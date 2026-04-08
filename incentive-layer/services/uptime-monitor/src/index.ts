import { ethers } from 'ethers';
import { Pool } from 'pg';
import * as winston from 'winston';
import * as dotenv from 'dotenv';

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

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // Every 5 minutes
const OFFLINE_THRESHOLD_MINUTES = 24 * 60; // 24 hours (Industry standard grace period before severe collateral slashing)

// SlashingManager minimal ABI for missed PoSt (heartbeat offline implies missed proofs/availability)
const slashingABI = [
    'function slashMissedPost(address provider, uint256 collateral) external'
];

async function main() {
    logger.info('Starting Kyneto Uptime Monitor & Slashing Worker...');

    const dbUrl = process.env.DATABASE_URL;
    const rpcUrl = process.env.RPC_URL || 'https://rpc-amoy.polygon.technology';
    const privateKey = process.env.PRIVATE_KEY;
    const slashingAddress = process.env.SLASHING_ADDRESS;

    if (!dbUrl || !privateKey || !slashingAddress) {
        logger.error('Missing required environment variables (DATABASE_URL, PRIVATE_KEY, SLASHING_ADDRESS)');
        process.exit(1);
    }

    const db = new Pool({ connectionString: dbUrl });
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const slashingContract = new ethers.Contract(slashingAddress, slashingABI, wallet);

    logger.info(`Connected to blockchain. Worker address: ${wallet.address}`);

    const runCheck = async () => {
        try {
            logger.info('Running downtime check...');
            
            // Find active providers whose last heartbeat is older than threshold
            const query = `
                SELECT p.address,
                       COALESCE(SUM(c.collateral), 0) as total_collateral
                FROM providers p
                LEFT JOIN capacity_pledges c ON c.provider_address = p.address AND c.active = true
                WHERE p.active = true 
                  AND p.last_heartbeat < NOW() - INTERVAL '${OFFLINE_THRESHOLD_MINUTES} minutes'
                GROUP BY p.address
            `;
            
            const result = await db.query(query);
            
            if (result.rows.length === 0) {
                logger.info('All active providers are healthy and online.');
                return;
            }

            logger.warn(`Found ${result.rows.length} offline providers. Initiating slashing...`);

            for (const row of result.rows) {
                const providerAddress = row.address;
                // Parse collateral (string to BigInt). In Postgres sum() returns string if bigints were summed.
                const collateral = BigInt(row.total_collateral || 0);

                try {
                    logger.info(`Slashing provider ${providerAddress} for downtime (collateral: ${collateral.toString()})...`);
                    
                    const tx = await slashingContract.slashMissedPost(providerAddress, collateral);
                    await tx.wait(1); // Wait for 1 confirmation
                    
                    logger.info(`Successfully slashed ${providerAddress}. Tx Hash: ${tx.hash}`);

                    // Mark as inactive in the database to prevent infinite slashing loops
                    // Next time they boot up, they will register / emit heartbeat again
                    await db.query('UPDATE providers SET active = false WHERE address = $1', [providerAddress]);
                    
                } catch (slashErr) {
                    logger.error(`Failed to slash provider ${providerAddress}:`, slashErr);
                }
            }
        } catch (err) {
            logger.error('Error during downtime check cycle:', err);
        }
    };

    // Run immediately on startup, then on interval
    runCheck();
    setInterval(runCheck, CHECK_INTERVAL_MS);
}

main().catch(err => {
    logger.error('Fatal error in uptime monitor:', err);
    process.exit(1);
});
