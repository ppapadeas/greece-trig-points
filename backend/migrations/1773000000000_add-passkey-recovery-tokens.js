exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('passkey_recovery_tokens', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    token_hash: { type: 'text', notNull: true, unique: true },
    expires_at: { type: 'timestamp with time zone', notNull: true },
    used_at: { type: 'timestamp with time zone' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('passkey_recovery_tokens', 'token_hash', { name: 'idx_passkey_recovery_token_hash' });
  pgm.createIndex('passkey_recovery_tokens', 'user_id', { name: 'idx_passkey_recovery_user' });
};

exports.down = (pgm) => {
  pgm.dropTable('passkey_recovery_tokens');
};
