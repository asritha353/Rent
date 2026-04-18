// database/db.js — MSSQL connection via direct TCP port (no SQL Browser needed)
require('dotenv').config();
const sql    = require('mssql');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const config = {
  server  : process.env.DB_SERVER   || 'ASRITHA',
  port    : parseInt(process.env.DB_PORT || '50651'),
  database: process.env.DB_NAME     || 'RentLux',
  user    : process.env.DB_USER     || 'sa',
  password: process.env.DB_PASSWORD || '',
  connectionTimeout: 30000,
  requestTimeout   : 30000,
  options : {
    encrypt               : true,   // SQL Server 2025 needs this
    trustServerCertificate: true,   // trust self-signed cert
    enableArithAbort      : true,
  },
};

console.log(`[DB] Connecting → ${config.server}:${config.port}/${config.database} (user: ${config.user})`);

let pool = null;

async function getPool() {
  if (pool && pool.connected) return pool;
  pool = await sql.connect(config);
  return pool;
}

/**
 * Run a parameterised query.
 * params: { key: { type: sql.VarChar(50), value: '...' }, ... }
 */
async function query(queryStr, params = {}) {
  const p   = await getPool();
  const req = p.request();
  Object.entries(params).forEach(([key, { type, value }]) => req.input(key, type, value));
  return req.query(queryStr);
}

// ── Create tables if they don't exist (idempotent)
async function initializeSchema() {
  const p = await getPool();
  console.log('[DB] ✅ Connected to SQL Server');

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
    CREATE TABLE Users (
      id            VARCHAR(50)   PRIMARY KEY,
      name          NVARCHAR(100) NOT NULL,
      email         NVARCHAR(100) NOT NULL,
      password_hash NVARCHAR(255) NOT NULL,
      role          NVARCHAR(20)  NOT NULL DEFAULT 'tenant',
      phone         NVARCHAR(20),
      google_id     NVARCHAR(100),
      auth_provider NVARCHAR(20)  DEFAULT 'local',
      created_at    DATETIME2     DEFAULT GETDATE(),
      CONSTRAINT UQ_Users_Email UNIQUE (email)
    )
  `);

  // Add google_id / auth_provider to existing tables (safe ALTER — idempotent)
  await p.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_NAME='Users' AND COLUMN_NAME='google_id')
      ALTER TABLE Users ADD google_id NVARCHAR(100)
  `);
  await p.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
                   WHERE TABLE_NAME='Users' AND COLUMN_NAME='auth_provider')
      ALTER TABLE Users ADD auth_provider NVARCHAR(20) DEFAULT 'local'
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Properties' AND xtype='U')
    CREATE TABLE Properties (
      id          VARCHAR(50)    PRIMARY KEY,
      owner_id    VARCHAR(50)    NOT NULL REFERENCES Users(id),
      title       NVARCHAR(200)  NOT NULL,
      city        NVARCHAR(100)  NOT NULL,
      location    NVARCHAR(200),
      price       DECIMAL(18,2)  NOT NULL,
      bhk         INT,
      type        NVARCHAR(50)   DEFAULT 'Apartment',
      description NVARCHAR(MAX),
      images      NVARCHAR(MAX),
      status      NVARCHAR(20)   DEFAULT 'available',
      created_at  DATETIME2      DEFAULT GETDATE()
    )
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Applications' AND xtype='U')
    CREATE TABLE Applications (
      id          VARCHAR(50)  PRIMARY KEY,
      tenant_id   VARCHAR(50)  NOT NULL REFERENCES Users(id),
      property_id VARCHAR(50)  NOT NULL REFERENCES Properties(id),
      message     NVARCHAR(MAX),
      status      NVARCHAR(20) DEFAULT 'pending',
      applied_at  DATETIME2    DEFAULT GETDATE(),
      resolved_at DATETIME2
    )
  `);

  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Agreements' AND xtype='U')
    CREATE TABLE Agreements (
      id             VARCHAR(50)   PRIMARY KEY,
      application_id VARCHAR(50)   NOT NULL REFERENCES Applications(id),
      terms          NVARCHAR(MAX) NOT NULL,
      generated_at   DATETIME2     DEFAULT GETDATE(),
      signed_tenant  BIT           DEFAULT 0,
      signed_owner   BIT           DEFAULT 0
    )
  `);

  console.log('[DB] ✅ Tables ready (Users, Properties, Applications, Agreements)');

  // Seed admin on first run
  const check = await p.request().query(`SELECT id FROM Users WHERE role = 'admin'`);
  if (check.recordset.length === 0) {
    const hash = await bcrypt.hash('Admin@123', 10);
    const id   = 'admin_' + uuidv4();
    const r    = p.request();
    r.input('id',   sql.VarChar(50),   id);
    r.input('name', sql.NVarChar(100), 'System Admin');
    r.input('email',sql.NVarChar(100), 'admin@rentlux.com');
    r.input('hash', sql.NVarChar(255), hash);
    await r.query(`INSERT INTO Users (id,name,email,password_hash,role) VALUES (@id,@name,@email,@hash,'admin')`);
    console.log('[DB] 🌱 Admin seeded → admin@rentlux.com / Admin@123');
  }
}

module.exports = { sql, getPool, query, initializeSchema };
