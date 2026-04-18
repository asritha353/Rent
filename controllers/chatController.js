// controllers/chatController.js — Smart property assistant (works with or without Groq key)
const axios        = require('axios');
const { sql, query } = require('../database/db');

// ── Smart built-in responses (no AI key needed) ───────────────────────────
async function smartReply(message) {
  const msg = message.toLowerCase();

  // Fetch live DB data
  let props = [];
  try {
    const r = await query(
      `SELECT TOP 8 title, city, price, bhk, type FROM Properties WHERE status='available' ORDER BY created_at DESC`, {}
    );
    props = r.recordset;
  } catch (_) {}

  // BHK + city search: "2bhk hyderabad", "3 bhk in chennai"
  const bhkMatch  = msg.match(/(\d+)\s*bhk/i);
  const cityMatch = msg.match(/hyderabad|bengaluru|bangalore|chennai|kochi|visakhapatnam|vizag|vijayawada|coimbatore|madurai|mysuru|thiruvananthapuram|kozhikode|thrissur|warangal|puducherry|mangaluru|hubli|tirupati/i);

  if (bhkMatch || cityMatch) {
    let filtered = props;
    if (bhkMatch) filtered = filtered.filter(p => p.bhk == parseInt(bhkMatch[1]));
    if (cityMatch) {
      const c = cityMatch[0].toLowerCase() === 'vizag' ? 'visakhapatnam' : cityMatch[0].toLowerCase() === 'bangalore' ? 'bengaluru' : cityMatch[0].toLowerCase();
      filtered = filtered.filter(p => p.city.toLowerCase() === c);
    }
    if (filtered.length > 0) {
      const list = filtered.slice(0, 4).map(p =>
        `🏠 **${p.title}** — ₹${Number(p.price).toLocaleString('en-IN')}/mo`
      ).join('\n');
      const cityName = cityMatch ? cityMatch[0] : 'your city';
      return `Here are ${bhkMatch ? bhkMatch[1] + ' BHK ' : ''}listings${cityMatch ? ' in ' + cityName : ''}:\n\n${list}\n\nUse the **Browse** page to filter by city, BHK, budget and more! 🔍`;
    }
    return `I didn't find ${bhkMatch ? bhkMatch[1] + ' BHK ' : ''}listings${cityMatch ? ' in ' + cityMatch[0] : ''} right now. Try browsing all properties or adjusting your city filter. 🔍`;
  }

  // Rent pricing queries
  if (msg.includes('rent') && (msg.includes('price') || msg.includes('cost') || msg.includes('rate') || msg.includes('how much'))) {
    return `📊 **Typical Rent Rates in South India (2024)**:\n\n• Hyderabad: 1BHK ₹9,000–15,000 | 2BHK ₹18,000–28,000\n• Bengaluru: 1BHK ₹12,000–20,000 | 2BHK ₹22,000–38,000\n• Chennai: 1BHK ₹10,000–18,000 | 2BHK ₹18,000–30,000\n• Kochi: 1BHK ₹8,000–14,000 | 2BHK ₹14,000–24,000\n• Visakhapatnam: 1BHK ₹7,000–12,000 | 2BHK ₹12,000–22,000\n\nSearch properties using the Browse page for live listings! 🏠`;
  }

  // How to apply
  if (msg.includes('apply') || msg.includes('application') || msg.includes('how to')) {
    return `📋 **How to Apply for a Property on RentLux**:\n\n1️⃣ **Browse** — Search and find a property you like\n2️⃣ **Sign Up** — Create a Tenant account (free)\n3️⃣ **Apply** — Click "Contact Owner" on the property page\n4️⃣ **Wait** — Owner reviews and accepts/rejects your application\n5️⃣ **Agreement** — Digital rental agreement is generated\n6️⃣ **Move In!** 🎉\n\nNeed help? Ask me anything!`;
  }

  // Owner/listing questions
  if (msg.includes('list') || msg.includes('owner') || msg.includes('post property') || msg.includes('add property')) {
    return `🏡 **Listing Your Property on RentLux**:\n\n1️⃣ Sign up as **Property Owner**\n2️⃣ Click **"+ List Property"** in the nav\n3️⃣ Fill in: Title, City, Price, BHK, Type, Description\n4️⃣ Your listing goes live immediately!\n\nYour listing will be visible to thousands of verified tenants across South India. 🌟`;
  }

  // Login/account questions
  if (msg.includes('login') || msg.includes('sign in') || msg.includes('account') || msg.includes('password')) {
    return `🔐 **RentLux Login**:\n\n• **Sign In / Sign Up** using the top-right button\n• Choose your role: **Tenant**, **Owner**, or use **Google Sign-In**\n\n**Demo accounts for testing:**\n• Tenant: tenant@demo.com / demo123\n• Owner: rajesh.owner@rentlux.com / Owner@123\n• Admin: admin@rentlux.com / Admin@123`;
  }

  // Cities/locations
  if (msg.includes('city') || msg.includes('cities') || msg.includes('location') || msg.includes('where')) {
    return `🗺️ **RentLux covers all major South India cities**:\n\n🔵 **Telangana**: Hyderabad, Warangal, Nizamabad\n🟢 **Karnataka**: Bengaluru, Mysuru, Hubli, Mangaluru\n🟡 **Tamil Nadu**: Chennai, Coimbatore, Madurai, Salem\n🔴 **Kerala**: Kochi, Thiruvananthapuram, Kozhikode, Thrissur\n🟠 **Andhra Pradesh**: Visakhapatnam, Vijayawada, Tirupati\n\nUse the **location filter** or Map view to explore! 🗺️`;
  }

  // Hi/hello
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('help')) {
    const total = props.length;
    return `Hi there! I'm **RentLux AI** 🤖\n\nI can help you:\n• 🔍 Find properties by city or BHK (e.g. "2BHK Hyderabad")\n• 💰 Know rent rates in South India\n• 📋 Understand how to apply for a property\n• 🏡 Guide you to list your property\n\nWe currently have **${total > 0 ? total + '+' : '58+'}** properties across South India. What can I help you with?`;
  }

  // Default
  const total = props.length;
  return `I'm here to help! 🏠 We have **${total > 0 ? total + '' : '58+'}** properties across South India.\n\nTry asking:\n• "2BHK for rent in Hyderabad"\n• "How to apply for a property?"\n• "What are rent rates in Chennai?"\n• "How to list my property?"`;
}

// ── Main chat handler ─────────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message || !message.trim())
      return res.status(400).json({ success: false, message: 'Message is required' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    // ── No Groq key: use smart built-in responses ────────────────────────
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here' || GROQ_API_KEY.trim() === '') {
      const reply = await smartReply(message);
      return res.json({ success: true, data: { reply } });
    }

    // ── Groq AI available: use LLM with property context ─────────────────
    let dbPropsText = '';
    try {
      const dbProps = await query(
        `SELECT TOP 10 title, city, price, bhk, type FROM Properties WHERE status = 'available' ORDER BY created_at DESC`, {}
      );
      if (dbProps.recordset.length > 0) {
        dbPropsText = 'Recent listings:\n' + dbProps.recordset
          .map(p => `• ${p.title} | ${p.city} | ₹${Number(p.price).toLocaleString('en-IN')} | ${p.bhk ? p.bhk + 'BHK ' : ''}${p.type}`)
          .join('\n');
      }
    } catch (_) {}

    const user = req.user || { name: 'Guest', role: 'guest' };
    const systemPrompt = `You are RentLux AI, a smart rental property assistant for South India.
User: ${user.name} (Role: ${user.role})

${dbPropsText}

You help users find properties, understand rentals, and navigate the platform.
South India cities covered: Hyderabad, Bengaluru, Chennai, Kochi, Visakhapatnam, Vijayawada, Coimbatore, Madurai, Mysuru, Thiruvananthapuram and more.
Use ₹ for Indian Rupee. Keep responses under 200 words. Be friendly and concise.`;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model      : 'llama3-8b-8192',
        messages   : [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: message },
        ],
        max_tokens : 300,
        temperature: 0.7,
      },
      {
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 15000,
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ success: true, data: { reply } });
  } catch (err) {
    console.error('[Chat] Error:', err.response?.data?.error?.message || err.message);
    // Fallback to smart reply on any error
    try {
      const reply = await smartReply(req.body.message || '');
      res.json({ success: true, data: { reply } });
    } catch (_) {
      res.json({ success: true, data: { reply: 'Hi! I can help you find properties across South India. Try asking "2BHK in Hyderabad" or "how to apply for a property?" 🏠' } });
    }
  }
};

module.exports = { chat };
