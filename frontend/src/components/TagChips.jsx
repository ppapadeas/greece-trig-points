import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Chip, Typography } from '@mui/material';
import { iconLigature, groupBy, tagLabel, groupLabel } from '../lib/tags';

const MaterialIcon = ({ name, sx }) => (
  <span className="material-icons" style={{ fontSize: 16, lineHeight: 1, ...sx }}>{name}</span>
);

const chipSx = (warning) => ({
  height: 28,
  borderRadius: '14px',
  fontSize: 13,
  bgcolor: warning ? 'rgba(255,243,216,0.55)' : 'transparent',
  borderColor: warning ? 'rgba(184,137,42,0.55)' : 'rgba(28,26,20,0.23)',
  color: warning ? '#6b4f15' : 'inherit',
  '& .MuiChip-icon': {
    color: warning ? '#B8892A' : 'rgba(28,26,20,0.6)',
    marginLeft: '6px',
    marginRight: '-2px',
  },
});

const TagChips = ({ tags, dense = false }) => {
  const { i18n } = useTranslation();
  if (!tags || tags.length === 0) return null;
  const groups = groupBy(tags);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      {groups.map(group => (
        <Box key={group.id}>
          {!dense && (
            <Typography variant="overline" sx={{ display: 'block', color: 'text.secondary', fontSize: 9, letterSpacing: '0.08em', lineHeight: 1.6 }}>
              {groupLabel(group, i18n.language)}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: dense ? 0 : 0.25 }}>
            {group.items.map(tag => (
              <Chip
                key={tag.slug}
                size="small"
                variant="outlined"
                icon={<MaterialIcon name={iconLigature(tag.icon)} />}
                label={tagLabel(tag, i18n.language)}
                sx={chipSx(tag.is_warning)}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default TagChips;
