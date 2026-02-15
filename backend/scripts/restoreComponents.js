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

const restoreOriginalSchema = async () => {
    try {
        console.log('Restoring original component schema...');

        await pool.query('BEGIN');

        // Drop the simplified table
        await pool.query('DROP TABLE IF EXISTS components CASCADE');

        // Recreate the original table with all fields
        await pool.query(`
            CREATE TABLE components (
                id SERIAL PRIMARY KEY,
                part_number VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
                monthly_demand INTEGER DEFAULT 0,
                low_stock_threshold INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Restored components table with original schema (name, description, stock_quantity, monthly_demand, low_stock_threshold)');

        await pool.query('COMMIT');
        console.log('✅ Restoration migration completed successfully!');

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('❌ Restoration failed:', err);
    } finally {
        pool.end();
    }
};

restoreOriginalSchema();
