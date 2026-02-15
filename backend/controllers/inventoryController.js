const { pool } = require('../config/db');
const ExcelJS = require('exceljs');

// Get all components
const getAllComponents = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM components ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Add a component
const addComponent = async (req, res) => {
    const { part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold } = req.body;
    try {
        const newComponent = await pool.query(
            'INSERT INTO components (part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold]
        );
        res.json(newComponent.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update a component
const updateComponent = async (req, res) => {
    const { id } = req.params;
    const { stock_quantity, monthly_demand, name, description, low_stock_threshold } = req.body;
    try {
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (stock_quantity !== undefined) {
            updates.push(`stock_quantity = $${paramIndex++}`);
            values.push(stock_quantity);
        }
        if (monthly_demand !== undefined) {
            updates.push(`monthly_demand = $${paramIndex++}`);
            values.push(monthly_demand);
        }
        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            values.push(description);
        }
        if (low_stock_threshold !== undefined) {
            updates.push(`low_stock_threshold = $${paramIndex++}`);
            values.push(low_stock_threshold);
        }

        if (updates.length === 0) {
            return res.status(400).json({ msg: 'No fields to update' });
        }

        values.push(id);
        const updateQuery = `UPDATE components SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        const update = await pool.query(updateQuery, values);

        if (update.rows.length === 0) {
            return res.status(404).json({ msg: 'Component not found' });
        }

        res.json(update.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Bulk Import via Excel
const importExcel = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const client = await pool.connect();

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const componentsToInsert = [];
        const processStats = {
            sheetsScanned: 0,
            sheetsProcessed: 0,
            rowsFound: 0
        };

        const columnMatchers = {
            part_number: ['part', 'p/n', 'pn', 'item', 'material', 'code', 'component id'],
            name: ['name', 'description', 'desc', 'title', 'component'],
            stock_quantity: ['qty', 'quantity', 'stock', 'available', 'on hand', 'qoh'],
            monthly_demand: ['demand', 'monthly', 'usage', 'run rate', 'consumption'],
            low_stock_threshold: ['threshold', 'min', 'limit', 'alert', 'safety']
        };

        workbook.eachSheet((worksheet, sheetId) => {
            processStats.sheetsScanned++;
            let headerRowIndex = -1;
            let colMap = {};

            for (let r = 1; r <= 20; r++) {
                const row = worksheet.getRow(r);
                if (!row.values || row.values.length === 0) continue;

                let matches = 0;
                let tempMap = {};

                row.eachCell((cell, colNum) => {
                    const txt = cell.text ? cell.text.toLowerCase().trim() : '';
                    if (!txt) return;

                    for (const [field, keywords] of Object.entries(columnMatchers)) {
                        if (keywords.some(k => txt.includes(k))) {
                            if (!tempMap[field]) {
                                tempMap[field] = colNum;
                                matches++;
                            }
                        }
                    }
                });

                if (tempMap.part_number && matches >= 2) {
                    headerRowIndex = r;
                    colMap = tempMap;
                    break;
                }
            }

            if (headerRowIndex !== -1) {
                processStats.sheetsProcessed++;
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber <= headerRowIndex) return;

                    const part_number = colMap.part_number ? row.getCell(colMap.part_number).text : null;
                    let name = colMap.name ? row.getCell(colMap.name).text : (part_number ? `Part ${part_number}` : null);

                    const stock_quantity = colMap.stock_quantity ? (parseInt(row.getCell(colMap.stock_quantity).value) || 0) : 0;
                    const monthly_demand = colMap.monthly_demand ? (parseInt(row.getCell(colMap.monthly_demand).value) || 0) : 0;
                    const low_stock_threshold = colMap.low_stock_threshold ? (parseInt(row.getCell(colMap.low_stock_threshold).value) || 0) : 0;

                    if (part_number && part_number.length > 2) {
                        const cleanPart = part_number.trim();
                        const cleanName = name ? name.trim() : cleanPart;

                        if (!componentsToInsert.find(c => c[0] === cleanPart)) {
                            componentsToInsert.push([cleanPart, cleanName, cleanName, stock_quantity, monthly_demand, low_stock_threshold]);
                        }
                    }
                });
            }
        });

        processStats.rowsFound = componentsToInsert.length;

        if (componentsToInsert.length === 0) {
            return res.status(400).json({
                msg: `Could not auto-detect columns. Sheets scanned: ${processStats.sheetsScanned}. Please ensure columns like "Part Number" exist.`
            });
        }

        await client.query('BEGIN');

        let insertedCount = 0;
        let updatedCount = 0;

        for (const component of componentsToInsert) {
            const [part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold] = component;
            const existing = await client.query('SELECT id FROM components WHERE part_number = $1', [part_number]);

            if (existing.rows.length > 0) {
                await client.query(
                    'UPDATE components SET stock_quantity = $1, name = $2, description = $3, monthly_demand = $4, low_stock_threshold = $5 WHERE part_number = $6',
                    [stock_quantity, name, description, monthly_demand, low_stock_threshold, part_number]
                );
                updatedCount++;
            } else {
                await client.query(
                    'INSERT INTO components (part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold) VALUES ($1, $2, $3, $4, $5, $6)',
                    [part_number, name, description, stock_quantity, monthly_demand, low_stock_threshold]
                );
                insertedCount++;
            }
        }

        await client.query('COMMIT');

        res.json({
            msg: `Processed ${processStats.sheetsProcessed} sheets.`,
            stats: {
                inserted: insertedCount,
                updated: updatedCount,
                totalProcessed: componentsToInsert.length
            }
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error during import');
    } finally {
        client.release();
    }
};

// Clear all components
const clearComponents = async (req, res) => {
    try {
        await pool.query('TRUNCATE TABLE components RESTART IDENTITY CASCADE');
        res.json({ msg: 'Inventory cleared successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

module.exports = {
    getAllComponents,
    addComponent,
    updateComponent,
    importExcel,
    clearComponents
};
