import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import ReportForm from './ReportForm';
import ReportList from './ReportList';
import { Drawer, Box, Typography, IconButton, Divider, Chip, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const Sidebar = ({ point, onClose, onPointUpdate }) => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    fetchReports();
  }, [point]);

  const handleReportSubmitted = (newReport) => {
    onPointUpdate(point.id, newReport.status);
    fetchReports();
  };

  return (
    <Drawer anchor="right" open={Boolean(point)} onClose={onClose}>
      <Box sx={{ width: 350, padding: 3, overflowY: 'auto' }}>
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
              <Divider sx={{ marginY: 2 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>EGSA87 X:</strong> {point.egsa87_x ? point.egsa87_x.toFixed(3) : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>EGSA87 Y:</strong> {point.egsa87_y ? point.egsa87_y.toFixed(3) : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>EGSA87 Z:</strong> {point.egsa87_z ? point.egsa87_z.toFixed(3) : 'N/A'}
              </Typography>
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