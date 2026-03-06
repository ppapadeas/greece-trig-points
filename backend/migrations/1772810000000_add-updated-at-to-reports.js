exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumn('reports', {
    updated_at: {
      type: 'timestamp with time zone',
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('reports', 'updated_at');
};
