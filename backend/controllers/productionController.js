const { pool } = require('../config/db');

// Record Production Run
const recordProduction = async (req, res) => {
    const { pcb_id, quantity } = req.body;
    console.log(`[PRODUCTION] Initiating run for PCB ID: ${pcb_id}, Quantity: ${quantity}`);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Check needed components
        const bom = await client.query(
            'SELECT component_id, quantity_per_pcb FROM pcb_components WHERE pcb_id = $1',
            [pcb_id]
        );

        if (bom.rows.length === 0) {
            throw new Error('No BOM found for this PCB');
        }

        // 2. Verify stock availability and prepare updates
        for (const item of bom.rows) {
            const requiredQty = item.quantity_per_pcb * quantity;

            const comp = await client.query(
                'SELECT stock_quantity, name FROM components WHERE id = $1 FOR UPDATE',
                [item.component_id]
            );

            if (comp.rows[0].stock_quantity < requiredQty) {
                throw new Error(`Insufficient stock for ${comp.rows[0].name}`);
            }

            // 3. Deduct Stock & Capture Snapshot
            const updatedComp = await client.query(
                'UPDATE components SET stock_quantity = stock_quantity - $1 WHERE id = $2 RETURNING stock_quantity, (stock_quantity + $1) as stock_before, monthly_demand, name',
                [requiredQty, item.component_id]
            );

            // 4. Check for Low Stock Trigger (20% of Monthly Demand Rule)
            const { stock_quantity, monthly_demand, name } = updatedComp.rows[0];
            const safetyThreshold = (monthly_demand || 0) * 0.2;

            if (stock_quantity <= safetyThreshold) {
                // Check if a pending trigger already exists to avoid duplicates
                const existingTrigger = await client.query(
                    "SELECT id FROM procurement_triggers WHERE component_id = $1 AND status = 'pending'",
                    [item.component_id]
                );

                if (existingTrigger.rows.length === 0) {
                    await client.query(
                        "INSERT INTO procurement_triggers (component_id, status) VALUES ($1, 'pending')",
                        [item.component_id]
                    );
                    console.log(`Procurement trigger created for ${updatedComp.rows[0].name}`);
                }
            }
        }

        // 5. Record Production Run
        const newRunRes = await client.query(
            'INSERT INTO production_runs (pcb_id, quantity_produced) VALUES ($1, $2) RETURNING *',
            [pcb_id, quantity]
        );
        const newRun = newRunRes.rows[0];

        // 6. Record Inventory Transactions with Snapshots
        for (const item of bom.rows) {
            const consumedQty = item.quantity_per_pcb * quantity;

            // We need to find the stock_before/after again or pass them from the loop above
            // Let's re-query to be safe or refine the logic to store them in a map
            const compState = await client.query('SELECT stock_quantity FROM components WHERE id = $1', [item.component_id]);
            const stockAfter = compState.rows[0].stock_quantity;
            const stockBefore = stockAfter + consumedQty;

            await client.query(
                'INSERT INTO inventory_transactions (production_run_id, component_id, quantity_used, stock_before, stock_after, transaction_type) VALUES ($1, $2, $3, $4, $5, $6)',
                [newRun.id, item.component_id, consumedQty, stockBefore, stockAfter, 'consumption']
            );
        }

        await client.query('COMMIT');
        res.json(newRun);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

// List Production History
const listProductionHistory = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT pr.id, pr.timestamp, p.pcb_name, pr.quantity_produced
            FROM production_runs pr
            JOIN pcbs p ON pr.pcb_id = p.id
            ORDER BY pr.timestamp DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Production Run Details (Traceability)
const getProductionRunDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                it.quantity_used, 
                it.stock_before, 
                it.stock_after, 
                c.name as component_name, 
                c.part_number
            FROM inventory_transactions it
            JOIN components c ON it.component_id = c.id
            WHERE it.production_run_id = $1
        `, [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    recordProduction,
    listProductionHistory,
    getProductionRunDetails
};
