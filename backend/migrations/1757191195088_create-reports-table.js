exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('reports', {
    id: { type: 'serial', primaryKey: true },
    // Foreign key linking to the user who made the report
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"(id)',
      onDelete: 'CASCADE', // If a user is deleted, their reports are deleted
    },
    // Foreign key linking to the point being reported on
    point_id: {
      type: 'integer',
      notNull: true,
      references: '"points"(id)',
      onDelete: 'CASCADE',
    },
    // Use the same ENUM type we created for the points table
    status: { type: 'point_status', notNull: true },
    comment: { type: 'text' },
    image_url: { type: 'varchar(255)' },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  // Add indexes for faster lookups
  pgm.createIndex('reports', 'user_id');
  pgm.createIndex('reports', 'point_id');
};

exports.down = (pgm) => {
  pgm.dropTable('reports');
};