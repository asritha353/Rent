// routes/admin.js — All routes require role=admin
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getAllUsers, getAllProperties, getAllApplications,
  deleteUser, deleteProperty, getSystemStats,
  changeUserRole, getAnalytics,
} = require('../controllers/adminController');

router.use(protect, requireRole('admin'));

router.get   ('/stats',            getSystemStats);
router.get   ('/analytics',        getAnalytics);
router.get   ('/users',            getAllUsers);
router.delete('/users/:id',        deleteUser);
router.put   ('/users/:id/role',   changeUserRole);
router.get   ('/properties',       getAllProperties);
router.delete('/properties/:id',   deleteProperty);
router.get   ('/applications',     getAllApplications);

module.exports = router;
