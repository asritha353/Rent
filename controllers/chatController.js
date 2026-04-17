// controllers/chatController.js — Groq-powered property assistant
const axios          = require('axios');
const { getAll }     = require('../utils/dataStore');
const { sql, query } = require('../database/db');

const chat = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ success: false, message: 'Message is required' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      return res.json({
        success: true,
        data: { reply: '🔑 AI chatbot is not configured yet. Please add your GROQ_API_KEY to the .env file and restart the server. Get a free key at https://console.groq.com' },
      });
    }

    // Gather real-time property context (sample)
    const jsonProps = getAll()
      .slice(0, 8)
      .map(p => `• ${p.title} | ${p.city} | ₹${p.price} | ${p.bhk ? p.bhk + 'BHK ' : ''}${p.type}`)
      .join('\n');

    let dbPropsText = '';
    try {
      const dbProps = await query(
        `SELECT TOP 6 title, city, price, bhk, type, status FROM Properties WHERE status = 'available'`,
        {}
      );
      if (dbProps.recordset.length > 0) {
        dbPropsText = '\nOwner-listed Properties:\n' + dbProps.recordset
          .map(p => `• ${p.title} | ${p.city} | ₹${p.price} | ${p.bhk ? p.bhk + 'BHK ' : ''}${p.type}`)
          .join('\n');
      }
    } catch { /* DB may not be ready */ }

    const systemPrompt = `You are RentLux AI, a smart rental property assistant integrated in the RentLux property management platform.

User: ${req.user.name} (Role: ${req.user.role})
Current Page: ${context || 'Dashboard'}

Platform Overview:
- Tenants can search properties, submit applications, and view rental agreements
- Owners can list properties, review applications, and accept/reject tenants
- Admins can monitor the entire platform

Available Properties (sample):
${jsonProps}${dbPropsText}

Workflow: Tenant applies → Owner reviews → Owner accepts/rejects → If accepted, rental agreement is generated → Both parties sign

You help users:
1. Find properties by city, BHK, price range, or type
2. Understand the rental application process
3. Explain rental agreement terms
4. Guide owners on listing and managing properties
5. Answer general rental / real-estate FAQs specific to India

Respond in a friendly, concise manner. If asked for specific data (like a specific application status), guide the user to the appropriate dashboard section rather than making up data. Use ₹ for Indian Rupee. Keep responses under 250 words.`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model      : 'llama3-8b-8192',
        messages   : [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: message },
        ],
        max_tokens : 400,
        temperature: 0.7,
      },
      {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 20000,
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('[Chat]', err.response?.data?.error?.message || err.message);
    res.status(500).json({ success: false, message: 'AI service unavailable. Please try again later.' });
  }
};

module.exports = { chat };
