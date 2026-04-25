import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../api';
import { Box, CircularProgress, Link, IconButton, Tooltip, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TagEditorDialog from './TagEditorDialog';

const PointsTable = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { gysId, name }

  const fetchPoints = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/api/admin/points');
      setPoints(data);
    } catch (error) {
      console.error("Failed to fetch points:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

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
    { field: 'name', headerName: 'Name', width: 220 },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'report_count',
      headerName: 'Reports',
      width: 90,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
    },
    {
      field: 'tag_slugs',
      headerName: 'Tags',
      width: 180,
      sortable: false,
      renderCell: (params) => {
        const slugs = params.value || [];
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {slugs.length > 0 ? (
              <Chip size="small" label={slugs.length} color="primary" />
            ) : (
              <Box component="span" sx={{ color: 'text.disabled', fontSize: 12 }}>—</Box>
            )}
            <Tooltip title="Edit tags">
              <IconButton size="small" onClick={() => setEditing({ gysId: params.row.gys_id, name: params.row.name })}>
                <LocalOfferIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
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
      <TagEditorDialog
        open={!!editing}
        gysId={editing?.gysId}
        pointName={editing?.name}
        onClose={() => setEditing(null)}
        onSaved={fetchPoints}
      />
    </Box>
  );
};

export default PointsTable;
