import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import { iconLigature, tagLabel } from '../lib/tags';

// Severe variant: military / border / dangerous → soft-red palette.
// Standard variant: any other warning → parchment-yellow palette.
const SEVERE = new Set(['inaccessible:military', 'border_zone', 'dangerous_terrain']);

const WarningBanner = ({ tags }) => {
  const { t, i18n } = useTranslation();
  const warningTags = (tags || []).filter(tg => tg.is_warning);
  if (warningTags.length === 0) return null;

  const severe = warningTags.some(tg => SEVERE.has(tg.slug));
  const head = warningTags[0];
  const moreCount = warningTags.length - 1;

  const colors = severe
    ? { bg: '#fde2e2', border: '#8B1A1A', icon: '#8B1A1A' }
    : { bg: '#fef3d6', border: '#B8892A', icon: '#B8892A' };

  return (
    <Box
      role="alert"
      sx={{
        bgcolor: colors.bg,
        borderLeft: `3px solid ${colors.border}`,
        borderBottom: '1px solid rgba(28,26,20,0.08)',
        px: '14px',
        py: '12px',
        display: 'flex',
        gap: 1.25,
        alignItems: 'flex-start',
      }}
    >
      <span className="material-icons" style={{ color: colors.icon, fontSize: 20, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>
        {iconLigature(head.icon)}
      </span>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: '3px' }}>
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#1C1A14',
            }}
          >
            {tagLabel(head, i18n.language)}
          </Typography>
          {moreCount > 0 && (
            <Typography sx={{ color: 'rgba(28,26,20,0.45)', fontSize: 10, fontFamily: 'monospace' }}>
              +{moreCount}
            </Typography>
          )}
        </Box>
        <Typography sx={{ fontStyle: 'italic', fontSize: 12, lineHeight: 1.4, color: 'rgba(28,26,20,0.7)' }}>
          {t('sidebar.warningDesc')}
        </Typography>
      </Box>
    </Box>
  );
};

export default WarningBanner;
