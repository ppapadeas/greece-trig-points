exports.shorthands = undefined;

exports.up = (pgm) => {
  // First, create the new type for the roles
  pgm.createType('user_role', ['USER', 'ADMIN']);

  // Then, add the 'role' column to the 'users' table
  pgm.addColumns('users', {
    role: {
      type: 'user_role',
      notNull: true,
      default: 'USER',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['role']);
  pgm.dropType('user_role');
};