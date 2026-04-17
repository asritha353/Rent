// middleware/auth.js — JWT verification + Role-Based Access Control
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'rentlux_secret_2024';

/**
 * protect — verifies Bearer JWT token, attaches req.user = { id, email, name, role }
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token — please log in' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired — please log in again' });
  }
};

/**
 * requireRole(...roles) — factory; call after protect.
 * Usage: router.get('/admin/stuff', protect, requireRole('admin'), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success : false,
      message : `Access denied. Required: ${roles.join(' or ')}. Your role: ${req.user.role}`,
    });
  }
  next();
};

module.exports = { protect, requireRole };
