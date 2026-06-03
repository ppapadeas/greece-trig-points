const pool = require('./database.service');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { deleteFile } = require('./s3.service');
const recoveryService = require('./recovery.service');

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

const getAllPoints = async () => {
  const query = `
    SELECT
      p.*,
      COALESCE(rc.report_count, 0) AS report_count,
      COALESCE(tc.tag_slugs, ARRAY[]::text[]) AS tag_slugs
    FROM points p
    LEFT JOIN (
      SELECT point_id, COUNT(*) AS report_count
      FROM reports GROUP BY point_id
    ) rc ON rc.point_id = p.id
    LEFT JOIN (
      SELECT point_id, ARRAY_AGG(tag_slug ORDER BY tag_slug) AS tag_slugs
      FROM point_tags GROUP BY point_id
    ) tc ON tc.point_id = p.id
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
  try {
    const imgRes = await pool.query(
      'SELECT image_url FROM report_images WHERE report_id = $1',
      [reportId]
    );
    const imageUrls = imgRes.rows.map(r => r.image_url);

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
    const { rows } = await pool.query(query, [reportId]);
    if (rows.length === 0) {
      throw new Error('Report not found');
    }

    for (const url of imageUrls) {
      deleteFile(url).catch(() => {});
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

const getUserDetail = async (userId) => {
  const userResult = await pool.query(
    `SELECT
       u.id, u.display_name, u.email, u.role, u.google_id,
       u.profile_picture_url, u.created_at, u.last_login,
       COUNT(r.id)                AS report_count,
       COUNT(DISTINCT r.point_id) AS points_covered,
       MAX(r.created_at)          AS last_report_at
     FROM users u
     LEFT JOIN reports r ON r.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  );
  const user = userResult.rows[0];
  if (!user) return null;

  const passkeysResult = await pool.query(
    `SELECT id, credential_id, device_name, transports, created_at
     FROM passkey_credentials
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return {
    ...user,
    passkeys: passkeysResult.rows,
  };
};

const deleteUserPasskey = async (userId, passkeyId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM passkey_credentials WHERE id = $1 AND user_id = $2',
    [passkeyId, userId]
  );
  return rowCount > 0;
};

const resetUserPasskeys = async (userId) => {
  const { rowCount } = await pool.query(
    'DELETE FROM passkey_credentials WHERE user_id = $1',
    [userId]
  );
  return rowCount;
};

const setUserRole = async (userId, role) => {
  if (role !== 'USER' && role !== 'ADMIN') {
    throw new Error('Invalid role');
  }
  const { rows } = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, role',
    [role, userId]
  );
  return rows[0] || null;
};

const generateUserRecoveryToken = async (userId) => {
  const userResult = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
  if (userResult.rows.length === 0) return null;
  return recoveryService.createRecoveryToken(userId);
};

const anonymizeUser = async (userId) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT id FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );
    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('DELETE FROM passkey_credentials WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM passkey_recovery_tokens WHERE user_id = $1', [userId]);

    const placeholderEmail = `anonymized-${userId}@vathra.local`;
    const { rows } = await client.query(
      `UPDATE users
       SET email = $2,
           google_id = NULL,
           display_name = 'Deleted user',
           profile_picture_url = NULL,
           role = 'USER'
       WHERE id = $1
       RETURNING id, email, display_name`,
      [userId, placeholderEmail]
    );

    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const hardDeleteUser = async (userId) => {
  const imgRes = await pool.query(
    `SELECT ri.image_url
     FROM report_images ri
     JOIN reports r ON r.id = ri.report_id
     WHERE r.user_id = $1`,
    [userId]
  );
  const imageUrls = imgRes.rows.map((r) => r.image_url);

  const { rowCount } = await pool.query(
    'DELETE FROM users WHERE id = $1',
    [userId]
  );

  if (rowCount === 0) return null;

  for (const url of imageUrls) {
    deleteFile(url).catch(() => {});
  }

  return { deleted: true, imagesRemoved: imageUrls.length };
};

module.exports = {
  getAllReports,
  getAllPoints,
  approveReport,
  deleteReport,
  getImageStats,
  getAllUsers,
  getUserDetail,
  deleteUserPasskey,
  resetUserPasskeys,
  setUserRole,
  generateUserRecoveryToken,
  anonymizeUser,
  hardDeleteUser,
};