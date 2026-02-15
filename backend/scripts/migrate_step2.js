const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const migrate = async () => {
    try {
        console.log('Running Step 2 Migration: PCB Mapping...');

        // 1. PCBs Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pcbs (
                id SERIAL PRIMARY KEY,
                pcb_name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table "pcbs" is ready.');

        // 2. PCB Components Mapping Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pcb_components (
                id SERIAL PRIMARY KEY,
                pcb_id INTEGER REFERENCES pcbs(id) ON DELETE CASCADE,
                component_id INTEGER REFERENCES components(id) ON DELETE CASCADE,
                quantity_required INTEGER NOT NULL CHECK (quantity_required > 0),
                UNIQUE(pcb_id, component_id)
            );
        `);
        console.log('Table "pcb_components" is ready.');

        console.log('Step 2 Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
