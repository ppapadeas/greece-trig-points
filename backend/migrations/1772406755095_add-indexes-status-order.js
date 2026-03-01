exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createIndex('points', 'status', { name: 'idx_points_status' });
  pgm.createIndex('points', 'point_order', { name: 'idx_points_point_order' });
};

exports.down = (pgm) => {
  pgm.dropIndex('points', 'status', { name: 'idx_points_status' });
  pgm.dropIndex('points', 'point_order', { name: 'idx_points_point_order' });
};
