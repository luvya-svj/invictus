const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// const { pool } = require('./config/db'); // Commented out until db.js is created and configured

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const apiRoutes = require('./routes/api');

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
