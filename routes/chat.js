// routes/chat.js — chatbot is public (no auth required)
const express = require('express');
const router  = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { chat } = require('../controllers/chatController');

// optionalAuth: sets req.user if token present, else sets guest user
router.post('/', optionalAuth, chat);

module.exports = router;
