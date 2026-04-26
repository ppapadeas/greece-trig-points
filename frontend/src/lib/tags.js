// Tag helpers — maps stored MUI-style PascalCase icon names to Material Icons
// font ligatures (which is what's loaded in index.html), plus tag grouping.

// MUI PascalCase → Material Icons ligature snake_case.
// Most names work after simple snake_casing; broken or non-existent names get a
// curated fallback so the chip never renders an empty box.
const ICON_FALLBACKS = {
  OffRoad: 'directions_car', // not a real icon — fall back to car
};

export function iconLigature(name) {
  if (!name) return 'label';
  if (ICON_FALLBACKS[name]) return ICON_FALLBACKS[name];
  // PascalCase → snake_case
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

export const TAG_GROUPS = [
  { id: 'access',   gr: 'Πρόσβαση',     en: 'Access' },
  { id: 'approach', gr: 'Προσέγγιση',   en: 'Approach' },
  { id: 'quality',  gr: 'Ποιότητα',     en: 'Quality' },
  { id: 'heritage', gr: 'Κληρονομιά',   en: 'Heritage / Data' },
];

export function groupBy(tags) {
  return TAG_GROUPS.reduce((acc, g) => {
    const items = (tags || []).filter(t => t.category === g.id);
    if (items.length) acc.push({ ...g, items });
    return acc;
  }, []);
}

export function tagLabel(tag, lang) {
  if (!tag) return '';
  return lang && lang.startsWith('en') ? tag.label_en : tag.label_el;
}

export function groupLabel(group, lang) {
  return lang && lang.startsWith('en') ? group.en : group.gr;
}
