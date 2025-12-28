import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function runE2E() {
    console.log('🚀 Starting Filecoin-style E2E Test Suite...');

    // 1. Wait for services
    console.log('⏳ Waiting for API server to be healthy...');
    await waitForAPI();

    // 2. Register Multiple Providers
    const providers = [
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Account #1
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Account #2
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906'  // Account #3
    ];

    console.log('👤 Registering storage providers...');
    for (const addr of providers) {
        try {
            await axios.post(`${API_URL}/api/heartbeat`, { provider_address: addr });
            console.log(`✅ Provider ${addr.substring(0, 8)}... registered`);
            await recordEvent('PROVIDER_REGISTERED', `New storage provider ${addr.substring(0, 8)}... joined the network`, { address: addr });
            await sleep(1000);
        } catch (error) {
            console.error(`❌ Provider registration failed for ${addr}`);
        }
    }

    // 3. Simulate Multiple Deals
    console.log('📤 Simulating client file uploads and deals...');
    for (let i = 1; i <= 5; i++) {
        const dealId = `DEAL-${1000 + i}`;
        const size = Math.floor(Math.random() * 100) + 10;
        const fee = (size * 0.02).toFixed(2);

        console.log(`📦 Initiating Deal #${dealId} (${size} GB)`);

        await recordEvent('DEAL_CREATED', `New storage deal #${dealId} initiated for ${size} GB`, {
            dealId,
            size,
            client: '0x1234...5678',
            protocolFee: fee
        });

        await sleep(3000);
    }

    // 4. Simulate Network Events (Slashing, Revenue, Proofs)
    console.log('💓 Starting network simulation loop...');
    const eventTypes = [
        { type: 'HEARTBEAT', weight: 60 },
        { type: 'PROOF_SUBMITTED', weight: 20 },
        { type: 'SLASHING', weight: 5 },
        { type: 'REVENUE_COLLECTED', weight: 15 }
    ];

    while (true) {
        const rand = Math.random() * 100;
        let cumulativeWeight = 0;
        let selectedEvent = eventTypes[0];

        for (const e of eventTypes) {
            cumulativeWeight += e.weight;
            if (rand <= cumulativeWeight) {
                selectedEvent = e;
                break;
            }
        }

        const provider = providers[Math.floor(Math.random() * providers.length)];
        const shortAddr = provider.substring(0, 8);

        try {
            switch (selectedEvent.type) {
                case 'HEARTBEAT':
                    await axios.post(`${API_URL}/api/heartbeat`, { provider_address: provider });
                    break;
                case 'PROOF_SUBMITTED':
                    await recordEvent('PROOF_SUBMITTED', `Provider ${shortAddr}... submitted valid storage proof`, { provider });
                    break;
                case 'SLASHING':
                    const amount = Math.floor(Math.random() * 50) + 10;
                    await recordEvent('SLASHING', `Provider ${shortAddr}... slashed ${amount} STK for downtime`, { provider, amount });
                    break;
                case 'REVENUE_COLLECTED':
                    const rev = (Math.random() * 5).toFixed(2);
                    await recordEvent('REVENUE', `Protocol collected ${rev} STK in transaction fees`, { amount: rev });
                    break;
            }
            process.stdout.write('.');
        } catch (e) {
            process.stdout.write('x');
        }

        await sleep(selectedEvent.type === 'HEARTBEAT' ? 2000 : 4000);
    }
}

async function recordEvent(event_type: string, description: string, data: any) {
    try {
        await axios.post(`${API_URL}/api/events`, { event_type, description, data });
    } catch (error: any) {
        console.error(`Failed to record event ${event_type}:`, error.message);
    }
}

async function waitForAPI() {
    let retries = 30;
    while (retries > 0) {
        try {
            await axios.get(`${API_URL}/health`);
            console.log('✅ API is online!');
            return;
        } catch (e) {
            retries--;
            await sleep(2000);
        }
    }
    throw new Error('API server did not start in time');
}

function sleep(ms: number) {
    return new Promise(r => setTimeout(r, ms));
}

runE2E().catch(console.error);
