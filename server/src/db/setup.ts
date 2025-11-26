import fs from 'fs';
import path from 'path';
import pool from './index';

const runSetup = async () => {
    try {
        console.log('Starting database setup...');

        // Read SQL files
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

        // Execute Schema
        console.log('Creating schema...');
        await pool.query(schemaSql);
        console.log('Schema created successfully.');

        // Execute Seed
        console.log('Seeding data...');
        await pool.query(seedSql);
        console.log('Data seeded successfully.');

        console.log('Database setup completed.');
    } catch (error) {
        console.error('Error during database setup:', error);
    } finally {
        await pool.end();
    }
};

runSetup();
