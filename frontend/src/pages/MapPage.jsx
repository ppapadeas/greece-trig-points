import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';
import Map from '../components/Map';
import Sidebar from '../components/Sidebar';
import BottomBar from '../components/BottomBar';
import MapSpinner from '../components/MapSpinner';
import { Paper, Typography, Button, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExploreIcon from '@mui/icons-material/Explore';

const ALL_STATUSES = ['OK', 'DAMAGED', 'UNKNOWN', 'MISSING', 'DESTROYED'];
const ALL_ORDERS = ['I', 'II', 'III', 'IV'];

// Read filter state from the URL once on first paint so deep-links into a
// pre-filtered map work without flashing the unfiltered set.
function filtersFromQuery() {
  if (typeof window === 'undefined') return { statuses: ALL_STATUSES, orders: ALL_ORDERS, tags: [] };
  const sp = new URLSearchParams(window.location.search);
  const parseList = (key, allowed) => {
    const raw = sp.get(key);
    if (!raw) return null;
    const items = raw.split(',').filter(Boolean);
    if (!allowed) return items;
    return items.filter(x => allowed.includes(x));
  };
  return {
    statuses: parseList('status', ALL_STATUSES) || ALL_STATUSES,
    orders: parseList('order', ALL_ORDERS) || ALL_ORDERS,
    tags: parseList('tags') || [],
  };
}

const MapPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [filters, setFilters] = useState(filtersFromQuery);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestUnvisited, setNearestUnvisited] = useState(null);
  const fetchAbortRef = useRef(null);

  // Read gysId from URL on initial load (permalink support)
  const { gysId: initialGysId } = useParams();
  const initialGysIdRef = useRef(initialGysId);

  const fetchPoints = useCallback(async () => {
    if (fetchAbortRef.current) fetchAbortRef.current.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/points', {
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

  // Fetch all points once on mount
  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  // Filter points client-side
  const filteredPoints = useMemo(() => {
    const sset = new Set(filters.statuses);
    const oset = new Set(filters.orders);
    const tagFilter = filters.tags || [];
    return points.filter(p =>
      sset.has(p.status) &&
      oset.has(p.point_order) &&
      (tagFilter.length === 0 || tagFilter.every(t => (p.tag_slugs || []).includes(t)))
    );
  }, [points, filters]);

  // Keep URL in sync with active filters so users can share a filtered view
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (filters.statuses.length < ALL_STATUSES.length) sp.set('status', filters.statuses.join(',')); else sp.delete('status');
    if (filters.orders.length < ALL_ORDERS.length) sp.set('order', filters.orders.join(',')); else sp.delete('order');
    if (filters.tags && filters.tags.length > 0) sp.set('tags', filters.tags.join(',')); else sp.delete('tags');
    const qs = sp.toString();
    const path = window.location.pathname;
    const newUrl = qs ? `${path}?${qs}` : path;
    if (newUrl !== `${path}${window.location.search}`) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [filters]);

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

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleMarkerClick = async (point) => {
    // Update URL without triggering a route change / remount
    window.history.pushState(null, '', `/point/${point.gys_id}`);
    // Fly to marker immediately using lat/lon from list data
    setFlyToCoords([point.lat, point.lon]);
    setSidebarOpen(true);
    // Fetch full detail for sidebar (list only has map-rendering columns)
    try {
      const response = await apiClient.get(`/api/points/${point.gys_id}`);
      setSelectedPoint(response.data);
    } catch (error) {
      console.error('Failed to fetch point detail:', error);
    }
  };

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  const handleExitedSidebar = () => {
    if (!sidebarOpen) {
      setSelectedPoint(null);
      window.history.pushState(null, '', '/');
    }
  };

  const handlePointUpdate = useCallback((pointId, newStatus) => {
    setPoints(currentPoints =>
      currentPoints.map(p =>
        p.id === pointId ? { ...p, status: newStatus } : p
      )
    );
    setSelectedPoint(prev =>
      prev && prev.id === pointId ? { ...prev, status: newStatus } : prev
    );
  }, []);

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
    // Fetch nearest unvisited for logged-in users
    if (user) {
      try {
        const res = await apiClient.get(`/api/points/nearest-unvisited?lat=${latlng.lat}&lon=${latlng.lng}`);
        setNearestUnvisited(res.data);
      } catch { /* no unvisited points */ }
    }
  };

  const handleGoToUnvisited = () => {
    if (!nearestUnvisited) return;
    const loc = JSON.parse(nearestUnvisited.location);
    const coords = [loc.coordinates[1], loc.coordinates[0]];
    window.history.pushState(null, '', `/point/${nearestUnvisited.gys_id}`);
    setSelectedPoint(nearestUnvisited);
    setSidebarOpen(true);
    setFlyToCoords(coords);
    setNearestUnvisited(null);
  };

  const pageTitle = selectedPoint
    ? `${selectedPoint.name || `GYS ${selectedPoint.gys_id}`} — vathra.xyz`
    : 'vathra.xyz — Τριγωνομετρικά Σημεία Ελλάδας';

  return (
    <div className="app-container">
      <Helmet>
        <title>{pageTitle}</title>
        <link rel="canonical" href={selectedPoint ? `https://vathra.xyz/point/${selectedPoint.gys_id}` : 'https://vathra.xyz/'} />
      </Helmet>
      <Map
        points={filteredPoints}
        onMarkerClick={handleMarkerClick}
        userLocation={userLocation}
        filters={filters}
        onFilterChange={handleFilterChange}
        flyToCoords={flyToCoords}
      >
        {isLoading && <MapSpinner />}
        <BottomBar onLocationFound={handleLocationFound} />
      </Map>

      {nearestUnvisited && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            px: 2, py: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            maxWidth: '90vw',
            borderRadius: 2,
          }}
        >
          <ExploreIcon color="primary" />
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            {t('map.nearestUnvisited', {
              name: nearestUnvisited.name || `GYS ${nearestUnvisited.gys_id}`,
              distance: (nearestUnvisited.distance_meters / 1000).toFixed(1),
            })}
          </Typography>
          <Button size="small" variant="contained" onClick={handleGoToUnvisited}>
            {t('map.goToPoint')}
          </Button>
          <IconButton size="small" onClick={() => setNearestUnvisited(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      )}

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
