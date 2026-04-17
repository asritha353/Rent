// routes/agreements.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { generateAgreement, getAgreement, signAgreement } = require('../controllers/agreementController');

router.use(protect);

router.post('/',                   generateAgreement);
router.get('/:applicationId',      getAgreement);
router.put('/:id/sign',            signAgreement);

module.exports = router;
