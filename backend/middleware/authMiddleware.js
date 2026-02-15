const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Debugging: Log headers to see if token is present
    console.log('Main Auth Middleware Hit - Bypassing Authentication');
    // console.log('Headers:', req.headers);

    // Bypass authentication for now
    next();
};

module.exports = authMiddleware;
