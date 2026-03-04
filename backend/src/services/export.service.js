const pool = require('./database.service');

const EXPORT_COLUMNS = `
  gys_id, name, description, status, point_order, elevation,
  ST_Y(location::geometry) as latitude,
  ST_X(location::geometry) as longitude,
  egsa87_x, egsa87_y, egsa87_z,
  prefecture, year_established,
  map_sheet_id, map_sheet_name_gr, map_sheet_name_en
`;

const getAllPointsForExport = async () => {
  const query = `SELECT ${EXPORT_COLUMNS} FROM points ORDER BY gys_id`;
  const result = await pool.query(query);
  return result.rows;
};

const toCSV = (rows) => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','));
  }
  return lines.join('\n');
};

const toKML = (rows) => {
  const escapeXml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const placemarks = rows
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => {
      const desc = [
        r.status && `Status: ${r.status}`,
        r.point_order && `Order: ${r.point_order}`,
        r.elevation && `Elevation: ${r.elevation}m`,
        r.prefecture && `Prefecture: ${r.prefecture}`,
        r.year_established && `Year: ${r.year_established}`,
        r.map_sheet_name_gr && `Map Sheet: ${r.map_sheet_name_gr}`,
      ]
        .filter(Boolean)
        .join('\n');

      return `    <Placemark>
      <name>${escapeXml(r.gys_id)}${r.name ? ' - ' + escapeXml(r.name) : ''}</name>
      <description>${escapeXml(desc)}</description>
      <ExtendedData>
        <Data name="gys_id"><value>${escapeXml(r.gys_id)}</value></Data>
        <Data name="status"><value>${escapeXml(r.status)}</value></Data>
        <Data name="order"><value>${escapeXml(r.point_order)}</value></Data>
        <Data name="elevation"><value>${escapeXml(r.elevation)}</value></Data>
      </ExtendedData>
      <Point>
        <coordinates>${r.longitude},${r.latitude},${r.elevation || 0}</coordinates>
      </Point>
    </Placemark>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GYS Trigonometric Points - vathra.xyz</name>
    <description>Hellenic Army trigonometric survey points exported from vathra.xyz</description>
${placemarks}
  </Document>
</kml>`;
};

const getFilteredPointsForExport = async ({ status, order, bbox } = {}) => {
  const whereClauses = [];
  const values = [];
  let paramIndex = 1;

  if (status) {
    const statuses = status.split(',').filter(Boolean);
    if (statuses.length > 0) {
      whereClauses.push(`status = ANY($${paramIndex++})`);
      values.push(statuses);
    }
  }
  if (order) {
    const orders = order.split(',').filter(Boolean);
    if (orders.length > 0) {
      whereClauses.push(`point_order = ANY($${paramIndex++})`);
      values.push(orders);
    }
  }
  if (bbox) {
    const parts = bbox.split(',').map(Number);
    if (parts.length === 4 && parts.every(n => !isNaN(n))) {
      whereClauses.push(`location && ST_MakeEnvelope($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 4326)`);
      values.push(...parts);
    }
  }

  let query = `SELECT ${EXPORT_COLUMNS} FROM points`;
  if (whereClauses.length > 0) query += ` WHERE ${whereClauses.join(' AND ')}`;
  query += ' ORDER BY gys_id';

  const result = await pool.query(query, values);
  return result.rows;
};

const toGPX = (rows) => {
  const escapeXml = (str) => {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  const waypoints = rows
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => {
      const desc = [
        r.status && `Status: ${r.status}`,
        r.point_order && `Order: ${r.point_order}`,
        r.elevation && `Elevation: ${r.elevation}m`,
        r.map_sheet_name_gr && `Map Sheet: ${r.map_sheet_name_gr}`,
      ]
        .filter(Boolean)
        .join(' | ');

      const name = r.name
        ? `${escapeXml(r.name)} (GYS ${escapeXml(r.gys_id)})`
        : `GYS ${escapeXml(r.gys_id)}`;

      return `  <wpt lat="${r.latitude}" lon="${r.longitude}">
    ${r.elevation ? `<ele>${r.elevation}</ele>` : ''}
    <name>${name}</name>
    <desc>${escapeXml(desc)}</desc>
    <sym>Flag, Blue</sym>
    <type>Trig Point</type>
  </wpt>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="vathra.xyz"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>GYS Trigonometric Points - vathra.xyz</name>
    <desc>Hellenic Army trigonometric survey points exported from vathra.xyz</desc>
    <link href="https://vathra.xyz"><text>vathra.xyz</text></link>
    <time>${new Date().toISOString()}</time>
  </metadata>
${waypoints}
</gpx>`;
};

module.exports = { getAllPointsForExport, getFilteredPointsForExport, toCSV, toKML, toGPX };
