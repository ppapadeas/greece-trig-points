import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';
import {
  Box, Typography, Button, IconButton, CircularProgress,
  useMediaQuery, useTheme, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExploreIcon from '@mui/icons-material/Explore';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const CAMERA_FOV = 60; // degrees horizontal field of view

function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function getCardinal(heading) {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(heading / 45) % 8];
}

const CompassPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const [phase, setPhase] = useState('gate'); // gate | loading | ar | unsupported
  const [error, setError] = useState(null);
  const [heading, setHeading] = useState(0);
  const [userPos, setUserPos] = useState(null);
  const [points, setPoints] = useState([]);
  const [radius, setRadius] = useState(5000);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const watchIdRef = useRef(null);
  const headingRef = useRef(0);
  const rafRef = useRef(null);
  const userPosRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Fetch nearby points when position or radius changes
  useEffect(() => {
    if (!userPos) return;
    const fetchNearby = async () => {
      try {
        const res = await apiClient.get('/api/points/nearby', {
          params: { lat: userPos[0], lon: userPos[1], radius },
        });
        setPoints(res.data);
      } catch (err) {
        console.error('Failed to fetch nearby points:', err);
      }
    };
    fetchNearby();
  }, [userPos, radius]);

  // Orientation handler (stored as ref to avoid stale closures)
  const handleOrientation = useCallback((event) => {
    const h = event.webkitCompassHeading ?? (event.absolute ? (360 - event.alpha) : null);
    if (h != null) headingRef.current = h;
  }, []);

  // RAF loop to update heading state at ~15fps
  const startHeadingLoop = useCallback(() => {
    let lastUpdate = 0;
    const loop = (ts) => {
      if (ts - lastUpdate > 66) { // ~15fps
        setHeading(headingRef.current);
        lastUpdate = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const handleEnable = async () => {
    setError(null);

    // Check for basic support
    if (!navigator.mediaDevices || !navigator.geolocation) {
      setPhase('unsupported');
      return;
    }

    setPhase('loading');

    try {
      // 1. Request compass permission (iOS)
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm !== 'granted') {
          setError(t('compass.permissionDenied'));
          setPhase('gate');
          return;
        }
      }

      // 2. Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 3. Listen for compass heading
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handleOrientation);
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
      startHeadingLoop();

      // 4. Start geolocation watch
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          userPosRef.current = newPos;
          setUserPos(newPos);
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError(t('compass.permissionDenied'));
          setPhase('gate');
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
      );

      setPhase('ar');
    } catch (err) {
      console.error('AR init error:', err);
      setError(t('compass.permissionDenied'));
      setPhase('gate');
    }
  };

  const handleMarkerTap = (gysId) => {
    navigate(`/point/${gysId}`);
  };

  // ---- Permission Gate ----
  if (!isMobile && phase === 'gate') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
        <CameraswitchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
          {t('compass.notSupported')}
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          {t('compass.back')}
        </Button>
      </Box>
    );
  }

  if (phase === 'unsupported') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
        <CameraswitchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
          {t('compass.notSupported')}
        </Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')}>
          {t('compass.back')}
        </Button>
      </Box>
    );
  }

  if (phase === 'gate') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4, gap: 2 }}>
        <ExploreIcon sx={{ fontSize: 80, color: 'primary.main' }} />
        <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          {t('compass.title')}
        </Typography>
        <Button variant="contained" size="large" onClick={handleEnable}>
          {t('compass.enable')}
        </Button>
        {error && (
          <Typography color="error" variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
            {error}
          </Typography>
        )}
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mt: 1 }}>
          {t('compass.back')}
        </Button>
      </Box>
    );
  }

  if (phase === 'loading') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
        <CircularProgress size={48} />
        <Typography>{t('compass.acquiring')}</Typography>
        {/* Hidden video to start camera stream early */}
        <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      </Box>
    );
  }

  // ---- AR View ----
  const visibleMarkers = userPos
    ? points.map((p) => {
        const bearing = calculateBearing(userPos[0], userPos[1], p.lat, p.lon);
        let delta = bearing - heading;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        return { ...p, bearing, delta, distance: p.distance_meters };
      }).filter((p) => Math.abs(p.delta) <= CAMERA_FOV / 2 + 10) // small margin
    : [];

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', bgcolor: '#000' }}>
      {/* Camera feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%', objectFit: 'cover',
        }}
      />

      {/* Top bar */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0))',
      }}>
        <IconButton onClick={() => navigate('/')} sx={{ color: '#fff' }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExploreIcon sx={{ color: '#fff', fontSize: 20 }} />
          <Typography sx={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 18 }}>
            {Math.round(heading)}° {getCardinal(heading)}
          </Typography>
        </Box>
        <Typography sx={{ color: '#fff', fontSize: 14 }}>
          {points.length > 0 ? t('compass.pointsFound', { count: points.length }) : t('compass.noPoints')}
        </Typography>
      </Box>

      {/* Compass line indicators */}
      <Box sx={{
        position: 'absolute', top: 48, left: 0, right: 0, zIndex: 5,
        display: 'flex', justifyContent: 'center',
      }}>
        <Box sx={{ width: 2, height: 16, bgcolor: 'rgba(255,255,255,0.5)' }} />
      </Box>

      {/* AR Markers */}
      {visibleMarkers.map((p) => {
        const screenX = 50 + (p.delta / (CAMERA_FOV / 2)) * 50; // % from left
        const scale = Math.max(0.5, 1 - p.distance / (radius * 1.5)); // depth cue
        const isClose = p.distance < 500;

        return (
          <Box
            key={p.id}
            onClick={() => handleMarkerTap(p.gys_id)}
            sx={{
              position: 'absolute',
              left: `${screenX}%`,
              top: '40%',
              transform: `translateX(-50%) scale(${scale})`,
              zIndex: 20,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              cursor: 'pointer',
              transition: 'left 0.1s linear',
              pointerEvents: 'auto',
            }}
          >
            {/* Vertical line */}
            <Box sx={{ width: 2, height: isClose ? 40 : 24, bgcolor: STATUS_COLORS[p.status] || '#17a2b8', opacity: 0.8 }} />
            {/* Dot */}
            <Box sx={{
              width: isClose ? 16 : 12,
              height: isClose ? 16 : 12,
              borderRadius: '50%',
              bgcolor: STATUS_COLORS[p.status] || '#17a2b8',
              border: '2px solid #fff',
              boxShadow: '0 0 8px rgba(0,0,0,0.5)',
            }} />
            {/* Label */}
            <Box sx={{
              mt: 0.5, px: 1, py: 0.3,
              bgcolor: 'rgba(0,0,0,0.75)',
              borderRadius: 1,
              whiteSpace: 'nowrap',
              maxWidth: 140,
            }}>
              <Typography sx={{
                color: '#fff', fontSize: isClose ? 12 : 10,
                fontWeight: 'bold', textAlign: 'center',
                overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {p.name || `GYS ${p.gys_id}`}
              </Typography>
              <Typography sx={{
                color: 'rgba(255,255,255,0.8)', fontSize: 10,
                textAlign: 'center',
              }}>
                {formatDistance(p.distance)}
              </Typography>
            </Box>
          </Box>
        );
      })}

      {/* Bottom bar */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        px: 2, py: 1.5,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
        gap: 2,
      }}>
        <Typography sx={{ color: '#fff', fontSize: 13, mr: 1 }}>
          {t('compass.radius')}:
        </Typography>
        <ToggleButtonGroup
          value={radius}
          exclusive
          onChange={(e, val) => { if (val != null) setRadius(val); }}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              color: 'rgba(255,255,255,0.7)',
              borderColor: 'rgba(255,255,255,0.3)',
              fontSize: 12, px: 1.5, py: 0.5,
              '&.Mui-selected': { color: '#fff', bgcolor: 'rgba(255,255,255,0.2)' },
            },
          }}
        >
          <ToggleButton value={1000}>1 km</ToggleButton>
          <ToggleButton value={5000}>5 km</ToggleButton>
          <ToggleButton value={10000}>10 km</ToggleButton>
          <ToggleButton value={20000}>20 km</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
};

export default CompassPage;
