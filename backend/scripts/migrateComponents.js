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

const migrateToSimplifiedSchema = async () => {
    try {
        console.log('Starting migration to simplified component schema...');

        await pool.query('BEGIN');

        // Drop the existing components table
        await pool.query('DROP TABLE IF EXISTS components CASCADE');
        console.log('Dropped old components table');

        // Create new simplified components table
        await pool.query(`
            CREATE TABLE components (
                id SERIAL PRIMARY KEY,
                part_number VARCHAR(50) UNIQUE NOT NULL,
                component_name VARCHAR(100) NOT NULL,
                current_stock_quantity INTEGER DEFAULT 0 CHECK (current_stock_quantity >= 0),
                monthly_required_quantity INTEGER DEFAULT 0 CHECK (monthly_required_quantity >= 0),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created new components table with simplified schema');

        await pool.query('COMMIT');
        console.log('✅ Migration completed successfully!');
        console.log('New schema: id, part_number, component_name, current_stock_quantity, monthly_required_quantity, created_at');

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        pool.end();
    }
};

migrateToSimplifiedSchema();
