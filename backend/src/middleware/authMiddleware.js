// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

// Verify JWT and attach user info to req
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.id,
      roles: payload.roles || []
    };
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Role-based authorization
// allowedRoles: array of roles, e.g. ['admin', 'manager']
const authorize = (allowedRoles = []) => (req, res, next) => {
  if (!allowedRoles.length) {
    // No restriction
    return next();
  }

  const userRoles = req.user?.roles || [];
  const hasRole = userRoles.some((r) => allowedRoles.includes(r));

  if (!hasRole) {
    return res.status(403).json({ message: 'Forbidden: insufficient role' });
  }

  next();
};

module.exports = { authenticate, authorize };
