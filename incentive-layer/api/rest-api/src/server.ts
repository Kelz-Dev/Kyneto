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

dotenv.config();

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
            'SELECT * FROM providers WHERE LOWER(address) = LOWER($1)',
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
             ON CONFLICT (address) DO UPDATE SET last_heartbeat = NOW(), active = true`,
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
        (SELECT COUNT(*) FROM providers WHERE active = true AND last_heartbeat > NOW() - INTERVAL '5 minutes') as active_providers,
        (SELECT COUNT(*) FROM shards WHERE active = true) as active_shards,
        (SELECT COALESCE(SUM(capacity_gb), 0) FROM capacity_pledges WHERE active = true AND provider_address IN (SELECT address FROM providers WHERE last_heartbeat > NOW() - INTERVAL '5 minutes')) as total_capacity_gb,
        (SELECT COALESCE(SUM(utilization_gb), 0) FROM capacity_pledges WHERE active = true) as total_utilization_gb,
        (SELECT AVG(reputation_score) FROM providers WHERE active = true) as avg_reputation,
        (SELECT COALESCE(SUM(protocol_fee), 0) FROM deals) as total_protocol_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM slashing_events) as total_tokens_burned
    `);

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

// Export io for use in other modules
export { io };

// Start server
const PORT = process.env.PORT || 3002;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`✅ API server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
});
