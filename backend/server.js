const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { pool } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const apiRoutes = require('./routes/api');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Status
app.get('/', (req, res) => {
    res.json({
        name: 'Invictus API',
        version: '1.0.0',
        status: 'online',
        message: 'PCB Consumption Analytics & Manufacturing Management Platform'
    });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(503).json({ status: 'degraded', database: 'disconnected', error: err.message });
    }
});

// API Routes
app.use('/api', apiRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// Start Server
app.listen(PORT, async () => {
    console.log(`===============================================`);
    console.log(`  🚀 Invictus Backend Server running on port ${PORT}`);
    console.log(`  🔗 Local: http://localhost:${PORT}`);
    console.log(`  🔗 Health: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);

    // Verify DB Connection on startup
    try {
        const client = await pool.connect();
        console.log('  ✅ PostgreSQL database connection established.');
        client.release();
    } catch (err) {
        console.warn('  ⚠️ Database connection warning:', err.message);
        console.warn('  👉 Ensure PostgreSQL is running and .env has valid credentials.');
    }
});
