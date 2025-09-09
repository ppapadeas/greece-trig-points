import { useState, useEffect } from 'react';
import apiClient from '../api';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import SearchBar from '../components/SearchBar'; // Import the new component
import { useTheme, useMediaQuery } from '@mui/material';

const MapPage = () => {
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app-container">
      {/* We must wrap the map and search bar in a parent component */}
      <Map points={points} onMarkerClick={handleMarkerClick}>
        <SearchBar /> 
      </Map>

      <Sidebar 
        point={selectedPoint} 
        open={sidebarOpen}
        onClose={handleCloseSidebar} 
        onPointUpdate={handlePointUpdate}
        onExited={handleExitedSidebar}
      />
    </div>
  );
};

export default MapPage;