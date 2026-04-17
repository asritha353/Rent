// routes/auth.js
const express  = require('express');
const router   = express.Router();
const passport = require('passport');

const { register, login, getMe, changePassword } = require('../controllers/authController');
const { googleCallback, googleAuthFailed }        = require('../controllers/googleAuthController');
const { protect }                                 = require('../middleware/auth');
const { authLimiter }                             = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validateChangePassword } = require('../middleware/validator');

// ── Rate limit all auth endpoints ──────────────────────────────────────────
router.use(authLimiter);

// ── Email / Password ───────────────────────────────────────────────────────
router.post('/register', validateRegister, register);
router.post('/login',    validateLogin,    login);
router.get ('/me',       protect,          getMe);
router.put ('/change-password', protect, validateChangePassword, changePassword);

// ── Google OAuth ───────────────────────────────────────────────────────────
// Step 1: Redirect to Google consent screen.
// Pass intended role via ?role=tenant|owner (default: tenant)
router.get('/google',
  (req, res, next) => {
    // Encode the desired role in the OAuth state param
    const state = req.query.role === 'owner' ? 'owner' : 'tenant';
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state,
    })(req, res, next);
  }
);

// Step 2: Google redirects back here after consent
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect : '/?error=google_auth_failed',
    session         : true,
  }),
  googleCallback
);

// Failure landing (shown if passport.authenticate fails internally)
router.get('/google/failure', googleAuthFailed);

module.exports = router;
