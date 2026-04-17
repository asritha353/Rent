// routes/owner.js — All routes require role=owner
const express = require('express');
const router  = express.Router();
const { protect, requireRole }   = require('../middleware/auth');
const { validateProperty }       = require('../middleware/validator');
const {
  createProperty, getMyProperties, updateProperty, deleteProperty,
  getApplicationsForMyProperties, acceptApplication, rejectApplication,
  getOwnerStats,
} = require('../controllers/ownerController');

// Apply protect + requireRole to every route in this file
router.use(protect, requireRole('owner'));

router.post  ('/properties',               validateProperty, createProperty);
router.get   ('/properties',               getMyProperties);
router.put   ('/properties/:id',           validateProperty, updateProperty);
router.delete('/properties/:id',           deleteProperty);
router.get   ('/applications',             getApplicationsForMyProperties);
router.put   ('/applications/:id/accept',  acceptApplication);
router.put   ('/applications/:id/reject',  rejectApplication);
router.get   ('/stats',                    getOwnerStats);

module.exports = router;
