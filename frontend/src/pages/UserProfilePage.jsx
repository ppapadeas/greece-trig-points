import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import { registerPasskey } from '../utils/passkey';
import {
  Container, Grid, Card, CardContent, Typography, Box,
  Avatar, Skeleton, List, ListItem, ListItemText,
  Divider, Chip, useTheme, LinearProgress,
  Button, IconButton, Alert,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PinDropIcon from '@mui/icons-material/PinDrop';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from '@mui/material/Link';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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

const MiniMap = ({ points, center }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OSM',
          },
        },
        layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
      },
      center: [center[1], center[0]], // [lng, lat]
      zoom: 7,
      scrollZoom: false,
      interactive: true,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      map.addSource('report-points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: points.map(r => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [r.lon, r.lat] },
            properties: {
              name: r.point_name || `GYS ${r.gys_id}`,
              status: r.status,
            },
          })),
        },
      });
      map.addLayer({
        id: 'report-points-layer',
        type: 'circle',
        source: 'report-points',
        paint: {
          'circle-radius': 6,
          'circle-color': [
            'match', ['get', 'status'],
            'OK', STATUS_COLORS.OK, 'DAMAGED', STATUS_COLORS.DAMAGED,
            'DESTROYED', STATUS_COLORS.DESTROYED, 'MISSING', STATUS_COLORS.MISSING,
            'UNKNOWN', STATUS_COLORS.UNKNOWN,
            '#17a2b8',
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9,
        },
      });
    });

    return () => map.remove();
  }, [points, center]);

  return <Box ref={containerRef} sx={{ height: 360, borderRadius: 1, overflow: 'hidden' }} />;
};

const UserProfilePage = () => {
  const { userId } = useParams();
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  const [profile, setProfile] = useState(null);
  const [reports, setReports] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passkeys, setPasskeys] = useState([]);
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const isOwnProfile = currentUser && String(currentUser.id) === String(userId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, reportsRes, challengesRes] = await Promise.all([
          apiClient.get(`/api/users/${userId}`),
          apiClient.get(`/api/users/${userId}/reports?limit=50`),
          apiClient.get(`/api/users/${userId}/challenges`),
        ]);
        setProfile(profileRes.data);
        setReports(reportsRes.data);
        setChallenges(challengesRes.data);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  useEffect(() => {
    if (isOwnProfile) {
      apiClient.get('/api/passkey/credentials')
        .then(res => setPasskeys(res.data))
        .catch(() => {});
    }
  }, [isOwnProfile]);

  const handleAddPasskey = async () => {
    setPasskeyError('');
    setPasskeyLoading(true);
    try {
      await registerPasskey();
      const res = await apiClient.get('/api/passkey/credentials');
      setPasskeys(res.data);
    } catch (err) {
      setPasskeyError(err.response?.data?.message || t('profile.passkeyError'));
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = async (id) => {
    try {
      await apiClient.delete(`/api/passkey/credentials/${id}`);
      setPasskeys(prev => prev.filter(pk => pk.id !== id));
    } catch (err) {
      setPasskeyError(err.response?.data?.message || t('profile.passkeyError'));
    }
  };

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
      <Helmet>
        <title>{profile.display_name} — vathra.xyz</title>
      </Helmet>
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

      {/* Challenges */}
      {challenges.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <EmojiEventsIcon color="primary" />
              <Typography variant="h6">{t('profile.challenges')}</Typography>
            </Box>
            <Grid container spacing={2}>
              {challenges.map((ch) => {
                const pct = ch.total > 0 ? Math.round((ch.done / ch.total) * 100) : 0;
                return (
                  <Grid key={ch.id} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {t(`challenges.${ch.id}`)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ch.done} / {ch.total}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{ height: 8, borderRadius: 4 }}
                        color={pct === 100 ? 'success' : 'primary'}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Mini Map */}
        {mapPoints.length > 0 && (
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>{t('profile.mapTitle')}</Typography>
                <MiniMap points={mapPoints} center={center} />
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

      {/* Passkey Management — own profile only */}
      {isOwnProfile && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FingerprintIcon color="primary" />
              <Typography variant="h6">{t('profile.passkeys')}</Typography>
            </Box>
            {passkeyError && <Alert severity="error" sx={{ mb: 2 }}>{passkeyError}</Alert>}
            {passkeys.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('profile.noPasskeys')}
              </Typography>
            ) : (
              <List disablePadding>
                {passkeys.map((pk, index) => (
                  <ListItem
                    key={pk.id}
                    divider={index < passkeys.length - 1}
                    sx={{ px: 0 }}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleDeletePasskey(pk.id)} title={t('profile.deletePasskey')}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={pk.device_name || t('profile.passkeyDefault')}
                      secondary={new Date(pk.created_at).toLocaleDateString(undefined, {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    />
                  </ListItem>
                ))}
              </List>
            )}
            <Button
              variant="outlined"
              startIcon={<FingerprintIcon />}
              onClick={handleAddPasskey}
              disabled={passkeyLoading}
              sx={{ mt: 1 }}
            >
              {t('profile.addPasskey')}
            </Button>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default UserProfilePage;
