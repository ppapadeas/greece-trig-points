#!/usr/bin/env node
/**
 * Smoke test suite for vathra.xyz — run after deployment to verify all key
 * endpoints and features are working on the live site.
 *
 * Usage:
 *   node scripts/smoke-test.mjs
 *   node scripts/smoke-test.mjs --base https://staging.vathra.xyz
 *
 * Exit code 0 = all passed, 1 = one or more failures.
 */

const BASE = process.argv.find(a => a.startsWith('--base='))?.split('=')[1]
  ?? 'https://vathra.xyz';
const API = 'https://vathra-api.fly.dev';

let passed = 0;
let failed = 0;

async function check(label, fn) {
  try {
    await fn();
    console.log(`  ✅  ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ❌  ${label}`);
    console.error(`       ${err.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

async function get(url, headers = {}) {
  const res = await fetch(url, { headers });
  return res;
}

async function getJson(url) {
  const res = await get(url, { Accept: 'application/json' });
  assert(res.ok, `HTTP ${res.status} from ${url}`);
  return res.json();
}

console.log(`\n🔍  Smoke testing ${BASE}\n`);

// ── Frontend (Vercel) ──────────────────────────────────────────────────────

console.log('Frontend:');

await check('GET / returns 200 with HTML', async () => {
  const res = await get(BASE + '/');
  assert(res.ok, `HTTP ${res.status}`);
  const text = await res.text();
  assert(text.includes('<div id="root">'), 'Missing React root div');
});

await check('GET /about returns 200 (SPA rewrite)', async () => {
  const res = await get(BASE + '/about');
  assert(res.ok, `HTTP ${res.status}`);
});

await check('GET /stats returns 200 (SPA rewrite)', async () => {
  const res = await get(BASE + '/stats');
  assert(res.ok, `HTTP ${res.status}`);
});

await check('GET /robots.txt returns 200', async () => {
  const res = await get(BASE + '/robots.txt');
  assert(res.ok, `HTTP ${res.status}`);
  const text = await res.text();
  assert(text.includes('Sitemap:'), 'robots.txt missing Sitemap directive');
  assert(text.includes('Disallow: /admin'), 'robots.txt missing /admin disallow');
});

await check('GET /sitemap.xml returns 200 with sitemap index', async () => {
  const res = await get(BASE + '/sitemap.xml');
  assert(res.ok, `HTTP ${res.status}`);
  const text = await res.text();
  assert(text.includes('<sitemapindex'), 'Not a sitemap index');
});

await check('GET /sitemap-points.xml returns 200 with point URLs', async () => {
  const res = await get(BASE + '/sitemap-points.xml');
  assert(res.ok, `HTTP ${res.status}`);
  const text = await res.text();
  assert(text.includes('<urlset'), 'Not a valid urlset');
  assert(text.includes('vathra.xyz/point/'), 'No point URLs in sitemap');
});

// ── Static asset serving — CRITICAL: catch vercel.json routing regressions ─

console.log('\nStatic assets (vercel.json routing):');

await check('JS bundle served with correct MIME type (not text/html)', async () => {
  const html = await (await get(BASE + '/')).text();
  const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
  assert(match, 'Could not find main JS bundle URL in index.html');
  const res = await get(BASE + match[1]);
  assert(res.ok, `HTTP ${res.status} for ${match[1]}`);
  const ct = res.headers.get('content-type') || '';
  assert(ct.includes('javascript') || ct.includes('text/plain'),
    `JS bundle returned wrong MIME type: ${ct} — vercel.json catch-all may be intercepting /assets/`);
});

await check('CSS bundle served with correct MIME type (not text/html)', async () => {
  const html = await (await get(BASE + '/')).text();
  const match = html.match(/href="(\/assets\/index-[^"]+\.css)"/);
  assert(match, 'Could not find main CSS bundle URL in index.html');
  const res = await get(BASE + match[1]);
  assert(res.ok, `HTTP ${res.status} for ${match[1]}`);
  const ct = res.headers.get('content-type') || '';
  assert(ct.includes('css') || ct.includes('text/plain'),
    `CSS bundle returned wrong MIME type: ${ct} — vercel.json catch-all may be intercepting /assets/`);
});

await check('/api/* not intercepted by SPA rewrite', async () => {
  // /api/og with no id should return 400 (not index.html)
  const res = await get(BASE + '/api/og', { 'User-Agent': 'Twitterbot/1.0' });
  const ct = res.headers.get('content-type') || '';
  assert(!ct.includes('text/html') || res.status === 400,
    `SPA catch-all is intercepting /api/ requests — got ${res.status} ${ct}`);
});

// ── OG tag bot detection — fetch a real GYS ID first ─────────────────────

// Fetch a real GYS ID to use in OG tests (og.js uses GYS ID, not numeric ID)
let ogGysId = '149074'; // fallback
try {
  const pts = await (await fetch(API + '/api/points')).json();
  if (pts[0]?.gys_id) ogGysId = pts[0].gys_id;
} catch {}

console.log('\nOG / Middleware:');

await check(`Bot UA on /point/${ogGysId} gets OG HTML (not SPA shell)`, async () => {
  const res = await get(BASE + `/point/${ogGysId}`, {
    'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  });
  assert(res.ok, `HTTP ${res.status}`);
  const text = await res.text();
  assert(text.includes('og:title'), 'Missing og:title meta tag');
  assert(text.includes('og:description'), 'Missing og:description meta tag');
  assert(text.includes('og:image'), 'Missing og:image meta tag');
});

await check(`Browser UA on /point/${ogGysId} gets SPA index.html`, async () => {
  const res = await get(BASE + `/point/${ogGysId}`, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  });
  assert(res.ok, `HTTP ${res.status}`);
  const text = await res.text();
  assert(text.includes('<div id="root">'), 'Browser did not receive SPA shell');
});

await check(`GET /api/og?id=${ogGysId} returns OG HTML (bot UA)`, async () => {
  const res = await get(BASE + `/api/og?id=${ogGysId}`, {
    'User-Agent': 'Twitterbot/1.0',
  });
  assert(res.ok, `HTTP ${res.status}`);
  const text = await res.text();
  assert(text.includes('og:title'), 'Missing og:title');
});

// ── Backend API ────────────────────────────────────────────────────────────

console.log('\nBackend API:');

await check('GET /api/points returns array of points', async () => {
  const data = await getJson(API + '/api/points');
  assert(Array.isArray(data), 'Expected array');
  assert(data.length > 0, 'No points returned');
  const p = data[0];
  assert('gys_id' in p, 'Missing gys_id');
  assert('status' in p, 'Missing status');
  assert('lat' in p && 'lon' in p, 'Missing lat/lon');
});

let sampleGysId;
let sampleNumericId;
await check('GET /api/points (pick sample point for further tests)', async () => {
  const data = await getJson(API + '/api/points');
  sampleGysId = data[0].gys_id;
  sampleNumericId = data[0].id;
  assert(sampleGysId, 'Could not determine sample gys_id');
});

await check('GET /api/points/:gysId returns point detail', async () => {
  const data = await getJson(API + `/api/points/${sampleGysId}`);
  assert(data.gys_id === sampleGysId, 'gys_id mismatch');
  assert('location' in data, 'Missing location field');
  assert('elevation' in data, 'Missing elevation field');
});

await check('GET /api/points/:id/reports returns array with image_urls', async () => {
  // Find a point that has at least one report so we can check the schema
  const pts = await getJson(API + '/api/points');
  let reports = [];
  for (const pt of pts.slice(0, 20)) {
    const r = await getJson(API + `/api/points/${pt.id}/reports`);
    if (r.length > 0) { reports = r; break; }
  }
  assert(Array.isArray(reports), 'Expected array');
  if (reports.length > 0) {
    assert('image_urls' in reports[0], 'Report missing image_urls field — DB migration may not have run yet');
  }
});

await check('GET /api/points/search?q=test returns array', async () => {
  const data = await getJson(API + '/api/points/search?q=test');
  assert(Array.isArray(data), 'Expected array');
});

await check('GET /api/stats returns stats object', async () => {
  const data = await getJson(API + '/api/stats');
  assert(typeof data === 'object', 'Expected object');
  assert('totalPoints' in data, 'Missing totalPoints');
});

await check('GET /api/points/nearest?lat=38&lon=23 returns a point', async () => {
  const data = await getJson(API + '/api/points/nearest?lat=38&lon=23');
  assert('gys_id' in data, 'Missing gys_id in nearest response');
});

await check('PUT /api/points/:id/reports/:reportId requires auth (returns 401)', async () => {
  const res = await fetch(API + '/api/points/1/reports/1', { method: 'PUT' });
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

await check('DELETE /api/points/:id/reports/:reportId requires auth (returns 401)', async () => {
  const res = await fetch(API + '/api/points/1/reports/1', { method: 'DELETE' });
  assert(res.status === 401, `Expected 401, got ${res.status}`);
});

// ── Security headers ───────────────────────────────────────────────────────

console.log('\nSecurity headers:');

await check('X-Frame-Options header present', async () => {
  const res = await get(BASE + '/');
  const h = res.headers.get('x-frame-options') || res.headers.get('X-Frame-Options');
  assert(h, 'Missing X-Frame-Options header');
});

await check('X-Content-Type-Options: nosniff present', async () => {
  const res = await get(BASE + '/');
  const h = res.headers.get('x-content-type-options') || '';
  assert(h.includes('nosniff'), `Expected nosniff, got: ${h}`);
});

// ── Summary ────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passed}/${total} passed`);
if (failed > 0) {
  console.log(`\n⚠️  ${failed} test(s) failed — check output above.\n`);
  process.exit(1);
} else {
  console.log('\n🎉  All smoke tests passed!\n');
  process.exit(0);
}
