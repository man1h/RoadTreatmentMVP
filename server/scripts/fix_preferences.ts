import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'aldot_dispatch',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

async function checkAndFixPreferences() {
    try {
        console.log('Checking user_tmc_preferences...');

        // Check current preferences
        const check = await pool.query('SELECT COUNT(*) FROM user_tmc_preferences');
        console.log(`Current preferences count: ${check.rows[0].count}`);

        // Check for admin user (ID 1)
        const adminPrefs = await pool.query('SELECT * FROM user_tmc_preferences WHERE user_id = 1');
        console.log(`Admin user preferences: ${adminPrefs.rows.length}`);

        if (adminPrefs.rows.length === 0) {
            console.log('No preferences found for admin. Creating default preferences...');

            // Insert default preferences for all users
            await pool.query(`
                INSERT INTO user_tmc_preferences (user_id, tmc_id, is_monitoring)
                SELECT u.id, t.id, true
                FROM users u
                CROSS JOIN tmc_centers t
                ON CONFLICT (user_id, tmc_id) DO NOTHING
            `);

            console.log('Default preferences created!');

            // Verify
            const verify = await pool.query('SELECT * FROM user_tmc_preferences WHERE user_id = 1');
            console.log(`Admin user now has ${verify.rows.length} preferences`);
            console.log(verify.rows);
        } else {
            console.log('Admin preferences exist:');
            console.log(adminPrefs.rows);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkAndFixPreferences();
