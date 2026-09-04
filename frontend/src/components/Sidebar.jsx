import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import PhotoSlider from './PhotoSlider';
import WarningBanner from './WarningBanner';
import TagChips from './TagChips';
import {
  Drawer, Box, Typography, IconButton, Button, CircularProgress,
  Tooltip, Toolbar, Menu, MenuItem, Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import NavigationIcon from '@mui/icons-material/Navigation';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';

// Status palette — matches the bright map colors so badge ↔ marker reads consistent
const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const StatusBadge = ({ status, t }) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.UNKNOWN;
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.6,
        px: '7px',
        py: '2px',
        borderRadius: 0.25,
        fontFamily: 'monospace',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color,
        bgcolor: `${color}1F`,
        border: `1px solid ${color}40`,
      }}
    >
      {t(`status.${status}`)}
    </Box>
  );
};

const FactRow = ({ k, v, tip }) => {
  const row = (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      py: '7px',
      borderBottom: '1px solid rgba(28,26,20,0.08)',
      '&:last-child': { borderBottom: 'none' },
    }}
  >
    <Typography
      component="span"
      sx={{
        fontFamily: 'monospace',
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(28,26,20,0.45)',
      }}
    >
      {k}
    </Typography>
    <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: 11, color: '#1C1A14', textAlign: 'right' }}>
      {v}
    </Typography>
  </Box>
  );
  if (!tip) return row;
  return (
    <Tooltip title={tip} arrow placement="top" enterTouchDelay={0} leaveTouchDelay={3000}>
      {row}
    </Tooltip>
  );
};

const Sidebar = ({ point, open, onClose, onPointUpdate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  const [navAnchorEl, setNavAnchorEl] = useState(null);
  const [reportFormOpen, setReportFormOpen] = useState(false);

  const photos = useMemo(() => {
    if (!reports) return [];
    return reports.flatMap(r => r.image_urls?.length ? r.image_urls : (r.image_url ? [r.image_url] : []));
  }, [reports]);

  const fetchReports = async () => {
    if (!point) return;
    setIsLoadingReports(true);
    try {
      const response = await apiClient.get(`/api/points/${point.id}/reports`);
      setReports(response.data);
    } catch (error) {
      console.error('Failed to fetch reports', error);
      setReports([]);
    }
    setIsLoadingReports(false);
  };

  useEffect(() => {
    if (point) {
      setCopySuccess('');
      setShareSuccess('');
      setReportFormOpen(false);
      fetchReports();
    }
  }, [point]);

  const handleReportSubmitted = (newReport) => {
    onPointUpdate(point.id, newReport.status);
    fetchReports();
    setReportFormOpen(false);
  };

  const handleNavOpen = (event) => setNavAnchorEl(event.currentTarget);
  const handleNavClose = () => setNavAnchorEl(null);

  const handleNavigate = (provider) => {
    if (!point) return;
    const location = JSON.parse(point.location);
    const lat = location.coordinates[1];
    const lon = location.coordinates[0];
    if (provider === 'google') {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
    } else {
      window.open(`https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lon}`, '_blank');
    }
    handleNavClose();
  };

  const handleCopy = () => {
    if (!point) return;
    const coordsText = `X: ${point.egsa87_x?.toFixed(2)}, Y: ${point.egsa87_y?.toFixed(2)}, Z: ${point.egsa87_z?.toFixed(2)}`;
    navigator.clipboard.writeText(coordsText).then(() => {
      setCopySuccess(t('sidebar.copied'));
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleShare = async () => {
    if (!point) return;
    const url = `${window.location.origin}/point/${point.gys_id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `GYS ${point.gys_id}`, text: point.name || `Point ${point.gys_id}`, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareSuccess(t('sidebar.linkCopied'));
      setTimeout(() => setShareSuccess(''), 2000);
    }
  };

  // Format helpers
  const fmtCoord = (deg, isLat) => {
    if (deg == null) return '—';
    const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
    const abs = Math.abs(deg);
    const d = Math.floor(abs);
    const mFloat = (abs - d) * 60;
    const m = Math.floor(mFloat);
    const s = ((mFloat - m) * 60).toFixed(2);
    return `${d}°${String(m).padStart(2, '0')}′${s}″${dir}`;
  };

  const lat = point?.location ? JSON.parse(point.location).coordinates[1] : null;
  const lon = point?.location ? JSON.parse(point.location).coordinates[0] : null;

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      sx={{
        width: 380,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 380,
          boxSizing: 'border-box',
          bgcolor: '#EDE4D3', // limestone
          borderLeft: '1px solid rgba(28,26,20,0.10)',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {point && (
          <>
            {/* Dark ink header */}
            <Box sx={{ bgcolor: '#1C1A14', px: '20px', pt: '16px', pb: '14px', position: 'relative' }}>
              <IconButton
                onClick={onClose}
                size="small"
                aria-label="Close"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  width: 24,
                  height: 24,
                  borderRadius: 0.25,
                  bgcolor: 'rgba(247,242,232,0.08)',
                  color: '#F7F2E8',
                  '&:hover': { bgcolor: 'rgba(247,242,232,0.16)' },
                }}
              >
                <CloseIcon fontSize="inherit" sx={{ fontSize: 16 }} />
              </IconButton>
              <Typography
                sx={{
                  fontFamily: 'monospace',
                  fontSize: 10,
                  fontWeight: 500,
                  letterSpacing: '0.08em',
                  color: '#C2652A',
                }}
              >
                GYS {point.gys_id}
              </Typography>
              <Typography
                component="h2"
                sx={{
                  color: '#F7F2E8',
                  fontFamily: 'IBM Plex Serif, Georgia, serif',
                  fontWeight: 350,
                  fontSize: 24,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  mt: 0.5,
                  mb: 1,
                  pr: 4,
                  wordBreak: 'break-word',
                }}
              >
                {point.name || `Point ${point.gys_id}`}
              </Typography>
              <StatusBadge status={point.status} t={t} />
              {shareSuccess && (
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#5A8A6A' }}>
                  {shareSuccess}
                </Typography>
              )}
            </Box>

            {/* Warning banner — fires only when any tag has is_warning */}
            <WarningBanner tags={point.tags} />

            {/* Photo slider */}
            {photos.length > 0 && (
              <Box>
                <PhotoSlider photos={photos} />
              </Box>
            )}

            {/* Fact rows */}
            <Box sx={{ px: '20px', pt: '12px', pb: '8px' }}>
              <FactRow k={t('sidebar.factLat')} v={lat != null ? fmtCoord(lat, true) : '—'} />
              <FactRow k={t('sidebar.factLon')} v={lon != null ? fmtCoord(lon, false) : '—'} />
              <FactRow k={t('sidebar.factElev')} v={point.elevation != null ? `${point.elevation.toFixed(2)} m` : '—'} />
              <FactRow k="Datum" v="ΕΓΣΑ87 / GGRS87" />
              <FactRow k={t('sidebar.factOrder')} v={point.point_order || '—'} />
              {point.description?.trim() && (
                <FactRow k={t('sidebar.factDescription')} v={point.description.trim()} tip={t('sidebar.factDescriptionTip')} />
              )}
              {point.prefecture && <FactRow k={t('sidebar.factPrefecture')} v={point.prefecture} />}
              {point.year_established && <FactRow k={t('sidebar.factEstablished')} v={point.year_established} />}
              {point.map_sheet_name_gr && <FactRow k={t('sidebar.factMapSheet')} v={point.map_sheet_name_gr} />}
            </Box>

            {/* EGSA87 coordinates strip — secondary, mono, with copy + navigate */}
            <Box
              sx={{
                px: '20px',
                py: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(28,26,20,0.08)',
                borderBottom: '1px solid rgba(28,26,20,0.08)',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: 9,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(28,26,20,0.45)',
                  }}
                >
                  ΕΓΣΑ87
                </Typography>
                <Typography sx={{ fontFamily: 'monospace', fontSize: 11, color: '#1C1A14' }}>
                  {point.egsa87_x?.toFixed(2)} · {point.egsa87_y?.toFixed(2)} · {point.egsa87_z?.toFixed(2)}
                </Typography>
              </Box>
              <Box>
                <Tooltip title={t('sidebar.navigate')}>
                  <IconButton size="small" onClick={handleNavOpen}>
                    <NavigationIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Menu anchorEl={navAnchorEl} open={Boolean(navAnchorEl)} onClose={handleNavClose}>
                  <MenuItem onClick={() => handleNavigate('google')}>Google Maps</MenuItem>
                  <MenuItem onClick={() => handleNavigate('osm')}>OpenStreetMap</MenuItem>
                </Menu>
                <Tooltip title={t('sidebar.copyTooltip')}>
                  <IconButton size="small" onClick={handleCopy}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            {copySuccess && (
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', pr: 2, color: '#5A8A6A' }}>
                {copySuccess}
              </Typography>
            )}

            {/* Tag chips — non-warning only (warnings live in the banner) */}
            {point.tags && point.tags.some(tg => !tg.is_warning) && (
              <Box sx={{ px: '20px', pt: '14px', pb: '8px' }}>
                <Typography
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: 9,
                    fontWeight: 500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'rgba(28,26,20,0.45)',
                    mb: '6px',
                  }}
                >
                  {t('sidebar.tags')}
                </Typography>
                <TagChips tags={point.tags} />
              </Box>
            )}

            {/* Report history */}
            {reports.length > 0 && (
              <Box sx={{ px: '20px', pt: '14px', pb: '8px' }}>
                <ReportList reports={reports} pointId={point.id} onReportsChange={fetchReports} />
              </Box>
            )}
            {isLoadingReports && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                <CircularProgress size={20} />
              </Box>
            )}

            {/* Action buttons */}
            <Box sx={{ px: '20px', pt: '12px', pb: '24px', display: 'flex', gap: 1 }}>
              {user && (
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setReportFormOpen(!reportFormOpen)}
                  sx={{
                    bgcolor: '#C2652A',
                    color: '#F7F2E8',
                    fontFamily: 'monospace',
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    boxShadow: 'none',
                    py: '8px',
                    '&:hover': { bgcolor: '#A8511F', boxShadow: 'none' },
                  }}
                >
                  {reportFormOpen ? t('sidebar.cancelReport') : t('sidebar.report')}
                </Button>
              )}
              <Tooltip title={t('sidebar.share')}>
                <IconButton
                  onClick={handleShare}
                  aria-label={t('sidebar.share')}
                  sx={{
                    color: '#1C1A14',
                    border: '1px solid rgba(28,26,20,0.20)',
                    borderRadius: 1,
                    width: 40,
                    height: 40,
                    '&:hover': { bgcolor: 'rgba(28,26,20,0.04)', borderColor: 'rgba(28,26,20,0.30)' },
                  }}
                >
                  <ShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Inline report form — hidden by default, expands when "+ REPORT" clicked */}
            <Collapse in={reportFormOpen} timeout={320}>
              <Box sx={{ px: '20px', pb: '20px' }}>
                {user && (
                  <ReportForm
                    point={point}
                    onReportSubmit={handleReportSubmitted}
                    onCancel={() => setReportFormOpen(false)}
                  />
                )}
              </Box>
            </Collapse>

          </>
        )}
      </Box>
    </Drawer>
  );
};

export default React.memo(Sidebar);
