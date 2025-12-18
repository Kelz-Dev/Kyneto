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
            'function createDeal(string fileCID, uint256 fileSizeGB, uint256 durationDays, uint256 pricePerGBMonth, address[] selectedProviders, string[] shardCIDs, uint256[] shardSizes) returns (uint256)'
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
    async monitorDeal(dealId: string): Promise<void> {
        this.logger.info(`Monitoring deal #${dealId}`);

        // Check shard health
        const result = await this.db.query(
            `SELECT COUNT(*) FILTER (WHERE active = true) as active_shards
       FROM shards WHERE deal_id = $1`,
            [dealId]
        );

        const activeShards = parseInt(result.rows[0].active_shards);

        if (activeShards < 15) {
            this.logger.warn(`Deal #${dealId} has ${activeShards}/15 active shards`);
        }

        if (activeShards < 10) {
            this.logger.error(`Deal #${dealId} CRITICAL: Only ${activeShards} shards remaining!`);
        }
    }
}
