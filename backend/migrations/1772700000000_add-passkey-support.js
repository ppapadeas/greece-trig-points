exports.shorthands = undefined;

exports.up = (pgm) => {
  // Make google_id nullable for passkey-only users
  pgm.alterColumn('users', 'google_id', { notNull: false });

  pgm.createTable('passkey_credentials', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    credential_id: { type: 'text', notNull: true, unique: true },
    public_key: { type: 'text', notNull: true },
    counter: { type: 'bigint', notNull: true, default: 0 },
    transports: { type: 'text[]' },
    device_name: { type: 'varchar(255)' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('passkey_credentials', 'user_id', { name: 'idx_passkey_cred_user' });
  pgm.createIndex('passkey_credentials', 'credential_id', { name: 'idx_passkey_cred_id' });
};

exports.down = (pgm) => {
  pgm.dropTable('passkey_credentials');
  pgm.alterColumn('users', 'google_id', { notNull: true });
};
