const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { pool } = require('../config/db');

const verifyProcurement = async () => {
    const client = await pool.connect();
    try {
        console.log('--- VERIFYING PROCUREMENT TRIGGER ---');

        // 1. Find PCB-A and its IC 555 component
        const pcbRes = await client.query("SELECT id FROM pcbs WHERE pcb_name = 'PCB-A'");
        const pcbId = pcbRes.rows[0].id;

        const compRes = await client.query("SELECT id, stock_quantity, low_stock_threshold FROM components WHERE part_number = 'IC-555'");
        const comp = compRes.rows[0];
        console.log(`Initial IC-555 Stock: ${comp.stock_quantity}, Threshold: ${comp.low_stock_threshold}`);

        // 2. Calculate quantity to drop below threshold
        // Initial: 250, Threshold: 40. Need to consume 211+.
        const produceQty = 215;
        console.log(`Simulating production of ${produceQty} units of PCB-A...`);

        // Use the API logic (mimicked here)
        const { recordProduction } = require('../controllers/productionController');

        // Mock req/res
        const req = { body: { pcb_id: pcbId, quantity: produceQty } };
        const res = {
            json: (data) => console.log('✅ Production Success:', data.id),
            status: (code) => ({ json: (err) => console.error('❌ Production Error:', err.error) })
        };

        await recordProduction(req, res);

        // 3. Check Triggers
        const triggerRes = await client.query("SELECT pt.*, c.name FROM procurement_triggers pt JOIN components c ON pt.component_id = c.id WHERE c.part_number = 'IC-555'");
        if (triggerRes.rows.length > 0) {
            console.log('✅ SUCCESS: Procurement trigger found!');
            const trigger = triggerRes.rows[0];

            // 4. RESTOCK Verify
            console.log(`--- VERIFYING RESTOCK (Fulfill Trigger ${trigger.id}) ---`);
            const { fulfillTrigger } = require('../controllers/procurementController');
            const fulfillReq = { params: { id: trigger.id }, body: { quantity: 1000 } };
            const fulfillRes = {
                json: (data) => console.log('✅ Restock Success:', data.msg),
                status: (code) => ({ json: (err) => console.error('❌ Restock Error:', err.error) })
            };

            await fulfillTrigger(fulfillReq, fulfillRes);

            const finalCompRes = await client.query("SELECT stock_quantity FROM components WHERE part_number = 'IC-555'");
            console.log(`Final IC-555 Stock: ${finalCompRes.rows[0].stock_quantity}`);
            // Initial 250 - 215 + 1000 = 1035
            if (finalCompRes.rows[0].stock_quantity === 1035) {
                console.log('✅ SUCCESS: Stock replenished correctly!');
            }
        } else {
            console.error('❌ FAILURE: Procurement trigger not found.');
        }

    } catch (err) {
        console.error('Test Failed:', err);
    } finally {
        client.release();
        pool.end();
    }
};

verifyProcurement();
