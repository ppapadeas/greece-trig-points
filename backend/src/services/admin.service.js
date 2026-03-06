const pool = require('./database.service');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const getBucketStats = async () => {
  let totalSize = 0;
  let totalObjects = 0;
  let continuationToken;

  do {
    const command = new ListObjectsV2Command({
      Bucket: process.env.S3_BUCKET_NAME,
      ContinuationToken: continuationToken,
    });
    const response = await s3.send(command);
    if (response.Contents) {
      for (const obj of response.Contents) {
        totalSize += obj.Size;
        totalObjects++;
      }
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return { totalSize, totalObjects };
};

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

const getImageStats = async () => {
  const [
    totalRes,
    withImageRes,
    byUserRes,
    byMonthRes,
    recentImagesRes,
    bucketStats,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM reports'),
    pool.query("SELECT COUNT(*) FROM reports WHERE image_url IS NOT NULL AND image_url <> ''"),
    pool.query(`
      SELECT u.display_name, COUNT(r.id) as image_count
      FROM reports r
      JOIN users u ON r.user_id = u.id
      WHERE r.image_url IS NOT NULL AND r.image_url <> ''
      GROUP BY u.id, u.display_name
      ORDER BY image_count DESC
      LIMIT 10
    `),
    pool.query(`
      SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
             COUNT(*) as count
      FROM reports
      WHERE image_url IS NOT NULL AND image_url <> ''
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at)
    `),
    pool.query(`
      SELECT r.id, r.image_url, r.created_at, u.display_name, p.gys_id
      FROM reports r
      JOIN users u ON r.user_id = u.id
      JOIN points p ON r.point_id = p.id
      WHERE r.image_url IS NOT NULL AND r.image_url <> ''
      ORDER BY r.created_at DESC
      LIMIT 10
    `),
    getBucketStats(),
  ]);

  return {
    totalReports: parseInt(totalRes.rows[0].count, 10),
    reportsWithImages: parseInt(withImageRes.rows[0].count, 10),
    reportsWithoutImages: parseInt(totalRes.rows[0].count, 10) - parseInt(withImageRes.rows[0].count, 10),
    imagesByUser: byUserRes.rows.map(r => ({
      name: r.display_name,
      count: parseInt(r.image_count, 10),
    })),
    imagesByMonth: byMonthRes.rows.map(r => ({
      month: r.month,
      count: parseInt(r.count, 10),
    })),
    recentImages: recentImagesRes.rows,
    storageBytes: bucketStats.totalSize,
    storageObjects: bucketStats.totalObjects,
  };
};

const getAllUsers = async () => {
  const result = await pool.query(`
    SELECT
      u.id,
      u.display_name,
      u.email,
      u.role,
      u.profile_picture_url,
      u.created_at,
      u.last_login,
      COUNT(r.id)                          AS report_count,
      COUNT(DISTINCT r.point_id)           AS points_covered,
      MAX(r.created_at)                    AS last_report_at
    FROM users u
    LEFT JOIN reports r ON r.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  return result.rows;
};

module.exports = {
  getAllReports,
  getAllPoints,
  approveReport,
  deleteReport,
  getImageStats,
  getAllUsers,
};