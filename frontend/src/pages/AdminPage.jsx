import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Box, Typography, CircularProgress, IconButton, Tooltip, Tabs, Tab } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import PointsTable from '../components/PointsTable';

// We extract the original reports table into its own component for cleanliness
const ReportsTable = ({ reports, onApprove, onReject }) => {
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'point_name', headerName: 'Point Name', width: 250 },
    { field: 'user_name', headerName: 'Submitted By', width: 200 },
    { field: 'status', headerName: 'New Status', width: 130 },
    { field: 'comment', headerName: 'Comment', flex: 1 },
    { 
      field: 'created_at', 
      headerName: 'Date', 
      width: 150,
      valueGetter: (value) => value && new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Approve Report"><IconButton color="success" onClick={() => onApprove(params.id)}><CheckCircleIcon /></IconButton></Tooltip>
          <Tooltip title="Reject (Delete) Report"><IconButton color="error" onClick={() => onReject(params.id)}><DeleteIcon /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <DataGrid
      rows={reports}
      columns={columns}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 25 } } }}
      pageSizeOptions={[10, 25, 50]}
    />
  );
};

const AdminPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/admin/reports');
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleApprove = async (id) => {
    try {
      await apiClient.post(`/api/admin/reports/${id}/approve`);
      setReports((prevReports) => prevReports.filter((report) => report.id !== id));
    } catch (error) {
      console.error("Failed to approve report:", error);
      alert("Failed to approve report.");
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await apiClient.delete(`/api/admin/reports/${id}`);
        setReports((prevReports) => prevReports.filter((report) => report.id !== id));
      } catch (error) {
        console.error("Failed to delete report:", error);
        alert("Failed to delete report.");
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', p: 3, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={currentTab} onChange={handleTabChange}>
          <Tab label="User Reports" />
          <Tab label="All Points Data" />
        </Tabs>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        {currentTab === 0 && (
          loading ? <CircularProgress /> : <ReportsTable reports={reports} onApprove={handleApprove} onReject={handleReject} />
        )}
        {currentTab === 1 && (
          <PointsTable />
        )}
      </Box>
    </Box>
  );
};

export default AdminPage;