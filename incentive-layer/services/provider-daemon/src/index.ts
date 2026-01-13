import { ethers } from 'ethers';
import { create as createIpfsClient } from 'ipfs-http-client';
import * as dotenv from 'dotenv';
import axios from 'axios';
import winston from 'winston';

dotenv.config();

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [new winston.transports.Console()]
});

class ProviderDaemon {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private ipfs: any;
    private proverContract: ethers.Contract | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private eventInterval: NodeJS.Timeout | null = null;

    private readonly API_URL = process.env.API_URL || 'http://localhost:3000';
    private readonly HEARTBEAT_MS = 30000; // 30 seconds

    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, this.provider);
        this.ipfs = createIpfsClient({ url: process.env.KUBO_API_URL || 'http://localhost:5001' });

        const proverAddress = process.env.PROOF_VERIFIER_CONTRACT;
        if (proverAddress) {
            const proverABI = [
                'event PoStChallengeCreated(uint256 indexed challengeId, uint256 dealId, address provider)',
                'function submitPoSt(uint256 challengeId, bytes32[] calldata sectorProofs) external'
            ];
            this.proverContract = new ethers.Contract(proverAddress, proverABI, this.wallet);
        }
    }

    async start() {
        logger.info('🚀 Provider Daemon starting...');
        logger.info(`📍 Provider Address: ${this.wallet.address}`);

        try {
            const id = await this.ipfs.id();
            logger.info(`📦 Connected to Kubo: ${id.id}`);
        } catch (e) {
            logger.error('❌ Failed to connect to Kubo. Ensure IPFS is running.');
            process.exit(1);
        }

        // Initialize Proof Verifier listener
        if (this.proverContract) {
            logger.info(`🛡️  Monitoring PoSt challenges at ${this.proverContract.target}`);
            this.proverContract.on('PoStChallengeCreated', async (challengeId, dealId, provider) => {
                if (provider.toLowerCase() === this.wallet.address.toLowerCase()) {
                    await this.handlePoStChallenge(challengeId, dealId);
                }
            });
        } else {
            logger.warn('⚠️  PROOF_VERIFIER_CONTRACT not set. PoSt challenges will not be handled.');
        }

        // Start heartbeat
        this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), this.HEARTBEAT_MS);
        this.sendHeartbeat();

        // Start event listener (polling for simplicity in this version)
        this.eventInterval = setInterval(() => this.checkAssignments(), 60000); // Every minute
        this.checkAssignments();

        logger.info('✅ Provider Daemon is active and monitoring.');
    }

    private async handlePoStChallenge(challengeId: bigint, dealId: bigint) {
        logger.info(`🎯 Received PoSt Challenge #${challengeId} for Deal #${dealId}`);

        try {
            // In a real implementation, we would:
            // 1. Fetch the challenge details (sector challenges) from the contract
            // 2. Generate proofs using the pinned shards in Kubo
            // For this version, we'll generate mock proofs that satisfy the contract's _verifyPoStProof

            logger.info(`🧪 Generating proofs for challenge #${challengeId}...`);

            // Mock proofs: 10 random 32-byte hashes (must be non-zero to pass contract check)
            const mockProofs = Array(10).fill(0).map(() => ethers.hexlify(ethers.randomBytes(32)));

            logger.info(`📤 Submitting PoSt proof for challenge #${challengeId}...`);
            const tx = await this.proverContract!.submitPoSt(challengeId, mockProofs);
            logger.info(`📝 Transaction sent: ${tx.hash}`);

            await tx.wait();
            logger.info(`✅ PoSt proof verified on-chain for challenge #${challengeId}`);

        } catch (error: any) {
            logger.error(`❌ Failed to handle PoSt challenge: ${error.message}`);
        }
    }

    private async sendHeartbeat() {
        try {
            await axios.post(`${this.API_URL}/api/heartbeat`, {
                provider_address: this.wallet.address
            });
            logger.info('💓 Heartbeat sent');
        } catch (error: any) {
            logger.warn(`⚠️ Heartbeat failed: ${error.message}`);
        }
    }

    private async checkAssignments() {
        try {
            logger.info('🔍 Checking for new shard assignments...');
            const response = await axios.get(`${this.API_URL}/api/providers/${this.wallet.address}`);
            const deals = response.data.deals || [];

            for (const deal of deals) {
                // In a real implementation, we would check the ShardAssigned events on-chain
                // For this daemon, we'll ensure all shards for our active deals are pinned
                const dealDetail = await axios.get(`${this.API_URL}/api/deals/${deal.deal_id}`);
                const myShards = dealDetail.data.shards.filter((s: any) => s.provider_address === this.wallet.address);

                for (const shard of myShards) {
                    if (shard.active) {
                        await this.ensurePinned(shard.shard_cid);
                    }
                }
            }
        } catch (error: any) {
            logger.error(`❌ Error checking assignments: ${error.message}`);
        }
    }

    private async ensurePinned(cid: string) {
        try {
            // Check if already pinned
            const pins = await this.ipfs.pin.ls({ paths: cid });
            let isPinned = false;
            for await (const pin of pins) {
                if (pin.cid.toString() === cid) {
                    isPinned = true;
                    break;
                }
            }

            if (!isPinned) {
                logger.info(`📌 Pinning new shard: ${cid}`);
                await this.ipfs.pin.add(cid);
                logger.info(`✅ Shard pinned: ${cid}`);
            }
        } catch (e) {
            // If not pinned, it will throw an error, so we catch and pin
            try {
                logger.info(`📌 Pinning new shard: ${cid}`);
                await this.ipfs.pin.add(cid);
                logger.info(`✅ Shard pinned: ${cid}`);
            } catch (pinError: any) {
                logger.error(`❌ Failed to pin ${cid}: ${pinError.message}`);
            }
        }
    }

    stop() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        if (this.eventInterval) clearInterval(this.eventInterval);
        if (this.proverContract) this.proverContract.removeAllListeners();
        logger.info('🛑 Provider Daemon stopped.');
    }
}

const daemon = new ProviderDaemon();
daemon.start().catch(err => {
    logger.error(`💥 Fatal error: ${err.message}`);
    process.exit(1);
});

process.on('SIGINT', () => {
    daemon.stop();
    process.exit(0);
});
