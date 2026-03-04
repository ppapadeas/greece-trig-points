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

const addReportToPoint = async ({ pointId, userId, status, comment, imageUrl }) => {
  const values = [pointId, userId, status, comment, imageUrl];
  const query = `
    WITH inserted_report AS (
      INSERT INTO reports (point_id, user_id, status, comment, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    ), updated_point AS (
      UPDATE points
      SET status = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING id
    )
    SELECT * FROM inserted_report;
  `;
  try {
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (err) {
    console.error("Error adding report for point:", err);
    throw err;
  }
};

const findReportsByPointId = async (pointId) => {
  const query = `
    SELECT
      reports.*,
      users.display_name,
      users.profile_picture_url
    FROM reports
    JOIN users ON reports.user_id = users.id
    WHERE reports.point_id = $1
    ORDER BY reports.created_at DESC;
  `;
  const result = await pool.query(query, [pointId]);
  return result.rows;
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

module.exports = {
  findAllPoints,
  addReportToPoint,
  findReportsByPointId,
  searchPointsByName,
  findNearestPoint,
  findPointByGysId,
  findPointById,
  findNearestUnvisited,
  findNearbyPoints,
};