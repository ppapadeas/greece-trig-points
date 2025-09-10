import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import { Drawer, Box, Typography, IconButton, Divider, Chip, CircularProgress, useMediaQuery, useTheme, Button, Tooltip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NavigationIcon from '@mui/icons-material/Navigation'; // Icon for the navigate button
import ContentCopyIcon from '@mui/icons-material/ContentCopy'; // Icon for the copy button

const Sidebar = ({ point, open, onClose, onPointUpdate, onExited }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(''); // State for the "Copied!" message
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
    // Reset copy message when point changes
    setCopySuccess('');
    fetchReports();
  }, [point]);

  const handleReportSubmitted = (newReport) => {
    onPointUpdate(point.id, newReport.status);
    fetchReports();
  };

  // --- NEW FUNCTION: Navigate ---
  const handleNavigate = () => {
    if (!point) return;
    const location = JSON.parse(point.location);
    const lat = location.coordinates[1];
    const lon = location.coordinates[0];
    // This URL format works on both desktop and mobile to open Google Maps
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
  };

  // --- NEW FUNCTION: Copy to Clipboard ---
  const handleCopy = () => {
    if (!point) return;
    const coordsText = `X: ${point.egsa87_x.toFixed(3)}, Y: ${point.egsa87_y.toFixed(3)}, Z: ${point.egsa87_z.toFixed(3)}`;
    navigator.clipboard.writeText(coordsText).then(() => {
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 2000); // Hide message after 2 seconds
    });
  };

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'persistent'}
      anchor="right"
      open={open}
      onClose={onClose}
      onExited={onExited} // Correctly handle the exited state
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ width: isMobile ? '80vw' : 350, maxWidth: 400, padding: 3, overflowY: 'auto' }}>
        {point && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Typography variant="h5">Point Details</Typography>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Divider />
            <Box sx={{ marginTop: 2 }}>
              <Typography variant="body1" gutterBottom><strong>ID:</strong> {point.name}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 1 }}>
                <Typography variant="body1"><strong>Status:</strong></Typography>
                <Chip label={point.status} color="primary" size="small" />
              </Box>
              <Typography variant="body2" color="text.secondary">
                <strong>WGS84 Elevation:</strong> {point.elevation ? point.elevation.toFixed(2) + 'm' : 'N/A'}
              </Typography>
              
              {/* --- NEW NAVIGATION BUTTON --- */}
              <Button 
                variant="contained" 
                startIcon={<NavigationIcon />} 
                onClick={handleNavigate}
                fullWidth
                sx={{ mt: 2 }}
              >
                Navigate to Point
              </Button>
              
              <Divider sx={{ marginY: 2 }} />

              {/* --- NEW COPY TO CLIPBOARD SECTION --- */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>EGSA87 Coordinates</Typography>
                  <Tooltip title="Copy Coordinates">
                    <IconButton onClick={handleCopy} size="small">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
              </Box>
              <Typography variant="body2" color="text.secondary">
                <strong>X:</strong> {point.egsa87_x ? point.egsa87_x.toFixed(3) : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Y:</strong> {point.egsa87_y ? point.egsa87_y.toFixed(3) : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Z:</strong> {point.egsa87_z ? point.egsa87_z.toFixed(3) : 'N/A'}
              </Typography>
              {copySuccess && <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>{copySuccess}</Typography>}
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