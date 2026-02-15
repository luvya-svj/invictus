const { pool } = require('../config/db');

// Get all procurement triggers
const getTriggers = async (req, res) => {
    try {
        // Proactive Sync: Ensure all currently low-stock components (20% rule) have a trigger record
        await pool.query(`
            INSERT INTO procurement_triggers (component_id, status)
            SELECT id, 'pending'
            FROM components
            WHERE stock_quantity <= (monthly_demand * 0.2)
            AND monthly_demand > 0
            AND id NOT IN (SELECT component_id FROM procurement_triggers WHERE status = 'pending')
        `);

        const result = await pool.query(`
            SELECT 
                pt.*, 
                c.name as component_name, 
                c.part_number, 
                c.stock_quantity,
                c.monthly_demand
            FROM procurement_triggers pt
            JOIN components c ON pt.component_id = c.id
            ORDER BY 
                CASE WHEN pt.status = 'pending' THEN 0 ELSE 1 END,
                pt.trigger_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching triggers' });
    }
};

// Fulfill a trigger (restock)
const fulfillTrigger = async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body; // Manual input or calculated

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get trigger details
        const triggerRes = await client.query('SELECT component_id FROM procurement_triggers WHERE id = $1', [id]);
        if (triggerRes.rows.length === 0) throw new Error('Trigger not found');
        const compId = triggerRes.rows[0].component_id;

        // 2. Update status
        await client.query(
            "UPDATE procurement_triggers SET status = 'fulfilled' WHERE id = $1",
            [id]
        );

        // 3. Increment stock
        const restockQty = quantity || 1000; // Default if not provided
        await client.query(
            'UPDATE components SET stock_quantity = stock_quantity + $1 WHERE id = $2',
            [restockQty, compId]
        );

        // 4. Log transaction
        await client.query(
            'INSERT INTO inventory_transactions (component_id, quantity_used, transaction_type) VALUES ($1, $2, $3)',
            [compId, restockQty, 'restock']
        );

        await client.query('COMMIT');
        res.json({ msg: 'Stock replenished successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(400).json({ error: err.message });
    } finally {
        client.release();
    }
};

module.exports = {
    getTriggers,
    fulfillTrigger
};
