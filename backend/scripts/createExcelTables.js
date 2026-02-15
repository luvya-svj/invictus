const { pool } = require('../config/db');

const createExcelTables = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('Creating excel_files table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS excel_files (
                id SERIAL PRIMARY KEY,
                original_filename VARCHAR(255) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                uploaded_by INTEGER REFERENCES users(id),
                file_size INTEGER,
                total_sheets INTEGER
            )
        `);

        console.log('Creating excel_sheets table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS excel_sheets (
                id SERIAL PRIMARY KEY,
                file_id INTEGER REFERENCES excel_files(id) ON DELETE CASCADE,
                sheet_name VARCHAR(255) NOT NULL,
                row_count INTEGER DEFAULT 0,
                column_headers JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Creating excel_rows table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS excel_rows (
                id SERIAL PRIMARY KEY,
                sheet_id INTEGER REFERENCES excel_sheets(id) ON DELETE CASCADE,
                row_number INTEGER NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Creating indexes...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_excel_rows_sheet ON excel_rows(sheet_id)
        `);
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_excel_sheets_file ON excel_sheets(file_id)
        `);

        await client.query('COMMIT');
        console.log('✅ Excel tables created successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating tables:', err);
        throw err;
    } finally {
        client.release();
        pool.end();
    }
};

createExcelTables();
