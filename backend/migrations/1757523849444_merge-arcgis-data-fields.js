exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.renameColumn('points', 'name', 'gys_id');
  pgm.addColumns('points', {
    name: { type: 'varchar(255)' },
    description: { type: 'text' },
    point_order: { type: 'varchar(10)' },
    prefecture: { type: 'varchar(100)' },
    postal_code: { type: 'varchar(10)' },
    year_established: { type: 'integer' },
    map_sheet_id: { type: 'varchar(50)' },
    map_sheet_name_gr: { type: 'varchar(100)' },
    map_sheet_name_en: { type: 'varchar(100)' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('points', [
    'name', 'description', 'point_order', 'prefecture', 'postal_code',
    'year_established', 'map_sheet_id', 'map_sheet_name_gr', 'map_sheet_name_en',
  ]);
  pgm.renameColumn('points', 'gys_id', 'name');
};