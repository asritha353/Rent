// utils/normalizer.js
// Cleans and normalizes raw Apify property data into a consistent format

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80';

/**
 * Converts a raw numeric price (in ₹) to a human-readable Indian format.
 * ≥ 1 Crore  → "₹X.XX Cr"
 * < 1 Crore  → "₹X.XX L"
 */
function formatIndianPrice(amount) {
  const n = Number(amount);
  if (!n || isNaN(n)) return '₹Price on Request';
  const CRORE = 1_00_00_000;
  const LAKH  = 1_00_000;
  if (n >= CRORE) {
    return `₹${(n / CRORE).toFixed(2)} Cr`;
  }
  return `₹${(n / LAKH).toFixed(2)} L`;
}

function urlToLocalPath(url) {
  if (!url) return null;
  try {
    const parts = url.split('/');
    const hash = parts.slice(3, 5).join('_');
    const ext  = url.split('?')[0].match(/\.(jpg|jpeg|png|webp|gif)$/i)?.[0] || '.jpg';
    return hash + ext;
  } catch(e) { return null; }
}

function extractImages(raw) {
  const imgs = [];

  // Try image_url first
  if (raw.image_url && typeof raw.image_url === 'string' && raw.image_url.startsWith('http')) {
    imgs.push(raw.image_url);
  }

  // Try details.images array
  if (raw.details && Array.isArray(raw.details.images)) {
    raw.details.images.forEach(group => {
      if (group.images && Array.isArray(group.images)) {
        group.images.forEach(img => {
          if (img.src && img.src.startsWith('http') && !imgs.includes(img.src)) {
            imgs.push(img.src);
          }
        });
      }
    });
  }

  return imgs;
}

function extractBHK(raw) {
  // Try property_information.bedrooms
  const pi = raw.property_information;
  if (pi && pi.bedrooms) return parseInt(pi.bedrooms);

  // Try features array for configuration
  if (Array.isArray(raw.features)) {
    const cfg = raw.features.find(f => f.id === 'configs');
    if (cfg && cfg.description) {
      const match = cfg.description.match(/(\d+)\s*BHK/i);
      if (match) return parseInt(match[1]);
    }
  }

  // Try name
  if (raw.name) {
    const match = raw.name.match(/(\d+)\s*BHK/i);
    if (match) return parseInt(match[1]);
  }

  return null;
}

function extractType(raw) {
  if (Array.isArray(raw.features)) {
    const cfg = raw.features.find(f => f.id === 'configs');
    if (cfg && cfg.description) {
      if (/villa/i.test(cfg.description)) return 'Villa';
      if (/apartment|flat/i.test(cfg.description)) return 'Apartment';
      if (/plot|land/i.test(cfg.description)) return 'Plot';
      if (/house/i.test(cfg.description)) return 'House';
    }
  }
  if (raw.name) {
    if (/villa/i.test(raw.name)) return 'Villa';
    if (/plot|land/i.test(raw.name)) return 'Plot';
  }
  return 'Apartment';
}

function extractCity(raw) {
  const addr = raw.address;
  if (!addr) return 'Unknown';
  const addrStr = addr.address || addr.long_address || '';
  if (/vijayawada/i.test(addrStr)) return 'Vijayawada';
  if (/hyderabad|secunderabad|telangana/i.test(addrStr)) return 'Hyderabad';
  // fallback from detailed_property_address
  if (Array.isArray(addr.detailed_property_address)) {
    const vals = addr.detailed_property_address.map(a => a.val || '').join(' ');
    if (/vijayawada/i.test(vals)) return 'Vijayawada';
    if (/hyderabad/i.test(vals)) return 'Hyderabad';
  }
  return 'Unknown';
}

function extractLocation(raw) {
  const addr = raw.address;
  if (!addr) return 'Location not specified';
  if (addr.address) return addr.address;
  if (Array.isArray(addr.detailed_property_address) && addr.detailed_property_address.length > 0) {
    return addr.detailed_property_address[0].val || 'Location not specified';
  }
  return 'Location not specified';
}

function extractDescription(raw) {
  if (raw.description && typeof raw.description === 'string') {
    // Strip HTML tags
    const stripped = raw.description.replace(/<[^>]+>/g, '').trim();
    if (stripped.length > 10) return stripped;
  }
  // Fallback: build from features
  if (Array.isArray(raw.features)) {
    return raw.features.map(f => `${f.label}: ${f.description}`).join(' | ');
  }
  return 'Premium property available for sale. Contact us for more details.';
}

function normalizeProperty(raw, cityOverride) {
  // Price must exist
  const price = raw.min_price || raw.max_price;
  if (!price || isNaN(Number(price))) return null;

  const images = extractImages(raw);
  const image = images.length > 0 ? images[0] : PLACEHOLDER_IMAGE;

  const bhk = extractBHK(raw);
  const city = cityOverride || extractCity(raw);

  const localImg = image ? urlToLocalPath(image) : null;

  return {
    id: String(raw.id || raw.url || Math.random().toString(36).slice(2)),
    title: raw.name || 'Premium Property',
    price: Number(price),
    priceDisplay: raw.price_display_value || formatIndianPrice(price),
    city,
    location: extractLocation(raw),
    bhk,
    type: extractType(raw),
    image,
    localImage: localImg, // filename in data/images/ after running downloadImages.js
    images,
    description: extractDescription(raw),
    area: raw.property_information?.area || null,
    bedrooms: raw.property_information?.bedrooms || bhk || null,
    bathrooms: raw.property_information?.bathrooms || null,
    possessionStatus: raw.current_possession_status || null,
    postedDate: raw.posted_date || null,
    sourceUrl: raw.url || null,
  };
}

function mergeAndClean(hydArr, vijArr) {
  console.log(`[Normalizer] Hyderabad raw: ${hydArr.length}, Vijayawada raw: ${vijArr.length}`);

  const hydNorm = hydArr.map(p => normalizeProperty(p, 'Hyderabad')).filter(Boolean);
  const vijNorm = vijArr.map(p => normalizeProperty(p, 'Vijayawada')).filter(Boolean);

  // Deduplicate by id
  const seen = new Set();
  const merged = [...hydNorm, ...vijNorm].filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  console.log(`[Normalizer] After cleaning — Hyderabad: ${hydNorm.length}, Vijayawada: ${vijNorm.length}, Total: ${merged.length}`);
  return merged;
}

module.exports = { mergeAndClean, normalizeProperty };
