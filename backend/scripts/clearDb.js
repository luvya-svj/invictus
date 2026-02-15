const { pool } = require('../config/db');

const clearDb = async () => {
    try {
        console.log('Clearing all components...');
        await pool.query('TRUNCATE TABLE components RESTART IDENTITY CASCADE');
        console.log('Components table cleared.');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing database:', err);
        process.exit(1);
    }
};

clearDb();
