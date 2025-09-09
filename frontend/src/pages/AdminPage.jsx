import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Box, Typography, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const AdminPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const { data } = await apiClient.get('/api/admin/reports');
        setReports(data);
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Define the columns for our data grid
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
  ];

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard - All Reports</Typography>
      <DataGrid
        rows={reports}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 25 },
          },
        }}
        pageSizeOptions={[10, 25, 50]}
        checkboxSelection
      />
    </Box>
  );
};

export default AdminPage;