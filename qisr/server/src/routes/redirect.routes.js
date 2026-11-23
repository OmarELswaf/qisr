const express = require('express');
const { state, persist } = require('../store');

const router = express.Router();

// GET /r/:slug — the actual redirect, with click tracking.
router.get('/:slug', (req, res) => {
  const link = state.links.find((l) => l.slug === req.params.slug);
  if (!link) return res.status(404).json({ error: 'not_found', message: 'No such short link' });

  const ua = String(req.headers['user-agent'] || '').toLowerCase();
  const device = /mobile|android|iphone|ipad/.test(ua) ? 'mobile' : 'desktop';
  link.clicks.push({
    at: new Date().toISOString(),
    referrer: req.get('referer') || '',
    device,
  });
  persist();

  res.redirect(302, link.longUrl);
});

module.exports = router;
