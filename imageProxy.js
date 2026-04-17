// routes/imageProxy.js
// Fetches images server-side to bypass CDN hotlink protection
const express = require('express');
const router  = express.Router();
const https   = require('https');
const http    = require('http');

// GET /api/img?url=<encoded_image_url>
router.get('/', (req, res) => {
  const imgUrl = req.query.url;
  if (!imgUrl) return res.status(400).send('Missing url parameter');

  let parsedUrl;
  try {
    parsedUrl = new URL(imgUrl);
  } catch(e) {
    return res.status(400).send('Invalid URL');
  }

  // Only allow housingcdn.com and similar real estate CDNs
  const allowed = ['housingcdn.com', 'housing.com', 'commonfloor.com', '99acres.com', 'magicbricks.com'];
  const isAllowed = allowed.some(domain => parsedUrl.hostname.includes(domain));
  if (!isAllowed) return res.status(403).send('Domain not allowed');

  const lib = parsedUrl.protocol === 'https:' ? https : http;

  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    headers: {
      // Pretend to be a regular browser - this bypasses hotlink protection
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://housing.com/',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
    },
    timeout: 8000,
  };

  const proxyReq = lib.request(options, (proxyRes) => {
    // Pass through content-type and cache headers
    const contentType = proxyRes.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // cache 24 hours
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(proxyRes.statusCode || 200);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    console.error('[ImageProxy] Error:', e.message, imgUrl.substring(0, 60));
    res.status(500).send('Image fetch failed');
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.status(504).send('Timeout');
  });

  proxyReq.end();
});

module.exports = router;
