import { ethers } from 'ethers';
import { Logger } from 'winston';
import { Pool } from 'pg';

/**
 * BlockchainListener - Listens to smart contract events and syncs to database
 * Processes events from all 7 contracts
 */
export class BlockchainListener {
    private provider: ethers.Provider;
    private logger: Logger;
    private db: Pool;
    private contracts: Map<string, ethers.Contract> = new Map();

    constructor(rpcUrl: string, db: Pool, logger: Logger) {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.logger = logger;
        this.db = db;
    }

    /**
     * Initialize contracts
     */
    async initialize(contractAddresses: ContractAddresses) {
        this.logger.info('Initializing blockchain listener...');

        // Load contract ABIs and create instances
        const contracts = [
            { name: 'marketplace', address: contractAddresses.marketplace, events: marketplaceABI },
            { name: 'registry', address: contractAddresses.registry, events: registryABI },
            { name: 'pledges', address: contractAddresses.pledges, events: pledgesABI },
            { name: 'prover', address: contractAddresses.prover, events: proverABI },
            { name: 'slashing', address: contractAddresses.slashing, events: slashingABI },
            { name: 'payments', address: contractAddresses.payments, events: paymentsABI }
        ];

        for (const { name, address, events } of contracts) {
            const contract = new ethers.Contract(address, events, this.provider);
            this.contracts.set(name, contract);
            this.logger.info(`Loaded ${name} contract at ${address}`);
        }
    }

    /**
     * Start listening to all events
     */
    async start() {
        this.logger.info('Starting blockchain event listeners...');

        // Listen to Marketplace events
        const marketplace = this.contracts.get('marketplace')!;
        marketplace.on('DealCreated', async (dealId, client, fileSizeGB, totalCost, event) => {
            await this.handleDealCreated(dealId, client, fileSizeGB, totalCost, event);
        });

        marketplace.on('ShardAssigned', async (dealId, provider, shardIndex, shardCID, event) => {
            await this.handleShardAssigned(dealId, provider, shardIndex, shardCID, event);
        });

        marketplace.on('DealCompleted', async (dealId, event) => {
            await this.handleDealCompleted(dealId, event);
        });

        marketplace.on('DealCancelled', async (dealId, client, event) => {
            await this.handleDealCancelled(dealId, client, event);
        });

        marketplace.on('ShardLost', async (dealId, provider, shardIndex, event) => {
            await this.handleShardLost(dealId, provider, shardIndex, event);
        });

        // Listen to Registry events
        const registry = this.contracts.get('registry')!;
        registry.on('ProviderRegistered', async (provider, peerId, region, event) => {
            await this.handleProviderRegistered(provider, peerId, region, event);
        });

        registry.on('ReputationUpdated', async (provider, newScore, reason, event) => {
            await this.handleReputationUpdated(provider, newScore, reason, event);
        });

        // Listen to Pledge events
        const pledges = this.contracts.get('pledges')!;
        pledges.on('PledgeCreated', async (provider, pledgeId, capacityGB, duration, collateral, event) => {
            await this.handlePledgeCreated(provider, pledgeId, capacityGB, duration, collateral, event);
        });

        // Listen to Proof events
        const prover = this.contracts.get('prover')!;
        prover.on('PoStSubmitted', async (challengeId, provider, event) => {
            await this.handlePoStSubmitted(challengeId, provider, event);
        });

        prover.on('PoStMissed', async (challengeId, provider, event) => {
            await this.handlePoStMissed(challengeId, provider, event);
        });

        // Listen to Slashing events
        const slashing = this.contracts.get('slashing')!;
        slashing.on('ProviderSlashed', async (provider, amount, reason, event) => {
            await this.handleProviderSlashed(provider, amount, reason, event);
        });

        // Listen to Payment events
        const payments = this.contracts.get('payments')!;
        payments.on('RewardsWithdrawn', async (provider, amount, event) => {
            await this.handleRewardsWithdrawn(provider, amount, event);
        });

        this.logger.info('✅ All event listeners active');
    }

    /**
     * Event handlers
     */

    private async handleDealCreated(dealId: bigint, client: string, fileSizeGB: bigint, totalCost: bigint, event: any) {
        this.logger.info(`Deal created: #${dealId} by ${client}`);

        try {
            await this.db.query(
                `INSERT INTO deals (deal_id, client_address, file_size_gb, total_cost, status, created_at, block_number)
         VALUES ($1, $2, $3, $4, 'active', NOW(), $5)`,
                [dealId.toString(), client, fileSizeGB.toString(), totalCost.toString(), event.log.blockNumber]
            );
        } catch (error) {
            this.logger.error('Error handling DealCreated:', error);
        }
    }

    private async handleShardAssigned(dealId: bigint, provider: string, shardIndex: bigint, shardCID: string, event: any) {
        this.logger.debug(`Shard assigned: Deal ${dealId}, Shard ${shardIndex} → ${provider}`);

        try {
            await this.db.query(
                `INSERT INTO shards (deal_id, provider_address, shard_index, shard_cid, active, created_at)
         VALUES ($1, $2, $3, $4, true, NOW())`,
                [dealId.toString(), provider, shardIndex.toString(), shardCID]
            );
        } catch (error) {
            this.logger.error('Error handling ShardAssigned:', error);
        }
    }

    private async handleDealCompleted(dealId: bigint, event: any) {
        this.logger.info(`Deal completed: #${dealId}`);

        try {
            await this.db.query(
                'UPDATE deals SET status = $1, completed_at = NOW() WHERE deal_id = $2',
                ['completed', dealId.toString()]
            );

            // Mark all shards as inactive so providers clean up
            await this.db.query(
                'UPDATE shards SET active = false, deleted_at = NOW() WHERE deal_id = $1 AND active = true',
                [dealId.toString()]
            );

            // Log protocol event
            await this.db.query(
                `INSERT INTO protocol_events (event_type, description, data) VALUES ($1, $2, $3)`,
                ['DEAL_COMPLETED', `Deal #${dealId} completed — shards marked for cleanup`, JSON.stringify({ dealId: dealId.toString() })]
            );
        } catch (error) {
            this.logger.error('Error handling DealCompleted:', error);
        }
    }

    private async handleDealCancelled(dealId: bigint, client: string, event: any) {
        this.logger.info(`Deal cancelled: #${dealId} by ${client}`);

        try {
            await this.db.query(
                'UPDATE deals SET status = $1, cancelled_at = NOW() WHERE deal_id = $2',
                ['cancelled', dealId.toString()]
            );

            // Mark all shards as inactive so providers clean up
            await this.db.query(
                'UPDATE shards SET active = false, deleted_at = NOW() WHERE deal_id = $1 AND active = true',
                [dealId.toString()]
            );

            // Log protocol event
            await this.db.query(
                `INSERT INTO protocol_events (event_type, description, data) VALUES ($1, $2, $3)`,
                ['DEAL_CANCELLED', `Deal #${dealId} cancelled by client ${client.substring(0, 10)}...`, JSON.stringify({ dealId: dealId.toString(), client })]
            );
        } catch (error) {
            this.logger.error('Error handling DealCancelled:', error);
        }
    }

    private async handleShardLost(dealId: bigint, provider: string, shardIndex: bigint, event: any) {
        this.logger.warn(`Shard lost: Deal ${dealId}, Shard ${shardIndex} from ${provider}`);

        try {
            await this.db.query(
                'UPDATE shards SET active = false, lost_at = NOW() WHERE deal_id = $1 AND provider_address = $2',
                [dealId.toString(), provider]
            );
        } catch (error) {
            this.logger.error('Error handling ShardLost:', error);
        }
    }

    private async handleProviderRegistered(provider: string, peerId: string, region: string, event: any) {
        this.logger.info(`Provider registered: ${provider} (${region})`);

        try {
            await this.db.query(
                `INSERT INTO providers (address, peer_id, region, reputation_score, active, registered_at)
         VALUES (LOWER($1), $2, $3, 50, true, NOW())
         ON CONFLICT (address) DO NOTHING`,
                [provider, peerId, region]
            );
        } catch (error) {
            this.logger.error('Error handling ProviderRegistered:', error);
        }
    }

    private async handleReputationUpdated(provider: string, newScore: bigint, reason: string, event: any) {
        this.logger.debug(`Reputation updated: ${provider} → ${newScore} (${reason})`);

        try {
            await this.db.query(
                'UPDATE providers SET reputation_score = $1 WHERE address = $2',
                [newScore.toString(), provider]
            );
        } catch (error) {
            this.logger.error('Error handling ReputationUpdated:', error);
        }
    }

    private async handlePledgeCreated(provider: string, pledgeId: bigint, capacityGB: bigint, duration: bigint, collateral: bigint, event: any) {
        this.logger.info(`Pledge created: ${provider} - ${capacityGB}GB for ${duration}s`);

        try {
            await this.db.query(
                `INSERT INTO capacity_pledges (provider_address, pledge_id, capacity_gb, duration_seconds, collateral, active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())`,
                [provider, pledgeId.toString(), capacityGB.toString(), duration.toString(), collateral.toString()]
            );
        } catch (error) {
            this.logger.error('Error handling PledgeCreated:', error);
        }
    }

    private async handlePoStSubmitted(challengeId: bigint, provider: string, event: any) {
        this.logger.debug(`PoSt submitted: Challenge ${challengeId} by ${provider}`);

        // Update last proof submission time
        try {
            await this.db.query(
                'UPDATE providers SET last_proof_at = NOW() WHERE address = $1',
                [provider]
            );
        } catch (error) {
            this.logger.error('Error handling PoStSubmitted:', error);
        }
    }

    private async handlePoStMissed(challengeId: bigint, provider: string, event: any) {
        this.logger.warn(`PoSt missed: Challenge ${challengeId} by ${provider}`);

        // Record missed proof
        try {
            await this.db.query(
                `INSERT INTO proof_misses (provider_address, challenge_id, missed_at)
         VALUES ($1, $2, NOW())`,
                [provider, challengeId.toString()]
            );
        } catch (error) {
            this.logger.error('Error handling PoStMissed:', error);
        }
    }

    private async handleProviderSlashed(provider: string, amount: bigint, reason: string, event: any) {
        this.logger.warn(`Provider slashed: ${provider} - ${ethers.formatEther(amount)} STK (${reason})`);

        try {
            await this.db.query(
                `INSERT INTO slashing_events (provider_address, amount, reason, slashed_at)
         VALUES ($1, $2, $3, NOW())`,
                [provider, amount.toString(), reason]
            );
        } catch (error) {
            this.logger.error('Error handling ProviderSlashed:', error);
        }
    }

    private async handleRewardsWithdrawn(provider: string, amount: bigint, event: any) {
        this.logger.info(`Rewards withdrawn: ${provider} - ${ethers.formatEther(amount)} STK`);

        try {
            await this.db.query(
                `INSERT INTO withdrawals (provider_address, amount, withdrawn_at)
         VALUES ($1, $2, NOW())`,
                [provider, amount.toString()]
            );
        } catch (error) {
            this.logger.error('Error handling RewardsWithdrawn:', error);
        }
    }
}

// Contract interfaces
export interface ContractAddresses {
    marketplace: string;
    registry: string;
    pledges: string;
    prover: string;
    slashing: string;
    payments: string;
}

// Minimal ABIs (only events)
const marketplaceABI = [
    'event DealCreated(uint256 indexed dealId, address indexed client, uint256 fileSizeGB, uint256 totalCost)',
    'event ShardAssigned(uint256 indexed dealId, address indexed provider, uint256 shardIndex, string shardCID)',
    'event DealCompleted(uint256 indexed dealId)',
    'event DealCancelled(uint256 indexed dealId, address indexed client)',
    'event ShardLost(uint256 indexed dealId, address indexed provider, uint256 shardIndex)'
];

const registryABI = [
    'event ProviderRegistered(address indexed provider, string peerId, string region)',
    'event ReputationUpdated(address indexed provider, uint256 newScore, string reason)'
];

const pledgesABI = [
    'event PledgeCreated(address indexed provider, uint256 indexed pledgeId, uint256 capacityGB, uint256 duration, uint256 collateral)'
];

const proverABI = [
    'event PoStSubmitted(uint256 indexed challengeId, address indexed provider)',
    'event PoStMissed(uint256 indexed challengeId, address indexed provider)'
];

const slashingABI = [
    'event ProviderSlashed(address indexed provider, uint256 amount, string reason)'
];

const paymentsABI = [
    'event RewardsWithdrawn(address indexed provider, uint256 amount)'
];

// Start the listener
import * as winston from 'winston';
import * as dotenv from 'dotenv';

console.log('DEBUG: Blockchain Listener script starting...');

dotenv.config();

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

const db = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function main() {
    const rpcUrl = process.env.RPC_URL || 'https://polygon-amoy.drpc.org';
    const listener = new BlockchainListener(rpcUrl, db, logger);

    const addresses: ContractAddresses = {
        marketplace: process.env.MARKETPLACE_ADDRESS || '',
        registry: process.env.REGISTRY_ADDRESS || '',
        pledges: process.env.PLEDGES_ADDRESS || '',
        prover: process.env.PROVER_ADDRESS || '',
        slashing: process.env.SLASHING_ADDRESS || '',
        payments: process.env.PAYMENTS_ADDRESS || ''
    };

    await listener.initialize(addresses);
    await listener.start();
}

main().catch(err => {
    logger.error('Fatal error in blockchain listener:', err);
    process.exit(1);
});
