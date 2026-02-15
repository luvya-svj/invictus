const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

const seedRealisticData = async () => {
    const client = await pool.connect();
    try {
        console.log('Seeding realistic manufacturing data...');
        await client.query('BEGIN');

        // 1. Realistic Components
        const components = [
            { pn: 'MCU-STM32-F4', name: 'STM32F405 Microcontroller', desc: 'ARM Cortex-M4 MCU', stock: 50, demand: 500, low: 10 },
            { pn: 'IC-MAX3485', name: 'RS-485 Transceiver', desc: 'MaxLinear Interface IC', stock: 100, demand: 1000, low: 20 },
            { pn: 'RES-0603-10K', name: '10k Resistor 0603', desc: 'Thick Film Chip Resistor', stock: 5000, demand: 20000, low: 500 },
            { pn: 'CAP-0805-100NF', name: '100nF Capacitor 0805', desc: 'Ceramic Multilayer Capacitor', stock: 2000, demand: 15000, low: 300 },
            { pn: 'CONN-HDR-2X5', name: '2x5 Pin Header', desc: '2.54mm Pitch Shrouded Header', stock: 200, demand: 800, low: 50 }
        ];

        const compIds = {};
        for (const c of components) {
            const res = await client.query(
                `INSERT INTO components (part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 ON CONFLICT (part_number) DO UPDATE 
                 SET stock_quantity = $4, monthly_demand = $5, low_stock_threshold = $6 
                 RETURNING id`,
                [c.pn, c.name, c.desc, c.stock, c.demand, c.low]
            );
            compIds[c.pn] = res.rows[0].id;
        }
        console.log('Components seeded.');

        // 2. Realistic PCBs
        const pcbs = [
            { name: 'INVICTUS-NODE-V1', desc: 'IoT Sensor Node Base' },
            { name: 'INVICTUS-GATEWAY-PRO', desc: 'Industrial Edge Gateway' }
        ];

        const pcbIds = {};
        for (const p of pcbs) {
            const res = await client.query(
                `INSERT INTO pcbs (name, description) VALUES ($1, $2) 
                 ON CONFLICT (name) DO UPDATE SET description = $2 
                 RETURNING id`,
                [p.name, p.desc]
            );
            pcbIds[p.name] = res.rows[0].id;
        }
        console.log('PCBs seeded.');

        // 3. Mappings (BOM)
        const mappings = [
            // Node V1 uses: 1x MCU, 4x Resistors, 4x Capacitors
            {
                pcb: 'INVICTUS-NODE-V1', comps: [
                    { pn: 'MCU-STM32-F4', qty: 1 },
                    { pn: 'RES-0603-10K', qty: 4 },
                    { pn: 'CAP-0805-100NF', qty: 4 }
                ]
            },
            // Gateway Pro uses: 1x MCU, 2x RS485, 10x Resistors, 10x Capacitors, 1x Header
            {
                pcb: 'INVICTUS-GATEWAY-PRO', comps: [
                    { pn: 'MCU-STM32-F4', qty: 1 },
                    { pn: 'IC-MAX3485', qty: 2 },
                    { pn: 'RES-0603-10K', qty: 10 },
                    { pn: 'CAP-0805-100NF', qty: 10 },
                    { pn: 'CONN-HDR-2X5', qty: 1 }
                ]
            }
        ];

        for (const m of mappings) {
            const pcbId = pcbIds[m.pcb];
            for (const c of m.comps) {
                const compId = compIds[c.pn];
                await client.query(
                    `INSERT INTO pcb_components (pcb_id, component_id, quantity_per_pcb) 
                     VALUES ($1, $2, $3) 
                     ON CONFLICT (pcb_id, component_id) DO UPDATE SET quantity_per_pcb = $3`,
                    [pcbId, compId, c.qty]
                );
            }
        }
        console.log('PCB-Component mappings (BOM) seeded.');

        await client.query('COMMIT');
        console.log('Realistic data seeding complete.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seeding error:', err);
    } finally {
        client.release();
        pool.end();
    }
};

seedRealisticData();
