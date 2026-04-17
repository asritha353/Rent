// controllers/tenantController.js — Tenant application workflow
const { v4: uuidv4 } = require('uuid');
const { sql, query } = require('../database/db');

function safeJSON(str, fallback = []) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// ─────────────────────────────────────────────
// POST /api/tenant/applications
// ─────────────────────────────────────────────
const applyForProperty = async (req, res) => {
  try {
    const { property_id, message } = req.body;
    if (!property_id)
      return res.status(400).json({ success: false, message: 'property_id is required' });

    // Check property exists and is available
    const propResult = await query(
      'SELECT id, status FROM Properties WHERE id = @id',
      { id: { type: sql.VarChar(50), value: property_id } }
    );
    if (propResult.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Property not found' });
    if (propResult.recordset[0].status === 'rented')
      return res.status(400).json({ success: false, message: 'This property is already rented' });

    // Prevent duplicate active application
    const dup = await query(
      `SELECT id FROM Applications
       WHERE tenant_id = @tenant_id AND property_id = @property_id
         AND status NOT IN ('rejected', 'withdrawn')`,
      {
        tenant_id  : { type: sql.VarChar(50), value: req.user.id },
        property_id: { type: sql.VarChar(50), value: property_id },
      }
    );
    if (dup.recordset.length > 0)
      return res.status(409).json({ success: false, message: 'You have already applied for this property' });

    const id = 'app_' + uuidv4();
    await query(
      `INSERT INTO Applications (id, tenant_id, property_id, message, status)
       VALUES (@id, @tenant_id, @property_id, @message, 'pending')`,
      {
        id         : { type: sql.VarChar(50),      value: id },
        tenant_id  : { type: sql.VarChar(50),      value: req.user.id },
        property_id: { type: sql.VarChar(50),      value: property_id },
        message    : { type: sql.NVarChar(sql.MAX), value: message || '' },
      }
    );

    console.log('[Tenant] Applied:', req.user.id, '→', property_id);
    res.status(201).json({ success: true, message: 'Application submitted', data: { id } });
  } catch (err) {
    console.error('[Tenant] applyForProperty:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/tenant/applications
// ─────────────────────────────────────────────
const getMyApplications = async (req, res) => {
  try {
    const result = await query(
      `SELECT a.*,
              p.title  AS property_title, p.city, p.price, p.bhk, p.type,
              p.images AS property_images, p.location,
              u.name   AS owner_name, u.email AS owner_email,
              ag.id    AS agreement_id
       FROM Applications a
       JOIN Properties p ON a.property_id = p.id
       JOIN Users      u ON p.owner_id    = u.id
       LEFT JOIN Agreements ag ON ag.application_id = a.id
       WHERE a.tenant_id = @tenant_id
       ORDER BY a.applied_at DESC`,
      { tenant_id: { type: sql.VarChar(50), value: req.user.id } }
    );

    const apps = result.recordset.map(a => ({
      ...a,
      property_images: safeJSON(a.property_images),
    }));

    res.json({ success: true, data: apps, total: apps.length });
  } catch (err) {
    console.error('[Tenant] getMyApplications:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/tenant/applications/:id  (withdraw)
// ─────────────────────────────────────────────
const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT id FROM Applications
       WHERE id = @id AND tenant_id = @tenant_id AND status = 'pending'`,
      {
        id       : { type: sql.VarChar(50), value: id },
        tenant_id: { type: sql.VarChar(50), value: req.user.id },
      }
    );
    if (result.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Pending application not found' });

    await query(
      `UPDATE Applications SET status = 'withdrawn', resolved_at = GETDATE() WHERE id = @id`,
      { id: { type: sql.VarChar(50), value: id } }
    );

    res.json({ success: true, message: 'Application withdrawn' });
  } catch (err) {
    console.error('[Tenant] withdrawApplication:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { applyForProperty, getMyApplications, withdrawApplication };
