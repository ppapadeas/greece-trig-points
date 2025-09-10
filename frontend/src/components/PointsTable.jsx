import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Box, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const PointsTable = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const { data } = await apiClient.get('/api/admin/points');
        setPoints(data);
      } catch (error) {
        console.error("Failed to fetch points:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  const columns = [
    { field: 'gys_id', headerName: 'GYS ID', width: 100 },
    { field: 'name', headerName: 'Name', width: 250 },
    { field: 'status', headerName: 'Status', width: 130 },
    { field: 'prefecture', headerName: 'Prefecture', width: 150 },
    { field: 'point_order', headerName: 'Order', width: 90 },
    { field: 'elevation', headerName: 'Elevation', width: 120 },
    { field: 'description', headerName: 'Description', flex: 1 },
  ];

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ height: 'calc(100vh - 180px)', width: '100%' }}>
      <DataGrid
        rows={points}
        columns={columns}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 100 },
          },
        }}
        pageSizeOptions={[25, 50, 100]}
        checkboxSelection
      />
    </Box>
  );
};

export default PointsTable;