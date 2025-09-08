import React, { useState, useEffect } from 'react';
import apiClient from '../api';
import { Container, Grid, Card, CardContent, Typography, Box, CircularProgress, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const StatCard = ({ title, value }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography color="text.secondary" gutterBottom>{title}</Typography>
      <Typography variant="h5" component="div">{value.toLocaleString()}</Typography>
    </CardContent>
  </Card>
);

const StatisticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Project Statistics
      </Typography>
      <Grid container spacing={3}>
        {/* Κύριες Κάρτες */}
        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Points" value={stats.totalPoints} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Reports" value={stats.totalReports} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Registered Users" value={stats.totalUsers} /></Grid>

        {/* Ανάλυση Κατάστασης */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Status Breakdown</Typography>
              <Divider sx={{ mb: 2 }} />
              {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                 <Box key={status} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                   <Typography variant="body1">{status}</Typography>
                   <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{count.toLocaleString()}</Typography>
                 </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Κορυφαίοι Χρήστες */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Contributors</Typography>
               <Divider sx={{ mb: 1 }} />
              <List>
                {stats.topUsers.map((user, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemAvatar><Avatar src={user.profile_picture_url} /></ListItemAvatar>
                    <ListItemText primary={user.display_name} secondary={`${user.report_count} reports`} />
                    {index === 0 && <EmojiEventsIcon color="warning" />}
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