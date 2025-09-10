import { useState, useEffect } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import { useDebounce } from '../hooks/useDebounce';
import apiClient from '../api';
import { Box, Typography } from '@mui/material';

const MIN_ZOOM_TO_LOAD = 9; // Points will only load at zoom level 9 or higher

const PointsLoader = ({ onPointsLoaded }) => {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const [bounds, setBounds] = useState(map.getBounds());
  const debouncedBounds = useDebounce(bounds, 500);

  useMapEvents({
    moveend: () => setBounds(map.getBounds()),
    zoomend: () => {
      setBounds(map.getBounds());
      setZoom(map.getZoom());
    },
  });

  useEffect(() => {
    const fetchPoints = async () => {
      if (zoom >= MIN_ZOOM_TO_LOAD) {
        try {
          const response = await apiClient.get('/api/points', {
            params: { bounds: debouncedBounds }
          });
          onPointsLoaded(response.data);
        } catch (error) {
          console.error("Failed to fetch points:", error);
        }
      }
    };
    fetchPoints();
  }, [debouncedBounds, zoom, onPointsLoaded]);

  if (zoom < MIN_ZOOM_TO_LOAD) {
    return (
      <Box 
        sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          padding: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Typography variant="h6">Zoom in to see points</Typography>
      </Box>
    );
  }

  return null;
};

export default PointsLoader;