import { Pool } from 'pg';
import { Logger } from 'winston';
import { ethers } from 'ethers';
import { ShardManager } from '../erasure-coding/src/shard-manager';
import { ReplicationOrchestrator } from '../replication-orchestrator/src/index';

/**
 * DealOrchestrator - End-to-end storage deal automation
 * Coordinates file upload, erasure coding, provider selection, and blockchain deal creation
 */
export class DealOrchestrator {
    private db: Pool;
    private logger: Logger;
    private shardManager: ShardManager;
    private replicationOrchestrator: ReplicationOrchestrator;
    private provider: ethers.Provider;
    private marketplaceContract: ethers.Contract;

    constructor(
        db: Pool,
        shardManager: ShardManager,
        replicationOrchestrator: ReplicationOrchestrator,
        rpcUrl: string,
        marketplaceAddress: string,
        logger: Logger
    ) {
        this.db = db;
        this.shardManager = shardManager;
        this.replicationOrchestrator = replicationOrchestrator;
        this.logger = logger;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        const marketplaceABI = [
            'function createDeal(string fileCID, uint256 fileSizeGB, uint256 durationDays, uint256 pricePerGBMonth, address[] selectedProviders, string[] shardCIDs, uint256[] shardSizes) returns (uint256)',
            'function repairShard(uint256 dealId, address oldProvider, address newProvider, string newShardCID)',
            'function getShardAllocation(uint256 dealId, address provider) view returns (uint256 shardIndex, string shardCID, uint256 sizeGB, bool active)'
        ];
        this.marketplaceContract = new ethers.Contract(marketplaceAddress, marketplaceABI, this.provider);
    }

    /**
     * Create complete storage deal from file CID
     */
    async createDeal(
        clientAddress: string,
        clientSigner: ethers.Signer,
        fileCID: string,
        durationDays: number,
        pricePerGBMonth: number
    ): Promise<string> {
        this.logger.info(`Creating deal for file ${fileCID}`);

        try {
            // Step 1: Encode file with erasure coding
            this.logger.info('Step 1: Erasure encoding file...');
            const shardInfos = await this.shardManager.encodeFile(fileCID);

            const fileSizeGB = shardInfos.reduce((sum, s) => sum + s.sizeBytes, 0) / (1024 ** 3);
            this.logger.info(`File encoded into ${shardInfos.length} shards (${fileSizeGB.toFixed(2)} GB total)`);

            // Step 2: Select providers
            this.logger.info('Step 2: Selecting providers...');
            const providers = await this.replicationOrchestrator.selectProvidersForDeal(fileSizeGB / 1.5); // Original size

            // Step 3: Prepare contract call data
            const providerAddresses = providers.map(p => p.providerAddress);
            const shardCIDs = shardInfos.map(s => s.shardCID);
            const shardSizes = shardInfos.map(s => Math.ceil(s.sizeBytes / (1024 ** 3))); // Convert to GB

            // Step 4: Create deal on blockchain
            this.logger.info('Step 4: Creating deal on blockchain...');
            const marketplace = this.marketplaceContract.connect(clientSigner);
            const tx = await marketplace.createDeal(
                fileCID,
                Math.ceil(fileSizeGB / 1.5),
                durationDays,
                ethers.parseEther(pricePerGBMonth.toString()),
                providerAddresses,
                shardCIDs,
                shardSizes
            );

            this.logger.info(`Transaction sent: ${tx.hash}`);
            const receipt = await tx.wait();

            // Extract deal ID from event
            const dealCreatedEvent = receipt.logs.find((log: any) =>
                log.topics[0] === ethers.id('DealCreated(uint256,address,uint256,uint256)')
            );

            const dealId = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], dealCreatedEvent.topics[1])[0].toString();

            this.logger.info(`✅ Deal created: #${dealId}`);

            return dealId;

        } catch (error) {
            this.logger.error('Error creating deal:', error);
            throw error;
        }
    }

    /**
     * Monitor deal health and trigger repairs
     */
    async monitorDeal(dealId: string, orchestratorSigner: ethers.Signer): Promise<void> {
        this.logger.info(`Monitoring deal #${dealId}`);

        // Check shard health from database
        const result = await this.db.query(
            `SELECT provider_address, shard_cid, active, shard_index
             FROM shards WHERE deal_id = $1`,
            [dealId]
        );

        const shards = result.rows;
        const activeShards = shards.filter(s => s.active).length;

        if (activeShards < 15) {
            this.logger.warn(`Deal #${dealId} has ${activeShards}/15 active shards. Triggering repair...`);
            await this.repairDeal(dealId, shards, orchestratorSigner);
        }

        if (activeShards < 10) {
            this.logger.error(`Deal #${dealId} CRITICAL: Only ${activeShards} shards remaining!`);
        }
    }

    /**
     * Repair a deal by reconstructing missing shards and re-deploying them
     */
    async repairDeal(dealId: string, shards: any[], orchestratorSigner: ethers.Signer): Promise<void> {
        this.logger.info(`Repairing deal #${dealId}...`);

        try {
            const missingShards = shards.filter(s => !s.active);
            const availableShards = shards.filter(s => s.active).map(s => ({
                cid: s.shard_cid,
                index: s.shard_index
            }));

            if (availableShards.length < 10) {
                throw new Error(`Cannot repair deal #${dealId}: insufficient shards available (${availableShards.length}/10)`);
            }

            for (const missing of missingShards) {
                this.logger.info(`Reconstructing shard ${missing.shard_index}...`);

                // 1. Reconstruct the missing shard data
                const shardData = await this.shardManager.reconstructShard(availableShards, missing.shard_index);

                // 2. Upload new shard to IPFS (this is handled inside reconstructShard if we use a different helper, 
                // but let's use the Buffer directly here)
                // Actually, ShardManager.reconstructShard returns a Buffer.
                const { create } = await (eval('import("ipfs-http-client")') as Promise<any>);
                const ipfs = create({ url: process.env.KUBO_API_URL || 'http://localhost:5001' });
                const uploadResult = await ipfs.add(shardData);
                const newShardCID = uploadResult.cid.toString();

                // 3. Select a new provider
                const newProviders = await this.replicationOrchestrator.selectProvidersForDeal(0.1); // Small size for single shard
                const newProvider = newProviders[0].providerAddress;

                // 4. Update blockchain
                this.logger.info(`Updating blockchain: replacing ${missing.provider_address} with ${newProvider}`);
                const marketplace = this.marketplaceContract.connect(orchestratorSigner);
                const tx = await (marketplace as any).repairShard(
                    dealId,
                    missing.provider_address,
                    newProvider,
                    newShardCID
                );
                await tx.wait();

                // 5. Update database
                await this.db.query(
                    `UPDATE shards 
                     SET provider_address = $1, shard_cid = $2, active = true 
                     WHERE deal_id = $3 AND shard_index = $4`,
                    [newProvider, newShardCID, dealId, missing.shard_index]
                );

                this.logger.info(`✅ Shard ${missing.shard_index} repaired successfully`);
            }
        } catch (error) {
            this.logger.error(`Error repairing deal #${dealId}:`, error);
        }
    }
}
