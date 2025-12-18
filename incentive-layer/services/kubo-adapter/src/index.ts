import { create as createIpfsClient, IPFSHTTPClient } from 'ipfs-http-client';
import { Logger } from 'winston';

/**
 * KuboAdapter - Wrapper around Kubo HTTP API
 * Provides simple interface for IPFS operations without modifying Kubo
 */
export class KuboAdapter {
    private ipfs: IPFSHTTPClient;
    private logger: Logger;

    constructor(kuboApiUrl: string, logger: Logger) {
        this.ipfs = createIpfsClient({ url: kuboApiUrl });
        this.logger = logger;
        this.logger.info(`Connected to Kubo at ${kuboApiUrl}`);
    }

    /**
     * Add file to IPFS
     */
    async addFile(content: Buffer | Uint8Array): Promise<string> {
        try {
            const result = await this.ipfs.add(content);
            const cid = result.cid.toString();
            this.logger.debug(`File added to IPFS: ${cid}`);
            return cid;
        } catch (error) {
            this.logger.error('Error adding file to IPFS:', error);
            throw error;
        }
    }

    /**
     * Retrieve file from IPFS
     */
    async getFile(cid: string): Promise<Buffer> {
        try {
            const chunks: Uint8Array[] = [];
            for await (const chunk of this.ipfs.cat(cid)) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        } catch (error) {
            this.logger.error(`Error retrieving file ${cid}:`, error);
            throw error;
        }
    }

    /**
     * Pin file (ensure it stays in local storage)
     */
    async pinFile(cid: string): Promise<void> {
        try {
            await this.ipfs.pin.add(cid);
            this.logger.debug(`File pinned: ${cid}`);
        } catch (error) {
            this.logger.error(`Error pinning file ${cid}:`, error);
            throw error;
        }
    }

    /**
     * Unpin file
     */
    async unpinFile(cid: string): Promise<void> {
        try {
            await this.ipfs.pin.rm(cid);
            this.logger.debug(`File unpinned: ${cid}`);
        } catch (error) {
            this.logger.error(`Error unpinning file ${cid}:`, error);
            throw error;
        }
    }

    /**
     * Get node info
     */
    async getNodeInfo() {
        try {
            const id = await this.ipfs.id();
            return {
                id: id.id.toString(),
                agentVersion: id.agentVersion,
                protocolVersion: id.protocolVersion,
                addresses: id.addresses.map(addr => addr.toString())
            };
        } catch (error) {
            this.logger.error('Error getting node info:', error);
            throw error;
        }
    }
}
