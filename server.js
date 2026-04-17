// server.js — RentLux Application Entry Point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const { initializeSchema } = require('./database/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Core middleware
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Serve the existing frontend (rentlux_WORKING.html)
// Static assets (images, etc.) from root directory
app.use(express.static(path.join(__dirname)));

// ── API Routes
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/users',      require('./routes/users'));
app.use('/api/owner',      require('./routes/owner'));
app.use('/api/tenant',     require('./routes/tenant'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/agreements', require('./routes/agreements'));
app.use('/api/chat',       require('./routes/chat'));

// ── Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── Root → serve existing rentlux_WORKING.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'rentlux_WORKING.html'));
});

// ── Fallback for any other non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'rentlux_WORKING.html'));
  }
});

// ── Start
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
    console.log(`║   API Docs : http://localhost:${PORT}/api/health ║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
  });
}

start();
