import { ImageResponse } from '@vercel/og';

const API_BASE = process.env.VITE_API_BASE_URL || 'https://vathra-api.fly.dev';

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const STATUS_LABELS = {
  OK: 'OK',
  DAMAGED: 'Damaged',
  DESTROYED: 'Destroyed',
  MISSING: 'Missing',
  UNKNOWN: 'Unknown',
};

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const gysId = searchParams.get('id');

  if (!gysId) {
    return new Response('Missing id', { status: 400 });
  }

  let point;
  try {
    const apiRes = await fetch(`${API_BASE}/api/points/${gysId}`);
    if (!apiRes.ok) throw new Error(`${apiRes.status}`);
    point = await apiRes.json();
  } catch {
    return new Response('Point not found', { status: 404 });
  }

  const location = JSON.parse(point.location);
  const lat = location.coordinates[1].toFixed(5);
  const lon = location.coordinates[0].toFixed(5);
  const name = point.name || `GYS ${point.gys_id}`;
  const statusColor = STATUS_COLORS[point.status] || '#17a2b8';
  const statusLabel = STATUS_LABELS[point.status] || point.status;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #01579b 100%)',
          padding: '60px',
          fontFamily: 'sans-serif',
          color: '#fff',
        }}
      >
        {/* Top: branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '28px', opacity: 0.8 }}>vathra.xyz</div>
        </div>

        {/* Middle: point info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '52px', fontWeight: 'bold', lineHeight: 1.1 }}>
            {name}
          </div>
          <div style={{ fontSize: '28px', opacity: 0.7 }}>
            GYS {point.gys_id}
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
            <div
              style={{
                background: statusColor,
                color: point.status === 'DAMAGED' ? '#000' : '#fff',
                padding: '8px 20px',
                borderRadius: '8px',
                fontSize: '24px',
                fontWeight: 'bold',
              }}
            >
              {statusLabel}
            </div>
            {point.point_order && (
              <div style={{ fontSize: '24px', opacity: 0.8 }}>
                Order {point.point_order}
              </div>
            )}
            {point.elevation && (
              <div style={{ fontSize: '24px', opacity: 0.8 }}>
                {point.elevation.toFixed(0)}m
              </div>
            )}
          </div>
        </div>

        {/* Bottom: coordinates + prefecture */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '22px', opacity: 0.6 }}>
            {lat}, {lon}
          </div>
          {point.prefecture && (
            <div style={{ fontSize: '22px', opacity: 0.6 }}>
              {point.prefecture}
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    }
  );
}
