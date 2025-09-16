import { useState, useEffect } from 'react';
import apiClient from '../api';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import BottomBar from '../components/BottomBar';
import MapSpinner from '../components/MapSpinner';

const MapPage = () => {
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nearestPoint, setNearestPoint] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL', order: 'ALL' });

  useEffect(() => {
    const fetchPoints = async () => {
      setIsLoading(true);
      try {
        // Pass the current filters to the API
        const response = await apiClient.get('/api/points', {
          params: filters
        });
        setPoints(response.data);
      } catch (error) {
        console.error("Failed to fetch points:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPoints();
  }, [filters]); // Re-run this effect whenever the filters change

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

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
        filters={filters}
        onFilterChange={handleFilterChange}
      >
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