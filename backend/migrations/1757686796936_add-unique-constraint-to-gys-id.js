exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add a UNIQUE constraint to the gys_id column in the points table
  pgm.addConstraint('points', 'points_gys_id_unique', {
    unique: 'gys_id',
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('points', 'points_gys_id_unique');
};