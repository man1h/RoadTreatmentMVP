import express from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import * as authService from '../services/authService';
import * as ticketService from '../services/ticketService';
import * as materialService from '../services/materialService';
import * as weatherService from '../services/weatherService';
import pool from '../db';

console.log('Loading API routes...');
const router = express.Router();

router.get('/ping', (req, res) => {
    console.log('Ping received');
    res.json({ message: 'pong' });
});

// --- Auth Routes ---
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

// --- Ticket Routes ---
router.post('/tickets', authenticateToken, requireRole(['dispatcher', 'admin']), async (req: any, res) => {
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
        res.status(201).json(ticket);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/tickets', authenticateToken, async (req, res) => {
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

router.patch('/tickets/:id', authenticateToken, async (req: any, res) => {
    try {
        const { status } = req.body;
        const authReq = req as AuthRequest;
        const ticket = await ticketService.updateTicketStatus(
            parseInt(req.params.id),
            status,
            authReq.user!.id
        );
        res.json(ticket);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Material Routes ---
router.get('/materials/inventory', authenticateToken, async (req, res) => {
    try {
        const { tmcId } = req.query;
        if (!tmcId) return res.status(400).json({ error: 'tmcId is required' });

        const inventory = await materialService.getInventory(parseInt(tmcId as string));
        res.json(inventory);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/treatments', authenticateToken, requireRole(['driver', 'dispatcher', 'admin']), async (req, res) => {
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
router.get('/weather/alerts', authenticateToken, async (req, res) => {
    try {
        const alerts = await weatherService.getWeatherAlerts();
        res.json(alerts);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// --- Public Routes (No Auth) ---
router.get('/public/bridges', async (req, res) => {
    try {
        // Get all bridges with their latest treatment status
        // This is a simplified query for MVP
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

export default router;
