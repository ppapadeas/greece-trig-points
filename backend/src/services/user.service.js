const pool = require('./database.service');

const RANKS = [
  { min: 500, en: 'Geodesist', el: 'Γεωδαίτης' },
  { min: 201, en: 'Cartographer', el: 'Χαρτογράφος' },
  { min: 51, en: 'Surveyor', el: 'Τοπογράφος' },
  { min: 11, en: 'Scout', el: 'Ανιχνευτής' },
  { min: 1, en: 'Explorer', el: 'Εξερευνητής' },
];

const getRank = (reportCount) => {
  for (const rank of RANKS) {
    if (reportCount >= rank.min) return rank;
  }
  return null;
};

const getUserProfile = async (userId) => {
  const [userRes, statsRes] = await Promise.all([
    pool.query(
      `SELECT id, display_name, profile_picture_url, created_at
       FROM users WHERE id = $1`,
      [userId]
    ),
    pool.query(
      `SELECT
         COUNT(*) AS report_count,
         COUNT(DISTINCT point_id) AS points_covered
       FROM reports WHERE user_id = $1`,
      [userId]
    ),
  ]);

  if (userRes.rows.length === 0) return null;

  const user = userRes.rows[0];
  const reportCount = parseInt(statsRes.rows[0].report_count, 10);
  const pointsCovered = parseInt(statsRes.rows[0].points_covered, 10);
  const rank = getRank(reportCount);

  return {
    ...user,
    reportCount,
    pointsCovered,
    rank,
  };
};

const getUserReports = async (userId, limit = 20, offset = 0) => {
  const result = await pool.query(
    `SELECT
       r.id, r.status, r.comment, r.image_url, r.created_at,
       p.gys_id, p.name AS point_name,
       ST_Y(p.location::geometry) AS lat,
       ST_X(p.location::geometry) AS lon
     FROM reports r
     JOIN points p ON r.point_id = p.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

module.exports = {
  getUserProfile,
  getUserReports,
  getRank,
};
