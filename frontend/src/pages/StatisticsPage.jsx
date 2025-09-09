import React, { useState, useEffect } from 'react'; // This line is corrected in spirit by the new code
import apiClient from '../api';
import { Container, Grid, Card, CardContent, Typography, Box, CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Import some icons
import PinDropIcon from '@mui/icons-material/PinDrop';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// A reusable card component for our main stats
const StatCard = ({ title, value, icon }) => (
  <Card sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mr: 2 }}>
      {icon}
    </Avatar>
    <Box>
      <Typography color="text.secondary" gutterBottom>{title}</Typography>
      <Typography variant="h5" component="div">{value.toLocaleString()}</Typography>
    </Box>
  </Card>
);

const StatisticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await apiClient.get('/api/stats');
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  if (!stats) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Could not load statistics.</Typography>;
  }

  // Prepare data for the pie chart
  const pieChartData = Object.entries(stats.statusBreakdown).map(([name, value]) => ({ name, value }));
  const COLORS = {
    OK: '#28a745',
    DAMAGED: '#ffc107',
    DESTROYED: '#dc3545',
    MISSING: '#6c757d',
    UNKNOWN: '#17a2b8',
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Project Statistics
      </Typography>
      <Grid container spacing={3}>
        {/* Main Stat Cards */}
        <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Total Points" value={stats.totalPoints} icon={<PinDropIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Total Reports" value={stats.totalReports} icon={<DescriptionIcon />} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
            <StatCard title="Registered Users" value={stats.totalUsers} icon={<PeopleIcon />} />
        </Grid>
        
        {/* Status Breakdown Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Status Breakdown</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Contributors List */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Contributors</Typography>
               <Divider sx={{ mb: 1 }} />
              <List>
                {stats.topUsers.map((user) => (
                  <ListItem key={user.display_name} divider>
                    <ListItemAvatar><Avatar src={user.profile_picture_url} /></ListItemAvatar>
                    <ListItemText primary={user.display_name} secondary={`${user.report_count} reports`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StatisticsPage;