// utils/dataStore.js
// Loads and caches the merged property dataset at startup

const fs = require('fs');
const path = require('path');
const { mergeAndClean } = require('./normalizer');

let _properties = null;

function loadData() {
  if (_properties) return _properties;

  const hydPath = path.join(__dirname, '../data/hyderabad.json');
  const vijPath = path.join(__dirname, '../data/vijayawada.json');

  let hydRaw = [], vijRaw = [];

  try {
    hydRaw = JSON.parse(fs.readFileSync(hydPath, 'utf-8'));
    console.log(`[DataStore] Loaded hyderabad.json: ${hydRaw.length} raw records`);
  } catch (e) {
    console.error('[DataStore] Failed to load hyderabad.json:', e.message);
  }

  try {
    vijRaw = JSON.parse(fs.readFileSync(vijPath, 'utf-8'));
    console.log(`[DataStore] Loaded vijayawada.json: ${vijRaw.length} raw records`);
  } catch (e) {
    console.error('[DataStore] Failed to load vijayawada.json:', e.message);
  }

  _properties = mergeAndClean(hydRaw, vijRaw);
  console.log(`[DataStore] Total clean properties ready: ${_properties.length}`);
  return _properties;
}

function getAll() {
  return loadData();
}

function getById(id) {
  return loadData().find(p => p.id === id) || null;
}

function getSimilar(id, limit = 6) {
  const all = loadData();
  const target = all.find(p => p.id === id);
  if (!target) return [];

  return all
    .filter(p => p.id !== id && p.city === target.city)
    .filter(p => {
      const priceDiff = Math.abs(p.price - target.price) / target.price;
      return priceDiff <= 0.4; // within 40% price range
    })
    .slice(0, limit);
}

module.exports = { getAll, getById, getSimilar, loadData };
