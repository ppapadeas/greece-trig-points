exports.shorthands = undefined;

const SEED_TAGS = [
  // access (orthogonal to status — describes whether you can physically reach the point)
  { slug: 'inaccessible:military', category: 'access', label_el: 'Στρατιωτική ζώνη', label_en: 'Military zone', icon: 'Security', is_warning: true },
  { slug: 'inaccessible:private', category: 'access', label_el: 'Ιδιωτική περιοχή', label_en: 'Private property', icon: 'Lock', is_warning: true },
  { slug: 'inaccessible:industrial', category: 'access', label_el: 'Βιομηχανική ζώνη', label_en: 'Industrial site', icon: 'Factory', is_warning: true },
  { slug: 'inaccessible:religious', category: 'access', label_el: 'Μοναστήρι/Εκκλησία', label_en: 'Religious property', icon: 'Church', is_warning: true },
  { slug: 'inaccessible:archaeological', category: 'access', label_el: 'Αρχαιολογικός χώρος', label_en: 'Archaeological site', icon: 'Museum', is_warning: true },
  { slug: 'border_zone', category: 'access', label_el: 'Παραμεθόρια ζώνη', label_en: 'Border zone', icon: 'Flag', is_warning: true },
  { slug: 'permission_required', category: 'access', label_el: 'Απαιτείται άδεια', label_en: 'Permission required', icon: 'AssignmentInd', is_warning: false },
  { slug: 'seasonal_access', category: 'access', label_el: 'Εποχιακή πρόσβαση', label_en: 'Seasonal access', icon: 'AcUnit', is_warning: false },

  // approach
  { slug: 'requires_4x4', category: 'approach', label_el: 'Απαιτείται 4x4', label_en: 'Requires 4x4', icon: 'OffRoad', is_warning: false },
  { slug: 'long_hike', category: 'approach', label_el: 'Μεγάλη πεζοπορία', label_en: 'Long hike', icon: 'DirectionsWalk', is_warning: false },
  { slug: 'dangerous_terrain', category: 'approach', label_el: 'Επικίνδυνο έδαφος', label_en: 'Dangerous terrain', icon: 'Warning', is_warning: true },
  { slug: 'easy_drive_in', category: 'approach', label_el: 'Εύκολη πρόσβαση με αυτοκίνητο', label_en: 'Easy drive-in', icon: 'DirectionsCar', is_warning: false },

  // quality
  { slug: 'panoramic', category: 'quality', label_el: 'Πανοραμική θέα', label_en: 'Panoramic view', icon: 'Landscape', is_warning: false },
  { slug: 'near_summit', category: 'quality', label_el: 'Κοντά σε κορυφή', label_en: 'Near summit', icon: 'Terrain', is_warning: false },
  { slug: 'hiking_trail', category: 'quality', label_el: 'Σε σημαδεμένο μονοπάτι', label_en: 'On marked trail', icon: 'Hiking', is_warning: false },
  { slug: 'family_friendly', category: 'quality', label_el: 'Κατάλληλο για οικογένειες', label_en: 'Family friendly', icon: 'FamilyRestroom', is_warning: false },
  { slug: 'historic_inscription', category: 'quality', label_el: 'Με ιστορική επιγραφή', label_en: 'Has historic inscription', icon: 'HistoryEdu', is_warning: false },

  // heritage / data quality
  { slug: 'monument_protected', category: 'heritage', label_el: 'Προστατευόμενο μνημείο', label_en: 'Protected monument', icon: 'Shield', is_warning: false },
  { slug: 'relocated', category: 'heritage', label_el: 'Μετατοπισμένο', label_en: 'Relocated', icon: 'SwapHoriz', is_warning: false },
  { slug: 'disputed', category: 'heritage', label_el: 'Αμφισβητούμενο', label_en: 'Disputed', icon: 'HelpOutline', is_warning: false },
  { slug: 'featured', category: 'heritage', label_el: 'Προτεινόμενο', label_en: 'Featured', icon: 'Star', is_warning: false },
];

exports.up = (pgm) => {
  pgm.createTable('tags', {
    slug: { type: 'text', primaryKey: true },
    category: { type: 'text', notNull: true },
    label_el: { type: 'text', notNull: true },
    label_en: { type: 'text', notNull: true },
    icon: { type: 'text' },
    is_warning: { type: 'boolean', notNull: true, default: false },
    created_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createTable('point_tags', {
    point_id: {
      type: 'integer',
      notNull: true,
      references: '"points"',
      onDelete: 'CASCADE',
    },
    tag_slug: {
      type: 'text',
      notNull: true,
      references: '"tags"',
      onDelete: 'CASCADE',
    },
    added_by: {
      type: 'integer',
      references: '"users"',
      onDelete: 'SET NULL',
    },
    added_at: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.addConstraint('point_tags', 'point_tags_pkey', {
    primaryKey: ['point_id', 'tag_slug'],
  });
  pgm.createIndex('point_tags', 'tag_slug', { name: 'idx_point_tags_slug' });
  pgm.createIndex('point_tags', 'point_id', { name: 'idx_point_tags_point' });

  const esc = (s) => s.replace(/'/g, "''");
  for (const t of SEED_TAGS) {
    pgm.sql(
      `INSERT INTO tags (slug, category, label_el, label_en, icon, is_warning) ` +
      `VALUES ('${esc(t.slug)}', '${esc(t.category)}', '${esc(t.label_el)}', ` +
      `'${esc(t.label_en)}', ${t.icon ? `'${esc(t.icon)}'` : 'NULL'}, ${t.is_warning ? 'TRUE' : 'FALSE'});`
    );
  }
};

exports.down = (pgm) => {
  pgm.dropTable('point_tags');
  pgm.dropTable('tags');
};
