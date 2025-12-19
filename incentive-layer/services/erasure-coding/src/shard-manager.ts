import { Logger } from 'winston';

// Use package name directly
const { ReedSolomonErasure } = require('@subspace/reed-solomon-erasure.wasm');

/**
 * ShardManager - Handles erasure coding with 10+5 Reed-Solomon configuration
 * Splits files into 15 shards (10 data + 5 parity)
 */
export class ShardManager {
    private ipfs: any;
    private logger: Logger;
    private rs: any;
    private ipfsUrl: string;

    // Reed-Solomon configuration: 10 data + 5 parity (50% parity)
    private readonly DATA_SHARDS = 10;
    private readonly PARITY_SHARDS = 5;
    private readonly TOTAL_SHARDS = 15;

    constructor(ipfsUrl: string, logger: Logger) {
        this.ipfsUrl = ipfsUrl;
        this.logger = logger;
    }

    /**
     * Initialize the Reed-Solomon WASM module and IPFS client
     */
    async init() {
        if (this.rs && this.ipfs) return;

        try {
            // Initialize Reed-Solomon
            if (!this.rs) {
                this.rs = await ReedSolomonErasure.fromCurrentDirectory();
                this.logger.info('Reed-Solomon WASM module initialized');
            }

            // Initialize IPFS client using dynamic import to handle ESM package in CJS project
            if (!this.ipfs) {
                // Using eval('import(...)') to prevent ts-node from transpiling to require()
                const { create } = await (eval('import("ipfs-http-client")') as Promise<any>);
                this.ipfs = create({ url: this.ipfsUrl });
                this.logger.info('IPFS client initialized');
            }
        } catch (error) {
            this.logger.error('Failed to initialize ShardManager:', error);
            throw error;
        }
    }

    /**
     * Split a file into 15 shards using Reed-Solomon encoding
     * @param fileCID - IPFS CID of the original file
     * @returns Array of shard CIDs and their metadata
     */
    async encodeFile(fileCID: string): Promise<ShardInfo[]> {
        this.logger.info(`Starting erasure encoding for file ${fileCID}`);
        await this.init();

        try {
            // 1. Download file from IPFS
            const chunks: Uint8Array[] = [];
            for await (const chunk of this.ipfs.cat(fileCID)) {
                chunks.push(chunk);
            }
            const fileData = Buffer.concat(chunks);
            const fileSize = fileData.length;

            this.logger.info(`Downloaded file: ${fileSize} bytes`);

            // 2. Apply Reed-Solomon encoding
            const shards = await this.applyErasureCoding(fileData);

            // 3. Upload each shard to IPFS
            const shardInfos: ShardInfo[] = [];
            for (let i = 0; i < shards.length; i++) {
                const shardCID = await this.uploadShard(shards[i]);

                shardInfos.push({
                    shardIndex: i,
                    shardCID: shardCID,
                    sizeBytes: shards[i].length,
                    isDataShard: i < this.DATA_SHARDS,
                    originalFileCID: fileCID
                });

                this.logger.debug(`Uploaded shard ${i}: ${shardCID} (${shards[i].length} bytes)`);
            }

            this.logger.info(`Successfully encoded file into ${this.TOTAL_SHARDS} shards`);
            return shardInfos;

        } catch (error) {
            this.logger.error(`Error encoding file ${fileCID}:`, error);
            throw error;
        }
    }

    /**
     * Reconstruct original file from available shards
     * Requires at least 10 out of 15 shards
     */
    async reconstructFile(shardCIDs: string[], shardIndices: number[]): Promise<string> {
        this.logger.info(`Reconstructing file from ${shardCIDs.length} shards`);
        await this.init();

        if (shardCIDs.length < this.DATA_SHARDS) {
            throw new Error(`Insufficient shards: need at least ${this.DATA_SHARDS}, have ${shardCIDs.length}`);
        }

        try {
            // 1. Download available shards
            const shards: Buffer[] = new Array(this.TOTAL_SHARDS);
            for (let i = 0; i < shardCIDs.length; i++) {
                const chunks: Uint8Array[] = [];
                for await (const chunk of this.ipfs.cat(shardCIDs[i])) {
                    chunks.push(chunk);
                }
                shards[shardIndices[i]] = Buffer.concat(chunks);
            }

            // 2. Reconstruct using Reed-Solomon
            const reconstructedData = await this.reconstructFromShards(shards, shardIndices);

            // 3. Upload reconstructed file to IPFS
            const result = await this.ipfs.add(reconstructedData);
            const fileCID = result.cid.toString();

            this.logger.info(`File reconstructed successfully: ${fileCID}`);
            return fileCID;

        } catch (error) {
            this.logger.error('Error reconstructing file:', error);
            throw error;
        }
    }

    /**
     * Reconstruct a single missing shard from available shards
     */
    async reconstructShard(
        availableShards: { cid: string; index: number }[],
        targetShardIndex: number
    ): Promise<Buffer> {
        this.logger.info(`Reconstructing shard ${targetShardIndex}`);
        await this.init();

        if (availableShards.length < this.DATA_SHARDS) {
            throw new Error(`Need at least ${this.DATA_SHARDS} shards to reconstruct`);
        }

        // Download available shards
        const shards: Buffer[] = new Array(this.TOTAL_SHARDS);
        const indices: number[] = [];

        for (const shard of availableShards) {
            const chunks: Uint8Array[] = [];
            for await (const chunk of this.ipfs.cat(shard.cid)) {
                chunks.push(chunk);
            }
            shards[shard.index] = Buffer.concat(chunks);
            indices.push(shard.index);
        }

        // Reconstruct all data using Reed-Solomon
        const reconstructedData = await this.reconstructFromShards(shards, indices);

        // Re-encode to get all shards
        const allShards = await this.applyErasureCoding(reconstructedData);

        return allShards[targetShardIndex];
    }

    /**
     * Apply Reed-Solomon erasure coding
     * Private helper method
     */
    private async applyErasureCoding(data: Buffer): Promise<Buffer[]> {
        await this.init();

        // Calculate shard size (each shard should be roughly equal)
        const shardSize = Math.ceil(data.length / this.DATA_SHARDS);

        // Pad data if necessary
        const paddedSize = shardSize * this.DATA_SHARDS;
        const totalSize = shardSize * this.TOTAL_SHARDS;

        // Create a contiguous buffer for all shards (data + parity)
        const contiguousBuffer = Buffer.alloc(totalSize);
        data.copy(contiguousBuffer);

        // Apply Reed-Solomon encoding in-place
        const result = this.rs.encode(contiguousBuffer, this.DATA_SHARDS, this.PARITY_SHARDS);

        if (result !== 0) { // ReedSolomonErasure.RESULT_OK is 0
            throw new Error(`Reed-Solomon encoding failed with error code: ${result}`);
        }

        // Split contiguous buffer into individual shards
        const shards: Buffer[] = [];
        for (let i = 0; i < this.TOTAL_SHARDS; i++) {
            const start = i * shardSize;
            const end = start + shardSize;
            shards.push(Buffer.from(contiguousBuffer.subarray(start, end)));
        }

        return shards;
    }

    /**
     * Reconstruct data from available shards
     */
    private async reconstructFromShards(
        shards: Buffer[],
        availableIndices: number[]
    ): Promise<Buffer> {
        await this.init();

        // If we have all data shards, just concatenate them
        const hasAllDataShards = availableIndices.filter(i => i < this.DATA_SHARDS).length === this.DATA_SHARDS;

        if (hasAllDataShards) {
            const dataShards = shards.slice(0, this.DATA_SHARDS).filter(s => s);
            return Buffer.concat(dataShards);
        }

        // Otherwise, use Reed-Solomon decoding
        const shardSize = shards[availableIndices[0]].length;
        const totalSize = shardSize * this.TOTAL_SHARDS;
        const contiguousBuffer = Buffer.alloc(totalSize);
        const shardsAvailable = new Array(this.TOTAL_SHARDS).fill(false);

        // Fill contiguous buffer with available shards
        for (let i = 0; i < this.TOTAL_SHARDS; i++) {
            if (shards[i]) {
                shards[i].copy(contiguousBuffer, i * shardSize);
                shardsAvailable[i] = true;
            }
        }

        // Reconstruct missing shards in-place
        const result = this.rs.reconstruct(contiguousBuffer, this.DATA_SHARDS, this.PARITY_SHARDS, shardsAvailable);

        if (result !== 0) { // ReedSolomonErasure.RESULT_OK is 0
            throw new Error(`Reed-Solomon reconstruction failed with error code: ${result}`);
        }

        // Extract data shards and concatenate
        const dataShards: Buffer[] = [];
        for (let i = 0; i < this.DATA_SHARDS; i++) {
            const start = i * shardSize;
            const end = start + shardSize;
            dataShards.push(contiguousBuffer.subarray(start, end));
        }

        return Buffer.concat(dataShards);
    }

    /**
     * Upload shard to IPFS
     */
    private async uploadShard(shard: Buffer): Promise<string> {
        const result = await this.ipfs.add(shard);
        return result.cid.toString();
    }
}

export interface ShardInfo {
    shardIndex: number;
    shardCID: string;
    sizeBytes: number;
    isDataShard: boolean;
    originalFileCID: string;
}
