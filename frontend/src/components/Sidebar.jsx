import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import PhotoSlider from './PhotoSlider';
import {
  Drawer, Box, Typography, IconButton, Divider, Chip, CircularProgress,
  Tooltip, Tabs, Tab, List, ListItem,
  ListItemIcon, ListItemText, Toolbar, Menu, MenuItem
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Link from '@mui/material/Link';
import CloseIcon from '@mui/icons-material/Close';
import ShareIcon from '@mui/icons-material/Share';
import NavigationIcon from '@mui/icons-material/Navigation';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MapIcon from '@mui/icons-material/Map';
import TerrainIcon from '@mui/icons-material/Terrain';

const Sidebar = ({ point, open, onClose, onPointUpdate }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [navAnchorEl, setNavAnchorEl] = useState(null);
  const photos = React.useMemo(() => {
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
      console.error("Failed to fetch reports", error);
      setReports([]);
    }
    setIsLoadingReports(false);
  };

  useEffect(() => {
    if (point) {
        setCopySuccess('');
        setActiveTab(0);
        fetchReports();
    }
  }, [point]);

  const handleReportSubmitted = (newReport) => {
    onPointUpdate(point.id, newReport.status);
    fetchReports();
    setActiveTab(1);
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
    const coordsText = `X: ${point.egsa87_x.toFixed(2)}, Y: ${point.egsa87_y.toFixed(2)}, Z: ${point.egsa87_z.toFixed(2)}`;
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'OK': return 'success';
      case 'DAMAGED': return 'warning';
      case 'DESTROYED': return 'error';
      case 'MISSING': return 'default';
      default: return 'info';
    }
  };

  const DetailItem = ({ icon, primary, secondary }) => (
    secondary ? (
      <ListItem>
        <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
        <ListItemText primary={primary} secondary={secondary} />
      </ListItem>
    ) : null
  );

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
        },
      }}
    >
      <Toolbar />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {point && (
          <>
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div" sx={{ wordBreak: 'break-word', pr: 2 }}>
                  {point.name || `GYS ${point.gys_id}`}
                </Typography>
                <Box>
                  <Tooltip title={t('sidebar.share')}>
                    <IconButton onClick={handleShare}><ShareIcon /></IconButton>
                  </Tooltip>
                  <IconButton onClick={onClose}><CloseIcon /></IconButton>
                </Box>
              </Box>
              {shareSuccess && <Typography variant="caption" color="success.main">{shareSuccess}</Typography>}
              <Typography variant="body2" color="text.secondary" gutterBottom>{t('sidebar.gysId')}: {point.gys_id}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body1"><strong>{t('sidebar.status')}:</strong></Typography>
                <Chip label={point.status} color={getStatusColor(point.status)} size="small" />
              </Box>
              {reports.length > 0 && (() => {
                const first = reports[reports.length - 1];
                return (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {t('sidebar.firstReporter')}{' '}
                    <Link component={RouterLink} to={`/profile/${first.user_id}`} underline="hover">
                      {first.display_name}
                    </Link>
                  </Typography>
                );
              })()}
            </Box>

            {photos.length > 0 && (
                <Box sx={{ px: 1 }}>
                    <PhotoSlider photos={photos} />
                </Box>
            )}
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                <Tab label={t('sidebar.detailsTab')} />
                <Tab label={t('sidebar.reportingTab', { count: reports.length })} />
              </Tabs>
            </Box>

            <Box sx={{ p: 2 }}>
              {activeTab === 0 && (
                <List dense>
                  <DetailItem icon={<AssessmentIcon />} primary={t('sidebar.order')} secondary={point.point_order} />
                  <DetailItem icon={<TerrainIcon />} primary={t('sidebar.elevation')} secondary={point.elevation ? `${point.elevation.toFixed(2)}m` : null} />
                  <DetailItem icon={<MapIcon />} primary={t('sidebar.prefecture')} secondary={point.prefecture} />
                  <DetailItem icon={<MapIcon />} primary={t('sidebar.established')} secondary={point.year_established} />
                  <Divider sx={{ my: 1 }} />
                  <ListItem>
                    <ListItemText primary={t('sidebar.description')} secondary={point.description || 'N/A'} secondaryTypographyProps={{ style: { whiteSpace: "pre-wrap" } }} />
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 2, pr: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{t('sidebar.coordinatesTitle')}</Typography>
                      <Box>
                        <Tooltip title={t('sidebar.navigate')}>
                          <IconButton onClick={handleNavOpen} color="primary"><NavigationIcon /></IconButton>
                        </Tooltip>
                        <Menu anchorEl={navAnchorEl} open={Boolean(navAnchorEl)} onClose={handleNavClose}>
                          <MenuItem onClick={() => handleNavigate('google')}>Google Maps</MenuItem>
                          <MenuItem onClick={() => handleNavigate('osm')}>OpenStreetMap</MenuItem>
                        </Menu>
                        <Tooltip title={t('sidebar.copyTooltip')}>
                          <IconButton onClick={handleCopy}><ContentCopyIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                  </Box>
                  <List dense disablePadding>
                      <ListItem sx={{ pl: 4 }}>
                         <ListItemText primary={`${t('sidebar.coordX')}: ${point.egsa87_x ? point.egsa87_x.toFixed(2) : 'N/A'}`} />
                      </ListItem>
                      <ListItem sx={{ pl: 4 }}>
                         <ListItemText primary={`${t('sidebar.coordY')}: ${point.egsa87_y ? point.egsa87_y.toFixed(2) : 'N/A'}`} />
                      </ListItem>
                       <ListItem sx={{ pl: 4 }}>
                         <ListItemText primary={`${t('sidebar.coordZ')}: ${point.egsa87_z ? point.egsa87_z.toFixed(2) : 'N/A'}`} />
                      </ListItem>
                  </List>
                  {copySuccess && <Typography variant="caption" color="success.main" sx={{ display: 'block', textAlign: 'right', pr: 2 }}>{copySuccess}</Typography>}
                  <Divider sx={{ my: 1 }} />
                  <ListItem>
                    <ListItemText primary={t('sidebar.mapSheetTitle')} />
                  </ListItem>
                   <ListItem sx={{ pl: 4 }}>
                     <ListItemText primary={t('sidebar.mapSheetId')} secondary={point.map_sheet_id || 'N/A'} />
                  </ListItem>
                  <ListItem sx={{ pl: 4 }}>
                     <ListItemText primary={t('sidebar.mapSheetNameGr')} secondary={point.map_sheet_name_gr || 'N/A'} />
                  </ListItem>
                  <ListItem sx={{ pl: 4 }}>
                     <ListItemText primary={t('sidebar.mapSheetNameEn')} secondary={point.map_sheet_name_en || 'N/A'} />
                  </ListItem>
                </List>
              )}
              {activeTab === 1 && (
                <>
                  {user && <ReportForm point={point} onReportSubmit={handleReportSubmitted} />}
                  {isLoadingReports 
                    ? <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                    : <ReportList reports={reports} pointId={point.id} onReportsChange={fetchReports} />
                  }
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default React.memo(Sidebar);