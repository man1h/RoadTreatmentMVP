import express from 'express';
import cors from 'cors';
import { loadBridges } from './bridgeService';
import dotenv from 'dotenv';
import { authenticateToken, requireRole, AuthRequest } from './middleware/auth';
import * as authService from './services/authService';
import * as ticketService from './services/ticketService';
import * as materialService from './services/materialService';
import * as weatherService from './services/weatherService';
import pool from './db';

import { createServer } from 'http';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io);

app.use(cors());
app.use(express.json());

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

// --- Ticket Routes ---
app.post('/api/tickets', authenticateToken, requireRole(['dispatcher', 'admin']), async (req: any, res) => {
    try {
        const { tmcId, truckId, driverId, priority, scheduledTime, notes, bridgeIds } = req.body;
        const authReq = req as AuthRequest;
        const ticket = await ticketService.createTicket(
            tmcId,
            authReq.user!.id,
            truckId,
            driverId,
            priority,
            scheduledTime,
            notes,
            bridgeIds
        );

        const io = req.app.get('io');
        io.emit('ticket_created', ticket);

        res.status(201).json(ticket);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/tickets', authenticateToken, async (req, res) => {
    try {
        const { tmcId, status } = req.query;
        const tickets = await ticketService.getTickets(
            tmcId ? parseInt(tmcId as string) : undefined,
            status as string
        );
        res.json(tickets);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.patch('/api/tickets/:id', authenticateToken, async (req: any, res) => {
    try {
        const { status } = req.body;
        const authReq = req as AuthRequest;
        const ticket = await ticketService.updateTicketStatus(
            parseInt(req.params.id),
            status,
            authReq.user!.id
        );

        const io = req.app.get('io');
        io.emit('ticket_updated', ticket);

        res.json(ticket);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/tickets/:id', authenticateToken, requireRole(['dispatcher', 'admin']), async (req: any, res) => {
    try {
        const { truckId, driverId, priority, scheduledTime, notes } = req.body;
        const ticket = await ticketService.updateTicket(
            parseInt(req.params.id),
            { truckId, driverId, priority, scheduledTime, notes }
        );

        const io = req.app.get('io');
        io.emit('ticket_updated', ticket);

        res.json(ticket);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/tickets/:id', authenticateToken, requireRole(['dispatcher', 'admin']), async (req, res) => {
    try {
        const result = await ticketService.deleteTicket(parseInt(req.params.id));

        const io = req.app.get('io');
        io.emit('ticket_deleted', { id: parseInt(req.params.id) });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Material Routes ---
app.get('/api/materials/inventory', authenticateToken, async (req, res) => {
    try {
        const { tmcId } = req.query;
        if (!tmcId) return res.status(400).json({ error: 'tmcId is required' });

        const inventory = await materialService.getInventory(parseInt(tmcId as string));
        res.json(inventory);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/treatments', authenticateToken, requireRole(['driver', 'dispatcher', 'admin']), async (req, res) => {
    try {
        const { ticketId, bridgeId, materialType, quantityTons } = req.body;
        const result = await materialService.recordMaterialUsage(
            ticketId,
            bridgeId,
            materialType,
            quantityTons
        );
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Weather Routes ---
app.get('/api/weather/alerts', authenticateToken, async (req, res) => {
    try {
        const alerts = await weatherService.getWeatherAlerts();
        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- User Management Routes (Admin Only) ---
app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.email, u.role, u.tmc_id, u.name, u.phone, u.created_at,
                   t.name as tmc_name
            FROM users u
            LEFT JOIN tmc_centers t ON u.tmc_id = t.id
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { email, password, role, tmcId, name, phone } = req.body;
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, role, tmc_id, name, phone)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, email, role, tmc_id, name, phone, created_at`,
            [email, passwordHash, role, tmcId, name, phone]
        );

        const io = req.app.get('io');
        io.emit('user_created', result.rows[0]);

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const { email, role, tmcId, name, phone } = req.body;
        const result = await pool.query(
            `UPDATE users 
             SET email = $1, role = $2, tmc_id = $3, name = $4, phone = $5
             WHERE id = $6
             RETURNING id, email, role, tmc_id, name, phone`,
            [email, role, tmcId, name, phone, req.params.id]
        );

        const io = req.app.get('io');
        io.emit('user_updated', result.rows[0]);

        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);

        const io = req.app.get('io');
        io.emit('user_deleted', { id: parseInt(req.params.id) });

        res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Fleet Management Routes ---
app.get('/api/trucks', authenticateToken, async (req, res) => {
    try {
        const { tmcId } = req.query;
        let query = 'SELECT * FROM trucks';
        const params: any[] = [];

        if (tmcId) {
            query += ' WHERE tmc_id = $1';
            params.push(tmcId);
        }

        query += ' ORDER BY truck_number';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/trucks', authenticateToken, requireRole(['admin', 'dispatcher']), async (req, res) => {
    try {
        const { truckNumber, tmcId, capacityTons } = req.body;
        const result = await pool.query(
            `INSERT INTO trucks (truck_number, tmc_id, status, capacity_tons)
             VALUES ($1, $2, 'available', $3)
             RETURNING *`,
            [truckNumber, tmcId, capacityTons]
        );

        const io = req.app.get('io');
        io.emit('truck_created', result.rows[0]);

        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/trucks/:id', authenticateToken, requireRole(['admin', 'dispatcher']), async (req, res) => {
    try {
        const { status, capacityTons } = req.body;
        const result = await pool.query(
            `UPDATE trucks 
             SET status = $1, capacity_tons = $2
             WHERE id = $3
             RETURNING *`,
            [status, capacityTons, req.params.id]
        );

        const io = req.app.get('io');
        io.emit('truck_updated', result.rows[0]);

        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/trucks/:id', authenticateToken, requireRole(['admin', 'dispatcher']), async (req, res) => {
    try {
        await pool.query('DELETE FROM trucks WHERE id = $1', [req.params.id]);

        const io = req.app.get('io');
        io.emit('truck_deleted', { id: parseInt(req.params.id) });

        res.json({ message: 'Truck deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Material Usage Routes ---
app.post('/api/materials/usage', authenticateToken, requireRole(['admin', 'dispatcher']), async (req, res) => {
    try {
        const { tmcId, materialType, quantityTons } = req.body;

        // Update inventory
        await pool.query(
            `UPDATE materials 
             SET quantity_tons = quantity_tons - $1, last_updated = NOW()
             WHERE tmc_id = $2 AND material_type = $3`,
            [quantityTons, tmcId, materialType]
        );

        // Get updated inventory
        const result = await pool.query(
            'SELECT * FROM materials WHERE tmc_id = $1 AND material_type = $2',
            [tmcId, materialType]
        );

        const io = req.app.get('io');
        io.emit('material_updated', result.rows[0]);

        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/materials/restock', authenticateToken, requireRole(['admin', 'dispatcher']), async (req, res) => {
    try {
        const { tmcId, materialType, quantityTons } = req.body;

        // Update inventory (add)
        await pool.query(
            `UPDATE materials 
             SET quantity_tons = quantity_tons + $1, last_updated = NOW()
             WHERE tmc_id = $2 AND material_type = $3`,
            [quantityTons, tmcId, materialType]
        );

        // Get updated inventory
        const result = await pool.query(
            'SELECT * FROM materials WHERE tmc_id = $1 AND material_type = $2',
            [tmcId, materialType]
        );

        const io = req.app.get('io');
        io.emit('material_updated', result.rows[0]);

        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/materials/:id', authenticateToken, requireRole(['admin', 'dispatcher']), async (req, res) => {
    try {
        const { quantityTons } = req.body;

        const result = await pool.query(
            `UPDATE materials 
             SET quantity_tons = $1, last_updated = NOW()
             WHERE id = $2
             RETURNING *`,
            [quantityTons, req.params.id]
        );

        const io = req.app.get('io');
        io.emit('material_updated', result.rows[0]);

        res.json(result.rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Dashboard API Routes ---
app.get('/api/dashboard/statewide', authenticateToken, requireRole(['admin']), async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user!.id;

        // Get user's TMC preferences
        const prefsResult = await pool.query(
            'SELECT tmc_id FROM user_tmc_preferences WHERE user_id = $1 AND is_monitoring = true',
            [userId]
        );
        const monitoredTmcIds = prefsResult.rows.map(r => r.tmc_id);

        // Get all TMCs with their stats
        const tmcStats = [];
        for (const tmcId of monitoredTmcIds) {
            const [tmcInfo, trucks, tickets, materials] = await Promise.all([
                pool.query('SELECT id, name, region FROM tmc_centers WHERE id = $1', [tmcId]),
                pool.query('SELECT status, COUNT(*) as count FROM trucks WHERE tmc_id = $1 GROUP BY status', [tmcId]),
                pool.query('SELECT status, COUNT(*) as count FROM treatment_tickets WHERE tmc_id = $1 GROUP BY status', [tmcId]),
                pool.query('SELECT material_type, quantity_tons FROM materials WHERE tmc_id = $1', [tmcId])
            ]);

            const truckCounts = trucks.rows.reduce((acc: any, row: any) => {
                acc[row.status] = parseInt(row.count);
                return acc;
            }, { available: 0, in_service: 0, maintenance: 0 });

            const ticketCounts = tickets.rows.reduce((acc: any, row: any) => {
                acc[row.status] = parseInt(row.count);
                return acc;
            }, { pending: 0, active: 0, completed: 0 });

            const materialData = materials.rows.reduce((acc: any, row: any) => {
                acc[row.material_type] = parseFloat(row.quantity_tons);
                return acc;
            }, {});

            tmcStats.push({
                ...tmcInfo.rows[0],
                trucks: truckCounts,
                tickets: ticketCounts,
                materials: materialData
            });
        }

        // Calculate totals
        const totals = tmcStats.reduce((acc, tmc) => {
            acc.trucks += (tmc.trucks.available || 0) + (tmc.trucks.in_service || 0) + (tmc.trucks.maintenance || 0);
            acc.tickets += (tmc.tickets.pending || 0) + (tmc.tickets.active || 0);
            return acc;
        }, { trucks: 0, tickets: 0 });

        res.json({ totals, tmcStats });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/dashboard/tmc/:id', authenticateToken, async (req, res) => {
    try {
        const tmcId = parseInt(req.params.id);

        const [tmcInfo, trucks, tickets, materials, recentTickets] = await Promise.all([
            pool.query('SELECT * FROM tmc_centers WHERE id = $1', [tmcId]),
            pool.query('SELECT status, COUNT(*) as count FROM trucks WHERE tmc_id = $1 GROUP BY status', [tmcId]),
            pool.query('SELECT status, COUNT(*) as count FROM treatment_tickets WHERE tmc_id = $1 GROUP BY status', [tmcId]),
            pool.query('SELECT material_type, quantity_tons FROM materials WHERE tmc_id = $1', [tmcId]),
            pool.query(`
                SELECT tt.id, tt.ticket_number, tt.status, tt.priority, tt.created_at,
                       u.name as driver_name, tr.truck_number
                FROM treatment_tickets tt
                LEFT JOIN users u ON tt.driver_id = u.id
                LEFT JOIN trucks tr ON tt.truck_id = tr.id
                WHERE tt.tmc_id = $1
                ORDER BY tt.created_at DESC
                LIMIT 10
            `, [tmcId])
        ]);

        const truckCounts = trucks.rows.reduce((acc: any, row: any) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, { available: 0, in_service: 0, maintenance: 0 });

        const ticketCounts = tickets.rows.reduce((acc: any, row: any) => {
            acc[row.status] = parseInt(row.count);
            return acc;
        }, { pending: 0, active: 0, completed: 0 });

        const materialData = materials.rows.reduce((acc: any, row: any) => {
            acc[row.material_type] = parseFloat(row.quantity_tons);
            return acc;
        }, {});

        res.json({
            ...tmcInfo.rows[0],
            trucks: truckCounts,
            tickets: ticketCounts,
            materials: materialData,
            recentActivity: recentTickets.rows
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- User TMC Preferences Routes ---
app.get('/api/preferences/tmc', authenticateToken, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const result = await pool.query(
            `SELECT p.tmc_id, p.is_monitoring, t.name, t.region
             FROM user_tmc_preferences p
             JOIN tmc_centers t ON p.tmc_id = t.id
             WHERE p.user_id = $1
             ORDER BY t.id`,
            [authReq.user!.id]
        );
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/preferences/tmc/:tmcId', authenticateToken, async (req, res) => {
    try {
        const authReq = req as AuthRequest;
        const { isMonitoring } = req.body;

        await pool.query(
            `INSERT INTO user_tmc_preferences (user_id, tmc_id, is_monitoring, updated_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, tmc_id)
             DO UPDATE SET is_monitoring = $3, updated_at = NOW()`,
            [authReq.user!.id, req.params.tmcId, isMonitoring]
        );

        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Public Routes (No Auth) ---
app.get('/api/public/bridges', async (req, res) => {
    try {
        // Get all bridges with their latest treatment status
        const result = await pool.query(`
      SELECT DISTINCT ON (bt.bridge_id) 
        bt.bridge_id, 
        bt.treated_at, 
        bt.treatment_type,
        tt.status as ticket_status,
        tt.scheduled_time
      FROM bridge_treatments bt
      LEFT JOIN treatment_tickets tt ON bt.ticket_id = tt.id
      ORDER BY bt.bridge_id, bt.treated_at DESC
    `);
        res.json(result.rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// Legacy endpoint (keep for backward compatibility if needed, or refactor)
app.get('/api/bridges', async (req, res) => {
    try {
        const bridges = await loadBridges();
        res.json(bridges);
    } catch (error) {
        console.error('Error loading bridges:', error);
        res.status(500).json({ error: 'Failed to load bridges' });
    }
});

httpServer.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Routes mounted directly in index.ts');
    console.log('Socket.io initialized');
});
