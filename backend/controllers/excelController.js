const { pool } = require('../config/db');
const ExcelJS = require('exceljs');

// Upload Excel and parse all sheets
const uploadExcel = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const client = await pool.connect();

    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        await client.query('BEGIN');

        // Insert file record
        const fileResult = await client.query(
            'INSERT INTO excel_files (original_filename, uploaded_by, file_size, total_sheets) VALUES ($1, $2, $3, $4) RETURNING id',
            [req.file.originalname, req.user?.userId || null, req.file.size, workbook.worksheets.length]
        );
        const fileId = fileResult.rows[0].id;

        let processedSheets = 0;

        // Process each sheet
        for (const worksheet of workbook.worksheets) {
            const sheetName = worksheet.name;

            // Skip visual-only sheets
            if (sheetName.toLowerCase().includes('pivot') ||
                sheetName.toLowerCase().includes('dashboard') ||
                sheetName.toLowerCase().includes('chart')) {
                console.log(`Skipping sheet: ${sheetName}`);
                continue;
            }

            // Get headers from first row
            const headerRow = worksheet.getRow(1);
            const headers = [];
            headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                headers[colNumber] = cell.text || `Column_${colNumber}`;
            });

            // Skip if no headers
            if (headers.filter(h => h).length === 0) {
                console.log(`Skipping empty sheet: ${sheetName}`);
                continue;
            }

            // Insert sheet record
            const sheetResult = await client.query(
                'INSERT INTO excel_sheets (file_id, sheet_name, row_count, column_headers) VALUES ($1, $2, $3, $4) RETURNING id',
                [fileId, sheetName, worksheet.rowCount - 1, JSON.stringify(headers)]
            );
            const sheetId = sheetResult.rows[0].id;

            // Process rows
            let rowsProcessed = 0;
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip header row

                const rowData = {};
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    const header = headers[colNumber];
                    if (header) {
                        rowData[header] = cell.text || cell.value?.toString() || '';
                    }
                });

                // Only insert if row has data
                if (Object.keys(rowData).length > 0) {
                    client.query(
                        'INSERT INTO excel_rows (sheet_id, row_number, data) VALUES ($1, $2, $3)',
                        [sheetId, rowNumber - 1, JSON.stringify(rowData)]
                    );
                    rowsProcessed++;
                }
            });

            // Update sheet row count
            await client.query(
                'UPDATE excel_sheets SET row_count = $1 WHERE id = $2',
                [rowsProcessed, sheetId]
            );

            processedSheets++;
        }

        await client.query('COMMIT');

        res.json({
            msg: 'Excel file processed successfully',
            fileId,
            sheetsProcessed: processedSheets
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error processing Excel:', err);
        res.status(500).json({ msg: 'Error processing Excel file', error: err.message });
    } finally {
        client.release();
    }
};

// Get all uploaded files
const getFiles = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, original_filename, uploaded_at, file_size, total_sheets FROM excel_files ORDER BY uploaded_at DESC'
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get sheets for a specific file
const getSheets = async (req, res) => {
    const { fileId } = req.params;
    try {
        const result = await pool.query(
            'SELECT id, sheet_name, row_count, column_headers FROM excel_sheets WHERE file_id = $1 ORDER BY id',
            [fileId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get rows for a specific sheet (with pagination)
const getSheetRows = async (req, res) => {
    const { sheetId } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    try {
        const result = await pool.query(
            'SELECT row_number, data FROM excel_rows WHERE sheet_id = $1 ORDER BY row_number LIMIT $2 OFFSET $3',
            [sheetId, limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM excel_rows WHERE sheet_id = $1',
            [sheetId]
        );

        res.json({
            rows: result.rows,
            total: parseInt(countResult.rows[0].count),
            limit,
            offset
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
};

// Get analytics for a sheet
const getSheetAnalytics = async (req, res) => {
    const { sheetId } = req.params;

    try {
        const {
            analyzeColumns,
            suggestCharts,
            calculateNumericAggregations,
            calculateTopN,
            calculateTimeSeries
        } = require('../utils/analyticsHelpers');

        // Fetch sheet metadata and rows
        const sheetResult = await pool.query(
            'SELECT sheet_name, column_headers FROM excel_sheets WHERE id = $1',
            [sheetId]
        );

        if (sheetResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Sheet not found' });
        }

        const sheet = sheetResult.rows[0];

        // Fetch all rows for analysis (limit for performance)
        const rowsResult = await pool.query(
            'SELECT row_number, data FROM excel_rows WHERE sheet_id = $1 ORDER BY row_number LIMIT 1000',
            [sheetId]
        );

        const rows = rowsResult.rows;

        if (rows.length === 0) {
            return res.json({
                sheetName: sheet.sheet_name,
                columnTypes: {},
                suggestedCharts: [],
                aggregations: {}
            });
        }

        // Analyze columns
        const columnAnalysis = analyzeColumns(rows);

        // Suggest charts
        const suggestedCharts = suggestCharts(columnAnalysis);

        // Calculate KPIs
        const numericColumns = Object.keys(columnAnalysis).filter(k => columnAnalysis[k].type === 'numeric');
        const categoricalColumns = Object.keys(columnAnalysis).filter(k =>
            columnAnalysis[k].type === 'categorical' || columnAnalysis[k].type === 'text'
        );
        const dateColumns = Object.keys(columnAnalysis).filter(k => columnAnalysis[k].type === 'date');

        // Calculate data coverage (non-null percentage)
        let totalCells = 0;
        let filledCells = 0;
        rows.forEach(row => {
            Object.values(row.data).forEach(val => {
                totalCells++;
                if (val !== null && val !== undefined && val !== '') {
                    filledCells++;
                }
            });
        });
        const dataCoverage = totalCells > 0 ? (filledCells / totalCells * 100).toFixed(1) : 0;

        const kpis = {
            totalRows: rows.length,
            totalColumns: Object.keys(columnAnalysis).length,
            numericColumns: numericColumns.length,
            categoricalColumns: categoricalColumns.length,
            dateColumns: dateColumns.length,
            dataCoverage: parseFloat(dataCoverage)
        };

        // Calculate aggregations
        const aggregations = {};

        // Numeric aggregations
        if (numericColumns.length > 0) {
            aggregations.numeric = calculateNumericAggregations(rows, numericColumns);
        }

        // Top-N for categorical charts
        if (categoricalColumns.length > 0 && numericColumns.length > 0) {
            aggregations.topN = calculateTopN(rows, categoricalColumns[0], numericColumns[0], 10);
        }

        // Time series
        if (dateColumns.length > 0 && numericColumns.length > 0) {
            aggregations.timeSeries = calculateTimeSeries(rows, dateColumns[0], numericColumns[0]);
        }

        res.json({
            sheetName: sheet.sheet_name,
            kpis,
            columnTypes: columnAnalysis,
            suggestedCharts,
            aggregations
        });

    } catch (err) {
        console.error('Error analyzing sheet:', err);
        res.status(500).json({ msg: 'Server error', error: err.message });
    }
};

// Delete a specific Excel file
const deleteFile = async (req, res) => {
    const { fileId } = req.params;
    try {
        await pool.query('DELETE FROM excel_files WHERE id = $1', [fileId]);
        res.json({ msg: 'File and associated data removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Error deleting file' });
    }
};

// Clear all Excel data
const clearAllFiles = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM excel_files');
        await client.query('COMMIT');
        res.json({ msg: 'All analytics data cleared' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ msg: 'Error clearing data' });
    } finally {
        client.release();
    }
};

module.exports = {
    uploadExcel,
    getFiles,
    getSheets,
    getSheetRows,
    getSheetAnalytics,
    deleteFile,
    clearAllFiles
};
