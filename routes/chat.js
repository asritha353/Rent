// routes/chat.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { chat } = require('../controllers/chatController');

router.post('/', protect, chat);

module.exports = router;
