import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box, Paper, Typography, Button, IconButton,
  ToggleButtonGroup, ToggleButton, Chip, Collapse, useMediaQuery, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import apiClient from '../api';
import { iconLigature, groupBy, tagLabel, groupLabel } from '../lib/tags';

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};
const STATUSES = ['OK', 'DAMAGED', 'UNKNOWN', 'MISSING', 'DESTROYED'];
const ORDERS = ['I', 'II', 'III', 'IV'];
const BASE_LAYERS = ['protomaps', 'topo', 'satellite'];

const StatusPill = ({ status, active, onClick, t }) => (
  <Box
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      height: 26,
      px: 1.25,
      borderRadius: '13px',
      border: '1px solid',
      borderColor: active ? STATUS_COLORS[status] : 'rgba(28,26,20,0.23)',
      bgcolor: active ? `${STATUS_COLORS[status]}24` : 'transparent',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'background-color 200ms cubic-bezier(0.4,0,0.2,1)',
      '&:hover': { bgcolor: active ? `${STATUS_COLORS[status]}36` : 'rgba(28,26,20,0.06)' },
    }}
  >
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS[status], opacity: active ? 1 : 0.45 }} />
    <Typography sx={{ fontSize: 11, fontWeight: 500, color: active ? 'inherit' : 'rgba(28,26,20,0.62)' }}>
      {t(`status.${status}`)}
    </Typography>
  </Box>
);

const OrderChip = ({ order, active, onClick }) => (
  <Box
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    sx={{
      flex: 1,
      height: 26,
      borderRadius: '4px',
      border: '1px solid',
      borderColor: active ? '#1C1A14' : 'rgba(28,26,20,0.23)',
      bgcolor: active ? 'rgba(28,26,20,0.06)' : 'transparent',
      color: active ? '#1C1A14' : 'rgba(28,26,20,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', userSelect: 'none',
      fontFamily: 'monospace', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      '&:hover': { bgcolor: 'rgba(28,26,20,0.06)' },
    }}
  >
    {order}
  </Box>
);

// Inactive chips are always the same neutral outlined treatment regardless of
// warning status — the warning-ness signal lives in the sidebar banner, not in
// the filter row. Active state still differentiates warning (amber) vs. normal
// (ink) so users can see what kind of tag they're filtering by.
const SmallTagChip = ({ tag, active, onClick, lang }) => (
  <Chip
    size="small"
    onClick={onClick}
    icon={<span className="material-icons" style={{ fontSize: 14, lineHeight: 1 }}>{iconLigature(tag.icon)}</span>}
    label={tagLabel(tag, lang)}
    variant={active ? 'filled' : 'outlined'}
    sx={{
      height: 24,
      fontSize: 11,
      borderRadius: '12px',
      bgcolor: active
        ? (tag.is_warning ? '#B8892A' : '#1C1A14')
        : 'transparent',
      color: active
        ? '#F7F2E8'
        : 'inherit',
      borderColor: 'rgba(28,26,20,0.23)',
      '& .MuiChip-icon': { marginLeft: '6px', marginRight: '-2px', color: 'inherit' },
    }}
  />
);

const MapControls = ({ filters, onFilterChange, onBaseLayerChange }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tagsOpen, setTagsOpen] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [baseLayer, setBaseLayer] = useState(filters.baseLayer || 'protomaps');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const p = apiClient.get('/api/points/tags');
    if (p && typeof p.then === 'function') {
      p.then(r => setAllTags(r.data)).catch(() => {});
    }
  }, []);

  const statuses = filters.statuses || STATUSES;
  const orders = filters.orders || ORDERS;
  const activeTags = filters.tags || [];

  const toggleStatus = (s) => {
    const next = statuses.includes(s) ? statuses.filter(x => x !== s) : [...statuses, s];
    onFilterChange('statuses', next);
  };
  const toggleOrder = (o) => {
    const next = orders.includes(o) ? orders.filter(x => x !== o) : [...orders, o];
    onFilterChange('orders', next);
  };
  const toggleTag = (slug) => {
    const next = activeTags.includes(slug) ? activeTags.filter(x => x !== slug) : [...activeTags, slug];
    onFilterChange('tags', next);
  };

  const handleBaseLayerChange = (_, value) => {
    if (!value) return;
    setBaseLayer(value);
    onBaseLayerChange(value);
  };

  const isDirty =
    statuses.length < STATUSES.length ||
    orders.length < ORDERS.length ||
    activeTags.length > 0;

  const reset = () => {
    onFilterChange('statuses', STATUSES);
    onFilterChange('orders', ORDERS);
    onFilterChange('tags', []);
    setTagsOpen(false);
  };

  const groups = groupBy(allTags);

  // Mobile: collapsed-by-default capsule that expands on tap
  if (isMobile && collapsed) {
    return (
      <Paper
        elevation={2}
        sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, bgcolor: 'rgba(247,242,232,0.95)', borderRadius: 1 }}
      >
        <IconButton onClick={() => setCollapsed(false)} aria-label={t('controls.filters')}>
          <TuneIcon />
        </IconButton>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 1000,
        width: isMobile ? 'calc(100vw - 24px)' : 268,
        maxHeight: 'calc(100% - 24px)',
        bgcolor: 'rgba(247,242,232,0.95)',
        borderRadius: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TuneIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>{t('controls.filters')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          {isDirty && (
            <Button size="small" onClick={reset} sx={{ fontSize: 11, color: '#C2652A', textTransform: 'uppercase', minWidth: 'auto' }}>
              {t('controls.reset')}
            </Button>
          )}
          {isMobile && (
            <IconButton size="small" onClick={() => setCollapsed(true)} aria-label="Close">
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, pb: 1.5 }}>
        {/* Status pills */}
        <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(28,26,20,0.65)', textTransform: 'uppercase', mb: 0.5 }}>
          {t('controls.status')}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
          {STATUSES.map(s => (
            <StatusPill key={s} status={s} active={statuses.includes(s)} onClick={() => toggleStatus(s)} t={t} />
          ))}
        </Box>

        {/* Order chips */}
        <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(28,26,20,0.65)', textTransform: 'uppercase', mb: 0.5 }}>
          {t('controls.order')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
          {ORDERS.map(o => (
            <OrderChip key={o} order={o} active={orders.includes(o)} onClick={() => toggleOrder(o)} />
          ))}
        </Box>

        {/* Tags accordion */}
        <Box
          role="button"
          tabIndex={0}
          onClick={() => setTagsOpen(!tagsOpen)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setTagsOpen(!tagsOpen)}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', userSelect: 'none', mb: 0.5 }}
        >
          <ExpandMoreIcon sx={{ fontSize: 18, transition: 'transform 200ms', transform: tagsOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
          <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{t('controls.tags')}</Typography>
          {activeTags.length > 0 && (
            <Box sx={{ ml: 'auto', minWidth: 18, height: 18, borderRadius: 9, bgcolor: '#C2652A', color: '#F7F2E8', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 0.75 }}>
              {activeTags.length}
            </Box>
          )}
        </Box>
        <Collapse in={tagsOpen} timeout={320}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 1 }}>
            {groups.map(group => (
              <Box key={group.id}>
                <Typography sx={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(28,26,20,0.65)', textTransform: 'uppercase', mb: 0.5 }}>
                  {groupLabel(group, i18n.language)} ({group.items.filter(t => activeTags.includes(t.slug)).length}/{group.items.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {group.items.map(tag => (
                    <SmallTagChip key={tag.slug} tag={tag} active={activeTags.includes(tag.slug)} onClick={() => toggleTag(tag.slug)} lang={i18n.language} />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>

      {/* Base layer footer */}
      <Box sx={{ borderTop: '1px solid rgba(28,26,20,0.08)', px: 1.5, py: 1 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(28,26,20,0.65)', textTransform: 'uppercase', mb: 0.5 }}>
          {t('controls.base')}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={baseLayer}
          onChange={handleBaseLayerChange}
          fullWidth
          sx={{ '& .MuiToggleButton-root': { fontSize: 11, py: 0.25, textTransform: 'none' } }}
        >
          {BASE_LAYERS.map(bl => (
            <ToggleButton key={bl} value={bl}>
              {t(`controls.base.${bl}`)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Paper>
  );
};

export default MapControls;
