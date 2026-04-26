import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import { iconLigature, tagLabel } from '../lib/tags';

// Banner shown above point details when any of the point's tags is_warning=true.
// Aggregates them into one strip so the user sees the high-priority signals
// without scrolling.
const WarningBanner = ({ tags }) => {
  const { t, i18n } = useTranslation();
  const warningTags = (tags || []).filter(tg => tg.is_warning);
  if (warningTags.length === 0) return null;

  return (
    <Box
      role="alert"
      sx={{
        bgcolor: '#fef3d6',
        borderLeft: '3px solid #B8892A',
        px: 2, py: 1.25,
        display: 'flex',
        gap: 1.25,
        alignItems: 'flex-start',
      }}
    >
      <span className="material-icons" style={{ color: '#B8892A', fontSize: 22, lineHeight: 1, marginTop: 1 }}>
        gpp_maybe
      </span>
      <Box sx={{ flex: 1 }}>
        <Typography
          sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b4f15' }}
        >
          {t('sidebar.warningTitle')}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.25 }}>
          {warningTags.map(tg => (
            <Box key={tg.slug} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <span className="material-icons" style={{ fontSize: 16, color: '#B8892A' }}>{iconLigature(tg.icon)}</span>
              <Typography sx={{ fontStyle: 'italic', fontSize: 12, color: '#6b4f15' }}>
                {tagLabel(tg, i18n.language)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default WarningBanner;
