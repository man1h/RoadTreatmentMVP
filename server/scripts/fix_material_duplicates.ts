import pool from '../src/db';

async function fixMaterialDuplicates() {
    const client = await pool.connect();
    try {
        console.log('Starting material duplicate cleanup...');
        await client.query('BEGIN');

        // 1. Identify duplicates and keep only the one with the highest ID
        // We'll use a temporary table or a CTE to delete the others
        const deleteQuery = `
            DELETE FROM materials a USING materials b
            WHERE a.id < b.id
            AND a.tmc_id = b.tmc_id
            AND a.material_type = b.material_type;
        `;

        const result = await client.query(deleteQuery);
        console.log(`Deleted ${result.rowCount} duplicate rows.`);

        // 2. Add unique constraint to prevent future duplicates
        // We need to check if it exists first to avoid errors, or just try to add it
        try {
            await client.query(`
                ALTER TABLE materials 
                ADD CONSTRAINT unique_tmc_material_type UNIQUE (tmc_id, material_type);
            `);
            console.log('Added unique constraint: unique_tmc_material_type');
        } catch (err: any) {
            if (err.code === '42710') { // duplicate_object
                console.log('Unique constraint already exists.');
            } else {
                throw err;
            }
        }

        await client.query('COMMIT');
        console.log('Cleanup completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error cleaning up duplicates:', error);
    } finally {
        client.release();
        process.exit();
    }
}

fixMaterialDuplicates();
