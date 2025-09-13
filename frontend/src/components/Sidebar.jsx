import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import { 
  Drawer, Box, Typography, IconButton, Divider, Chip, CircularProgress, 
  useMediaQuery, useTheme, Tooltip, Tabs, Tab, List, ListItem, 
  ListItemIcon, ListItemText 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigationIcon from '@mui/icons-material/Navigation';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MapIcon from '@mui/icons-material/Map';
import TerrainIcon from '@mui/icons-material/Terrain';

const Sidebar = ({ point, open, onClose, onPointUpdate, onExited }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  const handleNavigate = () => {
    if (!point) return;
    const location = JSON.parse(point.location);
    const lat = location.coordinates[1];
    const lon = location.coordinates[0];
    window.open(`https://www.google.com/maps?q=${lat},${lon}`, '_blank');
  };

  const handleCopy = () => {
    if (!point) return;
    const coordsText = `X: ${point.egsa87_x.toFixed(3)}, Y: ${point.egsa87_y.toFixed(3)}, Z: ${point.egsa87_z.toFixed(3)}`;
    navigator.clipboard.writeText(coordsText).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="right"
      open={open}
      onClose={onClose}
      TransitionProps={{ onExited: onExited }}
      ModalProps={{ keepMounted: true }}
      // This tells the Drawer to position itself correctly below the header
      sx={{
        '& .MuiDrawer-paper': {
          top: '64px', // Standard MUI AppBar height
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ width: isMobile ? '80vw' : 380, maxWidth: 450, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {point && (
          <>
            {/* --- TOP HEADER SECTION --- */}
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" component="div" sx={{ wordBreak: 'break-word', pr: 2 }}>
                  {point.name || `Point ID: ${point.gys_id}`}
                </Typography>
                <IconButton onClick={onClose}><CloseIcon /></IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>GYS ID: {point.gys_id}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography variant="body1"><strong>Status:</strong></Typography>
                <Chip label={point.status} color="primary" size="small" />
              </Box>
            </Box>

            {/* --- TABS --- */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                <Tab label="Details" />
                <Tab label={`Reporting (${reports.length})`} />
              </Tabs>
            </Box>

            {/* --- TAB CONTENT --- */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              {activeTab === 0 && (
                <List dense>
                  <DetailItem icon={<AssessmentIcon />} primary="Order" secondary={point.point_order} />
                  <DetailItem icon={<TerrainIcon />} primary="Elevation" secondary={point.elevation ? `${point.elevation.toFixed(2)}m` : null} />
                  <DetailItem icon={<MapIcon />} primary="Prefecture" secondary={point.prefecture} />
                  <DetailItem icon={<MapIcon />} primary="Established" secondary={point.year_established} />
                  <Divider sx={{ my: 1 }} />
                  <ListItem>
                    <ListItemText primary="Description" secondary={point.description || 'N/A'} secondaryTypographyProps={{ style: { whiteSpace: "pre-wrap" } }} />
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pl: 2, pr: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Coordinates</Typography>
                      <Box>
                        <Tooltip title="Navigate to Point">
                          <IconButton onClick={handleNavigate} color="primary"><NavigationIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Copy EGSA87 Coords">
                          <IconButton onClick={handleCopy}><ContentCopyIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      </Box>
                  </Box>
                  <List dense disablePadding>
                      <ListItem sx={{ pl: 4 }}>
                         <ListItemText primary={`X: ${point.egsa87_x ? point.egsa87_x.toFixed(3) : 'N/A'}`} />
                      </ListItem>
                      <ListItem sx={{ pl: 4 }}>
                         <ListItemText primary={`Y: ${point.egsa87_y ? point.egsa87_y.toFixed(3) : 'N/A'}`} />
                      </ListItem>
                       <ListItem sx={{ pl: 4 }}>
                         <ListItemText primary={`Z: ${point.egsa87_z ? point.egsa87_z.toFixed(3) : 'N/A'}`} />
                      </ListItem>
                  </List>
                  {copySuccess && <Typography variant="caption" color="success.main" sx={{ display: 'block', textAlign: 'right', pr: 2 }}>{copySuccess}</Typography>}
                  <Divider sx={{ my: 1 }} />
                  <ListItem>
                    <ListItemText primary="Map Sheet Info" />
                  </ListItem>
                   <ListItem sx={{ pl: 4 }}>
                     <ListItemText primary="ID" secondary={point.map_sheet_id || 'N/A'} />
                  </ListItem>
                  <ListItem sx={{ pl: 4 }}>
                     <ListItemText primary="Name (GR)" secondary={point.map_sheet_name_gr || 'N/A'} />
                  </ListItem>
                  <ListItem sx={{ pl: 4 }}>
                     <ListItemText primary="Name (EN)" secondary={point.map_sheet_name_en || 'N/A'} />
                  </ListItem>
                </List>
              )}
              {activeTab === 1 && (
                <>
                  {user && <ReportForm point={point} onReportSubmit={handleReportSubmitted} />}
                  {isLoadingReports
                    ? <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
                    : <ReportList reports={reports} />
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

export default Sidebar;