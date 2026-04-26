exports.shorthands = undefined;

exports.up = (pgm) => {
  // observed_at is the date the user actually saw the point on the ground.
  // created_at remains the immutable submission timestamp (the audit trail).
  pgm.addColumn('reports', {
    observed_at: { type: 'date' },
  });
  // Backfill — for existing rows, the only date we know is the submission day.
  pgm.sql(`UPDATE reports SET observed_at = created_at::date WHERE observed_at IS NULL`);
  pgm.alterColumn('reports', 'observed_at', { notNull: true });
  pgm.createIndex('reports', 'observed_at', { name: 'idx_reports_observed_at' });
};

exports.down = (pgm) => {
  pgm.dropIndex('reports', 'observed_at', { name: 'idx_reports_observed_at' });
  pgm.dropColumn('reports', 'observed_at');
};
