const API_BASE = process.env.VITE_API_BASE_URL || 'https://api.vathra.xyz';
// The API rejects non-browser requests unless they carry a Referer from the
// allowed frontend origin or a known client User-Agent. Server-side fetches
// from Vercel functions have neither by default, so send both explicitly.
const API_HEADERS = { Referer: 'https://vathra.xyz/', 'User-Agent': 'vathra-vercel/1.0' };

export default async function handler(req, res) {
  try {
    const apiRes = await fetch(`${API_BASE}/api/points`, { headers: API_HEADERS });
    if (!apiRes.ok) throw new Error(`API returned ${apiRes.status}`);
    const points = await apiRes.json();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const point of points) {
      xml += `  <url><loc>https://vathra.xyz/point/${point.gys_id}</loc><priority>0.5</priority></url>\n`;
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    return res.status(500).send('Failed to generate sitemap');
  }
}
