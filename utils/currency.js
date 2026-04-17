// utils/currency.js — Indian currency formatting helper
// Usage: formatINR(7470000) → "₹74.70 L"

/**
 * Formats a number as Indian Rupee display value.
 * Crores (Cr), Lakhs (L), Thousands (K), exact rupees otherwise.
 *
 * @param {number|string} amount
 * @returns {string}
 */
function formatINR(amount) {
  const n = Number(amount);
  if (isNaN(n)) return '₹—';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  if (n >= 1_000)       return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

/**
 * Formats a rent amount (monthly) with /mo suffix.
 * @param {number} amount
 * @returns {string}
 */
function formatRent(amount) {
  return `${formatINR(amount)}/mo`;
}

/**
 * Parses a price display value back to a number (best-effort).
 * e.g. "₹74.70 L" → 7470000
 * @param {string} display
 * @returns {number}
 */
function parseINR(display) {
  if (!display) return 0;
  const clean = display.replace(/[₹,\s]/g, '').toUpperCase();
  if (clean.endsWith('CR'))  return parseFloat(clean) * 1_00_00_000;
  if (clean.endsWith('L'))   return parseFloat(clean) * 1_00_000;
  if (clean.endsWith('K'))   return parseFloat(clean) * 1_000;
  return parseFloat(clean) || 0;
}

module.exports = { formatINR, formatRent, parseINR };
