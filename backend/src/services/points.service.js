const pool = require('./database.service');

// THIS FUNCTION IS NOW UPDATED to select all new fields
const findAllPoints = async (bounds) => {
  let query = `
    SELECT
      id, gys_id, name, elevation, status, description, point_order,
      prefecture, postal_code, year_established, map_sheet_id,
      map_sheet_name_gr, map_sheet_name_en, egsa87_x, egsa87_y, egsa87_z,
      ST_AsGeoJSON(location) as location
    FROM points
  `;
  const values = [];

  if (bounds) {
    try {
      // Parse the JSON string from the query parameter
      const parsedBounds = JSON.parse(bounds);
      const { _southWest, _northEast } = parsedBounds;
      if (_southWest && _northEast) {
        query += `
          WHERE location && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        `;
        values.push(_southWest.lng, _southWest.lat, _northEast.lng, _northEast.lat);
      }
    } catch (e) {
      console.error("Error parsing bounds parameter:", e);
    }
  }

  const result = await pool.query(query, values);
  return result.rows;
};

const addReportToPoint = async ({ pointId, userId, status, comment, imageUrl }) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const reportQuery = `
      INSERT INTO reports (point_id, user_id, status, comment, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const reportValues = [pointId, userId, status, comment, imageUrl];
    const reportResult = await client.query(reportQuery, reportValues);

    const updatePointQuery = `
      UPDATE points
      SET status = $1, updated_at = NOW()
      WHERE id = $2;
    `;
    await client.query(updatePointQuery, [status, pointId]);

    await client.query('COMMIT');
    
    return reportResult.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
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
    WHERE gys_id ILIKE $1 OR name ILIKE $1
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

module.exports = {
  findAllPoints,
  addReportToPoint,
  findReportsByPointId,
  searchPointsByName,
  findNearestPoint,
};