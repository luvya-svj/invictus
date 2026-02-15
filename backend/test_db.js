const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function testDB() {
    try {
        console.log("Checking PCBs...");
        const pcbs = await pool.query('SELECT * FROM pcbs');
        console.log("PCBs:", pcbs.rows);

        console.log("\nChecking PCB Components Mapping...");
        const mapping = await pool.query('SELECT * FROM pcb_components');
        console.log("Mappings:", mapping.rows);

        console.log("\nChecking Components...");
        const components = await pool.query('SELECT id, name, stock_quantity FROM components LIMIT 5');
        console.log("Components:", components.rows);

    } catch (err) {
        console.error("DB Test Error:", err);
    } finally {
        await pool.end();
    }
}

testDB();
