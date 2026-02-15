const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

async function debugData() {
    try {
        const res = await pool.query('SELECT part_number, stock_quantity FROM components');
        console.log('--- COMPONENT DATA ---');
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error('Debug failed:', err);
        process.exit(1);
    }
}
debugData();
