const pool = require('./database.service');

const findAllPoints = async () => {
  const query = `
    SELECT
      id, name, elevation, status, created_at, updated_at,
      egsa87_x, egsa87_y, egsa87_z,
      ST_AsGeoJSON(location) as location
    FROM points;
  `;
  const result = await pool.query(query);
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
      SET status = $1
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
  // We search for names that contain the search term, case-insensitively.
  // We limit the results to 10 for performance.
  const query = `
    SELECT 
      id, 
      name, 
      status, 
      ST_AsGeoJSON(location) as location 
    FROM points 
    WHERE name ILIKE $1 
    LIMIT 10;
  `;
  // The '%' are wildcards, so it finds any point containing the search term
  const values = [`%${searchTerm}%`];
  const result = await pool.query(query, values);
  return result.rows;
};

module.exports = {
  findAllPoints,
  addReportToPoint,
  findReportsByPointId,
  searchPointsByName,
};
