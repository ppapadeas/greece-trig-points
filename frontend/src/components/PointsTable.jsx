import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../api';
import { Box, CircularProgress, Link } from '@mui/material';
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

  // --- THIS IS THE NEW, COMPREHENSIVE COLUMN DEFINITION ---
  const columns = [
    {
      field: 'gys_id',
      headerName: 'GYS ID',
      width: 100,
      renderCell: (params) => (
        <Link component={RouterLink} to={`/point/${params.value}`} target="_blank">
          {params.value}
        </Link>
      ),
    },
    { field: 'name', headerName: 'Name', width: 250 },
    { field: 'status', headerName: 'Status', width: 120 },
    { 
      field: 'report_count', 
      headerName: 'Reports', 
      width: 100,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
    },
    { field: 'point_order', headerName: 'Order', width: 80 },
    { field: 'elevation', headerName: 'Elevation', width: 110 },
    { field: 'prefecture', headerName: 'Prefecture', width: 150 },
    { field: 'description', headerName: 'Description', width: 250 },
    { field: 'year_established', headerName: 'Year', width: 90 },
    { field: 'map_sheet_name_gr', headerName: 'Map Sheet', width: 200 },
    { field: 'egsa87_x', headerName: 'EGSA87 X', width: 150 },
    { field: 'egsa87_y', headerName: 'EGSA87 Y', width: 150 },
    { field: 'egsa87_z', headerName: 'EGSA87 Z', width: 150 },
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
        disableRowSelectionOnClick
      />
    </Box>
  );
};

export default PointsTable;