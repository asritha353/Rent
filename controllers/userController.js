// controllers/userController.js
const fs   = require('fs');
const path = require('path');
const { getAll } = require('../utils/dataStore');

const USERS_FILE = path.join(__dirname, '../data/users.json');

function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch(e) { return []; }
}

function writeUsers(users) {
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2)); } catch(e) {}
}

// GET /api/users/dashboard-stats
const getDashboardStats = (req, res) => {
  try {
    const all        = getAll();
    const hyderabad  = all.filter(p => p.city === 'Hyderabad').length;
    const vijayawada = all.filter(p => p.city === 'Vijayawada').length;

    const bhkGroups = {};
    all.forEach(p => { if (p.bhk) bhkGroups[p.bhk + ' BHK'] = (bhkGroups[p.bhk + ' BHK'] || 0) + 1; });

    const typeGroups = {};
    all.forEach(p => { typeGroups[p.type] = (typeGroups[p.type] || 0) + 1; });

    const avgPrice = all.length ? Math.round(all.reduce((s, p) => s + p.price, 0) / all.length) : 0;

    res.json({
      success: true,
      data: {
        totalProperties : all.length,
        cities          : { Hyderabad: hyderabad, Vijayawada: vijayawada },
        bhkBreakdown    : bhkGroups,
        propertyTypes   : typeGroups,
        avgPrice,
      },
    });
  } catch(err) {
    console.error('[Dashboard]', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/users/save-property
const saveProperty = (req, res) => {
  try {
    const { userId, propertyId } = req.body;
    const users = readUsers();
    const user  = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.savedProperties) user.savedProperties = [];
    if (!user.savedProperties.includes(propertyId)) {
      user.savedProperties.push(propertyId);
      writeUsers(users);
    }
    res.json({ success: true, data: user.savedProperties });
  } catch(err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/users/saved/:userId
const getSavedProperties = (req, res) => {
  try {
    const users = readUsers();
    const user  = users.find(u => u.id === req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const all   = getAll();
    const saved = all.filter(p => (user.savedProperties || []).includes(p.id));
    res.json({ success: true, data: saved, total: saved.length });
  } catch(err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getDashboardStats, saveProperty, getSavedProperties };
