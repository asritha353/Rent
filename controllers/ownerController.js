// controllers/ownerController.js — Owner CRUD + Application management
const { v4: uuidv4 } = require('uuid');
const { sql, query } = require('../database/db');

function safeJSON(str, fallback = []) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// ─────────────────────────────────────────────
// POST /api/owner/properties
// ─────────────────────────────────────────────
const createProperty = async (req, res) => {
  try {
    const { title, city, location, price, bhk, type, description, images } = req.body;
    if (!title || !city || !price)
      return res.status(400).json({ success: false, message: 'title, city and price are required' });

    const id         = 'prop_' + uuidv4();
    const imagesJson = JSON.stringify(Array.isArray(images) ? images : []);

    await query(
      `INSERT INTO Properties (id, owner_id, title, city, location, price, bhk, type, description, images, status)
       VALUES (@id, @owner_id, @title, @city, @location, @price, @bhk, @type, @description, @images, 'available')`,
      {
        id         : { type: sql.VarChar(50),    value: id },
        owner_id   : { type: sql.VarChar(50),    value: req.user.id },
        title      : { type: sql.NVarChar(200),  value: title },
        city       : { type: sql.NVarChar(100),  value: city },
        location   : { type: sql.NVarChar(200),  value: location  || '' },
        price      : { type: sql.Decimal(18, 2), value: Number(price) },
        bhk        : { type: sql.Int,            value: bhk ? parseInt(bhk) : null },
        type       : { type: sql.NVarChar(50),   value: type || 'Apartment' },
        description: { type: sql.NVarChar(sql.MAX), value: description || '' },
        images     : { type: sql.NVarChar(sql.MAX), value: imagesJson },
      }
    );

    console.log('[Owner] Created property:', id, 'by', req.user.id);
    res.status(201).json({ success: true, message: 'Property listed successfully', data: { id } });
  } catch (err) {
    console.error('[Owner] createProperty:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/owner/properties
// ─────────────────────────────────────────────
const getMyProperties = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(20, parseInt(req.query.limit || '10'));
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM Applications a WHERE a.property_id = p.id AND a.status = 'pending') AS pending_applications
       FROM Properties p
       WHERE p.owner_id = @owner_id
       ORDER BY p.created_at DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      {
        owner_id: { type: sql.VarChar(50), value: req.user.id },
        offset  : { type: sql.Int,         value: offset },
        limit   : { type: sql.Int,         value: limit },
      }
    );

    const countResult = await query(
      'SELECT COUNT(*) AS total FROM Properties WHERE owner_id = @owner_id',
      { owner_id: { type: sql.VarChar(50), value: req.user.id } }
    );

    const total      = countResult.recordset[0].total;
    const properties = result.recordset.map(p => ({ ...p, images: safeJSON(p.images) }));

    res.json({ success: true, data: properties, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Owner] getMyProperties:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/owner/properties/:id
// ─────────────────────────────────────────────
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, city, location, price, bhk, type, description, images, status } = req.body;

    const existing = await query(
      'SELECT id FROM Properties WHERE id = @id AND owner_id = @owner_id',
      { id: { type: sql.VarChar(50), value: id }, owner_id: { type: sql.VarChar(50), value: req.user.id } }
    );
    if (existing.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Property not found or not your listing' });

    await query(
      `UPDATE Properties SET
         title       = COALESCE(@title, title),
         city        = COALESCE(@city, city),
         location    = COALESCE(@location, location),
         price       = COALESCE(@price, price),
         bhk         = COALESCE(@bhk, bhk),
         type        = COALESCE(@type, type),
         description = COALESCE(@description, description),
         images      = COALESCE(@images, images),
         status      = COALESCE(@status, status)
       WHERE id = @id AND owner_id = @owner_id`,
      {
        id         : { type: sql.VarChar(50),    value: id },
        owner_id   : { type: sql.VarChar(50),    value: req.user.id },
        title      : { type: sql.NVarChar(200),  value: title  || null },
        city       : { type: sql.NVarChar(100),  value: city   || null },
        location   : { type: sql.NVarChar(200),  value: location || null },
        price      : { type: sql.Decimal(18, 2), value: price  ? Number(price) : null },
        bhk        : { type: sql.Int,            value: bhk    ? parseInt(bhk) : null },
        type       : { type: sql.NVarChar(50),   value: type   || null },
        description: { type: sql.NVarChar(sql.MAX), value: description || null },
        images     : { type: sql.NVarChar(sql.MAX), value: images ? JSON.stringify(images) : null },
        status     : { type: sql.NVarChar(20),   value: status || null },
      }
    );

    res.json({ success: true, message: 'Property updated' });
  } catch (err) {
    console.error('[Owner] updateProperty:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/owner/properties/:id
// ─────────────────────────────────────────────
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query(
      'SELECT id FROM Properties WHERE id = @id AND owner_id = @owner_id',
      { id: { type: sql.VarChar(50), value: id }, owner_id: { type: sql.VarChar(50), value: req.user.id } }
    );
    if (existing.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Property not found or not your listing' });

    // Cascade delete child records
    await query(
      `DELETE FROM Agreements WHERE application_id IN (SELECT id FROM Applications WHERE property_id = @id)`,
      { id: { type: sql.VarChar(50), value: id } }
    );
    await query(`DELETE FROM Applications WHERE property_id = @id`, { id: { type: sql.VarChar(50), value: id } });
    await query(
      `DELETE FROM Properties WHERE id = @id AND owner_id = @owner_id`,
      { id: { type: sql.VarChar(50), value: id }, owner_id: { type: sql.VarChar(50), value: req.user.id } }
    );

    res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    console.error('[Owner] deleteProperty:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/owner/applications
// ─────────────────────────────────────────────
const getApplicationsForMyProperties = async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*, p.title AS property_title, p.city, p.price,
              u.name AS tenant_name, u.email AS tenant_email
       FROM Applications a
       JOIN Properties p ON a.property_id = p.id
       JOIN Users      u ON a.tenant_id   = u.id
       WHERE p.owner_id = @owner_id
       ORDER BY a.applied_at DESC`,
      { owner_id: { type: sql.VarChar(50), value: req.user.id } }
    );

    res.json({ success: true, data: result.recordset, total: result.recordset.length });
  } catch (err) {
    console.error('[Owner] getApplications:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/owner/applications/:id/accept
// ─────────────────────────────────────────────
const acceptApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const appResult = await query(
      `SELECT a.*, p.owner_id, p.id AS prop_id
       FROM Applications a
       JOIN Properties p ON a.property_id = p.id
       WHERE a.id = @id AND p.owner_id = @owner_id`,
      { id: { type: sql.VarChar(50), value: id }, owner_id: { type: sql.VarChar(50), value: req.user.id } }
    );
    if (appResult.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Application not found' });

    if (appResult.recordset[0].status !== 'pending')
      return res.status(400).json({ success: false, message: 'Application is no longer pending' });

    const propId = appResult.recordset[0].prop_id;

    // Accept this application
    await query(
      `UPDATE Applications SET status = 'accepted', resolved_at = GETDATE() WHERE id = @id`,
      { id: { type: sql.VarChar(50), value: id } }
    );
    // Auto-reject all other pending applications for the same property
    await query(
      `UPDATE Applications SET status = 'rejected', resolved_at = GETDATE()
       WHERE property_id = @prop_id AND id <> @id AND status = 'pending'`,
      { prop_id: { type: sql.VarChar(50), value: propId }, id: { type: sql.VarChar(50), value: id } }
    );
    // Mark property as rented
    await query(
      `UPDATE Properties SET status = 'rented' WHERE id = @prop_id`,
      { prop_id: { type: sql.VarChar(50), value: propId } }
    );

    res.json({ success: true, message: 'Application accepted. Property marked as rented.' });
  } catch (err) {
    console.error('[Owner] acceptApplication:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/owner/applications/:id/reject
// ─────────────────────────────────────────────
const rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT a.id FROM Applications a
       JOIN Properties p ON a.property_id = p.id
       WHERE a.id = @id AND p.owner_id = @owner_id AND a.status = 'pending'`,
      { id: { type: sql.VarChar(50), value: id }, owner_id: { type: sql.VarChar(50), value: req.user.id } }
    );
    if (result.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Pending application not found' });

    await query(
      `UPDATE Applications SET status = 'rejected', resolved_at = GETDATE() WHERE id = @id`,
      { id: { type: sql.VarChar(50), value: id } }
    );

    res.json({ success: true, message: 'Application rejected' });
  } catch (err) {
    console.error('[Owner] rejectApplication:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createProperty, getMyProperties, updateProperty, deleteProperty,
  getApplicationsForMyProperties, acceptApplication, rejectApplication,
};
