const pool = require('./database.service');

const listTags = async () => {
  const { rows } = await pool.query(
    `SELECT slug, category, label_el, label_en, icon, is_warning
     FROM tags
     ORDER BY category, slug`
  );
  return rows;
};

const getTagsForPoint = async (gysId) => {
  const { rows } = await pool.query(
    `SELECT t.slug, t.category, t.label_el, t.label_en, t.icon, t.is_warning,
            pt.added_at, pt.added_by
     FROM point_tags pt
     JOIN tags t ON t.slug = pt.tag_slug
     JOIN points p ON p.id = pt.point_id
     WHERE p.gys_id = $1
     ORDER BY t.category, t.slug`,
    [gysId]
  );
  return rows;
};

const addTagToPoint = async (gysId, tagSlug, userId) => {
  const { rows } = await pool.query(
    `INSERT INTO point_tags (point_id, tag_slug, added_by)
     SELECT p.id, $2, $3 FROM points p WHERE p.gys_id = $1
     ON CONFLICT (point_id, tag_slug) DO NOTHING
     RETURNING tag_slug`,
    [gysId, tagSlug, userId]
  );
  return rows[0] || null;
};

const removeTagFromPoint = async (gysId, tagSlug) => {
  const { rowCount } = await pool.query(
    `DELETE FROM point_tags pt
     USING points p
     WHERE pt.point_id = p.id AND p.gys_id = $1 AND pt.tag_slug = $2`,
    [gysId, tagSlug]
  );
  return rowCount > 0;
};

module.exports = {
  listTags,
  getTagsForPoint,
  addTagToPoint,
  removeTagFromPoint,
};
