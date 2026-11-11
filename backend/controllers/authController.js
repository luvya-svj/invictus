const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'invictus_default_jwt_secret_key_2026';

const register = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        if (!username || !password) {
            return res.status(400).json({ msg: 'Please provide both username and password.' });
        }

        const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ msg: 'Username is already taken.' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, password_hash, role || 'operator']
        );

        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({ error: 'Server Error during registration' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        if (!username || !password) {
            return res.status(400).json({ msg: 'Please provide username and password.' });
        }

        const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        if (user.rows.length === 0) {
            return res.status(401).json({ msg: 'Invalid Credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

        if (!validPassword) {
            return res.status(401).json({ msg: 'Invalid Credentials' });
        }

        const token = jwt.sign(
            { id: user.rows[0].id, role: user.rows[0].role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: { id: user.rows[0].id, username: user.rows[0].username, role: user.rows[0].role }
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ error: 'Server Error during login' });
    }
};

module.exports = { register, login };
