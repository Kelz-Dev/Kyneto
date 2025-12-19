import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function runE2E() {
    console.log('🚀 Starting E2E Test Suite...');

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
            await sleep(1000);
        } catch (error) {
            console.error(`❌ Provider registration failed for ${addr}`);
        }
    }

    // 3. Simulate Multiple Deals
    console.log('📤 Simulating client file uploads...');
    for (let i = 1; i <= 3; i++) {
        const dealId = `e2e-deal-${Date.now()}-${i}`;
        const size = Math.floor(Math.random() * 100) + 10;
        console.log(`📦 Initiating Deal #${dealId} (${size} GB)`);

        // In a real scenario, this would call the API to create a deal
        // For E2E sync demo, we'll assume the API/Background workers handle it
        // and we just observe the dashboard.

        await sleep(2000);
    }

    // 4. Keep-alive Heartbeats (Simulate ongoing activity)
    console.log('💓 Starting heartbeat loop (Ctrl+C to stop)...');
    while (true) {
        const randomProvider = providers[Math.floor(Math.random() * providers.length)];
        try {
            await axios.post(`${API_URL}/api/heartbeat`, { provider_address: randomProvider });
            process.stdout.write('.');
        } catch (e) {
            process.stdout.write('x');
        }
        await sleep(5000);
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
