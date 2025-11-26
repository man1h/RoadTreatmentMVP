import pool from '../db';

export const createTicket = async (
    tmcId: number,
    createdBy: number,
    truckId: number,
    driverId: number,
    priority: string,
    scheduledTime: string,
    notes: string,
    bridgeIds: string[]
) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Generate ticket number (TICKET-YYYYMMDD-XXXX)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const ticketNumber = `TICKET-${dateStr}-${randomSuffix}`;

        // Create ticket
        const ticketResult = await client.query(
            `INSERT INTO treatment_tickets 
       (ticket_number, tmc_id, created_by, assigned_driver_id, truck_id, priority, scheduled_time, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'assigned')
       RETURNING id, ticket_number`,
            [ticketNumber, tmcId, createdBy, driverId, truckId, priority, scheduledTime, notes]
        );

        const ticketId = ticketResult.rows[0].id;

        // Link bridges to ticket
        for (const bridgeId of bridgeIds) {
            await client.query(
                `INSERT INTO bridge_treatments (ticket_id, bridge_id) VALUES ($1, $2)`,
                [ticketId, bridgeId]
            );
        }

        // Update truck status
        await client.query(
            `UPDATE trucks SET status = 'assigned' WHERE id = $1`,
            [truckId]
        );

        await client.query('COMMIT');

        // Fetch full ticket details to return
        const fullTicketQuery = `
            SELECT t.*, 
                   u.name as driver_name, 
                   tr.truck_number,
                   (SELECT COUNT(*) FROM bridge_treatments bt WHERE bt.ticket_id = t.id) as bridge_count
            FROM treatment_tickets t
            LEFT JOIN users u ON t.assigned_driver_id = u.id
            LEFT JOIN trucks tr ON t.truck_id = tr.id
            WHERE t.id = $1
        `;
        const fullTicketResult = await pool.query(fullTicketQuery, [ticketId]);
        return fullTicketResult.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const getTickets = async (tmcId?: number, status?: string) => {
    let query = `
    SELECT t.*, 
           u.name as driver_name, 
           tr.truck_number,
           (SELECT COUNT(*) FROM bridge_treatments bt WHERE bt.ticket_id = t.id) as bridge_count
    FROM treatment_tickets t
    LEFT JOIN users u ON t.assigned_driver_id = u.id
    LEFT JOIN trucks tr ON t.truck_id = tr.id
    WHERE 1=1
  `;

    const params: any[] = [];

    if (tmcId) {
        params.push(tmcId);
        query += ` AND t.tmc_id = $${params.length}`;
    }

    if (status) {
        params.push(status);
        query += ` AND t.status = $${params.length}`;
    }

    query += ` ORDER BY t.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
};

export const updateTicketStatus = async (ticketId: number, status: string, userId: number) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `UPDATE treatment_tickets 
       SET status = $1, 
           started_at = CASE WHEN $1 = 'in_progress' THEN NOW() ELSE started_at END,
           completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
       WHERE id = $2
       RETURNING *`,
            [status, ticketId]
        );

        if (status === 'completed') {
            // Free up the truck
            const truckId = result.rows[0].truck_id;
            await client.query(
                `UPDATE trucks SET status = 'available' WHERE id = $1`,
                [truckId]
            );
        }

        await client.query('COMMIT');

        // Fetch full ticket details to return
        const fullTicketQuery = `
            SELECT t.*, 
                   u.name as driver_name, 
                   tr.truck_number,
                   (SELECT COUNT(*) FROM bridge_treatments bt WHERE bt.ticket_id = t.id) as bridge_count
            FROM treatment_tickets t
            LEFT JOIN users u ON t.assigned_driver_id = u.id
            LEFT JOIN trucks tr ON t.truck_id = tr.id
            WHERE t.id = $1
        `;
        const fullTicketResult = await pool.query(fullTicketQuery, [ticketId]);
        return fullTicketResult.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const updateTicket = async (
    ticketId: number,
    updates: {
        truckId: number;
        driverId: number;
        priority: string;
        scheduledTime: string;
        notes: string;
    }
) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get current ticket info to handle truck status changes
        const currentTicketRes = await client.query('SELECT truck_id FROM treatment_tickets WHERE id = $1', [ticketId]);
        const oldTruckId = currentTicketRes.rows[0]?.truck_id;

        // Update ticket
        await client.query(
            `UPDATE treatment_tickets 
             SET truck_id = $1, assigned_driver_id = $2, priority = $3, scheduled_time = $4, notes = $5
             WHERE id = $6`,
            [updates.truckId, updates.driverId, updates.priority, updates.scheduledTime, updates.notes, ticketId]
        );

        // Handle truck status if truck changed
        if (oldTruckId && oldTruckId !== updates.truckId) {
            // Free old truck
            await client.query("UPDATE trucks SET status = 'available' WHERE id = $1", [oldTruckId]);
            // Assign new truck
            await client.query("UPDATE trucks SET status = 'assigned' WHERE id = $1", [updates.truckId]);
        }

        await client.query('COMMIT');

        // Fetch full ticket details to return
        const fullTicketQuery = `
            SELECT t.*, 
                   u.name as driver_name, 
                   tr.truck_number,
                   (SELECT COUNT(*) FROM bridge_treatments bt WHERE bt.ticket_id = t.id) as bridge_count
            FROM treatment_tickets t
            LEFT JOIN users u ON t.assigned_driver_id = u.id
            LEFT JOIN trucks tr ON t.truck_id = tr.id
            WHERE t.id = $1
        `;
        const fullTicketResult = await pool.query(fullTicketQuery, [ticketId]);
        return fullTicketResult.rows[0];

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

export const deleteTicket = async (ticketId: number) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get truck ID to free it
        const ticketRes = await client.query('SELECT truck_id FROM treatment_tickets WHERE id = $1', [ticketId]);
        const truckId = ticketRes.rows[0]?.truck_id;

        // Delete bridge treatments first (foreign key)
        await client.query('DELETE FROM bridge_treatments WHERE ticket_id = $1', [ticketId]);

        // Delete ticket
        await client.query('DELETE FROM treatment_tickets WHERE id = $1', [ticketId]);

        // Free truck
        if (truckId) {
            await client.query("UPDATE trucks SET status = 'available' WHERE id = $1", [truckId]);
        }

        await client.query('COMMIT');
        return { success: true, id: ticketId };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
