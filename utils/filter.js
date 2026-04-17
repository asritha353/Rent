// utils/filter.js
// All filtering, searching, and pagination logic

function applyFilters(properties, query) {
  let results = [...properties];

  // ── City filter (strict, case-insensitive)
  if (query.city) {
    const city = query.city.trim().toLowerCase();
    results = results.filter(p => p.city.toLowerCase() === city);
    console.log(`[Filter] After city="${query.city}": ${results.length}`);
  }

  // ── BHK filter
  if (query.bhk !== undefined && query.bhk !== '') {
    const bhk = parseInt(query.bhk);
    if (!isNaN(bhk)) {
      results = results.filter(p => p.bhk === bhk);
      console.log(`[Filter] After bhk=${bhk}: ${results.length}`);
    }
  }

  // ── Price range filter
  if (query.minPrice !== undefined && query.minPrice !== '') {
    const min = parseFloat(query.minPrice);
    if (!isNaN(min)) {
      results = results.filter(p => p.price >= min);
    }
  }
  if (query.maxPrice !== undefined && query.maxPrice !== '') {
    const max = parseFloat(query.maxPrice);
    if (!isNaN(max)) {
      results = results.filter(p => p.price <= max);
    }
  }

  // ── Text search (title, location, type, description)
  if (query.search) {
    const terms = query.search.toLowerCase().trim().split(/\s+/);

    // Parse BHK from search string (e.g. "2 BHK")
    let searchBhk = null;
    const bhkMatch = query.search.match(/(\d+)\s*bhk/i);
    if (bhkMatch) searchBhk = parseInt(bhkMatch[1]);

    // Parse city from search string
    let searchCity = null;
    if (/hyderabad/i.test(query.search)) searchCity = 'hyderabad';
    if (/vijayawada/i.test(query.search)) searchCity = 'vijayawada';

    // Apply smart search filters derived from text
    if (searchCity) {
      results = results.filter(p => p.city.toLowerCase() === searchCity);
      console.log(`[Filter] Search extracted city="${searchCity}": ${results.length}`);
    }
    if (searchBhk) {
      results = results.filter(p => p.bhk === searchBhk);
      console.log(`[Filter] Search extracted bhk=${searchBhk}: ${results.length}`);
    }

    // Remove city/bhk terms and do remaining keyword search on text fields
    const remainingTerms = terms.filter(t =>
      !/hyderabad|vijayawada|\d+bhk|bhk|\d+/i.test(t) && t.length > 2
    );

    if (remainingTerms.length > 0) {
      results = results.filter(p => {
        const haystack = `${p.title} ${p.location} ${p.type} ${p.description}`.toLowerCase();
        return remainingTerms.every(term => haystack.includes(term));
      });
    }

    console.log(`[Filter] After search="${query.search}": ${results.length}`);
  }

  // ── Property type filter
  if (query.type) {
    results = results.filter(p => p.type.toLowerCase() === query.type.toLowerCase());
  }

  return results;
}

function paginate(arr, page = 1, limit = 12) {
  const p = Math.max(1, parseInt(page));
  const l = Math.min(50, Math.max(1, parseInt(limit)));
  const start = (p - 1) * l;
  const end = start + l;
  return {
    data: arr.slice(start, end),
    total: arr.length,
    page: p,
    limit: l,
    totalPages: Math.ceil(arr.length / l),
  };
}

module.exports = { applyFilters, paginate };
