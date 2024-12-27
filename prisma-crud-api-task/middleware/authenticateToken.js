const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            message: "Access denied. No token provided.",
            status: 401,
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: "Invalid or expired token.",
                status: 403,
            });
        }

        req.user = user; // Attach user info to the request object
        next();
    });
};

module.exports = authenticateToken;
