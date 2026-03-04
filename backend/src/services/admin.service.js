const pool = require('./database.service');

const getAllReports = async () => {
  const query = `
    SELECT
      r.id,
      r.status,
      r.comment,
      r.image_url,
      r.created_at,
      p.gys_id as point_gys_id,
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

// --- THIS IS THE UPDATED FUNCTION ---
const getAllPoints = async () => {
  // This query now joins with the reports table to count the number of reports for each point.
  const query = `
    SELECT
      p.*,
      COUNT(r.id) AS report_count
    FROM points p
    LEFT JOIN reports r ON p.id = r.point_id
    GROUP BY p.id
    ORDER BY p.gys_id;
  `;
  const result = await pool.query(query);
  return result.rows;
};

const approveReport = async (reportId) => {
  const query = `
    WITH updated_report AS (
      UPDATE reports
      SET is_reviewed = true
      WHERE id = $1
      RETURNING point_id, status, id
    ), updated_point AS (
      UPDATE points
      SET status = ur.status
      FROM updated_report ur
      WHERE points.id = ur.point_id
      RETURNING points.id
    )
    SELECT id FROM updated_report;
  `;
  try {
    const { rows } = await pool.query(query, [reportId]);
    if (rows.length === 0) {
      throw new Error(`Report with ID ${reportId} not found.`);
    }
    return { success: true };
  } catch (e) {
    console.error("Query failed in approveReport:", e);
    throw e;
  }
};

const deleteReport = async (reportId) => {
  const query = `
    WITH deleted AS (
      DELETE FROM reports
      WHERE id = $1
      RETURNING id AS deleted_id, point_id
    ), latest AS (
      SELECT r.status, r.point_id
      FROM reports r
      JOIN deleted d ON r.point_id = d.point_id
      WHERE r.id <> d.deleted_id
      ORDER BY r.created_at DESC
      LIMIT 1
    ), upd AS (
      UPDATE points p
      SET status = COALESCE(l.status, 'UNKNOWN')
      FROM deleted d
      LEFT JOIN latest l ON l.point_id = d.point_id
      WHERE p.id = d.point_id
      RETURNING p.id, p.status
    )
    SELECT deleted_id FROM deleted;
  `;
  try {
    const { rows } = await pool.query(query, [reportId]);
    if (rows.length === 0) {
      throw new Error('Report not found');
    }
    return { success: true };
  } catch (e) {
    console.error("Query failed in deleteReport:", e);
    throw e;
  }
};

module.exports = {
  getAllReports,
  getAllPoints,
  approveReport,
  deleteReport,
};