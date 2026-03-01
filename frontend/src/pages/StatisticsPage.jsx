import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';
import {
  Container, Grid, Card, CardContent, Typography, Box,
  Skeleton, List, ListItem, ListItemAvatar, Avatar,
  ListItemText, Divider, useTheme, useMediaQuery
} from '@mui/material';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

import PinDropIcon from '@mui/icons-material/PinDrop';
import PeopleIcon from '@mui/icons-material/People';
import DescriptionIcon from '@mui/icons-material/Description';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const ORDER_COLORS = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2'];

const StatCard = ({ title, value, icon, subtitle }) => (
  <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56, mr: 2, flexShrink: 0 }}>
      {icon}
    </Avatar>
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>{title}</Typography>
      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
      )}
    </Box>
  </Card>
);

const StatCardSkeleton = () => (
  <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
    <Skeleton variant="circular" width={56} height={56} sx={{ mr: 2, flexShrink: 0 }} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={36} />
    </Box>
  </Card>
);

const ChartSkeleton = ({ height = 350 }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 1 }} />
    </CardContent>
  </Card>
);

const CustomPieTooltip = ({ active, payload, total }) => {
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

const CustomBarTooltip = ({ active, payload, label, pointsLabel }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1.5, py: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{label}</Typography>
        <Typography variant="body2">{payload[0].value.toLocaleString()} {pointsLabel}</Typography>
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Skeleton variant="text" width="30%" height={52} sx={{ mb: 4 }} />
        <Grid container spacing={3}>
          {[...Array(4)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}><StatCardSkeleton /></Grid>
          ))}
          <Grid size={{ xs: 12, md: 7 }}><ChartSkeleton height={350} /></Grid>
          <Grid size={{ xs: 12, md: 5 }}><ChartSkeleton height={350} /></Grid>
          <Grid size={{ xs: 12, md: 8 }}><ChartSkeleton height={380} /></Grid>
          <Grid size={{ xs: 12, md: 4 }}><ChartSkeleton height={380} /></Grid>
        </Grid>
      </Container>
    );
  }

  if (!stats) {
    return <Typography sx={{ textAlign: 'center', mt: 4 }}>Could not load statistics.</Typography>;
  }

  const statusTotal = Object.values(stats.statusBreakdown).reduce((a, b) => a + b, 0);
  const pieChartData = Object.entries(stats.statusBreakdown).map(([name, value]) => ({
    name: t(`status.${name}`),
    value,
    key: name,
  }));

  const orderTotal = (stats.orderBreakdown || []).reduce((a, b) => a + b.count, 0);
  const orderChartData = (stats.orderBreakdown || []).map(r => ({
    name: t(`stats.order.${r.name}`, { defaultValue: r.name }),
    value: r.count,
    key: r.name,
    label: `${t(`stats.order.${r.name}`, { defaultValue: r.name })}: ${r.count.toLocaleString()}`,
  }));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        {t('stats.title')}
      </Typography>

      <Grid container spacing={3}>

        {/* Stat Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title={t('stats.totalPoints')} value={stats.totalPoints.toLocaleString()} icon={<PinDropIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title={t('stats.totalReports')} value={stats.totalReports.toLocaleString()} icon={<DescriptionIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard title={t('stats.totalUsers')} value={stats.totalUsers.toLocaleString()} icon={<PeopleIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('stats.coverage')}
            value={`${stats.coveragePercent}%`}
            icon={<CheckCircleOutlineIcon />}
            subtitle={t('stats.coverageSubtitle', { count: stats.coveredPoints.toLocaleString() })}
          />
        </Grid>

        {/* Status donut + Top Contributors */}
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
                    <Tooltip content={<CustomPieTooltip total={statusTotal} />} />
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

        {/* Prefecture bar chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('stats.mapSheetBreakdown')}</Typography>
              <Box sx={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={stats.prefectureBreakdown || []}
                    layout="vertical"
                    margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={isMobile ? 80 : 130}
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      tickFormatter={(v) => isMobile && v.length > 10 ? v.slice(0, 10) + '…' : v}
                    />
                    <Tooltip content={<CustomBarTooltip pointsLabel={t('stats.points')} />} />
                    <Bar dataKey="count" fill={theme.palette.primary.main} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order donut chart */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('stats.orderBreakdown')}</Typography>
              <Box sx={{ width: '100%', height: 380 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={orderChartData}
                      cx="50%"
                      cy="45%"
                      innerRadius="40%"
                      outerRadius="65%"
                      paddingAngle={2}
                      dataKey="value"
                      nameKey="name"
                    >
                      {orderChartData.map((entry, index) => (
                        <Cell key={entry.key} fill={ORDER_COLORS[index % ORDER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip total={orderTotal} />} />
                    <Legend formatter={(value, entry) => entry.payload.label} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Container>
  );
};

export default StatisticsPage;
