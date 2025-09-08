exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('session', {
    sid: { type: 'varchar', notNull: true },
    sess: { type: 'json', notNull: true },
    expire: { type: 'timestamp(6)', notNull: true },
  });
  pgm.addConstraint('session', 'session_pkey', {
    primaryKey: 'sid',
  });
  pgm.createIndex('session', 'expire');
};

exports.down = (pgm) => {
  pgm.dropTable('session');
};