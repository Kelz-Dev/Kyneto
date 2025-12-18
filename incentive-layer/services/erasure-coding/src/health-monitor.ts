import { Logger } from 'winston';
import { Pool } from 'pg';

/**
 * HealthMonitor - Monitors provider availability via heartbeat
 * Detects offline providers and triggers repair
 */
export class HealthMonitor {
    private logger: Logger;
    private db: Pool;
    private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
    private readonly OFFLINE_THRESHOLD = 60000; // 60 seconds (2 missed heartbeats)
    private monitoringInterval: NodeJS.Timeout | null = null;

    constructor(db: Pool, logger: Logger) {
        this.db = db;
        this.logger = logger;
    }

    /**
     * Start monitoring all providers
     */
    start() {
        this.logger.info('Starting health monitor...');

        this.monitoringInterval = setInterval(async () => {
            await this.checkAllProviders();
        }, this.HEARTBEAT_INTERVAL);

        this.logger.info(`Health monitor started (interval: ${this.HEARTBEAT_INTERVAL}ms)`);
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.info('Health monitor stopped');
        }
    }

    /**
     * Check all providers for availability
     */
    private async checkAllProviders() {
        try {
            // Get all active providers with active shards
            const result = await this.db.query(`
        SELECT DISTINCT
          s.provider_address,
          s.deal_id,
          s.shard_index,
          s.shard_cid,
          p.last_heartbeat,
          p.endpoint
        FROM shards s
        JOIN providers p ON s.provider_address = p.address
        WHERE s.active = true
          AND p.active = true
      `);

            const currentTime = Date.now();

            for (const row of result.rows) {
                const timeSinceHeartbeat = currentTime - new Date(row.last_heartbeat).getTime();

                if (timeSinceHeartbeat > this.OFFLINE_THRESHOLD) {
                    this.logger.warn(`Provider ${row.provider_address} is offline (${Math.round(timeSinceHeartbeat / 1000)}s since last heartbeat)`);

                    // Mark shard as potentially lost (with cooldown)
                    await this.reportPotentialShardLoss(
                        row.deal_id,
                        row.provider_address,
                        row.shard_index,
                        row.shard_cid
                    );
                }
            }

        } catch (error) {
            this.logger.error('Error checking provider health:', error);
        }
    }

    /**
     * Report a potentially lost shard
     * Waits 5 minutes before confirming loss (in case temporary)
     */
    private async reportPotentialShardLoss(
        dealId: number,
        providerAddress: string,
        shardIndex: number,
        shardCID: string
    ) {
        try {
            // Check if already reported
            const existing = await this.db.query(
                'SELECT * FROM shard_loss_reports WHERE deal_id = $1 AND provider_address = $2 AND shard_index = $3',
                [dealId, providerAddress, shardIndex]
            );

            if (existing.rows.length > 0) {
                const reportTime = new Date(existing.rows[0].reported_at).getTime();
                const elapsed = Date.now() - reportTime;

                // If 5 minutes elapsed, trigger repair
                if (elapsed > 300000) { // 5 minutes
                    this.logger.error(`Shard confirmed lost: Deal ${dealId}, Provider ${providerAddress}, Shard ${shardIndex}`);

                    // Emit event for repair service
                    await this.triggerRepair(dealId, providerAddress, shardIndex, shardCID);

                    // Mark shard as inactive in database
                    await this.db.query(
                        'UPDATE shards SET active = false, lost_at = NOW() WHERE deal_id = $1 AND provider_address = $2',
                        [dealId, providerAddress]
                    );

                    // Delete report
                    await this.db.query(
                        'DELETE FROM shard_loss_reports WHERE deal_id = $1 AND provider_address = $2',
                        [dealId, providerAddress]
                    );
                }
            } else {
                // First time reporting, create record
                await this.db.query(
                    `INSERT INTO shard_loss_reports (deal_id, provider_address, shard_index, shard_cid, reported_at)
           VALUES ($1, $2, $3, $4, NOW())`,
                    [dealId, providerAddress, shardIndex, shardCID]
                );

                this.logger.warn(`Potential shard loss reported: Deal ${dealId}, Shard ${shardIndex} (cooldown: 5 min)`);
            }

        } catch (error) {
            this.logger.error('Error reporting shard loss:', error);
        }
    }

    /**
     * Trigger repair service for lost shard
     */
    private async triggerRepair(
        dealId: number,
        oldProvider: string,
        shardIndex: number,
        shardCID: string
    ) {
        try {
            // Insert into repair queue
            await this.db.query(
                `INSERT INTO repair_queue (deal_id, old_provider, shard_index, shard_cid, status, created_at)
         VALUES ($1, $2, $3, $4, 'pending', NOW())`,
                [dealId, oldProvider, shardIndex, shardCID]
            );

            this.logger.info(`Repair queued for Deal ${dealId}, Shard ${shardIndex}`);

        } catch (error) {
            this.logger.error('Error queuing repair:', error);
        }
    }

    /**
     * Record provider heartbeat
     * Called by providers via API
     */
    async recordHeartbeat(providerAddress: string) {
        try {
            await this.db.query(
                'UPDATE providers SET last_heartbeat = NOW() WHERE address = $1',
                [providerAddress]
            );

            // Remove any pending shard loss reports for this provider
            await this.db.query(
                'DELETE FROM shard_loss_reports WHERE provider_address = $1',
                [providerAddress]
            );

            this.logger.debug(`Heartbeat recorded for ${providerAddress}`);

        } catch (error) {
            this.logger.error(`Error recording heartbeat for ${providerAddress}:`, error);
        }
    }

    /**
     * Get health status for a specific deal
     */
    async getDealHealth(dealId: number): Promise<DealHealthStatus> {
        const result = await this.db.query(
            `SELECT
        COUNT(*) as total_shards,
        COUNT(*) FILTER (WHERE active = true) as active_shards,
        COUNT(*) FILTER (WHERE active = false) as lost_shards
       FROM shards
       WHERE deal_id = $1`,
            [dealId]
        );

        const row = result.rows[0];
        const isHealthy = row.active_shards >= 10; // Need 10+ shards to reconstruct

        return {
            dealId,
            totalShards: parseInt(row.total_shards),
            activeShards: parseInt(row.active_shards),
            lostShards: parseInt(row.lost_shards),
            isHealthy,
            status: isHealthy ? 'healthy' : (row.active_shards >= 10 ? 'degraded' : 'critical')
        };
    }

    /**
     * Get overall network health statistics
     */
    async getNetworkHealth(): Promise<NetworkHealthStats> {
        const dealsResult = await this.db.query(`
      SELECT
        COUNT(DISTINCT deal_id) as total_deals,
        AVG(active_shards) as avg_active_shards
      FROM (
        SELECT deal_id, COUNT(*) FILTER (WHERE active = true) as active_shards
        FROM shards
        GROUP BY deal_id
      ) deal_stats
    `);

        const providersResult = await this.db.query(`
      SELECT
        COUNT(*) as total_providers,
        COUNT(*) FILTER (WHERE last_heartbeat > NOW() - INTERVAL '2 minutes') as online_providers
      FROM providers
      WHERE active = true
    `);

        return {
            totalDeals: parseInt(dealsResult.rows[0].total_deals) || 0,
            averageActiveShards: parseFloat(dealsResult.rows[0].avg_active_shards) || 0,
            totalProviders: parseInt(providersResult.rows[0].total_providers) || 0,
            onlineProviders: parseInt(providersResult.rows[0].online_providers) || 0
        };
    }
}

export interface DealHealthStatus {
    dealId: number;
    totalShards: number;
    activeShards: number;
    lostShards: number;
    isHealthy: boolean;
    status: 'healthy' | 'degraded' | 'critical';
}

export interface NetworkHealthStats {
    totalDeals: number;
    averageActiveShards: number;
    totalProviders: number;
    onlineProviders: number;
}
