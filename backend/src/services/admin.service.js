const pool = require('./database.service');

const getAllReports = async () => {
  const query = `
    SELECT
      r.id,
      r.status,
      r.comment,
      r.image_url,
      r.created_at,
      p.name as point_name,
      u.display_name as user_name
    FROM reports r
    JOIN points p ON r.point_id = p.id
    JOIN users u ON r.user_id = u.id
    ORDER BY r.created_at DESC;
  `;
  const result = await pool.query(query);
  return result.rows;
};

const getAllPoints = async () => {
  // Select all fields from the points table, ordered by the official ID
  const query = 'SELECT * FROM points ORDER BY gys_id;';
  const result = await pool.query(query);
  return result.rows;
};

const approveReport = async (reportId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First, get the report details
    const reportRes = await client.query('SELECT point_id, status FROM reports WHERE id = $1 FOR UPDATE', [reportId]);
    if (reportRes.rows.length === 0) {
      throw new Error(`Report with ID ${reportId} not found.`);
    }
    const { point_id, status } = reportRes.rows[0];

    // Update the point's main status
    await client.query('UPDATE points SET status = $1 WHERE id = $2', [status, point_id]);

    // Mark the report as reviewed (or delete it if you prefer)
    await client.query('UPDATE reports SET is_reviewed = true WHERE id = $1', [reportId]);

    await client.query('COMMIT');
    return { success: true };
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Transaction failed in approveReport:", e); // Add more detailed logging
    throw e;
  } finally {
    client.release();
  }
};

const deleteReport = async (reportId) => {
  await pool.query('DELETE FROM reports WHERE id = $1', [reportId]);
  return { success: true };
};

module.exports = {
  getAllReports,
  getAllPoints,
  approveReport,
  deleteReport,
};