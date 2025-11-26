import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const createDb = async () => {
    const client = new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: 'postgres', // Connect to default 'postgres' db to create new db
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
    });

    try {
        await client.connect();
        console.log('Connected to postgres database.');

        const dbName = process.env.DB_NAME || 'road_treatment_db';

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

        if (res.rowCount === 0) {
            console.log(`Database ${dbName} does not exist. Creating...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`Database ${dbName} created successfully.`);
        } else {
            console.log(`Database ${dbName} already exists.`);
        }

    } catch (error) {
        console.error('Error creating database:', error);
    } finally {
        await client.end();
    }
};

createDb();
