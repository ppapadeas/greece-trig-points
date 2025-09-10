import { useState, useCallback } from 'react';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import BottomBar from '../components/BottomBar';
import apiClient from '../api';

const MapPage = () => {
  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nearestPoint, setNearestPoint] = useState(null);

  const handlePointsLoaded = useCallback((newPoints) => {
    setPoints(currentPoints => {
      const existingIds = new Set(currentPoints.map(p => p.id));
      const filteredNewPoints = newPoints.filter(p => !existingIds.has(p.id));
      return [...currentPoints, ...filteredNewPoints];
    });
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
        onPointsLoaded={handlePointsLoaded}
      >
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