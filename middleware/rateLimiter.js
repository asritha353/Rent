// middleware/rateLimiter.js — express-rate-limit configurations
const rateLimit = require('express-rate-limit');

/**
 * authLimiter — 5 requests per 15 minutes per IP
 * Applied to: POST /api/auth/login, POST /api/auth/register
 */
const authLimiter = rateLimit({
  windowMs : 15 * 60 * 1000, // 15 minutes
  max      : 5,
  message  : { success: false, message: 'Too many auth attempts — please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders  : false,
});

/**
 * apiLimiter — 100 requests per 15 minutes per IP
 * Applied to: all general API routes
 */
const apiLimiter = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 100,
  message  : { success: false, message: 'Too many requests — please slow down.' },
  standardHeaders: true,
  legacyHeaders  : false,
});

/**
 * chatLimiter — 20 messages per minute per IP
 * Applied to: POST /api/chat
 */
const chatLimiter = rateLimit({
  windowMs : 60 * 1000, // 1 minute
  max      : 20,
  message  : { success: false, message: 'Chat rate limit reached — please wait a moment.' },
  standardHeaders: true,
  legacyHeaders  : false,
});

module.exports = { authLimiter, apiLimiter, chatLimiter };
