import 'dotenv/config';
import { createLogger, format, transports } from 'winston';
import { Pool } from 'pg';
import { HealthMonitor } from './health-monitor';
import { RepairService } from './repair-service';
import { ShardManager } from './shard-manager';

// Setup Logger
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

// Setup Database
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
});

db.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});

async function main() {
    try {
        logger.info('Starting Erasure Coding Service...');

        // Initialize Shard Manager
        const ipfsUrl = process.env.KUBO_API_URL || 'http://localhost:5001';
        const shardManager = new ShardManager(ipfsUrl, logger);
        await shardManager.init();

        // Initialize Services
        const healthMonitor = new HealthMonitor(db, logger);
        const repairService = new RepairService(db, shardManager, logger);

        // Start Services
        healthMonitor.start();
        repairService.start();

        logger.info('Erasure Coding Service is running');

        // Graceful Shutdown
        process.on('SIGTERM', async () => {
            logger.info('SIGTERM received, shutting down...');
            healthMonitor.stop();
            repairService.stop();
            await db.end();
            process.exit(0);
        });

    } catch (error) {
        logger.error('Fatal error during startup:', error);
        process.exit(1);
    }
}

main();
