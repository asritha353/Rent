// routes/tenant.js — All routes require role=tenant
const express = require('express');
const router  = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const { applyForProperty, getMyApplications, withdrawApplication } = require('../controllers/tenantController');

router.use(protect, requireRole('tenant'));

router.post('/applications',        applyForProperty);
router.get('/applications',         getMyApplications);
router.delete('/applications/:id',  withdrawApplication);

module.exports = router;
