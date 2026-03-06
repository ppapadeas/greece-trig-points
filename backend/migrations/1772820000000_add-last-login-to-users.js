exports.up = (pgm) => {
  pgm.addColumn('users', {
    last_login: {
      type: 'timestamp with time zone',
      notNull: false,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('users', 'last_login');
};
