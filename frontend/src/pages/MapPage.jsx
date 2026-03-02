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
  const boundsRef = useRef(null);
  const fetchAbortRef = useRef(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters; // always current, no stale closure

  const { gysId } = useParams();
  const navigate = useNavigate();

  const fetchPoints = useCallback(async (bounds, currentFilters) => {
    // Cancel any in-flight request
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    // DEBUG — remove before ship
    console.log('[vathra] fetchPoints called', {
      bounds: bounds ? `${bounds._southWest?.lat.toFixed(3)},${bounds._southWest?.lng.toFixed(3)} → ${bounds._northEast?.lat.toFixed(3)},${bounds._northEast?.lng.toFixed(3)}` : 'none',
      filters: currentFilters,
      stack: new Error().stack.split('\n').slice(1, 4).join(' | '),
    });

    setIsLoading(true);
    try {
      const params = { ...currentFilters };
      if (bounds) params.bounds = JSON.stringify(bounds);
      const response = await apiClient.get('/api/points', {
        params,
        signal: controller.signal,
      });
      console.log('[vathra] fetchPoints resolved', response.data.length, 'points');
      setPoints(response.data);
    } catch (error) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        console.error("Failed to fetch points:", error);
      } else {
        console.log('[vathra] fetchPoints aborted (superseded by newer request)');
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  }, []);

  // Re-fetch when filters change, using last known bounds
  useEffect(() => {
    console.log('[vathra] filter useEffect fired', filters);
    fetchPoints(boundsRef.current, filters);
  }, [filters, fetchPoints]);

  // Stable reference — filtersRef.current always has latest filters without being a dep
  const handleBoundsChange = useCallback((bounds) => {
    console.log('[vathra] handleBoundsChange called');
    boundsRef.current = bounds;
    fetchPoints(bounds, filtersRef.current);
  }, [fetchPoints]); // fetchPoints is stable (no deps), so this never changes

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
        onBoundsChange={handleBoundsChange}
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
