// controllers/propertyController.js — Reads from SQL database (all South India cities)
const { sql, query } = require('../database/db');

// ── Helper: build WHERE clause from query params ───────────────────────────
function buildWhere(q) {
  const conditions = ["p.status = 'available'"];
  const params = {};

  if (q.city && q.city.trim()) {
    conditions.push('LOWER(p.city) = LOWER(@city)');
    params.city = { type: sql.NVarChar(100), value: q.city.trim() };
  }
  if (q.bhk && q.bhk !== '') {
    const bhkNum = parseInt(q.bhk);
    if (!isNaN(bhkNum)) {
      conditions.push('p.bhk = @bhk');
      params.bhk = { type: sql.Int, value: bhkNum };
    }
  }
  if (q.type && q.type.trim()) {
    conditions.push('LOWER(p.type) = LOWER(@type)');
    params.type = { type: sql.NVarChar(50), value: q.type.trim() };
  }
  if (q.maxPrice && q.maxPrice !== '') {
    const max = parseFloat(q.maxPrice);
    if (!isNaN(max)) {
      conditions.push('p.price <= @maxPrice');
      params.maxPrice = { type: sql.Decimal(18, 2), value: max };
    }
  }
  if (q.minPrice && q.minPrice !== '') {
    const min = parseFloat(q.minPrice);
    if (!isNaN(min)) {
      conditions.push('p.price >= @minPrice');
      params.minPrice = { type: sql.Decimal(18, 2), value: min };
    }
  }
  // Furnished filter — derived from description text (no extra column needed)
  if (q.furnished && q.furnished.trim()) {
    const fv = q.furnished.trim().toLowerCase();
    if (fv === 'fully') {
      conditions.push("(LOWER(p.description) LIKE '%fully furnished%' OR LOWER(p.title) LIKE '%fully furnished%')");
    } else if (fv === 'semi') {
      conditions.push("(LOWER(p.description) LIKE '%semi%furnished%' OR LOWER(p.title) LIKE '%semi%')");
    } else if (fv === 'unfurnished') {
      conditions.push("(LOWER(p.description) LIKE '%unfurnished%' OR LOWER(p.title) LIKE '%unfurnished%')");
    }
  }
  // Property For filter — Rent = residential types, Commercial = Office/Shop
  if (q.propertyFor && q.propertyFor.trim()) {
    const pf = q.propertyFor.trim().toLowerCase();
    if (pf === 'rent') {
      conditions.push("p.type IN ('Apartment','House','Villa')");
    } else if (pf === 'commercial') {
      conditions.push("p.type IN ('Office','Shop')");
    } else if (pf === 'buy') {
      conditions.push("p.type IN ('Plot','House','Villa','Apartment')");
    }
  }
  // Free text search
  if (q.search && q.search.trim()) {
    conditions.push("(p.title LIKE @search OR p.city LIKE @search OR p.location LIKE @search OR p.description LIKE @search)");
    params.search = { type: sql.NVarChar(200), value: `%${q.search.trim()}%` };
  }

  return { where: 'WHERE ' + conditions.join(' AND '), params };
}

// GET /api/properties ─────────────────────────────────────────────────────
const getAllProperties = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || 1));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || 12)));
    const offset = (page - 1) * limit;

    const { where, params } = buildWhere(req.query);

    const countRes = await query(
      `SELECT COUNT(*) AS total FROM Properties p ${where}`,
      params
    );
    const total = countRes.recordset[0].total;

    const dataRes = await query(
      `SELECT p.id, p.title, p.city, p.location, p.price, p.bhk, p.type,
              p.description, p.status, p.created_at,
              u.name AS owner_name
       FROM Properties p
       LEFT JOIN Users u ON u.id = p.owner_id
       ${where}
       ORDER BY p.created_at DESC
       OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`,
      params
    );

    const data = dataRes.recordset.map(p => ({
      id: p.id, title: p.title, city: p.city, location: p.location,
      price: Number(p.price), bhk: p.bhk, type: p.type,
      description: p.description, status: p.status,
      ownerName: p.owner_name,
    }));

    console.log('[Properties] query:', JSON.stringify(req.query), '→', total, 'total,', data.length, 'returned');
    res.json({ success: true, data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Properties] getAllProperties error:', err.message);
    res.status(500).json({ success: false, message: 'Server error', data: [], total: 0 });
  }
};

// GET /api/properties/stats ───────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const r = await query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN LOWER(city) = 'hyderabad'   THEN 1 ELSE 0 END) AS hyderabad,
         SUM(CASE WHEN LOWER(city) = 'bengaluru'   THEN 1 ELSE 0 END) AS bengaluru,
         SUM(CASE WHEN LOWER(city) = 'chennai'     THEN 1 ELSE 0 END) AS chennai,
         SUM(CASE WHEN LOWER(city) = 'kochi'       THEN 1 ELSE 0 END) AS kochi
       FROM Properties WHERE status = 'available'`, {}
    );
    const byTypeRes = await query(
      `SELECT type, COUNT(*) AS cnt FROM Properties WHERE status='available' GROUP BY type`, {}
    );
    const byType = {};
    byTypeRes.recordset.forEach(r => { byType[r.type] = r.cnt; });
    res.json({ success: true, data: { ...r.recordset[0], byType } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/properties/:id ─────────────────────────────────────────────────
const getPropertyById = async (req, res) => {
  try {
    const r = await query(
      `SELECT p.*, u.name AS owner_name, u.email AS owner_email
       FROM Properties p LEFT JOIN Users u ON u.id = p.owner_id
       WHERE p.id = @id`,
      { id: { type: sql.VarChar(50), value: req.params.id } }
    );
    if (!r.recordset.length)
      return res.status(404).json({ success: false, message: 'Property not found' });
    const p = r.recordset[0];
    res.json({ success: true, data: { ...p, price: Number(p.price) } });
  } catch (err) {
    console.error('[Properties] getById:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/properties/similar/:id ─────────────────────────────────────────
const getSimilarProperties = async (req, res) => {
  try {
    const r = await query(
      `SELECT p.id, p.title, p.city, p.price, p.bhk, p.type FROM Properties p
       WHERE p.id != @id AND p.status = 'available'
         AND p.city = (SELECT city FROM Properties WHERE id = @id)
       ORDER BY ABS(p.price - (SELECT price FROM Properties WHERE id = @id))
       OFFSET 0 ROWS FETCH NEXT 6 ROWS ONLY`,
      { id: { type: sql.VarChar(50), value: req.params.id } }
    );
    res.json({ success: true, data: r.recordset, total: r.recordset.length });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', data: [], total: 0 });
  }
};

module.exports = { getAllProperties, getPropertyById, getSimilarProperties, getStats };
