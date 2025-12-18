import { Pool } from 'pg';
import { Logger } from 'winston';
import { ethers } from 'ethers';
import * as crypto from 'crypto';

/**
 * ProofGenerator - Automated Proof-of-Spacetime challenge generation
 * Creates PoSt challenges every 24 hours for all active deals
 */
export class ProofGenerator {
    private db: Pool;
    private logger: Logger;
    private provider: ethers.Provider;
    private proverContract: ethers.Contract;
    private wallet: ethers.Wallet;
    private generationInterval: NodeJS.Timeout | null = null;

    private readonly CHALLENGE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    private readonly CHALLENGE_SECTORS = 10;

    constructor(
        db: Pool,
        rpcUrl: string,
        proverAddress: string,
        privateKey: string,
        logger: Logger
    ) {
        this.db = db;
        this.logger = logger;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);

        const proverABI = [
            'function createPoStChallenge(uint256 dealId, address provider, bytes32[] sectorChallenges) returns (uint256)',
            'function checkMissedPoSt(uint256 challengeId) returns (bool)'
        ];
        this.proverContract = new ethers.Contract(proverAddress, proverABI, this.wallet);
    }

    /**
     * Start automated challenge generation
     */
    start() {
        this.logger.info('Starting proof generator...');

        // Generate challenges every hour (check which providers need challenges)
        this.generationInterval = setInterval(async () => {
            await this.generateChallenges();
        }, 60 * 60 * 1000); // Every hour

        // Also run immediately
        this.generateChallenges();

        this.logger.info('Proof generator started');
    }

    /**
     * Stop challenge generation
     */
    stop() {
        if (this.generationInterval) {
            clearInterval(this.generationInterval);
            this.generationInterval = null;
            this.logger.info('Proof generator stopped');
        }
    }

    /**
     * Generate challenges for all providers that need them
     */
    private async generateChallenges() {
        try {
            // Find providers who need challenges (last proof > 24h ago)
            const result = await this.db.query(`
        SELECT DISTINCT
          s.deal_id,
          s.provider_address,
          p.last_proof_at
        FROM shards s
        JOIN providers p ON s.provider_address = p.address
        WHERE s.active = true
          AND (p.last_proof_at IS NULL OR p.last_proof_at < NOW() - INTERVAL '24 hours')
        LIMIT 50
      `);

            this.logger.info(`Generating challenges for ${result.rows.length} providers`);

            for (const row of result.rows) {
                await this.createChallenge(row.deal_id, row.provider_address);
            }

        } catch (error) {
            this.logger.error('Error generating challenges:', error);
        }
    }

    /**
     * Create a PoSt challenge for a provider
     */
    private async createChallenge(dealId: string, providerAddress: string) {
        try {
            // Generate random sector challenges
            const sectorChallenges: string[] = [];
            for (let i = 0; i < this.CHALLENGE_SECTORS; i++) {
                const randomBytes = crypto.randomBytes(32);
                sectorChallenges.push('0x' + randomBytes.toString('hex'));
            }

            this.logger.debug(`Creating challenge for provider ${providerAddress} on deal ${dealId}`);

            // Submit to blockchain
            const tx = await this.proverContract.createPoStChallenge(
                dealId,
                providerAddress,
                sectorChallenges
            );

            const receipt = await tx.wait();

            // Extract challenge ID from event
            const event = receipt.logs.find((log: any) =>
                log.topics[0] === ethers.id('PoStChallengeCreated(uint256,uint256,address)')
            );

            if (event) {
                const challengeId = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], event.topics[1])[0].toString();
                this.logger.info(`Challenge created: #${challengeId} for provider ${providerAddress}`);
            }

        } catch (error) {
            this.logger.error(`Error creating challenge for ${providerAddress}:`, error);
        }
    }

    /**
     * Check for missed proofs and report them
     */
    async checkMissedProofs() {
        try {
            // Find challenges with deadline passed and not submitted
            const result = await this.db.query(`
        SELECT challenge_id, provider_address
        FROM post_challenges
        WHERE deadline < NOW()
          AND submitted = false
          AND checked = false
        LIMIT 100
      `);

            this.logger.info(`Checking ${result.rows.length} potentially missed proofs`);

            for (const row of result.rows) {
                await this.reportMissedProof(row.challenge_id);
            }

        } catch (error) {
            this.logger.error('Error checking missed proofs:', error);
        }
    }

    /**
     * Report a missed proof to smart contract
     */
    private async reportMissedProof(challengeId: string) {
        try {
            const tx = await this.proverContract.checkMissedPoSt(challengeId);
            await tx.wait();

            // Mark as checked in database
            await this.db.query(
                'UPDATE post_challenges SET checked = true WHERE challenge_id = $1',
                [challengeId]
            );

            this.logger.warn(`Reported missed proof: Challenge #${challengeId}`);

        } catch (error) {
            this.logger.error(`Error reporting missed proof ${challengeId}:`, error);
        }
    }
}
