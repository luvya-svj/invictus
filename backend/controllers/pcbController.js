const { pool } = require('../config/db');

// Create PCB
exports.createPCB = async (req, res) => {
    const { pcb_name } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO pcbs (pcb_name) VALUES ($1) RETURNING *',
            [pcb_name]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error creating PCB', error: err.message });
    }
};

// List PCBs
exports.listPCBs = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pcbs ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error listing PCBs' });
    }
};

// Map components to PCB
exports.mapComponents = async (req, res) => {
    const { pcbId } = req.params;
    const { components } = req.body; // Array of { component_id, quantity_required }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Remove existing mapping for this PCB to handle updates
        await client.query('DELETE FROM pcb_components WHERE pcb_id = $1', [pcbId]);

        for (const comp of components) {
            await client.query(
                'INSERT INTO pcb_components (pcb_id, component_id, quantity_per_pcb) VALUES ($1, $2, $3)',
                [pcbId, comp.component_id, comp.quantity_per_pcb]
            );
        }

        await client.query('COMMIT');
        res.json({ msg: 'Mapping updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ msg: 'Error mapping components', error: err.message });
    } finally {
        client.release();
    }
};

// View PCB component mapping
exports.getPCBMapping = async (req, res) => {
    const { pcbId } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                pc.*, 
                c.name as component_name, 
                c.part_number 
            FROM pcb_components pc
            JOIN components c ON pc.component_id = c.id
            WHERE pc.pcb_id = $1
        `, [pcbId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error fetching PCB mapping' });
    }
};
