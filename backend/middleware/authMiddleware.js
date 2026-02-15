const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Debugging: Log headers to see if token is present
    console.log('Main Auth Middleware Hit');
    console.log('Headers:', req.headers);

    const token = req.header('x-auth-token');

    if (!token) {
        console.log('No token found in x-auth-token header');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
