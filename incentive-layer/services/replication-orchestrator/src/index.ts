import { Pool } from 'pg';
import { Logger } from 'winston';

/**
 * ReplicationOrchestrator - Selects 15 providers for shard placement
 * Ensures geographic diversity and reputation balance
 */
export class ReplicationOrchestrator {
    private db: Pool;
    private logger: Logger;

    private readonly REQUIRED_SHARDS = 15;
    private readonly MIN_REPUTATION = 30;

    constructor(db: Pool, logger: Logger) {
        this.db = db;
        this.logger = logger;
    }

    /**
     * Select 15 providers for a new deal
     * Prioritizes: reputation, geographic diversity, available capacity
     */
    async selectProvidersForDeal(requiredCapacityGB: number): Promise<ProviderSelection[]> {
        this.logger.info(`Selecting ${this.REQUIRED_SHARDS} providers for ${requiredCapacityGB}GB storage`);

        try {
            // Calculate per-shard size (with 10+5 encoding, each shard is ~1/15 of encoded size)
            const encodedSize = requiredCapacityGB * 1.5; // 10+5 encoding overhead
            const perShardSize = encodedSize / this.REQUIRED_SHARDS;

            // Get available providers with capacity
            const result = await this.db.query(`
        SELECT 
          p.address,
          p.peer_id,
          p.endpoint,
          p.region,
          p.reputation_score,
          cp.capacity_gb,
          cp.utilization_gb,
          (cp.capacity_gb - cp.utilization_gb) as available_capacity
        FROM providers p
        JOIN capacity_pledges cp ON p.address = cp.provider_address
        WHERE p.active = true
          AND p.reput_score >= $1
          AND cp.active = true
          AND (cp.capacity_gb - cp.utilization_gb) >= $2
        ORDER BY p.reputation_score DESC, RANDOM()
      `, [this.MIN_REPUTATION, perShardSize]);

            if (result.rows.length < this.REQUIRED_SHARDS) {
                throw new Error(`Insufficient providers: need ${this.REQUIRED_SHARDS}, found ${result.rows.length}`);
            }

            // Select providers with geographic diversity
            const selected = this.selectWithDiversity(result.rows, this.REQUIRED_SHARDS);

            this.logger.info(`Selected ${selected.length} providers:`);
            const regionCounts = selected.reduce((acc, p) => {
                acc[p.region] = (acc[p.region] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            this.logger.info(`  Region distribution: ${JSON.stringify(regionCounts)}`);

            return selected.map((p, index) => ({
                shardIndex: index,
                providerAddress: p.address,
                peerId: p.peer_id,
                endpoint: p.endpoint,
                region: p.region,
                reputationScore: p.reputation_score
            }));

        } catch (error) {
            this.logger.error('Error selecting providers:', error);
            throw error;
        }
    }

    /**
     * Select providers with geographic diversity
     * Tries to distribute shards across different regions
     */
    private selectWithDiversity(providers: any[], count: number): any[] {
        const selected: any[] = [];
        const regionCounts: Map<string, number> = new Map();

        // First pass: select one from each region
        const regions = [...new Set(providers.map(p => p.region))];
        for (const region of regions) {
            if (selected.length >= count) break;

            const provider = providers.find(p =>
                p.region === region && !selected.includes(p)
            );

            if (provider) {
                selected.push(provider);
                regionCounts.set(region, 1);
            }
        }

        // Second pass: fill remaining slots balancing reputation and diversity
        while (selected.length < count) {
            // Find provider from least-represented region
            const sortedRegions = regions.sort((a, b) =>
                (regionCounts.get(a) || 0) - (regionCounts.get(b) || 0)
            );

            let added = false;
            for (const region of sortedRegions) {
                const provider = providers.find(p =>
                    p.region === region && !selected.includes(p)
                );

                if (provider) {
                    selected.push(provider);
                    regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
                    added = true;
                    break;
                }
            }

            if (!added) {
                // Fallback: add any available provider
                const remaining = providers.find(p => !selected.includes(p));
                if (remaining) {
                    selected.push(remaining);
                } else {
                    break;
                }
            }
        }

        return selected.slice(0, count);
    }

    /**
     * Rebalance shards across providers (for maintenance)
     */
    async rebalanceShards(): Promise<void> {
        this.logger.info('Starting shard rebalancing...');

        // Find over-utilized providers
        const result = await this.db.query(`
      SELECT 
        provider_address,
        COUNT(*) as shard_count,
        AVG(reputation_score) as avg_reputation
      FROM shards s
      JOIN providers p ON s.provider_address = p.address
      WHERE s.active = true
      GROUP BY provider_address
      HAVING COUNT(*) > (
        SELECT AVG(shard_count) * 1.2
        FROM (
          SELECT COUNT(*) as shard_count
          FROM shards
          WHERE active = true
          GROUP BY provider_address
        ) counts
      )
    `);

        this.logger.info(`Found ${result.rows.length} over-utilized providers`);

        // TODO: Implement rebalancing logic
        // - Select shards to move
        // - Find under-utilized providers
        // - Coordinate data migration
    }
}

export interface ProviderSelection {
    shardIndex: number;
    providerAddress: string;
    peerId: string;
    endpoint: string;
    region: string;
    reputationScore: number;
}
