const API_BASE = process.env.VITE_API_BASE_URL || 'https://vathra-api.fly.dev';

const BOT_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Slackbot', 'Discordbot',
  'Googlebot', 'bingbot', 'Applebot', 'redditbot', 'vkShare',
  'Pinterestbot', 'Embedly',
];

const STATUS_LABELS = {
  OK: 'OK',
  DAMAGED: 'Damaged / Με φθορές',
  DESTROYED: 'Destroyed / Κατεστραμμένο',
  MISSING: 'Missing / Δεν Βρέθηκε',
  UNKNOWN: 'Unknown / Άγνωστο',
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  const gysId = req.query.id;
  if (!gysId) return res.status(400).send('Missing id');

  // Only serve dynamic OG for bots; everyone else gets the SPA
  const ua = req.headers['user-agent'] || '';
  const isBot = BOT_PATTERNS.some(p => ua.includes(p));
  if (!isBot) {
    // Regular browser — serve the SPA index.html directly
    const fs = require('fs');
    const path = require('path');
    try {
      const indexPath = path.join(process.cwd(), 'index.html');
      const html = fs.readFileSync(indexPath, 'utf-8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } catch {
      // Fallback: fetch from CDN avoiding the /point/ rewrite
      const host = req.headers.host || 'vathra.xyz';
      const proto = req.headers['x-forwarded-proto'] || 'https';
      try {
        const spaRes = await fetch(`${proto}://${host}/index.html`);
        const html = await spaRes.text();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
      } catch {
        return res.redirect(302, '/');
      }
    }
  }

  // Bot: fetch point data from API
  let point;
  try {
    const apiRes = await fetch(`${API_BASE}/api/points/${gysId}`);
    if (!apiRes.ok) throw new Error(`${apiRes.status}`);
    point = await apiRes.json();
  } catch {
    return res.status(404).send('Point not found');
  }

  const location = JSON.parse(point.location);
  const lat = location.coordinates[1].toFixed(5);
  const lon = location.coordinates[0].toFixed(5);
  const title = point.name
    ? `${point.name} (GYS ${point.gys_id}) — vathra.xyz`
    : `GYS ${point.gys_id} — vathra.xyz`;
  const status = STATUS_LABELS[point.status] || point.status;
  const description = [
    `Status: ${status}`,
    point.point_order && `Order: ${point.point_order}`,
    point.elevation && `Elevation: ${point.elevation.toFixed(0)}m`,
    `Coordinates: ${lat}, ${lon}`,
    point.map_sheet_name_gr && `Map: ${point.map_sheet_name_gr}`,
  ].filter(Boolean).join(' | ');

  const pageUrl = `https://vathra.xyz/point/${point.gys_id}`;
  const imageUrl = `https://vathra.xyz/api/og-image?id=${point.gys_id}`;

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: point.name || `GYS ${point.gys_id}`,
    description: description,
    url: pageUrl,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      ...(point.elevation && { elevation: point.elevation }),
    },
    isPartOf: {
      '@type': 'WebApplication',
      name: 'vathra.xyz',
      url: 'https://vathra.xyz',
    },
  });

  const html = `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="vathra.xyz">
  <meta property="og:locale" content="el_GR">
  <meta property="og:locale:alternate" content="en_US">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${imageUrl}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="alternate" hreflang="el" href="${pageUrl}">
  <link rel="alternate" hreflang="en" href="${pageUrl}">
  <link rel="alternate" hreflang="x-default" href="${pageUrl}">
  <script type="application/ld+json">${jsonLd}</script>
</head>
<body>
  <p><a href="${pageUrl}">${escapeHtml(title)}</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.status(200).send(html);
}
