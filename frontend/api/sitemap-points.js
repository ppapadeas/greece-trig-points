const API_BASE = process.env.VITE_API_BASE_URL || 'https://vathra-api.fly.dev';

export default async function handler(req, res) {
  try {
    const apiRes = await fetch(`${API_BASE}/api/points`);
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
