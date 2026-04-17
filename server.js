// server.js — RentLux Application Entry Point
require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const path        = require('path');

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

// ── General rate limiter on all /api routes ─────────────────────────────────
app.use('/api', apiLimiter);

// ── Serve static frontend (root dir serves rentlux_WORKING.html etc.) ───────
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

// ── Root → serve rentlux_WORKING.html ────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'rentlux_WORKING.html'));
});

// ── SPA fallback for all non-API routes ─────────────────────────────────────
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'rentlux_WORKING.html'));
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
