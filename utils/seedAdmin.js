// utils/seedAdmin.js — One-time admin user seeder
// Run with: node utils/seedAdmin.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getPool, initializeSchema } = require('../database/db');

const ADMIN = {
  id    : uuidv4(),
  name  : 'RentLux Admin',
  email : 'admin@rentlux.com',
  password: 'Admin@123',
  role  : 'admin',
};

async function seedAdmin() {
  try {
    await initializeSchema();
    const pool = getPool();

    // Check if admin already exists
    const existing = await pool.request()
      .input('email', ADMIN.email)
      .query('SELECT id FROM Users WHERE email = @email');

    if (existing.recordset.length > 0) {
      console.log(`✅ Admin already exists: ${ADMIN.email}`);
      process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN.password, 10);

    await pool.request()
      .input('id',            ADMIN.id)
      .input('name',          ADMIN.name)
      .input('email',         ADMIN.email)
      .input('password_hash', hash)
      .input('role',          ADMIN.role)
      .query(`
        INSERT INTO Users (id, name, email, password_hash, role, is_verified, is_active)
        VALUES (@id, @name, @email, @password_hash, @role, 1, 1)
      `);

    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log('║       Admin Seeded Successfully       ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  Email   : ${ADMIN.email}    ║`);
    console.log(`║  Password: ${ADMIN.password}              ║`);
    console.log('╚══════════════════════════════════════╝');
    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('[SeedAdmin] Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
