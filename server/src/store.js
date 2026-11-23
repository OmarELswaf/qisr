// Tiny JSON data layer (same pattern as my nexus-admin project).
// 'file' mode persists locally; 'memory' mode reseeds per boot for the demo.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

function newSlug(len = 6) {
  const bytes = crypto.randomBytes(len);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic demo data: three links with realistic click history.
function freshState() {
  const rand = mulberry32(20261123);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const demo = [
    { slug: 'github', longUrl: 'https://github.com/OmarELswaf', days: 60, base: 9 },
    { slug: 'portfolio', longUrl: 'https://portfolio-olive-tau-95.vercel.app/', days: 45, base: 6 },
    { slug: 'nexus-demo', longUrl: 'https://nexus-admin-two-alpha.vercel.app', days: 20, base: 4 },
  ];
  const referrers = ['https://t.co/', 'https://www.linkedin.com/', 'https://wa.me/', '', 'https://github.com/'];
  const agents = ['mobile', 'desktop', 'desktop', 'mobile', 'desktop'];

  const links = demo.map(({ slug, longUrl, days, base }) => {
    const clicks = [];
    for (let d = days; d >= 0; d--) {
      const n = Math.floor(rand() * base) + (d % 7 === 0 ? Math.floor(rand() * 4) : 0);
      for (let i = 0; i < n; i++) {
        clicks.push({
          at: new Date(now - d * day - Math.floor(rand() * day)).toISOString(),
          referrer: referrers[Math.floor(rand() * referrers.length)],
          device: agents[Math.floor(rand() * agents.length)],
        });
      }
    }
    clicks.sort((a, b) => (a.at < b.at ? -1 : 1));
    return { slug, longUrl, createdAt: new Date(now - days * day).toISOString(), clicks };
  });

  return { links };
}

let state;
if (config.dataMode === 'file') {
  try {
    state = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch {
    state = freshState();
    persist();
  }
} else {
  state = freshState();
}

function persist() {
  if (config.dataMode !== 'file') return;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, DB_PATH);
}

module.exports = { state, persist, newSlug };
