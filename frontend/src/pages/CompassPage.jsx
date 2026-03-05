import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
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

const CAMERA_FOV = 60;
const SMOOTHING = 0.3; // low-pass filter coefficient (higher = more responsive, 0.1-0.5)

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

// Smooth angle interpolation that handles the 0/360 wraparound
function lerpAngle(current, target, factor) {
  let diff = target - current;
  // Shortest path around the circle
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const result = current + diff * factor;
  return ((result % 360) + 360) % 360;
}

const CompassPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [phase, setPhase] = useState('gate');
  const [error, setError] = useState(null);
  const [heading, setHeading] = useState(0);
  const [rawHeadingDisplay, setRawHeadingDisplay] = useState(0);
  const [userPos, setUserPos] = useState(null);
  const [points, setPoints] = useState([]);
  const [radius, setRadius] = useState(5000);
  const [showDebug, setShowDebug] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const watchIdRef = useRef(null);
  const rawHeadingRef = useRef(0);   // raw sensor value
  const smoothHeadingRef = useRef(0); // smoothed value
  const rafRef = useRef(null);
  const orientationHandlerRef = useRef(null);
  const userPosRef = useRef(null);   // latest GPS for debouncing
  const videoAttachedRef = useRef(false); // prevent re-attaching stream

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (orientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', orientationHandlerRef.current);
        window.removeEventListener('deviceorientationabsolute', orientationHandlerRef.current);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Fetch nearby points when position or radius changes
  // Debounce: only update userPos state if moved >50m
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

  // Video ref callback — attach stream once when element mounts
  const setVideoRef = useCallback((el) => {
    videoRef.current = el;
    if (el && streamRef.current && !videoAttachedRef.current) {
      el.srcObject = streamRef.current;
      videoAttachedRef.current = true;
    }
  }, []);

  // RAF loop: smooth heading + update state at ~15fps
  const startHeadingLoop = useCallback(() => {
    let lastUpdate = 0;
    const loop = (ts) => {
      // Apply low-pass filter to smooth jitter
      smoothHeadingRef.current = lerpAngle(
        smoothHeadingRef.current,
        rawHeadingRef.current,
        SMOOTHING,
      );
      // Only update React state at ~15fps to avoid re-render overhead
      if (ts - lastUpdate > 66) {
        setHeading(smoothHeadingRef.current);
        setRawHeadingDisplay(rawHeadingRef.current);
        lastUpdate = ts;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const handleEnable = async () => {
    setError(null);

    if (!navigator.mediaDevices || !navigator.geolocation) {
      setPhase('unsupported');
      return;
    }

    setPhase('loading');

    try {
      // 1. Request compass permission (iOS 13+)
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
      videoAttachedRef.current = false;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoAttachedRef.current = true;
      }

      // 3. Listen for compass heading
      // On Android, deviceorientationabsolute provides alpha where 0=North.
      // Per W3C spec alpha increases counter-clockwise, so compass = (360 - alpha).
      // However, some Android implementations already provide clockwise values.
      // We detect this by checking if absolute is true and using the correct formula.
      const handler = (event) => {
        if (event.webkitCompassHeading != null) {
          // iOS: webkitCompassHeading is already clockwise compass heading (0=N, 90=E)
          rawHeadingRef.current = event.webkitCompassHeading;
        } else if (event.alpha != null) {
          // Android: alpha from deviceorientationabsolute
          // W3C spec: alpha=0 is North, increases counter-clockwise
          // Compass heading (clockwise from North) = (360 - alpha)
          rawHeadingRef.current = (360 - event.alpha) % 360;
        }
      };
      orientationHandlerRef.current = handler;

      // Prefer absolute orientation (Android Chrome)
      // Also listen to regular event as fallback
      let usingAbsolute = false;
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', handler);
        usingAbsolute = true;
      }
      if (!usingAbsolute) {
        window.addEventListener('deviceorientation', handler);
      }
      startHeadingLoop();

      // 4. Start geolocation watch — debounce updates (>50m movement)
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const newLat = pos.coords.latitude;
          const newLon = pos.coords.longitude;
          const prev = userPosRef.current;
          // Only trigger React state update if moved significantly or first fix
          if (!prev || haversineDistance(prev[0], prev[1], newLat, newLon) > 50) {
            userPosRef.current = [newLat, newLon];
            setUserPos([newLat, newLon]);
          }
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

  // ---- Not Supported (desktop or no APIs) ----
  if ((!isMobile && phase === 'gate') || phase === 'unsupported') {
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

  // ---- Permission Gate ----
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

  // ---- Compute visible markers ----
  const visibleMarkers = userPos
    ? points.map((p) => {
        const bearing = calculateBearing(userPos[0], userPos[1], p.lat, p.lon);
        let delta = bearing - heading;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        return { ...p, bearing, delta, distance: p.distance_meters };
      }).filter((p) => Math.abs(p.delta) <= CAMERA_FOV / 2 + 10)
    : [];

  // ---- AR View ----
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', bgcolor: '#000' }}>
      <Helmet>
        <title>{t('compass.title')} — vathra.xyz</title>
        <link rel="canonical" href="https://vathra.xyz/compass" />
      </Helmet>
      {/* Camera feed — single element, ref callback attaches stream once */}
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%', objectFit: 'cover',
        }}
      />

      {/* Loading overlay */}
      {phase === 'loading' && (
        <Box sx={{
          position: 'absolute', inset: 0, zIndex: 30,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(0,0,0,0.6)',
        }}>
          <CircularProgress size={48} sx={{ color: '#fff' }} />
          <Typography sx={{ color: '#fff', mt: 2 }}>{t('compass.acquiring')}</Typography>
        </Box>
      )}

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
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
          onClick={() => setShowDebug((d) => !d)}
        >
          <ExploreIcon sx={{ color: '#fff', fontSize: 20 }} />
          <Typography sx={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace', fontSize: 18 }}>
            {Math.round(heading)}° {getCardinal(heading)}
          </Typography>
        </Box>
        <Typography sx={{ color: '#fff', fontSize: 14 }}>
          {points.length > 0 ? t('compass.pointsFound', { count: points.length }) : t('compass.noPoints')}
        </Typography>
      </Box>

      {/* Debug overlay — tap compass heading to toggle */}
      {showDebug && (
        <Box sx={{
          position: 'absolute', top: 56, left: 8, zIndex: 25,
          bgcolor: 'rgba(0,0,0,0.8)', borderRadius: 1, px: 1.5, py: 1,
          fontFamily: 'monospace', fontSize: 11, color: '#0f0',
          lineHeight: 1.6,
        }}>
          <div>raw: {Math.round(rawHeadingDisplay)}°</div>
          <div>smooth: {Math.round(heading)}°</div>
          <div>pos: {userPos ? `${userPos[0].toFixed(4)}, ${userPos[1].toFixed(4)}` : 'none'}</div>
          <div>pts: {points.length} (r={radius}m)</div>
          {visibleMarkers.slice(0, 3).map((p) => (
            <div key={p.id}>
              {p.gys_id}: brg={Math.round(p.bearing)}° d={Math.round(p.delta)}° {formatDistance(p.distance)}
            </div>
          ))}
        </Box>
      )}

      {/* Compass center line */}
      <Box sx={{
        position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)', zIndex: 5,
      }}>
        <Box sx={{ width: 2, height: 16, bgcolor: 'rgba(255,255,255,0.5)' }} />
      </Box>

      {/* AR Markers */}
      {visibleMarkers.map((p) => {
        const screenX = 50 + (p.delta / (CAMERA_FOV / 2)) * 50;
        const scale = Math.max(0.5, 1 - p.distance / (radius * 1.5));
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
              pointerEvents: 'auto',
              willChange: 'left',
            }}
          >
            <Box sx={{ width: 2, height: isClose ? 40 : 24, bgcolor: STATUS_COLORS[p.status] || '#17a2b8', opacity: 0.8 }} />
            <Box sx={{
              width: isClose ? 16 : 12,
              height: isClose ? 16 : 12,
              borderRadius: '50%',
              bgcolor: STATUS_COLORS[p.status] || '#17a2b8',
              border: '2px solid #fff',
              boxShadow: '0 0 8px rgba(0,0,0,0.5)',
            }} />
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

// Quick haversine for distance check (returns meters)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default CompassPage;
