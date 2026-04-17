// routes/users.js
const express = require('express');
const router  = express.Router();
const { getDashboardStats, saveProperty, getSavedProperties } = require('../controllers/userController');

// No auth middleware needed for dashboard stats (public)
router.get('/dashboard-stats', getDashboardStats);

// These two need a token — but we make auth optional so it doesn't crash
router.post('/save-property', (req, res) => {
  const { userId, propertyId } = req.body || {};
  if (!userId || !propertyId) {
    return res.status(400).json({ success: false, message: 'userId and propertyId required' });
  }
  saveProperty(req, res);
});

router.get('/saved/:userId', getSavedProperties);

module.exports = router;
