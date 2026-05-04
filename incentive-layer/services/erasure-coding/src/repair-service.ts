import { Logger } from 'winston';
import { Pool } from 'pg';
import { ethers } from 'ethers';
import { ShardManager } from './shard-manager';

/**
 * RepairService - Reconstructs lost shards and redistributes them
 * Monitors repair queue and coordinates shard reconstruction
 */
export class RepairService {
    private logger: Logger;
    private db: Pool;
    private shardManager: ShardManager;
    private repairInterval: NodeJS.Timeout | null = null;
    private readonly REPAIR_CHECK_INTERVAL = 60000; // Check every minute

    constructor(db: Pool, shardManager: ShardManager, logger: Logger) {
        this.db = db;
        this.shardManager = shardManager;
        this.logger = logger;
    }

    /**
     * Start repair service
     */
    start() {
        this.logger.info('Starting repair service...');

        this.repairInterval = setInterval(async () => {
            await this.processRepairQueue();
        }, this.REPAIR_CHECK_INTERVAL);

        this.logger.info(`Repair service started (interval: ${this.REPAIR_CHECK_INTERVAL}ms)`);
    }

    /**
     * Stop repair service
     */
    stop() {
        if (this.repairInterval) {
            clearInterval(this.repairInterval);
            this.repairInterval = null;
            this.logger.info('Repair service stopped');
        }
    }

    /**
     * Process pending repairs in queue
     */
    private async processRepairQueue() {
        try {
            // Get pending repairs
            const result = await this.db.query(`
        SELECT * FROM repair_queue
        WHERE status = 'pending'
        ORDER BY created_at ASC
        LIMIT 10
      `);

            for (const repair of result.rows) {
                await this.repairShard(
                    repair.id,
                    repair.deal_id,
                    repair.old_provider,
                    repair.shard_index,
                    repair.shard_cid
                );
            }

        } catch (error) {
            this.logger.error('Error processing repair queue:', error);
        }
    }

    /**
     * Repair a single shard
     */
    private async repairShard(
        repairId: number,
        dealId: number,
        oldProvider: string,
        shardIndex: number,
        oldShardCID: string
    ) {
        this.logger.info(`Starting repair: Deal ${dealId}, Shard ${shardIndex}`);

        try {
            // Mark as in-progress
            await this.db.query(
                'UPDATE repair_queue SET status = $1, started_at = NOW() WHERE id = $2',
                ['in_progress', repairId]
            );

            // 1. Get all active shards for this deal
            const shardsResult = await this.db.query(
                `SELECT shard_index, shard_cid FROM shards
         WHERE deal_id = $1 AND active = true
         ORDER BY shard_index`,
                [dealId]
            );

            if (shardsResult.rows.length < 10) {
                throw new Error(`Insufficient shards to reconstruct: have ${shardsResult.rows.length}, need 10`);
            }

            this.logger.info(`Found ${shardsResult.rows.length} active shards for reconstruction`);

            // 2. Reconstruct the missing shard
            const availableShards = shardsResult.rows.map(row => ({
                cid: row.shard_cid,
                index: row.shard_index
            }));

            const reconstructedShard = await this.shardManager.reconstructShard(
                availableShards,
                shardIndex
            );

            this.logger.info(`Shard ${shardIndex} reconstructed (${reconstructedShard.length} bytes)`);

            // 3. Select new provider
            const newProvider = await this.selectNewProvider(dealId, oldProvider);

            if (!newProvider) {
                throw new Error('No available provider for shard placement');
            }

            // 4. Upload reconstructed shard to IPFS
            const { create: createIpfsClient } = await import('ipfs-http-client');
            const ipfs = createIpfsClient({ url: process.env.KUBO_API_URL || 'http://localhost:5001' });
            const result = await ipfs.add(reconstructedShard);
            const newShardCID = result.cid.toString();

            this.logger.info(`Reconstructed shard uploaded: ${newShardCID}`);

            // 5. Create new shard allocation in database
            await this.db.query(
                `INSERT INTO shards (deal_id, provider_address, shard_index, shard_cid, size_bytes, active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())`,
                [dealId, newProvider, shardIndex, newShardCID, reconstructedShard.length]
            );

            // 6. Update deal provider list (call smart contract)
            // This would integrate with blockchain service to call StorageMarketplace.repairShard()
            await this.updateBlockchainShardAllocation(dealId, oldProvider, newProvider, newShardCID);

            // 7. Mark repair as completed
            await this.db.query(
                'UPDATE repair_queue SET status = $1, completed_at = NOW(), new_provider = $2, new_shard_cid = $3 WHERE id = $4',
                ['completed', newProvider, newShardCID, repairId]
            );

            this.logger.info(`✅ Repair completed: Deal ${dealId}, Shard ${shardIndex} → Provider ${newProvider}`);

        } catch (error) {
            this.logger.error(`Error repairing shard (Deal ${dealId}, Shard ${shardIndex}):`, error);

            // Mark as failed
            await this.db.query(
                'UPDATE repair_queue SET status = $1, error = $2 WHERE id = $3',
                ['failed', (error as any).message, repairId]
            );
        }
    }

    /**
     * Select a new provider for shard placement
     * Ensures geographic diversity and avoids providers already in this deal
     */
    private async selectNewProvider(dealId: number, excludeProvider: string): Promise<string | null> {
        // Get providers already in this deal
        const existingProviders = await this.db.query(
            'SELECT DISTINCT provider_address FROM shards WHERE deal_id = $1 AND active = true',
            [dealId]
        );

        const excludedAddresses = [excludeProvider, ...existingProviders.rows.map(r => r.provider_address)];

        // Find new provider with capacity and good reputation
        const result = await this.db.query(
            `SELECT p.address, p.region, cp.available_capacity
       FROM providers p
       JOIN capacity_pledges cp ON p.address = cp.provider_address
       WHERE p.active = true
         AND p.reputation_score >= 50
         AND p.address != ALL($1)
         AND cp.active = true
         AND cp.available_capacity > 0
       ORDER BY p.reputation_score DESC, RANDOM()
       LIMIT 1`,
            [excludedAddresses]
        );

        if (result.rows.length === 0) {
            this.logger.warn('No available provider found for shard placement');
            return null;
        }

        return result.rows[0].address;
    }

    /**
     * Update blockchain shard allocation
     * Calls StorageMarketplace.repairShard()
     */
    private async updateBlockchainShardAllocation(
        dealId: number,
        oldProvider: string,
        newProvider: string,
        newShardCID: string
    ) {
        try {
            this.logger.info(`Updating blockchain - Deal ${dealId}: ${oldProvider} → ${newProvider}`);

            if (!process.env.PRIVATE_KEY || !process.env.MARKETPLACE_ADDRESS || !process.env.RPC_URL) {
                throw new Error('Missing blockchain configuration (PRIVATE_KEY, MARKETPLACE_ADDRESS, RPC_URL)');
            }

            const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

            const abi = [
                "function repairShard(uint256 dealId, address oldProvider, address newProvider, string calldata newShardCID) external"
            ];

            const contract = new ethers.Contract(process.env.MARKETPLACE_ADDRESS, abi, wallet);

            const tx = await contract.repairShard(dealId, oldProvider, newProvider, newShardCID);
            this.logger.info(`Transaction sent: ${tx.hash}`);

            const receipt = await tx.wait();
            this.logger.info(`Transaction confirmed: ${receipt.transactionHash}`);

        } catch (error) {
            this.logger.error('Error updating blockchain:', error);
            throw error; // Re-throw to fail the repair job
        }
    }

    /**
     * Get repair statistics
     */
    async getRepairStats(): Promise<RepairStats> {
        const result = await this.db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE status = 'completed') as avg_repair_time_seconds
      FROM repair_queue
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);

        const row = result.rows[0];

        return {
            pending: parseInt(row.pending) || 0,
            inProgress: parseInt(row.in_progress) || 0,
            completed: parseInt(row.completed) || 0,
            failed: parseInt(row.failed) || 0,
            averageRepairTimeSeconds: parseFloat(row.avg_repair_time_seconds) || 0
        };
    }
}

export interface RepairStats {
    pending: number;
    inProgress: number;
    completed: number;
    failed: number;
    averageRepairTimeSeconds: number;
}
