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
  const query = 'SELECT * FROM points ORDER BY gys_id;';
  const result = await pool.query(query);
  return result.rows;
};

const approveReport = async (reportId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reportRes = await client.query('SELECT point_id, status FROM reports WHERE id = $1 FOR UPDATE', [reportId]);
    if (reportRes.rows.length === 0) {
      throw new Error(`Report with ID ${reportId} not found.`);
    }
    const { point_id, status } = reportRes.rows[0];
    await client.query('UPDATE points SET status = $1 WHERE id = $2', [status, point_id]);
    await client.query('UPDATE reports SET is_reviewed = true WHERE id = $1', [reportId]);
    await client.query('COMMIT');
    return { success: true };
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Transaction failed in approveReport:", e);
    throw e;
  } finally {
    client.release();
  }
};

// --- THIS IS THE NEW, SMARTER DELETE FUNCTION ---
const deleteReport = async (reportId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First, get the point_id from the report we are about to delete
    const reportRes = await client.query('SELECT point_id FROM reports WHERE id = $1', [reportId]);
    if (reportRes.rows.length === 0) {
      throw new Error('Report not found');
    }
    const { point_id } = reportRes.rows[0];

    // Now, delete the report
    await client.query('DELETE FROM reports WHERE id = $1', [reportId]);

    // Next, find the status of the newest remaining report for that point
    const latestReportRes = await client.query(
      'SELECT status FROM reports WHERE point_id = $1 ORDER BY created_at DESC LIMIT 1',
      [point_id]
    );

    // Determine the new status
    const newStatus = latestReportRes.rows.length > 0 ? latestReportRes.rows[0].status : 'UNKNOWN';

    // Finally, update the point's main status
    await client.query('UPDATE points SET status = $1 WHERE id = $2', [newStatus, point_id]);

    await client.query('COMMIT');
    return { success: true };

  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Transaction failed in deleteReport:", e);
    throw e;
  } finally {
    client.release();
  }
};

module.exports = {
  getAllReports,
  getAllPoints,
  approveReport,
  deleteReport,
};