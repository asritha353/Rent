// controllers/authController.js — MSSQL + Role-aware JWT
require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { sql, query } = require('../database/db');

const SECRET = process.env.JWT_SECRET || 'rentlux_secret_2024';

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    SECRET,
    { expiresIn: '7d' }
  );
}

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const userRole = ['tenant', 'owner'].includes(role) ? role : 'tenant';

    // Duplicate email check
    const existing = await query(
      'SELECT id FROM Users WHERE email = @email',
      { email: { type: sql.NVarChar(100), value: email } }
    );
    if (existing.recordset.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id   = uuidv4();

    await query(
      'INSERT INTO Users (id, name, email, password_hash, role) VALUES (@id, @name, @email, @hash, @role)',
      {
        id  : { type: sql.VarChar(50),   value: id },
        name: { type: sql.NVarChar(100), value: name },
        email:{ type: sql.NVarChar(100), value: email },
        hash: { type: sql.NVarChar(255), value: hash },
        role: { type: sql.NVarChar(20),  value: userRole },
      }
    );

    const user  = { id, name, email, role: userRole };
    const token = makeToken(user);
    console.log('[Auth] Registered:', email, '→', userRole);

    res.status(201).json({
      success: true,
      message: 'Account created',
      data   : { token, user: { id, name, email, role: userRole } },
    });
  } catch (err) {
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const result = await query(
      'SELECT id, name, email, password_hash, role FROM Users WHERE email = @email',
      { email: { type: sql.NVarChar(100), value: email } }
    );
    if (result.recordset.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const u     = result.recordset[0];
    const match = await bcrypt.compare(password, u.password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = makeToken({ id: u.id, email: u.email, name: u.name, role: u.role });
    console.log('[Auth] Login:', email, '→', u.role);

    res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: { id: u.id, name: u.name, email: u.email, role: u.role } },
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/auth/me  [protected]
const getMe = async (req, res) => {
  try {
    const result = await query(
      'SELECT id, name, email, role, created_at FROM Users WHERE id = @id',
      { id: { type: sql.VarChar(50), value: req.user.id } }
    );
    if (result.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('[Auth] getMe error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/auth/change-password  [protected]
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const result = await query(
      'SELECT password_hash FROM Users WHERE id = @id',
      { id: { type: sql.VarChar(50), value: req.user.id } }
    );
    if (result.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'User not found' });

    const match = await bcrypt.compare(oldPassword, result.recordset[0].password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    const newHash = await bcrypt.hash(newPassword, 10);
    await query(
      'UPDATE Users SET password_hash = @hash, updated_at = GETDATE() WHERE id = @id',
      {
        hash: { type: sql.NVarChar(255), value: newHash },
        id  : { type: sql.VarChar(50),   value: req.user.id },
      }
    );

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('[Auth] changePassword error:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe, changePassword };
