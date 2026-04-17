// routes/admin.js — All routes require role=admin
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getAllUsers, getAllProperties, getAllApplications,
  deleteUser, deleteProperty, getSystemStats,
  changeUserRole, getAnalytics,
} = require('../controllers/adminController');

// Every admin route requires authentication + admin role
router.use(protect, requireRole('admin'));

// ── System Overview ─────────────────────────────────────────────────────────
router.get('/stats',              getSystemStats);
router.get('/analytics',          getAnalytics);

// ── User Management ─────────────────────────────────────────────────────────
router.get   ('/users',           getAllUsers);
router.delete('/users/:id',       deleteUser);
router.put   ('/users/:id/role',  changeUserRole);

// ── Property Management ────────────────────────────────────────────────────
router.get   ('/properties',      getAllProperties);
router.delete('/properties/:id',  deleteProperty);

// ── Application Management ─────────────────────────────────────────────────
router.get('/applications',       getAllApplications);

module.exports = router;
