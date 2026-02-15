const { pool } = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        // 1. Low Stock Count & List
        const lowStockResult = await pool.query('SELECT id, name, part_number, stock_quantity, low_stock_threshold FROM components WHERE stock_quantity <= low_stock_threshold ORDER BY stock_quantity ASC LIMIT 10');
        const lowStockCountResult = await pool.query('SELECT COUNT(*) FROM components WHERE stock_quantity <= low_stock_threshold');

        // 2. Total Components
        const totalComponentsResult = await pool.query('SELECT COUNT(*) FROM components');

        // 3. Top Consumed Components (Aggregation from Transactions)
        const topConsumedResult = await pool.query(`
            SELECT c.name, c.part_number, SUM(it.quantity_used) as total_consumed
            FROM inventory_transactions it
            JOIN components c ON it.component_id = c.id
            WHERE it.transaction_type = 'consumption'
            GROUP BY c.id, c.name, c.part_number
            ORDER BY total_consumed DESC
            LIMIT 10
        `);

        // 4. Recent Production Runs
        const recentActivityResult = await pool.query(`
            SELECT pr.id, p.pcb_name, pr.quantity_produced, pr.timestamp
            FROM production_runs pr
            JOIN pcbs p ON pr.pcb_id = p.id
            ORDER BY pr.timestamp DESC
            LIMIT 5
        `);

        // 5. Dynamic Production Metrics (Active Lines & Velocity)
        const productionMetrics = await pool.query(`
            SELECT 
                COUNT(DISTINCT pcb_id) as active_lines,
                SUM(quantity_produced) as total_produced_24h,
                COALESCE(SUM(quantity_produced) / 24.0, 0) as units_per_hour
            FROM production_runs 
            WHERE timestamp > NOW() - INTERVAL '24 hours'
        `);

        // 6. Production Distribution (By PCB Name)
        const distributionResult = await pool.query(`
            SELECT p.pcb_name, SUM(pr.quantity_produced) as total_units
            FROM production_runs pr
            JOIN pcbs p ON pr.pcb_id = p.id
            GROUP BY p.pcb_name
            ORDER BY total_units DESC
        `);

        res.json({
            lowStockCount: parseInt(lowStockCountResult.rows[0].count),
            totalComponents: parseInt(totalComponentsResult.rows[0].count),
            lowStockItems: lowStockResult.rows,
            topConsumed: topConsumedResult.rows,
            recentActivity: recentActivityResult.rows,
            productionDistribution: distributionResult.rows,
            productionMetrics: {
                activeLines: parseInt(productionMetrics.rows[0].active_lines || 0),
                totalProduced24h: parseInt(productionMetrics.rows[0].total_produced_24h || 0),
                unitsPerHour: parseFloat(productionMetrics.rows[0].units_per_hour || 0).toFixed(1)
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = { getDashboardStats };
