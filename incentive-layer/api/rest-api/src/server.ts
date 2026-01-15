import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

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

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
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
            'SELECT * FROM providers WHERE address = $1',
            [address]
        );

        if (providerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }

        const pledgesResult = await db.query(
            'SELECT * FROM capacity_pledges WHERE provider_address = $1 ORDER BY created_at DESC',
            [address]
        );

        const dealsResult = await db.query(
            `SELECT DISTINCT d.* FROM deals d
       JOIN shards s ON d.deal_id = s.deal_id
       WHERE s.provider_address = $1
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
        const { provider_address } = req.body;

        if (!provider_address) {
            return res.status(400).json({ error: 'provider_address required' });
        }

        await db.query(
            'UPDATE providers SET last_heartbeat = NOW() WHERE address = $1',
            [provider_address]
        );

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
        (SELECT COUNT(*) FROM providers WHERE active = true) as active_providers,
        (SELECT COUNT(*) FROM shards WHERE active = true) as active_shards,
        (SELECT SUM(capacity_gb) FROM capacity_pledges WHERE active = true) as total_capacity_gb,
        (SELECT SUM(utilization_gb) FROM capacity_pledges WHERE active = true) as total_utilization_gb,
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
 * GET /health - Health check
 */
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});

// WebSocket events
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

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
    });
});

// Export io for use in other modules
export { io };

// Start server
const PORT = process.env.PORT || 3002;
httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`✅ API server running on port ${PORT}`);
    console.log(`📡 WebSocket server ready`);
});
