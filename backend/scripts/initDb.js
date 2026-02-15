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

const createTables = async () => {
  try {
    console.log('Connecting to database...');

    // FORCE SCHEMA UPDATE (Demo Only)
    await pool.query('DROP TABLE IF EXISTS inventory_transactions CASCADE');
    await pool.query('DROP TABLE IF EXISTS pcb_components CASCADE');
    await pool.query('DROP TABLE IF EXISTS pcbs CASCADE');

    // Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin', 'operator'))
      );
    `);
    console.log('Users table checked/created.');

    // Components Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS components (
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
    console.log('Components table checked/created.');

    // PCBs Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pcbs (
        id SERIAL PRIMARY KEY,
        pcb_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PCBs table checked/created.');

    // PCB Components Mapping
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pcb_components (
        id SERIAL PRIMARY KEY,
        pcb_id INTEGER REFERENCES pcbs(id) ON DELETE CASCADE,
        component_id INTEGER REFERENCES components(id) ON DELETE CASCADE,
        quantity_per_pcb INTEGER NOT NULL CHECK (quantity_per_pcb > 0),
        UNIQUE(pcb_id, component_id)
      );
    `);
    console.log('PCB Components table checked/created.');

    // Production Runs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS production_runs (
        id SERIAL PRIMARY KEY,
        pcb_id INTEGER REFERENCES pcbs(id),
        quantity_produced INTEGER NOT NULL CHECK (quantity_produced > 0),
        user_id INTEGER REFERENCES users(id),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Production Runs table checked/created.');

    // Procurement Triggers
    await pool.query(`
      CREATE TABLE IF NOT EXISTS procurement_triggers (
        id SERIAL PRIMARY KEY,
        component_id INTEGER REFERENCES components(id),
        trigger_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'fulfilled'))
      );
    `);
    console.log('Procurement Triggers table checked/created.');

    // Inventory Transactions (Step 3)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        production_run_id INTEGER REFERENCES production_runs(id) ON DELETE CASCADE,
        component_id INTEGER REFERENCES components(id),
        quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
        transaction_type VARCHAR(20) DEFAULT 'consumption',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Inventory Transactions table checked/created.');

    console.log("All tables created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err);
  } finally {
    pool.end();
  }
};

createTables();
