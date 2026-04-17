// routes/properties.js
const express = require('express');
const router  = express.Router();
const {
  getAllProperties,
  getPropertyById,
  getSimilarProperties,
  getStats,
} = require('../controllers/propertyController');

// IMPORTANT: /stats and /similar/:id MUST come before /:id
router.get('/stats',       getStats);
router.get('/similar/:id', getSimilarProperties);
router.get('/',            getAllProperties);
router.get('/:id',         getPropertyById);

module.exports = router;
