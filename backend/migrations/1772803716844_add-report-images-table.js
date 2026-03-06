exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('report_images', {
    id: { type: 'serial', primaryKey: true },
    report_id: {
      type: 'integer',
      notNull: true,
      references: '"reports"(id)',
      onDelete: 'CASCADE',
    },
    image_url: { type: 'text', notNull: true },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.createIndex('report_images', 'report_id');

  // Migrate existing single image_url values into report_images
  pgm.sql(`
    INSERT INTO report_images (report_id, image_url)
    SELECT id, image_url FROM reports WHERE image_url IS NOT NULL AND image_url != '';
  `);
};

exports.down = (pgm) => {
  pgm.dropTable('report_images');
};
