import { ethers } from 'ethers';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { create as createIpfsClient } from 'ipfs-http-client';
import { createLogger, format, transports } from 'winston';
import { createServer } from 'http';

dotenv.config();

// Structured Logger (consistent with erasure-coding service)
const logger = createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new transports.Console()
    ]
});

// Configuration from environment
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const DATABASE_URL = process.env.DATABASE_URL;
const KUBO_API_URL = process.env.KUBO_API_URL || 'http://localhost:5001';
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || '9100', 10);

// Reconnection config
const MAX_RETRIES = 10;
const BASE_DELAY_MS = 1000;

// State
let isConnected = false;
let retryCount = 0;
let currentProvider: ethers.JsonRpcProvider | null = null;

const db = new Pool({ connectionString: DATABASE_URL });
const ipfs = createIpfsClient({ url: KUBO_API_URL });

// Handle DB pool errors gracefully
db.on('error', (err) => {
    logger.error('Unexpected idle database client error', { error: err.message });
});

/**
 * Connect to the RPC provider with exponential backoff
 */
async function connectWithRetry(): Promise<ethers.JsonRpcProvider> {
    while (retryCount < MAX_RETRIES) {
        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            // Verify the connection by fetching the latest block
            await provider.getBlockNumber();
            isConnected = true;
            retryCount = 0;
            logger.info('Connected to RPC', { url: RPC_URL });
            return provider;
        } catch (error: any) {
            retryCount++;
            const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount - 1), 30000);
            logger.warn('RPC connection failed, retrying...', {
                attempt: retryCount,
                maxRetries: MAX_RETRIES,
                nextRetryMs: delay,
                error: error.message
            });
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw new Error(`Failed to connect to RPC after ${MAX_RETRIES} attempts`);
}

/**
 * Process a new block: index deals and mirror state to IPFS
 */
async function processBlock(blockNumber: number) {
    try {
        const result = await db.query('SELECT * FROM deals ORDER BY created_at DESC LIMIT 1000');
        const deals = result.rows;

        const metadata = {
            lastBlock: blockNumber,
            deals: deals,
            updatedAt: new Date().toISOString()
        };

        const { cid } = await ipfs.add(JSON.stringify(metadata));
        logger.info('Metadata mirrored to IPFS', { blockNumber, cid: cid.toString() });

        await db.query(
            'UPDATE system_config SET value = $1 WHERE key = $2',
            [cid.toString(), 'latest_metadata_cid']
        );

    } catch (error: any) {
        logger.error('Indexing error', { blockNumber, error: error.message });
    }
}

/**
 * Start the indexer with automatic reconnection
 */
async function startIndexer() {
    logger.info('Starting Decentralized Blockchain Indexer...');

    currentProvider = await connectWithRetry();

    const subscribeToBlocks = () => {
        if (!currentProvider) return;

        currentProvider.on('block', async (blockNumber: number) => {
            logger.debug('New block received', { blockNumber });
            await processBlock(blockNumber);
        });

        // Detect disconnection via provider error
        currentProvider.on('error', async (error: any) => {
            isConnected = false;
            logger.error('RPC provider error detected', { error: error.message });

            // Attempt reconnection
            try {
                currentProvider?.removeAllListeners();
                currentProvider = await connectWithRetry();
                subscribeToBlocks();
                logger.info('Successfully reconnected to RPC');
            } catch (reconnectError: any) {
                logger.error('Reconnection failed permanently', { error: reconnectError.message });
                process.exit(1);
            }
        });
    };

    subscribeToBlocks();
    logger.info('Listening for blockchain events and mirroring to IPFS...');
}

/**
 * Health check HTTP server for Docker healthcheck
 */
function startHealthServer() {
    const server = createServer((req, res) => {
        if (req.url === '/metrics' || req.url === '/health') {
            const status = isConnected ? 200 : 503;
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: isConnected ? 'healthy' : 'disconnected',
                rpc_url: RPC_URL,
                retry_count: retryCount,
                uptime_seconds: Math.floor(process.uptime())
            }));
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    server.listen(HEALTH_PORT, '0.0.0.0', () => {
        logger.info('Health check server started', { port: HEALTH_PORT });
    });

    return server;
}

/**
 * Graceful shutdown
 */
function setupGracefulShutdown(healthServer: ReturnType<typeof createServer>) {
    const shutdown = async (signal: string) => {
        logger.info('Shutdown signal received', { signal });

        currentProvider?.removeAllListeners();
        healthServer.close();
        await db.end();

        logger.info('Indexer shut down gracefully');
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

// Main entrypoint
async function main() {
    const healthServer = startHealthServer();
    setupGracefulShutdown(healthServer);
    await startIndexer();
}

main().catch((error) => {
    logger.error('Fatal error during startup', { error: error.message });
    process.exit(1);
});
