import { useState, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import BottomBar from '../components/BottomBar';
import { useTheme, useMediaQuery } from '@mui/material';

const MapPage = () => {
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nearestPoint, setNearestPoint] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response = await apiClient.get('/api/points');
        setPoints(response.data);
      } catch (error) {
        console.error("Failed to fetch points:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPoints();
  }, []);

  const handleMarkerClick = (point) => {
    setSelectedPoint(point);
    setSidebarOpen(true);
    setNearestPoint(null);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleExitedSidebar = () => {
    if (!sidebarOpen) {
      setSelectedPoint(null);
    }
  };

  const handlePointUpdate = (pointId, newStatus) => {
    setPoints(currentPoints => 
      currentPoints.map(p => 
        p.id === pointId ? { ...p, status: newStatus } : p
      )
    );
    if (selectedPoint && selectedPoint.id === pointId) {
      setSelectedPoint(prev => ({ ...prev, status: newStatus }));
    }
  };

  const handleLocationFound = async (latlng) => {
    try {
      const response = await apiClient.get(`/api/points/nearest?lat=${latlng.lat}&lon=${latlng.lng}`);
      setNearestPoint(response.data);
      setSelectedPoint(response.data);
      setSidebarOpen(true);
    } catch (error) {
      console.error("Failed to fetch nearest point:", error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
      {/* This Box prevents scrolling on the map page */}
      <div className="app-container">
        <Map 
          points={points} 
          onMarkerClick={handleMarkerClick}
          nearestPoint={nearestPoint}
        >
          <SettingsControl isProgressive={isProgressiveLoad} onToggle={handleToggleLoadMode} />
          <Loader />
          <BottomBar onLocationFound={handleLocationFound} />
        </Map>

        <Sidebar 
          point={selectedPoint} 
          open={sidebarOpen}
          onClose={handleCloseSidebar} 
          onPointUpdate={handlePointUpdate}
          onExited={handleExitedSidebar}
        />
      </div>
    </Box>
  );
};

export default MapPage;