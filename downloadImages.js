// downloadImages.js
// Run this ONCE: node downloadImages.js
// It downloads all property images to data/images/ folder
// Then serves them from localhost - no CDN blocking ever

const https = require('https');
const http  = require('http');
const fs    = require('fs');
const path  = require('path');

const IMAGES_DIR = path.join(__dirname, 'data', 'images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const hyd = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/hyderabad.json')));
const vij = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/vijayawada.json')));

// Collect all unique image URLs
const allProps = [...hyd, ...vij];
const urlMap = {}; // url -> filename
allProps.forEach(p => {
  if (p.image_url && p.image_url.startsWith('http')) {
    const hash = p.image_url.split('/').slice(3,5).join('_');
    const ext  = path.extname(p.image_url.split('?')[0]) || '.jpg';
    urlMap[p.image_url] = hash + ext;
  }
});

const urls   = Object.keys(urlMap);
const total  = urls.length;
let done = 0, failed = 0;

console.log(`\nDownloading ${total} images to data/images/...\n`);

function downloadOne(url, filename, cb) {
  const dest = path.join(IMAGES_DIR, filename);
  if (fs.existsSync(dest)) { cb(null); return; } // already downloaded

  const file = fs.createWriteStream(dest);
  const lib  = url.startsWith('https') ? https : http;

  const req = lib.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
      'Referer': 'https://housing.com/',
      'Accept': 'image/*',
    },
    timeout: 10000,
  }, (res) => {
    if (res.statusCode !== 200) {
      file.close(); fs.unlinkSync(dest);
      cb(new Error('Status ' + res.statusCode));
      return;
    }
    res.pipe(file);
    file.on('finish', () => { file.close(); cb(null); });
  });
  req.on('error', e => { try { fs.unlinkSync(dest); } catch(x){} cb(e); });
  req.on('timeout', () => { req.destroy(); cb(new Error('timeout')); });
}

// Download 5 at a time
let i = 0;
function next() {
  if (i >= urls.length) {
    console.log(`\n✅ Done! Downloaded: ${done}, Failed: ${failed}`);
    console.log(`Images saved to: data/images/`);
    console.log(`Now restart your server: node server.js`);
    return;
  }
  const url      = urls[i];
  const filename = urlMap[url];
  i++;
  downloadOne(url, filename, (err) => {
    if (err) { failed++; process.stdout.write('✗'); }
    else     { done++;   process.stdout.write('.'); }
    if ((done + failed) % 50 === 0) process.stdout.write(` ${done+failed}/${total}\n`);
    next();
  });
}

// Run 5 parallel downloads
for (let j = 0; j < 5; j++) next();
