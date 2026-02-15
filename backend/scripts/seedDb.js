const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

const seed = async () => {
    try {
        console.log('Seeding database...');

        // 1. Create Admin User
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('Admin@1234', salt);

        // Check if user exists
        const userCheck = await pool.query("SELECT * FROM users WHERE username = 'admin'");
        if (userCheck.rows.length === 0) {
            await pool.query(
                "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
                ['admin', passwordHash, 'admin']
            );
            console.log('Admin user created (user: admin, pass: admin)');
        } else {
            // FORCE UPDATE PASSWORD
            await pool.query(
                "UPDATE users SET password_hash = $1 WHERE username = 'admin'",
                [passwordHash]
            );
            console.log('Admin password updated to "admin"');
        }

        // 2. Add some components
        const components = [
            { pn: 'CAP-10UF', name: '10uF Capacitor', desc: 'Electrolytic Capacitor', stock: 1000, demand: 5000, low: 200 },
            { pn: 'RES-1K', name: '1k Resistor', desc: 'SMD Resistor 0805', stock: 5000, demand: 10000, low: 1000 },
            { pn: 'IC-ATM328', name: 'ATmega328P-AU', desc: 'Microcontroller', stock: 50, demand: 500, low: 100 },
            { pn: 'LED-RED', name: 'Red LED', desc: '3mm Red LED', stock: 2000, demand: 2000, low: 500 },
            { pn: 'CONN-USB', name: 'USB-C Connector', desc: 'USB Type C Receptacle', stock: 300, demand: 400, low: 100 },
        ];

        for (const c of components) {
            const check = await pool.query("SELECT * FROM components WHERE part_number = $1", [c.pn]);
            if (check.rows.length === 0) {
                await pool.query(
                    "INSERT INTO components (part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold) VALUES ($1, $2, $3, $4, $5, $6)",
                    [c.pn, c.name, c.desc, c.stock, c.demand, c.low]
                );
            }
        }
        console.log('Components seeded');

        // 3. Add PCBs
        const pcbs = [
            { name: 'PCB-A', desc: 'Power Supply Module' },
            { name: 'PCB-B', desc: 'Control Unit' },
        ];

        for (const p of pcbs) {
            const check = await pool.query("SELECT id FROM pcbs WHERE name = $1", [p.name]);
            let pcbId;
            if (check.rows.length === 0) {
                const res = await pool.query("INSERT INTO pcbs (name, description) VALUES ($1, $2) RETURNING id", [p.name, p.desc]);
                pcbId = res.rows[0].id;
            } else {
                pcbId = check.rows[0].id;
            }

            // Map components to this PCB (Mock mapping)
            // PCB-A uses 2x CAP-10UF and 1x IC-ATM328
            if (p.name === 'PCB-A') {
                const cap = await pool.query("SELECT id FROM components WHERE part_number = 'CAP-10UF'");
                const ic = await pool.query("SELECT id FROM components WHERE part_number = 'IC-ATM328'");

                if (cap.rows.length > 0) {
                    await pool.query("INSERT INTO pcb_components (pcb_id, component_id, quantity_per_pcb) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [pcbId, cap.rows[0].id, 2]);
                }
                if (ic.rows.length > 0) {
                    await pool.query("INSERT INTO pcb_components (pcb_id, component_id, quantity_per_pcb) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING", [pcbId, ic.rows[0].id, 1]);
                }
            }
        }
        console.log('PCBs seeded');

        console.log('Database seeded successfully.');
    } catch (err) {
        console.error('Seeding error:', err);
    } finally {
        pool.end();
    }
};

seed();
