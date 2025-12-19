import { ShardManager } from './shard-manager';
import * as winston from 'winston';

async function testRS() {
    const logger = winston.createLogger({
        level: 'debug',
        format: winston.format.simple(),
        transports: [new winston.transports.Console()]
    });

    // Mock IPFS client
    const mockIpfsUrl = 'http://localhost:5001';
    const shardManager = new ShardManager(mockIpfsUrl, logger);

    // 1. Create sample data
    const originalData = Buffer.from('This is a test message for Reed-Solomon erasure coding verification. It needs to be long enough to be split into multiple shards correctly.');
    console.log('Original Data:', originalData.toString());

    // 2. Test applyErasureCoding
    console.log('\n--- Testing Encoding ---');
    const shards = await (shardManager as any).applyErasureCoding(originalData);
    console.log(`Generated ${shards.length} shards`);

    // 3. Test reconstruction with all shards
    console.log('\n--- Testing Reconstruction (All Shards) ---');
    const indices = Array.from({ length: 15 }, (_, i) => i);
    const reconstructedAll = await (shardManager as any).reconstructFromShards(shards, indices);
    console.log('Reconstructed (All):', reconstructedAll.slice(0, originalData.length).toString());

    // 4. Test reconstruction with 5 missing shards (max allowed)
    console.log('\n--- Testing Reconstruction (5 Missing Shards) ---');
    const shardsWithMissing = [...shards];
    const missingIndices = [0, 2, 4, 6, 8]; // Remove 5 data shards
    missingIndices.forEach(idx => {
        shardsWithMissing[idx] = null;
    });

    const availableIndices = indices.filter(idx => !missingIndices.includes(idx));
    const reconstructedMissing = await (shardManager as any).reconstructFromShards(shardsWithMissing, availableIndices);
    console.log('Reconstructed (5 Missing):', reconstructedMissing.slice(0, originalData.length).toString());

    // 5. Verify
    if (originalData.equals(reconstructedMissing.slice(0, originalData.length))) {
        console.log('\n✅ SUCCESS: Reconstructed data matches original!');
    } else {
        console.log('\n❌ FAILURE: Reconstructed data does not match original!');
        process.exit(1);
    }
}

testRS().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
