const pool = require('./database.service');

const getDashboardStats = async () => {
  const [
    pointsCountRes,
    statusBreakdownRes,
    usersCountRes,
    reportsCountRes,
    topUsersRes,
    prefectureBreakdownRes,
    orderBreakdownRes,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM points;'),
    pool.query('SELECT status, COUNT(*) FROM points GROUP BY status;'),
    pool.query('SELECT COUNT(*) FROM users;'),
    pool.query('SELECT COUNT(*) FROM reports;'),
    pool.query(`
      SELECT u.display_name, u.profile_picture_url, COUNT(r.id) as report_count
      FROM users u
      JOIN reports r ON u.id = r.user_id
      GROUP BY u.id
      ORDER BY report_count DESC
      LIMIT 5;
    `),
    pool.query(`
      SELECT prefecture, COUNT(*) as count
      FROM points
      WHERE prefecture IS NOT NULL AND prefecture <> ''
      GROUP BY prefecture
      ORDER BY count DESC
      LIMIT 15;
    `),
    pool.query(`
      SELECT point_order, COUNT(*) as count
      FROM points
      WHERE point_order IS NOT NULL
      GROUP BY point_order
      ORDER BY point_order;
    `),
  ]);

  const statusBreakdown = statusBreakdownRes.rows.reduce((acc, row) => {
    acc[row.status] = parseInt(row.count, 10);
    return acc;
  }, {});

  return {
    totalPoints: parseInt(pointsCountRes.rows[0].count, 10),
    statusBreakdown,
    totalUsers: parseInt(usersCountRes.rows[0].count, 10),
    totalReports: parseInt(reportsCountRes.rows[0].count, 10),
    topUsers: topUsersRes.rows,
    prefectureBreakdown: prefectureBreakdownRes.rows.map(r => ({
      name: r.prefecture,
      count: parseInt(r.count, 10),
    })),
    orderBreakdown: orderBreakdownRes.rows.map(r => ({
      name: r.point_order,
      count: parseInt(r.count, 10),
    })),
  };
};

module.exports = {
  getDashboardStats,
};