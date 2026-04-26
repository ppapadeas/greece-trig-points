import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Chip, Typography } from '@mui/material';
import { iconLigature, groupBy, tagLabel, groupLabel } from '../lib/tags';

// Inline tag picker — used as a section inside ReportForm.
// Renders all tags grouped by category. Active tags are filled; inactive are
// outlined. Warning tags use the warning palette in both states.
const TagPickerInline = ({ allTags, selected, onChange }) => {
  const { i18n } = useTranslation();
  const sset = new Set(selected || []);
  const groups = groupBy(allTags);

  const toggle = (slug) => {
    const next = sset.has(slug)
      ? (selected || []).filter(s => s !== slug)
      : [...(selected || []), slug];
    onChange(next);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {groups.map(group => (
        <Box key={group.id}>
          <Typography sx={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: 'text.secondary', textTransform: 'uppercase', mb: 0.5 }}>
            {groupLabel(group, i18n.language)}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {group.items.map(tag => {
              const active = sset.has(tag.slug);
              return (
                <Chip
                  key={tag.slug}
                  size="small"
                  onClick={() => toggle(tag.slug)}
                  variant={active ? 'filled' : 'outlined'}
                  icon={<span className="material-icons" style={{ fontSize: 14, lineHeight: 1 }}>{iconLigature(tag.icon)}</span>}
                  label={tagLabel(tag, i18n.language)}
                  sx={{
                    height: 26, fontSize: 12, borderRadius: '13px',
                    // Inactive: always outlined neutral. Active: ink for normal, amber for warning.
                    bgcolor: active ? (tag.is_warning ? '#B8892A' : '#1C1A14') : 'transparent',
                    color: active ? '#F7F2E8' : 'inherit',
                    borderColor: 'rgba(28,26,20,0.23)',
                    '& .MuiChip-icon': { marginLeft: '6px', marginRight: '-2px', color: 'inherit' },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default TagPickerInline;
