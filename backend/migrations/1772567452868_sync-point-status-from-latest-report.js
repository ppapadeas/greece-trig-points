exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    UPDATE points p
    SET status = r.status
    FROM (
      SELECT DISTINCT ON (point_id) point_id, status
      FROM reports
      ORDER BY point_id, created_at DESC
    ) r
    WHERE p.id = r.point_id;
  `);
};

exports.down = () => {
  // Cannot reverse — original statuses are not stored
};
