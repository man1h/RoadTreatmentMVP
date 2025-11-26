import pool from '../db';

export const getInventory = async (tmcId: number) => {
    const result = await pool.query(
        `SELECT * FROM materials WHERE tmc_id = $1`,
        [tmcId]
    );
    return result.rows;
};

export const recordMaterialUsage = async (
    ticketId: number,
    bridgeId: string,
    materialType: string,
    quantityTons: number
) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Record usage on bridge treatment
        await client.query(
            `UPDATE bridge_treatments 
       SET treatment_type = $1, 
           material_used_tons = $2, 
           treated_at = NOW()
       WHERE ticket_id = $3 AND bridge_id = $4`,
            [materialType, quantityTons, ticketId, bridgeId]
        );

        // Get TMC ID from ticket
        const ticketRes = await client.query(
            `SELECT tmc_id FROM treatment_tickets WHERE id = $1`,
            [ticketId]
        );
        const tmcId = ticketRes.rows[0].tmc_id;

        // Deduct from inventory
        await client.query(
            `UPDATE materials 
       SET quantity_tons = quantity_tons - $1,
           last_updated = NOW()
       WHERE tmc_id = $2 AND material_type = $3`,
            [quantityTons, tmcId, materialType]
        );

        await client.query('COMMIT');
        return { success: true };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
