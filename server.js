// server.js — RentLux Application Entry Point
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const session     = require('express-session');
const path        = require('path');

// Register Google strategy (must happen before routes load)
const { passport } = require('./controllers/googleAuthController');

const { initializeSchema }      = require('./database/db');
const { apiLimiter }            = require('./middleware/rateLimiter');
const errorHandler              = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security & Performance Middleware ──────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP off so frontend inline scripts work
app.use(cors({
  origin         : process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods        : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders : ['Content-Type', 'Authorization'],
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Session (required for Passport OAuth state — JWT takes over after callback)
app.use(session({
  secret           : process.env.SESSION_SECRET || 'rentlux_session_secret_2024',
  resave           : false,
  saveUninitialized: false,
  cookie           : { secure: false, maxAge: 10 * 60 * 1000 }, // 10 min — OAuth flow only
}));
app.use(passport.initialize());
app.use(passport.session());

// ── General rate limiter on all /api routes ─────────────────────────────────
app.use('/api', apiLimiter);

// ── Static Files ────────────────────────────────────────────────────────────
// 1. Serve frontend/ dir first — /css/theme.css, /js/api.js, /tenant/dashboard.html all resolve here
app.use(express.static(path.join(__dirname, 'frontend')));
// 2. Serve root dir as fallback (for rentlux_WORKING.html, node_modules etc.)
app.use(express.static(path.join(__dirname)));

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/owner',      require('./routes/owner'));
app.use('/api/tenant',     require('./routes/tenant'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/agreements', require('./routes/agreements'));
app.use('/api/chat',       require('./routes/chat'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({
    success : true,
    status  : 'ok',
    uptime  : process.uptime(),
    memory  : process.memoryUsage(),
    env     : process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
);

// ── Root → serve frontend landing page (has Google OAuth + auth modal) ──────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ── SPA fallback — try the file in frontend/, else fall back to index.html ──
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const file = path.join(__dirname, 'frontend', req.path);
  res.sendFile(file, err => {
    if (err) res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
  });
});

// ── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initializeSchema();
  } catch (err) {
    console.error('\n[DB] ⚠️  Could not connect to SQL Server:', err.message);
    console.error('[DB] Check your .env — DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD');
    console.error('[DB] Server will start but database features will not work.\n');
  }

  app.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log(`║   🏡 RentLux  —  Full Stack  —  Port ${PORT}    ║`);
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║   Frontend : http://localhost:${PORT}           ║`);
    console.log(`║   Health   : http://localhost:${PORT}/api/health ║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
  });
}

start();
