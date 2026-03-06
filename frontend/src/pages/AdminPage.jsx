import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import apiClient from '../api';
import {
  Box, Typography, CircularProgress, IconButton, Tooltip, Tabs, Tab,
  Card, CardContent, Grid, Avatar, List, ListItem, ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import MapIcon from '@mui/icons-material/Map';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import HideImageIcon from '@mui/icons-material/HideImage';
import PersonIcon from '@mui/icons-material/Person';
import StorageIcon from '@mui/icons-material/Storage';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PointsTable from '../components/PointsTable';

const ReportsTable = ({ reports, onReject }) => {
  const columns = [
    {
      field: 'point_gys_id',
      headerName: 'GYS ID',
      width: 100,
      renderCell: (params) => (
        <RouterLink to={`/point/${params.value}`} style={{ color: 'inherit' }}>
          {params.value}
        </RouterLink>
      ),
    },
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
    // --- THIS COLUMN IS NOW UPDATED ---
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      width: 120,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View on Map">
            {/* Link to the permalink using the point's GYS ID */}
            <IconButton component={RouterLink} to={`/point/${params.row.point_gys_id}`}>
              <MapIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Report">
            <IconButton color="error" onClick={() => onReject(params.id)}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
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


const ImageStatsPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/admin/image-stats')
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to fetch image stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;
  if (!stats) return <Typography>Failed to load image stats.</Typography>;

  const pct = stats.totalReports > 0
    ? ((stats.reportsWithImages / stats.totalReports) * 100).toFixed(1)
    : 0;

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <PhotoLibraryIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">Reports with Images</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stats.reportsWithImages}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                <HideImageIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">Reports without Images</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{stats.reportsWithoutImages}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48 }}>
                <PhotoLibraryIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">Image Coverage</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{pct}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48 }}>
                <StorageIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Storage</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatBytes(stats.storageBytes)}</Typography>
                <Typography variant="caption" color="text.secondary">{stats.storageObjects} files</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                <PhotoLibraryIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">Avg Image Size</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  {stats.storageObjects > 0 ? formatBytes(stats.storageBytes / stats.storageObjects) : '—'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Image Contributors</Typography>
              <List disablePadding>
                {stats.imagesByUser.map((u, i) => (
                  <ListItem key={i} divider={i < stats.imagesByUser.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}><PersonIcon /></Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={u.name} secondary={`${u.count} images`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Images by Month</Typography>
              <List disablePadding>
                {stats.imagesByMonth.map((m, i) => (
                  <ListItem key={i} divider={i < stats.imagesByMonth.length - 1}>
                    <ListItemText primary={m.month} secondary={`${m.count} images`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recent Uploads</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {stats.recentImages.map((img) => (
              <Box key={img.id} sx={{ textAlign: 'center' }}>
                <Box
                  component="img"
                  src={img.image_url}
                  alt={`GYS ${img.gys_id}`}
                  sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 1, mb: 0.5 }}
                />
                <Typography variant="caption" display="block">
                  GYS {img.gys_id} — {img.display_name}
                </Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Failed to fetch users:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;

  const fmt = (v) => v ? new Date(v).toLocaleString() : '—';
  const fmtDate = (v) => v ? new Date(v).toLocaleDateString() : '—';

  const columns = [
    {
      field: 'profile_picture_url',
      headerName: '',
      width: 50,
      sortable: false,
      renderCell: (params) => (
        <Avatar src={params.value} sx={{ width: 32, height: 32 }}>
          <PersonIcon fontSize="small" />
        </Avatar>
      ),
    },
    { field: 'display_name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    {
      field: 'role',
      headerName: 'Role',
      width: 100,
      renderCell: (params) => params.value === 'ADMIN'
        ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'warning.main' }}>
            <AdminPanelSettingsIcon fontSize="small" /> ADMIN
          </Box>
        : 'USER',
    },
    { field: 'report_count', headerName: 'Reports', width: 90, type: 'number' },
    { field: 'points_covered', headerName: 'Points', width: 90, type: 'number' },
    {
      field: 'created_at',
      headerName: 'Registered',
      width: 130,
      valueGetter: (v) => v ? new Date(v) : null,
      valueFormatter: (v) => fmtDate(v),
      type: 'dateTime',
    },
    {
      field: 'last_login',
      headerName: 'Last Login',
      width: 170,
      valueGetter: (v) => v ? new Date(v) : null,
      valueFormatter: (v) => fmt(v),
      type: 'dateTime',
    },
    {
      field: 'last_report_at',
      headerName: 'Last Report',
      width: 170,
      valueGetter: (v) => v ? new Date(v) : null,
      valueFormatter: (v) => fmt(v),
      type: 'dateTime',
    },
  ];

  return (
    <DataGrid
      rows={users}
      columns={columns}
      initialState={{ pagination: { paginationModel: { page: 0, pageSize: 25 } } }}
      pageSizeOptions={[10, 25, 50]}
      disableRowSelectionOnClick
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

  const handleReject = async (id) => {
    if (window.confirm('Are you sure you want to delete this report? This will revert the point status.')) {
      try {
        await apiClient.delete(`/api/admin/reports/${id}`);
        // Refresh the list after deleting
        fetchReports();
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
          <Tab label="Image Stats" />
          <Tab label="Users" />
        </Tabs>
      </Box>
      
      <Box sx={{ flexGrow: 1 }}>
        {currentTab === 0 && (
          loading ? <CircularProgress /> : <ReportsTable reports={reports} onReject={handleReject} />
        )}
        {currentTab === 1 && (
          <PointsTable />
        )}
        {currentTab === 2 && (
          <ImageStatsPanel />
        )}
        {currentTab === 3 && (
          <UsersTable />
        )}
      </Box>
    </Box>
  );
};

export default AdminPage;