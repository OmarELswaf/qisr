// Integration tests: link creation, validation, redirect + click tracking, stats.
process.env.DATA_MODE = 'memory';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

let server;
let base;

before(async () => {
  await new Promise((resolve) => {
    server = createApp().listen(0, () => resolve());
  });
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

async function api(path, { method = 'GET', body, redirect = 'manual' } = {}) {
  const res = await fetch(base + path, {
    method,
    redirect,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* redirect responses have no JSON body */
  }
  return { status: res.status, body: json, location: res.headers.get('location') };
}

test('health endpoint responds', async () => {
  const { status, body } = await api('/api/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
});

test('creates a link with a generated slug', async () => {
  const { status, body } = await api('/api/links', {
    method: 'POST',
    body: { url: 'https://example.com/some/long/article?a=1' },
  });
  assert.equal(status, 201);
  assert.match(body.link.slug, /^[a-zA-Z0-9]{6}$/);
  assert.equal(body.link.longUrl, 'https://example.com/some/long/article?a=1');
  assert.ok(body.link.shortUrl.includes('/r/'));
});

test('creates a link with a custom slug and rejects duplicates', async () => {
  const first = await api('/api/links', {
    method: 'POST',
    body: { url: 'https://example.com/a', slug: 'my-link' },
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.link.slug, 'my-link');

  const dup = await api('/api/links', {
    method: 'POST',
    body: { url: 'https://example.com/b', slug: 'my-link' },
  });
  assert.equal(dup.status, 409);
});

test('rejects invalid URLs and bad slugs', async () => {
  const bad1 = await api('/api/links', { method: 'POST', body: { url: 'not-a-url' } });
  assert.equal(bad1.status, 400);
  const bad2 = await api('/api/links', { method: 'POST', body: { url: 'ftp://example.com' } });
  assert.equal(bad2.status, 400);
  const bad3 = await api('/api/links', { method: 'POST', body: { url: 'https://example.com', slug: 'x' } });
  assert.equal(bad3.status, 400);
});

test('refuses to shorten its own host', async () => {
  const { status } = await api('/api/links', {
    method: 'POST',
    body: { url: `${base}/r/github` },
  });
  assert.equal(status, 400);
});

test('redirect records a click and stats reflect it', async () => {
  const before = await api('/api/links/github/stats');
  assert.equal(before.status, 200);
  const countBefore = before.body.link.clicks;

  const red = await api('/r/github');
  assert.equal(red.status, 302);
  assert.equal(red.location, 'https://github.com/OmarELswaf');

  const afterStats = await api('/api/links/github/stats');
  assert.equal(afterStats.body.link.clicks, countBefore + 1);
  assert.ok(afterStats.body.link.stats.byDay.length > 0);
  assert.ok(afterStats.body.link.stats.byReferrer.length > 0);
});

test('unknown slug 404s on redirect and stats', async () => {
  const red = await api('/r/does-not-exist');
  assert.equal(red.status, 404);
  const stats = await api('/api/links/does-not-exist/stats');
  assert.equal(stats.status, 404);
});

test('QR endpoint returns a PNG data URL', async () => {
  const { status, body } = await api('/api/links/github/qr');
  assert.equal(status, 200);
  assert.ok(body.qr.startsWith('data:image/png;base64,'));
});

test('list returns links sorted by clicks', async () => {
  const { status, body } = await api('/api/links');
  assert.equal(status, 200);
  assert.ok(body.links.length >= 3);
  for (let i = 1; i < body.links.length; i++) {
    assert.ok(body.links[i - 1].clicks >= body.links[i].clicks);
  }
});
