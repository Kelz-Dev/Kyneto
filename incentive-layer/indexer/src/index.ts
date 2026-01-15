import { ethers } from 'ethers';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { create as createIpfsClient } from 'ipfs-http-client';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const DATABASE_URL = process.env.DATABASE_URL;
const KUBO_API_URL = process.env.KUBO_API_URL || 'http://localhost:5001';

const provider = new ethers.JsonRpcProvider(RPC_URL);
const db = new Pool({ connectionString: DATABASE_URL });
const ipfs = createIpfsClient({ url: KUBO_API_URL });

// Contract Addresses
const MARKETPLACE_ADDRESS = process.env.MARKETPLACE_ADDRESS;

async function startIndexer() {
    console.log('🚀 Starting Decentralized Blockchain Indexer...');

    provider.on('block', async (blockNumber) => {
        console.log(`📦 New Block: ${blockNumber}`);

        try {
            // 1. Fetch all deals from DB (simulating indexed state)
            const result = await db.query('SELECT * FROM deals');
            const deals = result.rows;

            // 2. Push state to IPFS
            const metadata = {
                lastBlock: blockNumber,
                deals: deals,
                updatedAt: new Date().toISOString()
            };

            const { cid } = await ipfs.add(JSON.stringify(metadata));
            console.log(`📡 Metadata mirrored to IPFS: ${cid}`);

            // 3. Update a "latest" pointer (in a real app, this could be IPNS or a smart contract)
            await db.query('UPDATE system_config SET value = $1 WHERE key = $2', [cid.toString(), 'latest_metadata_cid']);

        } catch (error) {
            console.error('Indexing error:', error);
        }
    });

    console.log('📡 Listening for blockchain events and mirroring to IPFS...');
}

startIndexer().catch(console.error);
