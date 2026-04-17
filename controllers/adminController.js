// controllers/adminController.js — System-wide management
const { sql, query } = require('../database/db');
const { getAll } = require('../utils/dataStore');

function safeJSON(str, fallback = []) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// ─────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(50, parseInt(req.query.limit || '20'));
    const offset = (page - 1) * limit;

    const [result, countResult] = await Promise.all([
      query(
        `SELECT id, name, email, role, created_at FROM Users
         ORDER BY created_at DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        { offset: { type: sql.Int, value: offset }, limit: { type: sql.Int, value: limit } }
      ),
      query('SELECT COUNT(*) AS total FROM Users'),
    ]);

    res.json({
      success   : true,
      data      : result.recordset,
      total     : countResult.recordset[0].total,
      page, limit, totalPages: Math.ceil(countResult.recordset[0].total / limit),
    });
  } catch (err) {
    console.error('[Admin] getAllUsers:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/properties  (DB only, paginated)
// ─────────────────────────────────────────────
const getAllProperties = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(50, parseInt(req.query.limit || '20'));
    const offset = (page - 1) * limit;

    const [result, countResult] = await Promise.all([
      query(
        `SELECT p.*, u.name AS owner_name, u.email AS owner_email
         FROM Properties p
         JOIN Users u ON p.owner_id = u.id
         ORDER BY p.created_at DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        { offset: { type: sql.Int, value: offset }, limit: { type: sql.Int, value: limit } }
      ),
      query('SELECT COUNT(*) AS total FROM Properties'),
    ]);

    const properties = result.recordset.map(p => ({ ...p, images: safeJSON(p.images) }));

    res.json({
      success   : true,
      data      : properties,
      total     : countResult.recordset[0].total,
      page, limit, totalPages: Math.ceil(countResult.recordset[0].total / limit),
    });
  } catch (err) {
    console.error('[Admin] getAllProperties:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/applications
// ─────────────────────────────────────────────
const getAllApplications = async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page  || '1'));
    const limit  = Math.min(50, parseInt(req.query.limit || '20'));
    const offset = (page - 1) * limit;

    const [result, countResult] = await Promise.all([
      query(
        `SELECT a.*, p.title AS property_title, p.city,
                t.name AS tenant_name, t.email AS tenant_email,
                o.name AS owner_name
         FROM Applications a
         JOIN Properties p ON a.property_id = p.id
         JOIN Users      t ON a.tenant_id   = t.id
         JOIN Users      o ON p.owner_id    = o.id
         ORDER BY a.applied_at DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        { offset: { type: sql.Int, value: offset }, limit: { type: sql.Int, value: limit } }
      ),
      query('SELECT COUNT(*) AS total FROM Applications'),
    ]);

    res.json({
      success   : true,
      data      : result.recordset,
      total     : countResult.recordset[0].total,
      page, limit, totalPages: Math.ceil(countResult.recordset[0].total / limit),
    });
  } catch (err) {
    console.error('[Admin] getAllApplications:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/users/:id
// ─────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id)
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });

    const userCheck = await query(
      'SELECT role FROM Users WHERE id = @id',
      { id: { type: sql.VarChar(50), value: id } }
    );
    if (userCheck.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (userCheck.recordset[0].role === 'admin')
      return res.status(403).json({ success: false, message: 'Cannot delete admin user' });

    // Cascade delete tenant-side
    await query(
      `DELETE FROM Agreements WHERE application_id IN (SELECT id FROM Applications WHERE tenant_id = @id)`,
      { id: { type: sql.VarChar(50), value: id } }
    );
    await query(`DELETE FROM Applications WHERE tenant_id = @id`, { id: { type: sql.VarChar(50), value: id } });

    // Cascade delete owner-side
    await query(
      `DELETE FROM Agreements WHERE application_id IN
         (SELECT a.id FROM Applications a JOIN Properties p ON a.property_id = p.id WHERE p.owner_id = @id)`,
      { id: { type: sql.VarChar(50), value: id } }
    );
    await query(
      `DELETE FROM Applications WHERE property_id IN (SELECT id FROM Properties WHERE owner_id = @id)`,
      { id: { type: sql.VarChar(50), value: id } }
    );
    await query(`DELETE FROM Properties WHERE owner_id = @id`, { id: { type: sql.VarChar(50), value: id } });
    await query(`DELETE FROM Users WHERE id = @id`, { id: { type: sql.VarChar(50), value: id } });

    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('[Admin] deleteUser:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/properties/:id
// ─────────────────────────────────────────────
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;

    const check = await query('SELECT id FROM Properties WHERE id = @id', { id: { type: sql.VarChar(50), value: id } });
    if (check.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Property not found' });

    await query(
      `DELETE FROM Agreements WHERE application_id IN (SELECT id FROM Applications WHERE property_id = @id)`,
      { id: { type: sql.VarChar(50), value: id } }
    );
    await query(`DELETE FROM Applications WHERE property_id = @id`, { id: { type: sql.VarChar(50), value: id } });
    await query(`DELETE FROM Properties WHERE id = @id`, { id: { type: sql.VarChar(50), value: id } });

    res.json({ success: true, message: 'Property deleted' });
  } catch (err) {
    console.error('[Admin] deleteProperty:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/stats
// ─────────────────────────────────────────────
const getSystemStats = async (req, res) => {
  try {
    const [
      usersCount, ownersCount, tenantsCount,
      propsCount, rentedCount,
      appsCount, pendingCount, acceptedCount,
    ] = await Promise.all([
      query('SELECT COUNT(*) AS n FROM Users'),
      query(`SELECT COUNT(*) AS n FROM Users WHERE role = 'owner'`),
      query(`SELECT COUNT(*) AS n FROM Users WHERE role = 'tenant'`),
      query('SELECT COUNT(*) AS n FROM Properties'),
      query(`SELECT COUNT(*) AS n FROM Properties WHERE status = 'rented'`),
      query('SELECT COUNT(*) AS n FROM Applications'),
      query(`SELECT COUNT(*) AS n FROM Applications WHERE status = 'pending'`),
      query(`SELECT COUNT(*) AS n FROM Applications WHERE status = 'accepted'`),
    ]);

    const jsonProps = getAll();

    res.json({
      success: true,
      data: {
        users              : usersCount.recordset[0].n,
        owners             : ownersCount.recordset[0].n,
        tenants            : tenantsCount.recordset[0].n,
        dbProperties       : propsCount.recordset[0].n,
        rentedProperties   : rentedCount.recordset[0].n,
        jsonProperties     : jsonProps.length,
        totalListings      : propsCount.recordset[0].n + jsonProps.length,
        applications       : appsCount.recordset[0].n,
        pendingApplications: pendingCount.recordset[0].n,
        acceptedApplications: acceptedCount.recordset[0].n,
      },
    });
  } catch (err) {
    console.error('[Admin] getSystemStats:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/admin/users/:id/role
// ─────────────────────────────────────────────
const changeUserRole = async (req, res) => {
  try {
    const { id }   = req.params;
    const { role } = req.body;

    if (!['tenant', 'owner'].includes(role))
      return res.status(400).json({ success: false, message: 'Role must be tenant or owner (admins cannot be assigned via API)' });

    if (id === req.user.id)
      return res.status(400).json({ success: false, message: 'You cannot change your own role' });

    const userCheck = await query(
      'SELECT role FROM Users WHERE id = @id',
      { id: { type: sql.VarChar(50), value: id } }
    );
    if (userCheck.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'User not found' });
    if (userCheck.recordset[0].role === 'admin')
      return res.status(403).json({ success: false, message: 'Cannot change role of another admin' });

    await query(
      'UPDATE Users SET role = @role WHERE id = @id',
      {
        role: { type: sql.NVarChar(20), value: role },
        id  : { type: sql.VarChar(50), value: id },
      }
    );

    res.json({ success: true, message: `User role updated to ${role}` });
  } catch (err) {
    console.error('[Admin] changeUserRole:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/analytics
// ─────────────────────────────────────────────
const getAnalytics = async (req, res) => {
  try {
    const days = Math.min(30, parseInt(req.query.days || '7'));

    const [signups, applications, roleBreakdown] = await Promise.all([
      query(
        `SELECT
           CONVERT(DATE, created_at) AS date,
           COUNT(*) AS count
         FROM Users
         WHERE created_at >= DATEADD(DAY, -@days, GETDATE())
         GROUP BY CONVERT(DATE, created_at)
         ORDER BY date`,
        { days: { type: sql.Int, value: days } }
      ),
      query(
        `SELECT
           CONVERT(DATE, applied_at) AS date,
           COUNT(*) AS count,
           SUM(CASE WHEN status='accepted' THEN 1 ELSE 0 END) AS accepted,
           SUM(CASE WHEN status='pending'  THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END) AS rejected
         FROM Applications
         WHERE applied_at >= DATEADD(DAY, -@days, GETDATE())
         GROUP BY CONVERT(DATE, applied_at)
         ORDER BY date`,
        { days: { type: sql.Int, value: days } }
      ),
      query(
        `SELECT role, COUNT(*) AS count FROM Users GROUP BY role`
      ),
    ]);

    res.json({
      success: true,
      data: {
        period       : `Last ${days} days`,
        signups      : signups.recordset,
        applications : applications.recordset,
        roleBreakdown: roleBreakdown.recordset,
      },
    });
  } catch (err) {
    console.error('[Admin] getAnalytics:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getAllUsers, getAllProperties, getAllApplications,
  deleteUser, deleteProperty, getSystemStats,
  changeUserRole, getAnalytics,
};
