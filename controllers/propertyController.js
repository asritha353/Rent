// controllers/propertyController.js
const { getAll, getById, getSimilar } = require('../utils/dataStore');
const { applyFilters, paginate }      = require('../utils/filter');

// GET /api/properties
const getAllProperties = (req, res) => {
  try {
    const all      = getAll();
    const filtered = applyFilters(all, req.query);
    const result   = paginate(filtered, req.query.page || 1, req.query.limit || 12);
    console.log('[Properties] query:', JSON.stringify(req.query), '→', result.total, 'results');
    res.json({ success: true, ...result });
  } catch(err) {
    console.error('[Properties]', err.message);
    res.status(500).json({ success: false, message: 'Server error', data: [], total: 0 });
  }
};

// GET /api/properties/stats
const getStats = (req, res) => {
  try {
    const all        = getAll();
    const hyderabad  = all.filter(p => p.city === 'Hyderabad').length;
    const vijayawada = all.filter(p => p.city === 'Vijayawada').length;
    const byType = {};
    all.forEach(p => { byType[p.type] = (byType[p.type] || 0) + 1; });
    res.json({ success: true, data: { total: all.length, hyderabad, vijayawada, byType } });
  } catch(err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/properties/:id
const getPropertyById = (req, res) => {
  try {
    const prop = getById(req.params.id);
    if (!prop) return res.status(404).json({ success: false, message: 'Property not found' });
    res.json({ success: true, data: prop });
  } catch(err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/properties/similar/:id
const getSimilarProperties = (req, res) => {
  try {
    const similar = getSimilar(req.params.id, 6);
    res.json({ success: true, data: similar, total: similar.length });
  } catch(err) {
    res.status(500).json({ success: false, message: 'Server error', data: [], total: 0 });
  }
};

module.exports = { getAllProperties, getPropertyById, getSimilarProperties, getStats };
