import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL', order: 'ALL' });
  const [userLocation, setUserLocation] = useState(null);
  const fetchAbortRef = useRef(null);

  const { gysId } = useParams();
  const navigate = useNavigate();

  const fetchPoints = useCallback(async (currentFilters) => {
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/points', {
        params: currentFilters,
        signal: controller.signal,
      });
      setPoints(response.data);
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error("Failed to fetch points:", error);
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  // Fetch all points on mount and whenever filters change
  useEffect(() => {
    fetchPoints(filters);
  }, [filters, fetchPoints]);

  useEffect(() => {
    const fetchPointForPermalink = async () => {
      if (gysId && (!selectedPoint || selectedPoint.gys_id !== gysId)) {
        try {
          const response = await apiClient.get(`/api/points/${gysId}`);
          const point = response.data;
          const location = JSON.parse(point.location);
          const coords = [location.coordinates[1], location.coordinates[0]];

          setSelectedPoint(point);
          setSidebarOpen(true);
          setFlyToCoords(coords);
        } catch (error) {
          console.error(`Failed to fetch point with GYS ID ${gysId}`, error);
          navigate('/');
        }
      }
    };
    fetchPointForPermalink();
  }, [gysId, navigate, selectedPoint]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMarkerClick = (point) => {
    navigate(`/point/${point.gys_id}`);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleExitedSidebar = () => {
    if (!sidebarOpen) {
      setSelectedPoint(null);
      navigate('/');
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
    setUserLocation([latlng.lat, latlng.lng]);
    try {
      const response = await apiClient.get(`/api/points/nearest?lat=${latlng.lat}&lon=${latlng.lng}`);
      navigate(`/point/${response.data.gys_id}`);
    } catch (error) {
      console.error("Failed to fetch nearest point:", error);
    }
  };

  return (
    <div className="app-container">
      <Map
        points={points}
        onMarkerClick={handleMarkerClick}
        userLocation={userLocation}
        filters={filters}
        onFilterChange={handleFilterChange}
        flyToCoords={flyToCoords}
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
