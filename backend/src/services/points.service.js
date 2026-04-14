const pool = require('./database.service');

const findAllPoints = async (params = {}) => {
  let { bounds, status, order } = params;
  // Minimal columns for map rendering — sidebar fetches full detail via /api/points/:gysId
  // lat/lon as plain numbers avoids 25k JSON.parse calls on the frontend
  let query = `
    SELECT
      id, gys_id, status, point_order,
      ST_Y(location::geometry) as lat,
      ST_X(location::geometry) as lon
    FROM points
  `;
  const whereClauses = [];
  const values = [];
  let paramIndex = 1;

  if (bounds) {
    try {
      const parsedBounds = JSON.parse(bounds);
      const { _southWest, _northEast } = parsedBounds;
      if (_southWest && _northEast) {
        whereClauses.push(`location && ST_MakeEnvelope($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, 4326)`);
        values.push(_southWest.lng, _southWest.lat, _northEast.lng, _northEast.lat);
      }
    } catch (e) { console.error("Error parsing bounds parameter:", e); }
  }

  if (status && status !== 'ALL') {
    whereClauses.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  
  if (order && order !== 'ALL') {
    whereClauses.push(`point_order = $${paramIndex++}`);
    values.push(order);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ${whereClauses.join(' AND ')}`;
  }
  
  const result = await pool.query(query, values);
  return result.rows;
};

const addReportToPoint = async ({ pointId, userId, status, comment, imageUrls = [] }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Use first image URL in the legacy column for backwards compat
    const legacyImageUrl = imageUrls[0] || null;
    const reportRes = await client.query(
      `INSERT INTO reports (point_id, user_id, status, comment, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [pointId, userId, status, comment, legacyImageUrl]
    );
    const report = reportRes.rows[0];

    if (imageUrls.length > 0) {
      const imgValues = imageUrls.map((url, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO report_images (report_id, image_url) VALUES ${imgValues}`,
        [report.id, ...imageUrls]
      );
    }

    await client.query(
      'UPDATE points SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, pointId]
    );

    await client.query('COMMIT');
    report.image_urls = imageUrls;
    return report;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error adding report for point:", err);
    throw err;
  } finally {
    client.release();
  }
};

const findReportsByPointId = async (pointId) => {
  const query = `
    SELECT
      reports.*,
      users.display_name,
      users.profile_picture_url,
      COALESCE(
        json_agg(report_images.image_url ORDER BY report_images.id) FILTER (WHERE report_images.image_url IS NOT NULL),
        '[]'
      ) AS image_urls
    FROM reports
    JOIN users ON reports.user_id = users.id
    LEFT JOIN report_images ON report_images.report_id = reports.id
    WHERE reports.point_id = $1
    GROUP BY reports.id, users.display_name, users.profile_picture_url
    ORDER BY reports.created_at DESC;
  `;
  const result = await pool.query(query, [pointId]);
  return result.rows;
};

const updateReport = async ({ reportId, userId, status, comment, imageUrls }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT * FROM reports WHERE id = $1 AND user_id = $2',
      [reportId, userId]
    );
    if (existing.rows.length === 0) return null;

    const legacyImageUrl = imageUrls && imageUrls.length > 0 ? imageUrls[0] : existing.rows[0].image_url;

    const updateRes = await client.query(
      `UPDATE reports SET status = $1, comment = $2, image_url = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [status, comment, legacyImageUrl, reportId]
    );
    const report = updateRes.rows[0];

    if (imageUrls) {
      await client.query('DELETE FROM report_images WHERE report_id = $1', [reportId]);
      if (imageUrls.length > 0) {
        const imgValues = imageUrls.map((url, i) => `($1, $${i + 2})`).join(', ');
        await client.query(
          `INSERT INTO report_images (report_id, image_url) VALUES ${imgValues}`,
          [reportId, ...imageUrls]
        );
      }
    }

    // Recalculate point status from most recent report
    await client.query(
      `UPDATE points SET status = (
        SELECT status FROM reports WHERE point_id = $1 ORDER BY created_at DESC LIMIT 1
      ), updated_at = NOW() WHERE id = $1`,
      [report.point_id]
    );

    await client.query('COMMIT');
    report.image_urls = imageUrls ?? [];
    return report;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const deleteReport = async ({ reportId, userId }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT * FROM reports WHERE id = $1 AND user_id = $2',
      [reportId, userId]
    );
    if (existing.rows.length === 0) return false;

    const pointId = existing.rows[0].point_id;
    await client.query('DELETE FROM reports WHERE id = $1', [reportId]);

    // Recalculate point status from remaining most recent report (or reset to UNKNOWN)
    await client.query(
      `UPDATE points SET status = COALESCE(
        (SELECT status FROM reports WHERE point_id = $1 ORDER BY created_at DESC LIMIT 1),
        'UNKNOWN'
      ), updated_at = NOW() WHERE id = $1`,
      [pointId]
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const searchPointsByName = async (searchTerm) => {
  const query = `
    SELECT
      id, 
      gys_id,
      name, 
      status, 
      ST_AsGeoJSON(location) as location 
    FROM points 
    WHERE 
      name ILIKE $1 OR gys_id::text ILIKE $1
    LIMIT 10;
  `;
  const values = [`%${searchTerm}%`];
  const result = await pool.query(query, values);
  return result.rows;
};

const findNearestPoint = async (lat, lon) => {
  const query = `
    SELECT 
      *,
      ST_AsGeoJSON(location) as location,
      ST_Distance(location, ST_MakePoint($2, $1)::geography) as distance_meters
    FROM points
    ORDER BY location <-> ST_MakePoint($2, $1)::geography
    LIMIT 1;
  `;
  const values = [lat, lon];
  const result = await pool.query(query, values);
  return result.rows[0];
};

const findPointByGysId = async (gysId) => {
  const query = `
    SELECT *, ST_AsGeoJSON(location) as location 
    FROM points 
    WHERE gys_id = $1;
  `;
  const result = await pool.query(query, [gysId]);
  return result.rows[0];
};

const findPointById = async (id) => {
  const result = await pool.query(
    'SELECT *, ST_AsGeoJSON(location) as location FROM points WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const findNearbyPoints = async (lat, lon, radius = 5000) => {
  const query = `
    SELECT
      id, gys_id, name, status, point_order, elevation,
      egsa87_x, egsa87_y, egsa87_z,
      ST_Y(location::geometry) as lat,
      ST_X(location::geometry) as lon,
      ST_Distance(location, ST_MakePoint($2, $1)::geography) as distance_meters
    FROM points
    WHERE ST_DWithin(location, ST_MakePoint($2, $1)::geography, $3)
    ORDER BY location <-> ST_MakePoint($2, $1)::geography
    LIMIT 50;
  `;
  const result = await pool.query(query, [lat, lon, radius]);
  return result.rows;
};

const findNearestUnvisited = async (lat, lon) => {
  const query = `
    SELECT
      id, gys_id, name, status, point_order, elevation,
      ST_AsGeoJSON(location) as location,
      ST_Distance(location, ST_MakePoint($2, $1)::geography) as distance_meters
    FROM points
    WHERE id NOT IN (SELECT DISTINCT point_id FROM reports)
    ORDER BY location <-> ST_MakePoint($2, $1)::geography
    LIMIT 1;
  `;
  const result = await pool.query(query, [lat, lon]);
  return result.rows[0];
};

const findRecentImages = async ({ limit = 24, offset = 0 } = {}) => {
  const result = await pool.query(
    `SELECT
       ri.id            AS image_id,
       ri.image_url,
       ri.created_at,
       r.id             AS report_id,
       r.status,
       r.comment,
       p.id             AS point_id,
       p.gys_id,
       p.name           AS point_name,
       u.display_name   AS reporter_name
     FROM report_images ri
     JOIN reports r  ON ri.report_id = r.id
     JOIN points  p  ON r.point_id   = p.id
     JOIN users   u  ON r.user_id    = u.id
     ORDER BY ri.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

module.exports = {
  findAllPoints,
  addReportToPoint,
  updateReport,
  deleteReport,
  findReportsByPointId,
  searchPointsByName,
  findNearestPoint,
  findPointByGysId,
  findPointById,
  findNearestUnvisited,
  findNearbyPoints,
  findRecentImages,
};