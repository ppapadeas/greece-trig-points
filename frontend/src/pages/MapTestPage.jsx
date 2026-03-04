import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, LayersControl } from 'react-leaflet';
import { Box, Typography, Paper, Chip, CircularProgress, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import 'leaflet/dist/leaflet.css';
import apiClient from '../api';
import SuperclusterLayer from '../components/SuperclusterLayer';

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const MapTestPage = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loadTime, setLoadTime] = useState(null);

  useEffect(() => {
    const fetchPoints = async () => {
      setLoading(true);
      const t0 = performance.now();
      try {
        const { data } = await apiClient.get('/api/points');
        setPoints(data);
        setLoadTime(Math.round(performance.now() - t0));
      } catch (err) {
        console.error('Failed to fetch points:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  const handleMarkerClick = useCallback((point) => {
    setSelectedPoint(point);
  }, []);

  return (
    <Box sx={{ height: '100%', position: 'relative' }}>
      <Paper
        elevation={2}
        sx={{
          position: 'absolute', top: 72, left: 10, zIndex: 1000,
          px: 2, py: 1, bgcolor: 'rgba(255,255,255,0.92)',
          display: 'flex', alignItems: 'center', gap: 1,
        }}
      >
        <Typography variant="body2" fontWeight="bold">
          Supercluster + Canvas Test
        </Typography>
        {loadTime && (
          <Chip label={`${points.length} pts in ${loadTime}ms`} size="small" color="success" />
        )}
      </Paper>

      {loading && (
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', zIndex: 1100,
          bgcolor: 'rgba(255,255,255,0.8)', p: 3, borderRadius: 2, boxShadow: 3,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading points...</Typography>
        </Box>
      )}

      <MapContainer
        center={[38.25, 23.83]}
        zoom={7}
        scrollWheelZoom={true}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
      >
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="Map">
            <TileLayer
              attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Topographic">
            <TileLayer
              attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='Tiles &copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <SuperclusterLayer points={points} onMarkerClick={handleMarkerClick} />
      </MapContainer>

      {selectedPoint && (
        <Paper
          elevation={4}
          sx={{
            position: 'absolute', bottom: 20, left: '50%',
            transform: 'translateX(-50%)', zIndex: 1000,
            px: 3, py: 2, minWidth: 280, borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              GYS {selectedPoint.gys_id}
            </Typography>
            <IconButton size="small" onClick={() => setSelectedPoint(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Chip
              label={selectedPoint.status}
              size="small"
              sx={{
                bgcolor: STATUS_COLORS[selectedPoint.status],
                color: selectedPoint.status === 'DAMAGED' ? '#000' : '#fff',
                fontWeight: 'bold',
              }}
            />
            <Chip label={`Order ${selectedPoint.point_order}`} size="small" variant="outlined" />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {selectedPoint.lat.toFixed(5)}, {selectedPoint.lon.toFixed(5)}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default MapTestPage;
