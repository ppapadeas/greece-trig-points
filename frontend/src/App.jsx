import { useState, useEffect } from 'react';
import apiClient from './api';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingSpinner from './components/LoadingSpinner';
import { useTheme, useMediaQuery } from '@mui/material';

function App() {
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
  
  // Deselect point when sidebar closes to avoid brief stale data
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
    <div className="page-container">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <div className="app-container">
        <Map points={points} onMarkerClick={handleMarkerClick} />
        <Sidebar 
          point={selectedPoint} 
          open={sidebarOpen}
          onClose={handleCloseSidebar} 
          onPointUpdate={handlePointUpdate}
          onExited={handleExitedSidebar}
        />
      </div>
    </div>
  );
}

export default App;
