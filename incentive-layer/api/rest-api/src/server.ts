import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import client from 'prom-client';
import multer from 'multer';
import * as crypto from 'crypto';

dotenv.config();

// File upload configuration (500MB max)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

// Rate limiter for file uploads (5 requests per minute per IP)
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: 'Too many upload requests, please try again after a minute' },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

// IPFS/Kubo client (lazy-loaded because ipfs-http-client is ESM)
let ipfsClient: any = null;
async function getIpfs() {
    if (!ipfsClient) {
        const { create } = await (eval('import("ipfs-http-client")') as Promise<any>);
        ipfsClient = create({ url: process.env.KUBO_API_URL || 'http://localhost:5001' });
    }
    return ipfsClient;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*' }
});

// Database
const db = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Trust proxy (required when behind Nginx to get real client IP for rate limiting)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Prometheus Metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    registers: [register],
});

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
});

const dbPoolActive = new client.Gauge({
    name: 'db_pool_active_connections',
    help: 'Number of active database pool connections',
    registers: [register],
    collect() {
        this.set(db.totalCount - db.idleCount);
    },
});

// Metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/metrics') return next();
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
        const route = req.route?.path || req.path;
        const labels = { method: req.method, route, status_code: String(res.statusCode) };
        end(labels);
        httpRequestsTotal.inc(labels);
    });
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000 // Increased from 300 to prevent provider daemon heartbeat 429 errors
});
app.use('/api/', limiter);

// Routes

/**
 * GET /api/deals - List all deals
 */
app.get('/api/deals', async (req: Request, res: Response) => {
    try {
        const { status, client } = req.query;

        let query = 'SELECT * FROM deals WHERE 1=1';
        const params: any[] = [];

        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }

        if (client) {
            params.push(client);
            query += ` AND client_address = $${params.length}`;
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const result = await db.query(query, params);
        res.json({ deals: result.rows });

    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/deals/:id - Get specific deal
 */
app.get('/api/deals/:id', async (req: Request, res: Response) => {
    try {
        const dealId = req.params.id;

        const dealResult = await db.query(
            'SELECT * FROM deals WHERE deal_id = $1',
            [dealId]
        );

        if (dealResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        const shardsResult = await db.query(
            `SELECT s.*, p.peer_id, p.region, p.reputation_score
       FROM shards s
       JOIN providers p ON s.provider_address = p.address
       WHERE s.deal_id = $1
       ORDER BY s.shard_index`,
            [dealId]
        );

        res.json({
            deal: dealResult.rows[0],
            shards: shardsResult.rows
        });

    } catch (error) {
        console.error('Error fetching deal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/providers - List all providers
 */
app.get('/api/providers', async (req: Request, res: Response) => {
    try {
        const { active, min_reputation } = req.query;

        let query = 'SELECT * FROM providers WHERE 1=1';
        const params: any[] = [];

        if (active !== undefined) {
            params.push(active === 'true');
            query += ` AND active = $${params.length}`;
        }

        if (min_reputation) {
            params.push(parseInt(min_reputation as string));
            query += ` AND reputation_score >= $${params.length}`;
        }

        query += ' ORDER BY reputation_score DESC LIMIT 100';

        const result = await db.query(query, params);
        res.json({ providers: result.rows });

    } catch (error) {
        console.error('Error fetching providers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/providers/:address - Get specific provider
 */
app.get('/api/providers/:address', async (req: Request, res: Response) => {
    try {
        const address = req.params.address;

        const providerResult = await db.query(
            'SELECT * FROM providers WHERE LOWER(address) = LOWER($1) ORDER BY last_heartbeat DESC NULLS LAST LIMIT 1',
            [address]
        );

        if (providerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        const pledgesResult = await db.query(
            'SELECT * FROM capacity_pledges WHERE LOWER(provider_address) = LOWER($1) ORDER BY created_at DESC',
            [address]
        );

        const dealsResult = await db.query(
            `SELECT DISTINCT d.* FROM deals d
       JOIN shards s ON d.deal_id = s.deal_id
       WHERE LOWER(s.provider_address) = LOWER($1)
       ORDER BY d.created_at DESC LIMIT 20`,
            [address]
        );

        res.json({
            provider: providerResult.rows[0],
            pledges: pledgesResult.rows,
            deals: dealsResult.rows
        });

    } catch (error) {
        console.error('Error fetching provider:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/heartbeat - Provider heartbeat
 */
app.post('/api/heartbeat', async (req: Request, res: Response) => {
    try {
        const { provider_address, storage } = req.body;

        if (!provider_address) {
            return res.status(400).json({ error: 'provider_address required' });
        }

        // UPSERT: create provider row if it doesn't exist, always update heartbeat
        await db.query(
            `INSERT INTO providers (address, peer_id, last_heartbeat, active, reputation_score, registered_at)
             VALUES (LOWER($1), 'pending', NOW(), true, 50, NOW())
             ON CONFLICT (address) DO UPDATE SET last_heartbeat = NOW(), active = true, peer_id = COALESCE(EXCLUDED.peer_id, providers.peer_id)`,
            [provider_address]
        );

        // Persist storage metrics if provided (defensive — columns may not exist yet)
        if (storage && storage.pledged_capacity_gb !== undefined) {
            try {
                await db.query(
                    `UPDATE providers SET
                        pledged_capacity_gb = $1,
                        used_gb = $2
                     WHERE LOWER(address) = LOWER($3)`,
                    [storage.pledged_capacity_gb, storage.used_gb || 0, provider_address]
                );
            } catch (storageErr) {
                // Columns may not exist yet — silently ignore
                console.warn('Storage columns not available in DB, skipping storage update');
            }
        }

        // Emit event via WebSocket
        io.emit('heartbeat', { provider: provider_address, timestamp: new Date() });

        res.json({ success: true });

    } catch (error) {
        console.error('Error updating heartbeat:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/stats - Network statistics
 */
app.get('/api/stats', async (req: Request, res: Response) => {
    try {
        const stats = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM deals WHERE status = 'active') as active_deals,
        (SELECT COUNT(*) FROM deals) as total_deals,
        (SELECT COUNT(*) FROM deals WHERE status = 'completed') as deals_completed,
        (SELECT COUNT(*) FROM deals WHERE status = 'failed') as deals_failed,
        (SELECT COUNT(*) FROM providers WHERE active = true AND last_heartbeat > NOW() - INTERVAL '45 seconds') as active_providers,
        (SELECT COUNT(DISTINCT provider_address) FROM capacity_pledges WHERE active = true) as total_providers,
        (SELECT COUNT(*) FROM shards WHERE active = true) as active_shards,
        (SELECT COALESCE(SUM(capacity_gb), 0) FROM capacity_pledges WHERE active = true AND (LOWER(provider_address) IN (SELECT LOWER(address) FROM providers WHERE last_heartbeat > NOW() - INTERVAL '45 seconds') OR EXISTS (SELECT 1 FROM providers WHERE last_heartbeat > NOW() - INTERVAL '45 seconds'))) as total_capacity_gb,
        (SELECT COALESCE(SUM(capacity_gb), 0) FROM capacity_pledges WHERE active = true) as total_capacity_all_gb,
        (SELECT COALESCE(SUM(utilization_gb), 0) FROM capacity_pledges WHERE active = true) as total_utilization_gb,
        (SELECT AVG(reputation_score) FROM providers WHERE active = true) as avg_reputation,
        (SELECT COALESCE(SUM(protocol_fee), 0) FROM deals) as total_protocol_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM slashing_events) as total_tokens_burned
    `);

        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        res.json(stats.rows[0]);

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/events - Recent protocol events
 */
app.get('/api/events', async (req: Request, res: Response) => {
    try {
        const result = await db.query('SELECT * FROM protocol_events ORDER BY created_at DESC LIMIT 50');
        res.json({ events: result.rows });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/detect-region - Detect region based on IP
 */
app.get('/api/detect-region', async (req: Request, res: Response) => {
    try {
        // In a real production environment, we would use the request IP
        // For local development/demo, we'll use a public IP or a mock
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // Using ip-api.com (free for non-commercial use, no API key required for basic)
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,continentCode,countryCode`);
        const data: any = await response.json();

        if (data.status === 'fail') {
            // Fallback for local/private IPs
            return res.json({ region: 'na', detected: false, message: data.message });
        }

        // Map continent codes to our region codes
        const regionMap: { [key: string]: string } = {
            'NA': 'na',
            'EU': 'eu',
            'AS': 'asia',
            'SA': 'sa',
            'OC': 'oc',
            'AF': 'af'
        };

        const region = regionMap[data.continentCode] || 'na';
        res.json({ region, detected: true, country: data.countryCode });

    } catch (error) {
        console.error('Error detecting region:', error);
        res.json({ region: 'na', detected: false });
    }
});

/**
 * POST /api/events - Record a new protocol event (Internal)
 */
app.post('/api/events', async (req: Request, res: Response) => {
    try {
        const { event_type, description, data } = req.body;
        const result = await db.query(
            'INSERT INTO protocol_events (event_type, description, data) VALUES ($1, $2, $3) RETURNING *',
            [event_type, description, JSON.stringify(data)]
        );

        // Broadcast to all connected clients
        io.emit('protocol_event', result.rows[0]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error recording event:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/deals/:dealId/key - Store encrypted file key
 * The key is ECIES-wrapped — only the deal creator can decrypt it.
 */
app.post('/api/deals/:dealId/key', async (req: Request, res: Response) => {
    try {
        const { dealId } = req.params;
        const { encrypted_key, encryption_iv, encryption_auth_tag, client_address } = req.body;

        if (!encrypted_key || !encryption_iv || !encryption_auth_tag || !client_address) {
            return res.status(400).json({ error: 'Missing required encryption fields' });
        }

        await db.query(
            `UPDATE deals SET
                is_encrypted = true,
                encrypted_key = $1,
                encryption_iv = $2,
                encryption_auth_tag = $3
             WHERE deal_id = $4 AND client_address = $5`,
            [encrypted_key, encryption_iv, encryption_auth_tag, dealId, client_address.toLowerCase()]
        );

        res.json({ message: 'Encryption key stored', deal_id: dealId });
    } catch (error) {
        console.error('Error storing encryption key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/deals/:dealId/key - Retrieve encrypted file key
 * Returns the wrapped key — client decrypts locally using their wallet.
 */
app.get('/api/deals/:dealId/key', async (req: Request, res: Response) => {
    try {
        const { dealId } = req.params;
        const result = await db.query(
            `SELECT encrypted_key, encryption_iv, encryption_auth_tag, is_encrypted, client_address
             FROM deals WHERE deal_id = $1`,
            [dealId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        const deal = result.rows[0];
        if (!deal.is_encrypted || !deal.encrypted_key) {
            return res.json({ is_encrypted: false });
        }

        res.json({
            is_encrypted: true,
            encrypted_key: deal.encrypted_key,
            encryption_iv: deal.encryption_iv,
            encryption_auth_tag: deal.encryption_auth_tag,
            client_address: deal.client_address
        });
    } catch (error) {
        console.error('Error retrieving encryption key:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/deals/:id - Cancel a deal and trigger provider cleanup
 */
app.delete('/api/deals/:id', async (req: Request, res: Response) => {
    try {
        const dealId = req.params.id;

        // Verify deal exists and is active
        const dealResult = await db.query(
            'SELECT * FROM deals WHERE deal_id = $1',
            [dealId]
        );

        if (dealResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        const deal = dealResult.rows[0];
        if (deal.status !== 'active' && deal.status !== 'in_grace_period') {
            return res.status(400).json({ error: `Deal is already ${deal.status}` });
        }

        // Mark deal as cancelled
        await db.query(
            'UPDATE deals SET status = $1, cancelled_at = NOW() WHERE deal_id = $2',
            ['cancelled', dealId]
        );

        // Fetch shard CIDs before deactivating (for WebSocket broadcast)
        const shardsResult = await db.query(
            'SELECT shard_cid, provider_address FROM shards WHERE deal_id = $1 AND active = true',
            [dealId]
        );
        const shardCIDs = shardsResult.rows.map((s: any) => s.shard_cid);
        const providerAddresses = [...new Set(shardsResult.rows.map((s: any) => s.provider_address))];

        // Deactivate all shards
        await db.query(
            'UPDATE shards SET active = false, deleted_at = NOW() WHERE deal_id = $1 AND active = true',
            [dealId]
        );

        // Log protocol event
        await db.query(
            'INSERT INTO protocol_events (event_type, description, data) VALUES ($1, $2, $3)',
            ['DEAL_CANCELLED', `Deal #${dealId} cancelled — ${shardCIDs.length} shards marked for cleanup`,
             JSON.stringify({ dealId, shardCIDs, providerAddresses })]
        );

        // Broadcast to all connected providers via WebSocket
        io.emit('deal:cancelled', { dealId, shardCIDs, providerAddresses });

        res.json({
            success: true,
            message: `Deal #${dealId} cancelled. ${shardCIDs.length} shards queued for provider cleanup.`,
            shards_deactivated: shardCIDs.length
        });

    } catch (error) {
        console.error('Error cancelling deal:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/providers/:address/cleanup - Get shard CIDs that should be unpinned
 * Returns inactive shards from cancelled/completed/failed deals for this provider
 */
app.get('/api/providers/:address/cleanup', async (req: Request, res: Response) => {
    try {
        const address = req.params.address;

        const result = await db.query(
            `SELECT s.shard_cid, s.deal_id, d.status as deal_status, s.deleted_at
             FROM shards s
             JOIN deals d ON s.deal_id = d.deal_id
             WHERE LOWER(s.provider_address) = LOWER($1)
               AND s.active = false
               AND d.status IN ('cancelled', 'completed', 'failed')
             ORDER BY s.deleted_at DESC`,
            [address]
        );

        res.json({
            provider: address,
            cleanup_count: result.rows.length,
            shards: result.rows
        });

    } catch (error) {
        console.error('Error fetching cleanup list:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /health - Health check
 */
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

/**
 * GET /metrics - Prometheus metrics
 */
app.get('/metrics', async (req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Keep track of active provider sockets
const providerSockets = new Map<string, string>();

// WebSocket events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('register:provider', (data) => {
        if (data && data.address) {
            const providerAddress = data.address.toLowerCase();
            providerSockets.set(providerAddress, socket.id);
            socket.join(`provider-rpc:${providerAddress}`);
            console.log(`🛡️ Provider registered for RPC: ${providerAddress} on socket ${socket.id}`);
            // Broadcast real-time online status to all dashboard clients
            io.emit('provider:status', { address: providerAddress, online: true });
        }
    });

    socket.on('subscribe:deal', (dealId) => {
        socket.join(`deal:${dealId}`);
        console.log(`Client ${socket.id} subscribed to deal ${dealId}`);
    });

    socket.on('subscribe:provider', (providerAddress) => {
        socket.join(`provider:${providerAddress}`);
        console.log(`Client ${socket.id} subscribed to provider ${providerAddress}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove from providerSockets map if it was a provider
        for (const [address, id] of providerSockets.entries()) {
            if (id === socket.id) {
                providerSockets.delete(address);
                console.log(`Provider disconnected: ${address}`);
                // Broadcast real-time offline status to all dashboard clients
                io.emit('provider:status', { address, online: false });
                break;
            }
        }
    });
});

/**
 * GET /api/providers/:address/rpc/peer-id - Request Peer ID directly from provider via WebSocket
 */
app.get('/api/providers/:address/rpc/peer-id', async (req: Request, res: Response) => {
    try {
        const address = req.params.address.toLowerCase();
        
        // Find if provider is connected
        const sockets = await io.in(`provider-rpc:${address}`).fetchSockets();
        
        if (sockets.length === 0) {
            return res.status(404).json({ error: 'Provider is not currently connected to the relay' });
        }

        // Request peer-id via socket with a 5 second timeout
        const clientSocket = sockets[0]; // Take the first connected instance
        
        try {
            const response = await clientSocket.timeout(5000).emitWithAck('rpc:get-peer-id');
            res.json(response);
        } catch (timeoutErr) {
            res.status(504).json({ error: 'Provider connected but failed to respond in time' });
        }

    } catch (error) {
        console.error('Error fetching peer-id via RPC:', error);
        res.status(500).json({ error: 'Internal server error while routing RPC' });
    }
});

// ====================================================
// PRODUCTION ROUTES: Real File Upload & Deal Pipeline
// ====================================================

/**
 * POST /api/upload - Upload a file to IPFS and return the real CID
 * Accepts multipart/form-data with a 'file' field
 */
app.post('/api/upload', uploadLimiter, upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const ipfs = await getIpfs();
        const result = await ipfs.add(req.file.buffer, { pin: true });
        const cid = result.cid.toString();

        console.log(`📦 File uploaded to IPFS: ${cid} (${req.file.size} bytes)`);

        res.json({
            success: true,
            cid,
            size: req.file.size,
            sizeGB: req.file.size / (1024 ** 3),
            filename: req.file.originalname
        });

    } catch (error: any) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file to storage network' });
    }
});

/**
 * POST /api/deals/create - Create a real storage deal
 * Performs: erasure coding (10+5) → provider selection → DB insertion → WebSocket broadcast
 * On-chain deal creation is handled separately by the client's wallet transaction
 */
app.post('/api/deals/create', async (req: Request, res: Response) => {
    try {
        const { fileCID, fileName, sizeGB, pricePerGBMonth, durationDays, clientAddress, encrypted } = req.body;

        if (!fileCID || !clientAddress || !sizeGB) {
            return res.status(400).json({ error: 'Missing required fields: fileCID, clientAddress, sizeGB' });
        }

        console.log(`🔧 Creating deal for file ${fileCID} (${sizeGB} GB)...`);

        // Step 1: Erasure code the file into shards (10 data + 5 parity)
        const DATA_SHARDS = 10;
        const PARITY_SHARDS = 5;
        const TOTAL_SHARDS = DATA_SHARDS + PARITY_SHARDS;

        let shardCIDs: string[] = [];
        let shardSizes: number[] = [];

        try {
            const ipfs = await getIpfs();

            // Download the file from IPFS
            const chunks: Uint8Array[] = [];
            for await (const chunk of ipfs.cat(fileCID)) {
                chunks.push(chunk);
            }
            const fileData = Buffer.concat(chunks);
            const fileSize = fileData.length;

            // Simple erasure coding: split into 10 data shards, create 5 parity shards
            const shardSize = Math.ceil(fileSize / DATA_SHARDS);
            const dataShards: Buffer[] = [];

            for (let i = 0; i < DATA_SHARDS; i++) {
                const start = i * shardSize;
                const end = Math.min(start + shardSize, fileSize);
                const shard = Buffer.alloc(shardSize, 0);
                fileData.copy(shard, 0, start, end);
                dataShards.push(shard);
            }

            // Generate parity shards via simple XOR (lightweight erasure coding)
            const parityShards: Buffer[] = [];
            for (let p = 0; p < PARITY_SHARDS; p++) {
                const parity = Buffer.alloc(shardSize, 0);
                for (let d = 0; d < DATA_SHARDS; d++) {
                    for (let b = 0; b < shardSize; b++) {
                        parity[b] ^= dataShards[(d + p) % DATA_SHARDS][b];
                    }
                }
                parityShards.push(parity);
            }

            const allShards = [...dataShards, ...parityShards];

            // Upload each shard to IPFS
            for (let i = 0; i < allShards.length; i++) {
                const shardResult = await ipfs.add(allShards[i], { pin: true });
                shardCIDs.push(shardResult.cid.toString());
                shardSizes.push(allShards[i].length);
            }

            console.log(`✅ File split into ${TOTAL_SHARDS} shards (${DATA_SHARDS} data + ${PARITY_SHARDS} parity)`);

        } catch (shardErr: any) {
            console.error('Erasure coding failed:', shardErr.message);
            // Fallback: store the file as a single shard
            shardCIDs = [fileCID];
            shardSizes = [Math.ceil((sizeGB || 0.001) * 1024 * 1024 * 1024)];
            console.warn('⚠️ Fallback: storing file as single shard (no erasure coding)');
        }

        // Step 2: Select available providers
        let selectedProviders: any[] = [];
        try {
            const providerResult = await db.query(`
                SELECT p.address, p.peer_id, p.region, p.reputation_score,
                       COALESCE(cp.capacity_gb, 0) as capacity_gb,
                       COALESCE(cp.utilization_gb, 0) as utilization_gb
                FROM providers p
                LEFT JOIN capacity_pledges cp ON LOWER(p.address) = LOWER(cp.provider_address) AND cp.active = true
                WHERE p.active = true
                  AND p.last_heartbeat > NOW() - INTERVAL '90 seconds'
                ORDER BY p.reputation_score DESC
            `);

            selectedProviders = providerResult.rows;
            console.log(`📡 Found ${selectedProviders.length} active provider(s)`);

            if (selectedProviders.length === 0) {
                console.warn('⚠️ No active providers — shards will be stored on IPFS only (unassigned)');
            }
        } catch (provErr: any) {
            console.warn('Provider selection failed:', provErr.message);
        }

        // Step 3: Create deal record in database
        const dealId = `D-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const totalMonths = Math.max(1, Math.ceil((durationDays || 30) / 30));
        const storageCost = (sizeGB || 0.001) * (pricePerGBMonth || 0.01) * totalMonths;
        const protocolFee = storageCost * 0.03;

        await db.query(
            `INSERT INTO deals (deal_id, client_address, file_cid, file_size_gb, duration_days, price_per_gb_month, 
                               total_cost, protocol_fee, status, created_at)
             VALUES ($1, LOWER($2), $3, $4, $5, $6, $7, $8, 'active', NOW())`,
            [dealId, clientAddress, fileCID, sizeGB, durationDays || 30, pricePerGBMonth || 0.01, storageCost, protocolFee]
        );

        // Step 4: Create shard records and assign to providers
        for (let i = 0; i < shardCIDs.length; i++) {
            // Assign shard to a provider (round-robin across available providers)
            const assignedProvider = selectedProviders.length > 0
                ? selectedProviders[i % selectedProviders.length].address
                : clientAddress; // Self-assign if no providers available

            await db.query(
                `INSERT INTO shards (deal_id, shard_index, shard_cid, shard_size_bytes, provider_address, 
                                    is_data_shard, active, created_at)
                 VALUES ($1, $2, $3, $4, LOWER($5), $6, true, NOW())`,
                [dealId, i, shardCIDs[i], shardSizes[i], assignedProvider, i < DATA_SHARDS]
            );
        }

        // Step 5: Log protocol event
        await db.query(
            `INSERT INTO protocol_events (event_type, description, data) VALUES ($1, $2, $3)`,
            ['DEAL_CREATED', `Deal ${dealId} created: ${fileName || 'file'} (${shardCIDs.length} shards)`,
             JSON.stringify({ dealId, fileCID, shardCount: shardCIDs.length, providers: selectedProviders.length, encrypted: !!encrypted })]
        );

        // Step 6: Broadcast to all connected clients
        io.emit('protocol_event', {
            event_type: 'DEAL_CREATED',
            description: `New storage deal: ${fileName || dealId}`,
            data: { dealId, fileCID, shardCount: shardCIDs.length },
            created_at: new Date()
        });

        // Notify provider daemons about new shard assignments
        for (const provider of selectedProviders) {
            io.to(`provider-rpc:${provider.address.toLowerCase()}`).emit('shard:assigned', {
                dealId,
                shardCIDs: shardCIDs.filter((_, idx) => {
                    const assignedTo = selectedProviders[idx % selectedProviders.length];
                    return assignedTo && assignedTo.address.toLowerCase() === provider.address.toLowerCase();
                })
            });
        }

        console.log(`✅ Deal ${dealId} created with ${shardCIDs.length} shards across ${selectedProviders.length} provider(s)`);

        res.json({
            success: true,
            dealId,
            fileCID,
            shardCount: shardCIDs.length,
            shardCIDs,
            providerCount: selectedProviders.length,
            providers: selectedProviders.map(p => ({ address: p.address, region: p.region })),
            totalCost: storageCost + protocolFee,
            protocolFee,
            degradedMode: selectedProviders.length < TOTAL_SHARDS
        });

    } catch (error: any) {
        console.error('Error creating deal:', error);
        res.status(500).json({ error: `Failed to create deal: ${error.message}` });
    }
});

/**
 * GET /api/deals/:id/download - Reconstruct and download a file from its shards
 */
app.get('/api/deals/:id/download', async (req: Request, res: Response) => {
    try {
        const dealId = req.params.id;

        // Get deal info
        const dealResult = await db.query(
            'SELECT * FROM deals WHERE deal_id = $1',
            [dealId]
        );

        if (dealResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        const deal = dealResult.rows[0];

        // Try to get the original file directly from IPFS first
        try {
            const ipfs = await getIpfs();
            const chunks: Uint8Array[] = [];
            for await (const chunk of ipfs.cat(deal.file_cid)) {
                chunks.push(chunk);
            }
            const fileData = Buffer.concat(chunks);

            res.set('Content-Type', 'application/octet-stream');
            res.set('Content-Disposition', `attachment; filename="${deal.file_cid}"`);
            res.set('X-File-CID', deal.file_cid);
            res.set('X-Encrypted', deal.is_encrypted ? 'true' : 'false');
            return res.send(fileData);

        } catch (ipfsErr: any) {
            console.warn(`Original file not available on IPFS, attempting shard reconstruction...`);
        }

        // Fallback: reconstruct from data shards
        const shardsResult = await db.query(
            `SELECT shard_cid, shard_index FROM shards 
             WHERE deal_id = $1 AND active = true AND is_data_shard = true 
             ORDER BY shard_index ASC`,
            [dealId]
        );

        if (shardsResult.rows.length === 0) {
            return res.status(404).json({ error: 'No active shards found for this deal' });
        }

        const ipfs = await getIpfs();
        const dataShardBuffers: Buffer[] = [];

        for (const shard of shardsResult.rows) {
            const chunks: Uint8Array[] = [];
            for await (const chunk of ipfs.cat(shard.shard_cid)) {
                chunks.push(chunk);
            }
            dataShardBuffers.push(Buffer.concat(chunks));
        }

        const reconstructedFile = Buffer.concat(dataShardBuffers);

        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment; filename="${deal.file_cid}"`);
        res.set('X-File-CID', deal.file_cid);
        res.set('X-Reconstructed', 'true');
        res.send(reconstructedFile);

    } catch (error: any) {
        console.error('Error downloading deal file:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

/**
 * DELETE /api/deals/:id - Cancel a storage deal early
 */
app.delete('/api/deals/:id', async (req: Request, res: Response) => {
    try {
        const dealId = req.params.id;
        const clientAddress = req.headers['x-client-address'] as string; // Ideally verified via signature

        const dealResult = await db.query('SELECT * FROM deals WHERE deal_id = $1', [dealId]);
        if (dealResult.rows.length === 0) {
            return res.status(404).json({ error: 'Deal not found' });
        }

        const deal = dealResult.rows[0];

        // Basic verification (in production, verify signed message)
        if (clientAddress && deal.client_address.toLowerCase() !== clientAddress.toLowerCase()) {
            return res.status(403).json({ error: 'Not authorized to cancel this deal' });
        }

        if (deal.status !== 'active') {
            return res.status(400).json({ error: `Cannot cancel deal in status: ${deal.status}` });
        }

        // Cancel deal and inactive shards
        await db.query('UPDATE deals SET status = $1, cancelled_at = NOW() WHERE deal_id = $2', ['cancelled', dealId]);
        await db.query('UPDATE shards SET active = false, deleted_at = NOW() WHERE deal_id = $1 AND active = true', [dealId]);

        // Log protocol event
        await db.query(
            `INSERT INTO protocol_events (event_type, description, data) VALUES ($1, $2, $3)`,
            ['DEAL_CANCELLED', `Deal ${dealId} cancelled by client`, JSON.stringify({ dealId, clientAddress })]
        );

        // Broadcast to clients
        io.emit('protocol_event', {
            event_type: 'DEAL_CANCELLED',
            description: `Storage deal cancelled: ${dealId}`,
            data: { dealId },
            created_at: new Date()
        });

        // Broadcast directly to provider RPC channel for immediate cleanup
        io.emit('deal:cancelled', { dealId });

        console.log(`❌ Deal ${dealId} cancelled via API, deletion propagated to providers`);

        res.json({ success: true, message: 'Deal cancelled successfully' });

    } catch (error: any) {
        console.error('Error cancelling deal:', error);
        res.status(500).json({ error: 'Failed to cancel deal' });
    }
});

// ====================================================
// CRON JOBS
// ====================================================

// Deal expiration check (runs every 5 minutes)
setInterval(async () => {
    try {
        console.log('⏳ Running deal expiration check...');
        const expiredResult = await db.query(`
            SELECT deal_id FROM deals 
            WHERE status = 'active' 
            AND created_at + (duration_days || ' days')::interval < NOW()
        `);

        if (expiredResult.rows.length > 0) {
            console.log(`Found ${expiredResult.rows.length} expired deals to auto-complete.`);
            
            for (const row of expiredResult.rows) {
                const dealId = row.deal_id;
                
                // Mark deal completed and shards inactive
                await db.query('UPDATE deals SET status = $1, completed_at = NOW() WHERE deal_id = $2', ['completed', dealId]);
                await db.query('UPDATE shards SET active = false, deleted_at = NOW() WHERE deal_id = $1 AND active = true', [dealId]);
                
                await db.query(
                    `INSERT INTO protocol_events (event_type, description, data) VALUES ($1, $2, $3)`,
                    ['DEAL_COMPLETED', `Deal ${dealId} automatically completed (expired)`, JSON.stringify({ dealId })]
                );

                io.emit('deal:cancelled', { dealId }); // Signals provider daemon to clean up shards
            }
        }
    } catch (err) {
        console.error('Error during expiration cron:', err);
    }
}, 5 * 60 * 1000);

// Export io for use in other modules
export { io };

// Start server
const PORT = process.env.PORT || 3002;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`✅ API server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
    console.log(`📦 IPFS URL: ${process.env.KUBO_API_URL || 'http://localhost:5001'}`);
});
