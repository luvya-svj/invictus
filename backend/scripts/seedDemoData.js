const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

const seedDemoData = async () => {
    const client = await pool.connect();
    try {
        console.log('Seeding demo data for Steps 1-3...');
        await client.query('BEGIN');

        // 1. Clear existing data to avoid conflicts
        await client.query('TRUNCATE TABLE pcb_components CASCADE');
        await client.query('TRUNCATE TABLE components CASCADE');
        await client.query('TRUNCATE TABLE pcbs CASCADE');
        await client.query('TRUNCATE TABLE production_runs CASCADE');
        await client.query('TRUNCATE TABLE inventory_transactions CASCADE');

        // 2. Components
        const components = [
            { pn: 'CAP-10UF', name: 'Capacitor 10µF', desc: 'Electrolytic Capacitor', stock: 1000, demand: 3000, low: 100 },
            { pn: 'RES-220', name: 'Resistor 220Ω', desc: 'Carbon Film Resistor', stock: 5000, demand: 12000, low: 500 },
            { pn: 'IC-LM358', name: 'IC LM358', desc: 'Dual Op-Amp IC', stock: 300, demand: 800, low: 50 },
            { pn: 'DIO-1N4007', name: 'Diode 1N4007', desc: 'General Purpose Rectifier', stock: 2000, demand: 6000, low: 200 }
        ];

        const compIds = {};
        for (const c of components) {
            const res = await client.query(
                `INSERT INTO components (part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                [c.pn, c.name, c.desc, c.stock, c.demand, c.low]
            );
            compIds[c.pn] = res.rows[0].id;
        }
        console.log('Components seeded.');

        // 3. PCBs
        const pcbs = [
            { name: 'PCB-A' },
            { name: 'PCB-B' }
        ];

        const pcbIds = {};
        for (const p of pcbs) {
            const res = await client.query(
                `INSERT INTO pcbs (pcb_name) VALUES ($1) RETURNING id`,
                [p.name]
            );
            pcbIds[p.name] = res.rows[0].id;
        }
        console.log('PCBs seeded.');

        // 4. Mappings (BOM)
        const mappings = [
            {
                pcb: 'PCB-A', comps: [
                    { pn: 'CAP-10UF', qty: 2 },
                    { pn: 'RES-220', qty: 5 },
                    { pn: 'IC-LM358', qty: 1 }
                ]
            },
            {
                pcb: 'PCB-B', comps: [
                    { pn: 'CAP-10UF', qty: 1 },
                    { pn: 'RES-220', qty: 3 },
                    { pn: 'DIO-1N4007', qty: 2 }
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
        console.log('PCB-Component mappings (BOM) seeded.');

        await client.query('COMMIT');
        console.log('Demo data seeding complete.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seeding error:', err);
    } finally {
        client.release();
        pool.end();
    }
};

seedDemoData();
