import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import { Drawer, Box, Typography, IconButton, Divider, Chip, CircularProgress, useMediaQuery, useTheme, Button, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigationIcon from '@mui/icons-material/Navigation';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const Sidebar = ({ point, open, onClose, onPointUpdate, onExited }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchReports = async () => {
    if (!point) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/api/points/${point.id}/reports`);
      setReports(response.data);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      setReports([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    setCopySuccess('');
    fetchReports();
  }, [point]);

  const handleReportSubmitted = (newReport) => {
    // Tell the parent (App) to update the point's status
    onPointUpdate(point.id, newReport.status);
    // Refresh the list of reports in the sidebar
    fetchReports();
  };

  const handleNavigate = () => {
    if (!point) return;
    const location = JSON.parse(point.location);
    const lat = location.coordinates[1];
    const lon = location.coordinates[0];
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
  };

  const handleCopy = () => {
    if (!point) return;
    const coordsText = `X: ${point.egsa87_x.toFixed(3)}, Y: ${point.egsa87_y.toFixed(3)}, Z: ${point.egsa87_z.toFixed(3)}`;
    navigator.clipboard.writeText(coordsText).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="right"
      open={open}
      onClose={onClose}
      onExited={onExited}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ width: isMobile ? '80vw' : 350, maxWidth: 400, padding: 3, overflowY: 'auto' }}>
        {point && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Typography variant="h5" component="div" sx={{ wordBreak: 'break-word' }}>
                {point.name || `Point ID: ${point.gys_id}`}
              </Typography>
              <IconButton onClick={onClose}><CloseIcon /></IconButton>
            </Box>
            <Divider />
            <Box sx={{ marginTop: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>GYS ID: {point.gys_id}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 2 }}>
                <Typography variant="body1"><strong>Status:</strong></Typography>
                <Chip label={point.status} color="primary" size="small" />
              </Box>
              <Button 
                variant="contained" 
                startIcon={<NavigationIcon />} 
                onClick={handleNavigate}
                fullWidth
              >
                Navigate to Point
              </Button>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Details</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Order:</strong> {point.point_order || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Elevation:</strong> {point.elevation ? `${point.elevation.toFixed(2)}m` : 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Prefecture:</strong> {point.prefecture || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Established:</strong> {point.year_established || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}><strong>Description:</strong> {point.description || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>EGSA87 Coordinates</Typography>
                  <Tooltip title="Copy Coordinates"><IconButton onClick={handleCopy} size="small"><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
              </Box>
              <Typography variant="body2" color="text.secondary"><strong>X:</strong> {point.egsa87_x ? point.egsa87_x.toFixed(3) : 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Y:</strong> {point.egsa87_y ? point.egsa87_y.toFixed(3) : 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Z:</strong> {point.egsa87_z ? point.egsa87_z.toFixed(3) : 'N/A'}</Typography>
              {copySuccess && <Typography variant="caption" color="success.main">{copySuccess}</Typography>}
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Map Sheet Info</Typography>
              <Typography variant="body2" color="text.secondary"><strong>ID:</strong> {point.map_sheet_id || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Name (GR):</strong> {point.map_sheet_name_gr || 'N/A'}</Typography>
              <Typography variant="body2" color="text.secondary"><strong>Name (EN):</strong> {point.map_sheet_name_en || 'N/A'}</Typography>
            </Box>
            
            {user && <ReportForm point={point} onReportSubmit={handleReportSubmitted} />}
            <Divider sx={{ marginY: 3 }} />
            
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ReportList reports={reports} />
            )}
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;