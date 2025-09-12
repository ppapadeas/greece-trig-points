import { useState, useCallback, useEffect } from 'react';
import apiClient from '../api';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import BottomBar from '../components/BottomBar';
import MapSpinner from '../components/MapSpinner';

const MapPage = () => {
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Manages the spinner visibility
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nearestPoint, setNearestPoint] = useState(null);

  useEffect(() => {
    const fetchAllPoints = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/api/points');
        setPoints(response.data);
      } catch (error) {
        console.error("Failed to fetch points:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllPoints();
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

  return (
    <div className="app-container">
      <Map 
        points={points} 
        onMarkerClick={handleMarkerClick}
        nearestPoint={nearestPoint}
      >
        {/* The Map will always be visible */}
        {/* The spinner and bottom bar are now children */}
        {isLoading && <MapSpinner />}
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
  );
};

export default MapPage;