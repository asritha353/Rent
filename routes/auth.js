// routes/auth.js
const express = require('express');
const router  = express.Router();
const { register, login, getMe, changePassword } = require('../controllers/authController');
const { protect }                                = require('../middleware/auth');
const { authLimiter }                            = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validateChangePassword } = require('../middleware/validator');

// Strict rate limit on auth endpoints (5 req / 15 min per IP)
router.use(authLimiter);

router.post('/register', validateRegister, register);
router.post('/login',    validateLogin,    login);
router.get('/me',        protect,          getMe);
router.put('/change-password', protect, validateChangePassword, changePassword);

module.exports = router;
