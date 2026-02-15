const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

const setupDemo = async () => {
    const client = await pool.connect();
    try {
        console.log('--- STARTING ENTERPRISE-SCALE DEMO SETUP ---');
        await client.query('BEGIN');

        // 1. DROP EXISTING TABLES (Reverse Dependency Order)
        console.log('Cleaning up existing tables...');
        await client.query('DROP TABLE IF EXISTS inventory_transactions CASCADE');
        await client.query('DROP TABLE IF EXISTS production_runs CASCADE');
        await client.query('DROP TABLE IF EXISTS procurement_triggers CASCADE');
        await client.query('DROP TABLE IF EXISTS pcb_components CASCADE');
        await client.query('DROP TABLE IF EXISTS pcbs CASCADE');
        await client.query('DROP TABLE IF EXISTS components CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');

        // 2. CREATE TABLES
        console.log('Creating tables...');

        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'operator' CHECK (role IN ('admin', 'operator'))
            )
        `);

        await client.query(`
            CREATE TABLE components (
                id SERIAL PRIMARY KEY,
                part_number VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
                monthly_demand INTEGER DEFAULT 0,
                low_stock_threshold INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE pcbs (
                id SERIAL PRIMARY KEY,
                pcb_name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE pcb_components (
                id SERIAL PRIMARY KEY,
                pcb_id INTEGER REFERENCES pcbs(id) ON DELETE CASCADE,
                component_id INTEGER REFERENCES components(id) ON DELETE CASCADE,
                quantity_per_pcb INTEGER NOT NULL CHECK (quantity_per_pcb > 0),
                UNIQUE(pcb_id, component_id)
            )
        `);

        await client.query(`
            CREATE TABLE production_runs (
                id SERIAL PRIMARY KEY,
                pcb_id INTEGER REFERENCES pcbs(id),
                quantity_produced INTEGER NOT NULL CHECK (quantity_produced > 0),
                user_id INTEGER REFERENCES users(id),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE inventory_transactions (
                id SERIAL PRIMARY KEY,
                production_run_id INTEGER REFERENCES production_runs(id) ON DELETE CASCADE,
                component_id INTEGER REFERENCES components(id),
                quantity_used INTEGER NOT NULL CHECK (quantity_used > 0),
                stock_before INTEGER,
                stock_after INTEGER,
                transaction_type VARCHAR(20) DEFAULT 'consumption',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await client.query(`
            CREATE TABLE procurement_triggers (
                id SERIAL PRIMARY KEY,
                component_id INTEGER REFERENCES components(id),
                trigger_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'fulfilled'))
            )
        `);

        // 3. SEED DATA
        console.log('Seeding enterprise-scale data...');

        const components = [
            { pn: 'CAP-10UF', name: 'Capacitor 10µF', desc: 'Electrolytic Capacitor', stock: 1000, demand: 3000, low: 100 },
            { pn: 'CAP-100UF', name: 'Capacitor 100µF', desc: 'Electrolytic Capacitor', stock: 500, demand: 2000, low: 50 },
            { pn: 'RES-220', name: 'Resistor 220Ω', desc: 'Carbon Film Resistor', stock: 5000, demand: 12000, low: 500 },
            { pn: 'RES-1K', name: 'Resistor 1kΩ', desc: 'Carbon Film Resistor', stock: 4000, demand: 8000, low: 400 },
            { pn: 'IC-LM358', name: 'IC LM358', desc: 'Dual Op-Amp IC', stock: 300, demand: 800, low: 50 },
            { pn: 'IC-555', name: 'IC 555 Timer', desc: 'Precision Timer IC', stock: 250, demand: 1000, low: 40 },
            { pn: 'DIO-1N4007', name: 'Diode 1N4007', desc: 'General Purpose Rectifier', stock: 2000, demand: 6000, low: 200 },
            { pn: 'ZEN-5.1V', name: 'Zener Diode 5.1V', desc: 'Voltage Regulator Diode', stock: 400, demand: 1200, low: 80 },
            { pn: 'REG-7805', name: 'Voltage Regulator 7805', desc: '5V Linear Regulator', stock: 500, demand: 500, low: 30 },
            { pn: 'LED-RED', name: 'LED Red 5mm', desc: 'Diffused Red LED', stock: 3000, demand: 9000, low: 500 },
            { pn: 'LED-GREEN', name: 'LED Green 5mm', desc: 'Diffused Green LED', stock: 3000, demand: 9000, low: 500 },
            { pn: 'TR-BC547', name: 'Transistor BC547', desc: 'NPN Transistor', stock: 800, demand: 2000, low: 100 },
            { pn: 'REL-12V', name: 'Relay 12V', desc: 'SPDT Electromagnetic Relay', stock: 300, demand: 500, low: 20 },
            { pn: 'CONN-2P', name: 'Connector 2-Pin', desc: '2.54mm Screw Terminal', stock: 600, demand: 1500, low: 100 },
            { pn: 'RES-470', name: 'Resistor 470Ω', desc: 'Carbon Film Resistor', stock: 5000, demand: 10000, low: 500 },
            { pn: 'IC-SENSOR-X1', name: 'Sensor IC X1', desc: 'High-Precision Analog Sensor', stock: 500, demand: 100, low: 10 }
        ];

        // Ensure we don't deduct below 0 in the seed loop
        // ... (rest of the loop is the same)

        const compIds = {};
        for (const c of components) {
            const res = await client.query(
                `INSERT INTO components (part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [c.pn, c.name, c.desc, c.stock, c.demand, c.low]
            );
            compIds[c.pn] = res.rows[0].id;
        }

        const pcbs = [
            { name: 'PCB-A', desc: 'Control Board' },
            { name: 'PCB-B', desc: 'Power Board' },
            { name: 'PCB-C', desc: 'Indicator Board' },
            { name: 'PCB-D', desc: 'Relay Driver Board' },
            { name: 'PCB-E', desc: 'Voltage Regulation Board' },
            { name: 'PCB-F', desc: 'Sensor Module' }
        ];

        const pcbIds = {};
        for (const p of pcbs) {
            const res = await client.query(
                `INSERT INTO pcbs (pcb_name, description) VALUES ($1, $2) RETURNING id`,
                [p.name, p.desc]
            );
            pcbIds[p.name] = res.rows[0].id;
        }

        const mappings = [
            {
                pcb: 'PCB-A', comps: [
                    { pn: 'CAP-10UF', qty: 2 },
                    { pn: 'CAP-100UF', qty: 1 },
                    { pn: 'RES-220', qty: 5 },
                    { pn: 'IC-LM358', qty: 1 },
                    { pn: 'IC-555', qty: 1 }
                ]
            },
            {
                pcb: 'PCB-B', comps: [
                    { pn: 'CAP-100UF', qty: 3 },
                    { pn: 'DIO-1N4007', qty: 4 },
                    { pn: 'ZEN-5.1V', qty: 2 },
                    { pn: 'REG-7805', qty: 1 }
                ]
            },
            {
                pcb: 'PCB-C', comps: [
                    { pn: 'RES-1K', qty: 4 },
                    { pn: 'LED-RED', qty: 2 },
                    { pn: 'LED-GREEN', qty: 2 }
                ]
            },
            {
                pcb: 'PCB-D', comps: [
                    { pn: 'TR-BC547', qty: 2 },
                    { pn: 'REL-12V', qty: 1 },
                    { pn: 'DIO-1N4007', qty: 1 },
                    { pn: 'RES-220', qty: 2 }
                ]
            },
            {
                pcb: 'PCB-E', comps: [
                    { pn: 'REG-7805', qty: 1 },
                    { pn: 'CAP-10UF', qty: 1 },
                    { pn: 'CAP-100UF', qty: 2 },
                    { pn: 'CONN-2P', qty: 1 }
                ]
            },
            {
                pcb: 'PCB-F', comps: [
                    { pn: 'IC-SENSOR-X1', qty: 1 },
                    { pn: 'RES-1K', qty: 2 },
                    { pn: 'CAP-10UF', qty: 1 }
                ]
            }
        ];

        for (const m of mappings) {
            const pcbId = pcbIds[m.pcb];
            for (const c of m.comps) {
                const compId = compIds[c.pn];
                await client.query(
                    `INSERT INTO pcb_components (pcb_id, component_id, quantity_per_pcb) 
                     VALUES ($1, $2, $3)`,
                    [pcbId, compId, c.qty]
                );
            }
        }

        const bcrypt = require('bcrypt');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Admin@1234', salt);
        await client.query(
            "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
            ['admin', passwordHash, 'admin']
        );

        // Seed some initial Pending Triggers for low stock items
        console.log('Seeding initial procurement triggers...');
        const lowStockComps = await client.query(
            "SELECT id FROM components WHERE part_number IN ('REL-12V', 'REG-7805', 'IC-SENSOR-X1')"
        );
        for (const comp of lowStockComps.rows) {
            await client.query(
                "INSERT INTO procurement_triggers (component_id, status) VALUES ($1, 'pending')",
                [comp.id]
            );
        }

        // 4. SEED HISTORICAL PRODUCTION RUNS (Step 6 Verification)
        console.log('Seeding historical production runs...');
        const allPcbs = await client.query('SELECT id, pcb_name FROM pcbs');
        for (const pcb of allPcbs.rows) {
            // Record 2-3 runs per PCB with random quantities
            const runCount = Math.floor(Math.random() * 2) + 2;
            for (let i = 0; i < runCount; i++) {
                const qty = Math.floor(Math.random() * 50) + 10;
                const runRes = await client.query(
                    'INSERT INTO production_runs (pcb_id, quantity_produced, timestamp) VALUES ($1, $2, NOW() - INTERVAL \'' + (i * 2) + ' days\') RETURNING id',
                    [pcb.id, qty]
                );

                const runId = runRes.rows[0].id;

                // Record consumption transactions based on BOM
                const bom = await client.query(
                    'SELECT component_id, quantity_per_pcb FROM pcb_components WHERE pcb_id = $1',
                    [pcb.id]
                );

                for (const item of bom.rows) {
                    const consumed = item.quantity_per_pcb * qty;

                    // Get stock before
                    const stockRes = await client.query('SELECT stock_quantity FROM components WHERE id = $1', [item.component_id]);
                    const stockBefore = stockRes.rows[0].stock_quantity;
                    const stockAfter = stockBefore - consumed;

                    // Record Transaction
                    await client.query(
                        'INSERT INTO inventory_transactions (production_run_id, component_id, quantity_used, stock_before, stock_after, transaction_type) VALUES ($1, $2, $3, $4, $5, $6)',
                        [runId, item.component_id, consumed, stockBefore, stockAfter, 'consumption']
                    );

                    // ACTUALLY DEDUCT STOCK (with safety)
                    await client.query(
                        'UPDATE components SET stock_quantity = GREATEST(0, stock_quantity - $1) WHERE id = $2',
                        [consumed, item.component_id]
                    );
                }
            }
        }

        // 5. FORCE LOW STOCK FOR DEMO (Final Polishing)
        console.log('Forcing critical stock states for demo...');
        await client.query("UPDATE components SET stock_quantity = 8 WHERE part_number = 'IC-SENSOR-X1'");
        await client.query("UPDATE components SET stock_quantity = 12 WHERE part_number = 'REL-12V'");
        await client.query("UPDATE components SET stock_quantity = 25 WHERE part_number = 'REG-7805'");

        await client.query('COMMIT');
        console.log('✅ ENTERPRISE DEMO SETUP COMPLETE!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ SETUP FAILED:', err);
    } finally {
        client.release();
        pool.end();
    }
};

setupDemo();
