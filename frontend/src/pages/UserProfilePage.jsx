import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';
import {
  Container, Grid, Card, CardContent, Typography, Box,
  Avatar, Skeleton, List, ListItem, ListItemText,
  Divider, Chip, useTheme, useMediaQuery,
} from '@mui/material';
import PinDropIcon from '@mui/icons-material/PinDrop';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import Link from '@mui/material/Link';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const RANK_COLORS = {
  Explorer: '#17a2b8',
  Scout: '#28a745',
  Surveyor: '#f57c00',
  Cartographer: '#7b1fa2',
  Geodesist: '#d32f2f',
};

const UserProfilePage = () => {
  const { userId } = useParams();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, reportsRes] = await Promise.all([
          apiClient.get(`/api/users/${userId}`),
          apiClient.get(`/api/users/${userId}/reports?limit=50`),
        ]);
        setProfile(profileRes.data);
        setReports(reportsRes.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Skeleton variant="circular" width={80} height={80} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="40%" height={40} />
              <Skeleton variant="text" width="25%" height={24} />
            </Box>
          </CardContent>
        </Card>
        <Grid container spacing={3}>
          {[...Array(3)].map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Card><CardContent><Skeleton variant="rectangular" height={80} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ textAlign: 'center' }}>{t('profile.notFound')}</Typography>
      </Container>
    );
  }

  const lang = i18n.language?.startsWith('el') ? 'el' : 'en';
  const rankLabel = profile.rank ? profile.rank[lang] : null;
  const rankColor = profile.rank ? RANK_COLORS[profile.rank.en] || theme.palette.primary.main : theme.palette.primary.main;

  // Points for mini-map
  const mapPoints = reports.filter(r => r.lat && r.lon);
  const defaultCenter = [38.5, 23.5];
  const center = mapPoints.length > 0
    ? [
        mapPoints.reduce((s, p) => s + p.lat, 0) / mapPoints.length,
        mapPoints.reduce((s, p) => s + p.lon, 0) / mapPoints.length,
      ]
    : defaultCenter;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Profile Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
          <Avatar
            src={profile.profile_picture_url}
            alt={profile.display_name}
            sx={{ width: 80, height: 80, fontSize: 32 }}
          >
            {!profile.profile_picture_url && profile.display_name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {profile.display_name}
              </Typography>
              {rankLabel && (
                <Chip
                  icon={<MilitaryTechIcon />}
                  label={rankLabel}
                  size="small"
                  sx={{ bgcolor: rankColor, color: '#fff', fontWeight: 'bold' }}
                />
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t('profile.memberSince', {
                date: new Date(profile.created_at).toLocaleDateString(undefined, {
                  month: 'long', year: 'numeric',
                }),
              })}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, mr: 2 }}>
              <DescriptionIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">{t('profile.totalReports')}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{profile.reportCount}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 48, height: 48, mr: 2 }}>
              <PinDropIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">{t('profile.pointsCovered')}</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{profile.pointsCovered}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card sx={{ display: 'flex', alignItems: 'center', p: 2, height: '100%' }}>
            <Avatar sx={{ bgcolor: 'info.main', width: 48, height: 48, mr: 2 }}>
              <CalendarTodayIcon />
            </Avatar>
            <Box>
              <Typography variant="body2" color="text.secondary">{t('profile.memberSinceLabel')}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {new Date(profile.created_at).toLocaleDateString(undefined, {
                  month: 'short', year: 'numeric',
                })}
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Mini Map */}
        {mapPoints.length > 0 && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('profile.mapTitle')}</Typography>
                <Box sx={{ height: 360, borderRadius: 1, overflow: 'hidden' }}>
                  <MapContainer
                    center={center}
                    zoom={7}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OSM'
                    />
                    {mapPoints.map((r) => (
                      <CircleMarker
                        key={r.id}
                        center={[r.lat, r.lon]}
                        radius={6}
                        pathOptions={{
                          fillColor: STATUS_COLORS[r.status] || '#17a2b8',
                          color: '#fff',
                          weight: 1,
                          fillOpacity: 0.9,
                        }}
                      >
                        <Tooltip>
                          {r.point_name || `GYS ${r.gys_id}`} — {t(`status.${r.status}`)}
                        </Tooltip>
                      </CircleMarker>
                    ))}
                  </MapContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Report History */}
        <Grid size={{ xs: 12, md: mapPoints.length > 0 ? 7 : 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>{t('profile.reportHistory')}</Typography>
              <Divider sx={{ mb: 1 }} />
              {reports.length === 0 ? (
                <Typography variant="body2" color="text.secondary">{t('profile.noReports')}</Typography>
              ) : (
                <List disablePadding>
                  {reports.map((report, index) => (
                    <ListItem
                      key={report.id}
                      divider={index < reports.length - 1}
                      sx={{ px: 0, alignItems: 'flex-start' }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Link component={RouterLink} to={`/point/${report.gys_id}`} variant="body2" sx={{ fontWeight: 'bold' }}>
                              {report.point_name || `GYS ${report.gys_id}`}
                            </Link>
                            <Chip
                              label={t(`status.${report.status}`)}
                              size="small"
                              sx={{
                                bgcolor: STATUS_COLORS[report.status] || '#999',
                                color: report.status === 'DAMAGED' ? '#000' : '#fff',
                                fontWeight: 'bold',
                                height: 22,
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {new Date(report.created_at).toLocaleDateString(undefined, {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                            {report.comment && ` — "${report.comment}"`}
                          </Typography>
                        }
                      />
                      {report.image_url && (
                        <Box
                          component="img"
                          src={report.image_url}
                          alt="Report"
                          sx={{
                            width: 48, height: 48, borderRadius: 1,
                            objectFit: 'cover', ml: 1, flexShrink: 0,
                          }}
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfilePage;
