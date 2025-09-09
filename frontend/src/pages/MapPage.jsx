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
  const [nearestPoint, setNearestPoint] = useState(null); // State for the nearest point

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
  
  const handleLocationFound = async (latlng) => {
    try {
      // Ask the backend to find the nearest point to our coordinates
      const response = await apiClient.get(`/api/points/nearest?lat=${latlng.lat}&lon=${latlng.lng}`);
      setNearestPoint(response.data);
      // Automatically select the nearest point to show its details
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
    <div className="app-container">
      <Map 
        points={points} 
        onMarkerClick={handleMarkerClick}
        // Pass the nearest point and the location handler to the map
        nearestPoint={nearestPoint}
        onLocationFound={handleLocationFound}
      >
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