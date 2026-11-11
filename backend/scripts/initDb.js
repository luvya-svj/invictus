const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

const createTables = async () => {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    await client.query('BEGIN');

    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin', 'operator'))
      );
    `);
    console.log('Users table checked/created.');

    // Components Table
    await client.query(`
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS pcbs (
        id SERIAL PRIMARY KEY,
        pcb_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('PCBs table checked/created.');

    // PCB Components Mapping (BOM)
    await client.query(`
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS production_runs (
        id SERIAL PRIMARY KEY,
        pcb_id INTEGER REFERENCES pcbs(id),
        quantity_produced INTEGER NOT NULL CHECK (quantity_produced > 0),
        user_id INTEGER REFERENCES users(id),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Production Runs table checked/created.');

    // Inventory Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_transactions (
        id SERIAL PRIMARY KEY,
        production_run_id INTEGER REFERENCES production_runs(id) ON DELETE CASCADE,
        component_id INTEGER REFERENCES components(id),
        quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
        stock_before INTEGER,
        stock_after INTEGER,
        transaction_type VARCHAR(20) DEFAULT 'consumption',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Inventory Transactions table checked/created.');

    // Procurement Triggers
    await client.query(`
      CREATE TABLE IF NOT EXISTS procurement_triggers (
        id SERIAL PRIMARY KEY,
        component_id INTEGER REFERENCES components(id),
        trigger_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'fulfilled'))
      );
    `);
    console.log('Procurement Triggers table checked/created.');

    // Excel Analytics Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS excel_files (
        id SERIAL PRIMARY KEY,
        original_filename VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by INTEGER REFERENCES users(id),
        file_size INTEGER,
        total_sheets INTEGER
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS excel_sheets (
        id SERIAL PRIMARY KEY,
        file_id INTEGER REFERENCES excel_files(id) ON DELETE CASCADE,
        sheet_name VARCHAR(255) NOT NULL,
        row_count INTEGER DEFAULT 0,
        column_headers JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS excel_rows (
        id SERIAL PRIMARY KEY,
        sheet_id INTEGER REFERENCES excel_sheets(id) ON DELETE CASCADE,
        row_number INTEGER NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_excel_rows_sheet ON excel_rows(sheet_id);
      CREATE INDEX IF NOT EXISTS idx_excel_sheets_file ON excel_sheets(file_id);
    `);
    console.log('Excel tables and indexes checked/created.');

    await client.query('COMMIT');
    console.log('✅ All tables and indexes initialized successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', err);
  } finally {
    client.release();
    pool.end();
  }
};

createTables();
