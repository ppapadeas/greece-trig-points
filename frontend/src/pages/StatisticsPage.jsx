import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';
import {
  Container, Grid2 as Grid, Card, CardContent, Typography, Box,
  CircularProgress, List, ListItem, ListItemAvatar, Avatar,
  ListItemText, Divider, useTheme
} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import PinDropIcon from '@mui/icons-material/PinDrop';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const StatCard = ({ title, value, icon }) => (
  <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mr: 2, flexShrink: 0 }}>
      {icon}
    </Avatar>
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
        {value.toLocaleString()}
      </Typography>
    </Box>
  </Card>
);

const CustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    return (
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1.5, py: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{name}</Typography>
        <Typography variant="body2">{value.toLocaleString()} ({pct}%)</Typography>
      </Box>
    );
  }
  return null;
};

const StatisticsPage = () => {
  const { t } = useTranslation();
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
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  }

  if (!stats) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Could not load statistics.</Typography>;
  }

  const total = Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0);
  const pieChartData = Object.entries(stats.statusBreakdown).map(([name, value]) => ({
    name: t(`status.${name}`),
    value,
    key: name,
  }));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        {t('stats.title')}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title={t('stats.totalPoints')} value={stats.totalPoints} icon={<PinDropIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard title={t('stats.totalReports')} value={stats.totalReports} icon={<DescriptionIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <StatCard title={t('stats.totalUsers')} value={stats.totalUsers} icon={<PeopleIcon />} />
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('stats.statusBreakdown')}</Typography>
              <Box sx={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius="45%"
                      outerRadius="70%"
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {pieChartData.map((entry) => (
                        <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip total={total} />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('stats.topContributors')}</Typography>
              <Divider sx={{ mb: 1 }} />
              <List disablePadding>
                {stats.topUsers.map((user, index) => (
                  <ListItem key={user.display_name} divider={index < stats.topUsers.length - 1} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar src={user.profile_picture_url}>
                        {!user.profile_picture_url && user.display_name?.[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.display_name}
                      secondary={t('stats.reports', { count: user.report_count })}
                    />
                    {index === 0 && <EmojiEventsIcon color="warning" />}
                    {index === 1 && <EmojiEventsIcon sx={{ color: '#aaa' }} />}
                    {index === 2 && <EmojiEventsIcon sx={{ color: '#cd7f32' }} />}
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
