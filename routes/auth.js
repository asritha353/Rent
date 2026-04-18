// routes/auth.js
const express = require('express');
const router  = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { initiateGoogleAuth, googleCallback }     = require('../controllers/googleAuthController');
const { protect }           = require('../middleware/auth');
const { authLimiter }       = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validateChangePassword } = require('../middleware/validator');

// ── Strict rate limit on all auth routes (5 req / 15 min per IP)
router.use(authLimiter);

// ── Standard email/password auth
router.post('/register', validateRegister, register);
router.post('/login',    validateLogin,    login);
router.get ('/me',       protect,          getMe);
router.put ('/change-password', protect, validateChangePassword, changePassword);

// ── Google OAuth (no rate limit — these are redirects, not API calls)
router.get('/google',          initiateGoogleAuth);
router.get('/google/callback', googleCallback);

module.exports = router;
