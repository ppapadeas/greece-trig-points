exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createType('point_status', ['OK', 'DAMAGED', 'DESTROYED', 'MISSING', 'UNKNOWN']);

  pgm.createTable('points', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(255)', notNull: true },
    location: { type: 'geography(point, 4326)', notNull: true },
    elevation: { type: 'real' },
    original_info: { type: 'text' },
    status: { type: 'point_status', notNull: true, default: 'UNKNOWN' },
    egsa87_x: { type: 'double precision' },
    egsa87_y: { type: 'double precision' },
    egsa87_z: { type: 'double precision' },
    created_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp with time zone', notNull: true, default: pgm.func('current_timestamp') },
  });

  pgm.createIndex('points', 'location', { method: 'gist' });
};

exports.down = (pgm) => {
  pgm.dropTable('points');
  pgm.dropType('point_status');
};