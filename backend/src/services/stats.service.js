const pool = require('./database.service');

const getDashboardStats = async () => {
  // Τρέχουμε όλες τις εντολές παράλληλα για μέγιστη ταχύτητα
  const [pointsCountRes, statusBreakdownRes, usersCountRes, reportsCountRes, topUsersRes] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM points;'),
    pool.query('SELECT status, COUNT(*) FROM points GROUP BY status;'),
    pool.query('SELECT COUNT(*) FROM users;'),
    pool.query('SELECT COUNT(*) FROM reports;'),
    pool.query(`
      SELECT u.display_name, COUNT(r.id) as report_count 
      FROM users u 
      JOIN reports r ON u.id = r.user_id 
      GROUP BY u.id 
      ORDER BY report_count DESC 
      LIMIT 5;
    `)
  ]);

  // Μετατρέπουμε τα αποτελέσματα σε ένα απλό αντικείμενο
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
  };
};

module.exports = {
  getDashboardStats,
};