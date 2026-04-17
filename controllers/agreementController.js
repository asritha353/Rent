// controllers/agreementController.js — Rental agreement generation (Groq-powered)
const { v4: uuidv4 } = require('uuid');
const axios          = require('axios');
const { sql, query } = require('../database/db');

// ── Generate agreement text via Groq (falls back to template if no key)
async function generateAgreementText(app) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const prompt = `Generate a professional rental agreement for an Indian property with these details:
Property: ${app.property_title}
Location: ${app.city}
Monthly Rent: INR ${Number(app.price).toLocaleString('en-IN')}
BHK: ${app.bhk || 'N/A'}
Tenant: ${app.tenant_name} (${app.tenant_email})
Owner/Landlord: ${app.owner_name} (${app.owner_email})

Include sections: 1) Parties, 2) Property Description, 3) Rent & Deposit, 4) Tenure (11 months), 5) Terms & Conditions, 6) Signatures. Keep it professional and concise (under 600 words).`;

  if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
    console.log('[Agreement] No Groq key — using template');
    return templateAgreement(app);
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model   : 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      },
      {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );
    return response.data.choices[0].message.content;
  } catch (err) {
    console.error('[Agreement] Groq API error:', err.response?.data?.error?.message || err.message);
    return templateAgreement(app);
  }
}

function templateAgreement(d) {
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const deposit = (Number(d.price) * 2).toLocaleString('en-IN');
  const rent    = Number(d.price).toLocaleString('en-IN');
  return `RENTAL AGREEMENT

Date: ${date}

═══════════════════════════════════
1. PARTIES
═══════════════════════════════════
Landlord / Owner : ${d.owner_name}  |  ${d.owner_email}
Tenant           : ${d.tenant_name} |  ${d.tenant_email}

═══════════════════════════════════
2. PROPERTY DESCRIPTION
═══════════════════════════════════
Property : ${d.property_title}
Location : ${d.city}
Type     : ${d.bhk ? d.bhk + ' BHK' : ''} ${d.type || 'Residential'}

═══════════════════════════════════
3. RENT & SECURITY DEPOSIT
═══════════════════════════════════
Monthly Rent       : ₹${rent}
Security Deposit   : ₹${deposit} (refundable on vacating)
Rent Due Date      : 5th of every calendar month
Payment Mode       : Bank Transfer / UPI

═══════════════════════════════════
4. TENURE
═══════════════════════════════════
Lease Duration     : 11 months from date of possession
Notice Period      : 30 days (either party)
Renewal            : By mutual written agreement

═══════════════════════════════════
5. TERMS & CONDITIONS
═══════════════════════════════════
a) Tenant shall maintain the property in good condition.
b) Sub-letting is strictly prohibited without owner's prior written consent.
c) All utility bills (electricity, water, internet) to be paid by tenant separately.
d) No structural changes / alterations without owner's written permission.
e) No commercial activities / pets without prior written consent.
f) Owner shall ensure all facilities mentioned at the time of agreement are functional.
g) Security deposit shall be returned within 15 days of vacating, subject to deductions for damages.

═══════════════════════════════════
6. SIGNATURES
═══════════════════════════════════
By signing below, both parties agree to the terms stated above.

___________________________          ___________________________
Owner / Landlord                     Tenant
${d.owner_name}                      ${d.tenant_name}
Date: _______________                Date: _______________
`;
}

// ─────────────────────────────────────────────
// POST /api/agreements
// ─────────────────────────────────────────────
const generateAgreement = async (req, res) => {
  try {
    const { application_id } = req.body;
    if (!application_id)
      return res.status(400).json({ success: false, message: 'application_id is required' });

    // Fetch accepted application with all related data
    const appResult = await query(
      `SELECT a.*, a.property_id,
              p.title AS property_title, p.city, p.price, p.bhk, p.type,
              p.owner_id,
              t.name  AS tenant_name,  t.email AS tenant_email,
              o.name  AS owner_name,   o.email AS owner_email
       FROM Applications a
       JOIN Properties p ON a.property_id = p.id
       JOIN Users      t ON a.tenant_id   = t.id
       JOIN Users      o ON p.owner_id    = o.id
       WHERE a.id = @id AND a.status = 'accepted'`,
      { id: { type: sql.VarChar(50), value: application_id } }
    );
    if (appResult.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Accepted application not found' });

    const app = appResult.recordset[0];

    // Only tenant, owner, or admin can generate
    const uid = req.user.id;
    if (uid !== app.tenant_id && uid !== app.owner_id && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Not authorized to generate this agreement' });

    // Return existing if already generated
    const existing = await query(
      'SELECT * FROM Agreements WHERE application_id = @id',
      { id: { type: sql.VarChar(50), value: application_id } }
    );
    if (existing.recordset.length > 0)
      return res.json({ success: true, message: 'Agreement already exists', data: existing.recordset[0] });

    const terms = await generateAgreementText(app);
    const id    = 'agr_' + uuidv4();

    await query(
      `INSERT INTO Agreements (id, application_id, terms) VALUES (@id, @application_id, @terms)`,
      {
        id            : { type: sql.VarChar(50),      value: id },
        application_id: { type: sql.VarChar(50),      value: application_id },
        terms         : { type: sql.NVarChar(sql.MAX), value: terms },
      }
    );

    res.status(201).json({ success: true, message: 'Agreement generated', data: { id, application_id, terms } });
  } catch (err) {
    console.error('[Agreement] generateAgreement:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// GET /api/agreements/:applicationId
// ─────────────────────────────────────────────
const getAgreement = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM Agreements WHERE application_id = @id',
      { id: { type: sql.VarChar(50), value: req.params.applicationId } }
    );
    if (result.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'No agreement found for this application' });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('[Agreement] getAgreement:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/agreements/:id/sign
// ─────────────────────────────────────────────
const signAgreement = async (req, res) => {
  try {
    const { id }  = req.params;
    const { role } = req.user;

    const agr = await query('SELECT id FROM Agreements WHERE id = @id', { id: { type: sql.VarChar(50), value: id } });
    if (agr.recordset.length === 0)
      return res.status(404).json({ success: false, message: 'Agreement not found' });

    if (role === 'tenant') {
      await query('UPDATE Agreements SET signed_tenant = 1 WHERE id = @id', { id: { type: sql.VarChar(50), value: id } });
    } else if (role === 'owner') {
      await query('UPDATE Agreements SET signed_owner = 1 WHERE id = @id', { id: { type: sql.VarChar(50), value: id } });
    } else {
      return res.status(403).json({ success: false, message: 'Only tenant or owner can sign' });
    }

    res.json({ success: true, message: 'Agreement signed successfully' });
  } catch (err) {
    console.error('[Agreement] signAgreement:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { generateAgreement, getAgreement, signAgreement };
