const express = require('express');
const rateLimit = require('express-rate-limit');
const QRCode = require('qrcode');
const { z } = require('zod');
const { state, persist, newSlug } = require('../store');

const router = express.Router();

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many links created, try again later' },
});

const createSchema = z.object({
  url: z
    .string()
    .min(4)
    .max(2000)
    .refine((u) => {
      try {
        const p = new URL(u);
        return p.protocol === 'http:' || p.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Must be a valid http(s) URL'),
  slug: z
    .string()
    .regex(/^[a-zA-Z0-9-_]{3,32}$/, 'Slug: 3-32 chars, letters, numbers, dash, underscore')
    .optional(),
});

function publicLink(req, link, { withStats = false } = {}) {
  const base = `${req.protocol}://${req.get('host')}`;
  const out = {
    slug: link.slug,
    longUrl: link.longUrl,
    shortUrl: `${base}/r/${link.slug}`,
    createdAt: link.createdAt,
    clicks: link.clicks.length,
  };
  if (withStats) {
    const byDay = {};
    for (const c of link.clicks) {
      const d = c.at.slice(0, 10);
      byDay[d] = (byDay[d] || 0) + 1;
    }
    const byReferrer = {};
    const byDevice = {};
    for (const c of link.clicks) {
      const r = c.referrer || 'direct';
      byReferrer[r] = (byReferrer[r] || 0) + 1;
      byDevice[c.device] = (byDevice[c.device] || 0) + 1;
    }
    out.stats = {
      byDay: Object.entries(byDay).map(([date, count]) => ({ date, count })),
      byReferrer: Object.entries(byReferrer).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      byDevice,
      recent: link.clicks.slice(-20).reverse(),
    };
  }
  return out;
}

// Create a short link.
router.post('/links', createLimiter, (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'validation_error',
      message: 'Invalid request body',
      fields: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const { url, slug } = parsed.data;

  // Do not shorten our own short URLs into loops.
  const host = req.get('host');
  try {
    if (new URL(url).host === host) {
      return res.status(400).json({ error: 'invalid_url', message: 'That URL already points here' });
    }
  } catch {
    return res.status(400).json({ error: 'invalid_url', message: 'Must be a valid http(s) URL' });
  }

  let finalSlug = slug;
  if (finalSlug) {
    if (state.links.some((l) => l.slug === finalSlug)) {
      return res.status(409).json({ error: 'conflict', message: 'That slug is taken' });
    }
  } else {
    do {
      finalSlug = newSlug();
    } while (state.links.some((l) => l.slug === finalSlug));
  }

  const link = { slug: finalSlug, longUrl: url, createdAt: new Date().toISOString(), clicks: [] };
  state.links.push(link);
  persist();
  res.status(201).json({ link: publicLink(req, link) });
});

// List links, most clicked first.
router.get('/links', (req, res) => {
  const links = [...state.links]
    .sort((a, b) => b.clicks.length - a.clicks.length)
    .map((l) => publicLink(req, l));
  res.json({ links });
});

// Stats for one link.
router.get('/links/:slug/stats', (req, res) => {
  const link = state.links.find((l) => l.slug === req.params.slug);
  if (!link) return res.status(404).json({ error: 'not_found', message: 'No such short link' });
  res.json({ link: publicLink(req, link, { withStats: true }) });
});

// QR code (PNG data URL) for the short URL.
router.get('/links/:slug/qr', async (req, res) => {
  const link = state.links.find((l) => l.slug === req.params.slug);
  if (!link) return res.status(404).json({ error: 'not_found', message: 'No such short link' });
  const shortUrl = `${req.protocol}://${req.get('host')}/r/${link.slug}`;
  const dataUrl = await QRCode.toDataURL(shortUrl, { margin: 1, width: 240 });
  res.json({ shortUrl, qr: dataUrl });
});

module.exports = router;
