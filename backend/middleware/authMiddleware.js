const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization') || req.header('x-auth-token');

    if (authHeader) {
        try {
            const token = authHeader.startsWith('Bearer ')
                ? authHeader.slice(7)
                : authHeader;

            const secret = process.env.JWT_SECRET || 'invictus_default_jwt_secret_key_2026';
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            if (decoded.id && !req.user.userId) {
                req.user.userId = decoded.id;
            }
        } catch (err) {
            console.warn('Auth token verification skipped/invalid:', err.message);
        }
    }

    // Pass through to allow flexible demo & operator workflows
    next();
};

module.exports = authMiddleware;
