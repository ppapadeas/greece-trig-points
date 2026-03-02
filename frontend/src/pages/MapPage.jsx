import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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

  // Read gysId from URL on initial load (permalink support)
  const { gysId: initialGysId } = useParams();
  const initialGysIdRef = useRef(initialGysId);

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

  // Handle permalink: open sidebar for gysId present on initial load
  useEffect(() => {
    const gysId = initialGysIdRef.current;
    if (!gysId) return;
    const fetchPointForPermalink = async () => {
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
        window.history.replaceState(null, '', '/');
      }
    };
    fetchPointForPermalink();
  }, []); // runs once on mount only

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleMarkerClick = async (point) => {
    // Update URL without triggering a route change / remount
    window.history.pushState(null, '', `/point/${point.gys_id}`);
    // Fly to marker immediately using lightweight list data
    const location = JSON.parse(point.location);
    setFlyToCoords([location.coordinates[1], location.coordinates[0]]);
    setSidebarOpen(true);
    // Fetch full detail for sidebar (list only has map-rendering columns)
    try {
      const response = await apiClient.get(`/api/points/${point.gys_id}`);
      setSelectedPoint(response.data);
    } catch (error) {
      console.error('Failed to fetch point detail:', error);
    }
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  const handleExitedSidebar = () => {
    if (!sidebarOpen) {
      setSelectedPoint(null);
      window.history.pushState(null, '', '/');
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
      const point = response.data;
      window.history.pushState(null, '', `/point/${point.gys_id}`);
      setSelectedPoint(point);
      setSidebarOpen(true);
      const loc = JSON.parse(point.location);
      setFlyToCoords([loc.coordinates[1], loc.coordinates[0]]);
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
