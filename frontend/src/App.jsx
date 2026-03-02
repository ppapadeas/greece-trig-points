import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import StatisticsPage from './pages/StatisticsPage';
import AdminPage from './pages/AdminPage';
import AdminRoute from './components/AdminRoute';
import AboutPage from './pages/AboutPage';
import { Box, Toolbar } from '@mui/material';

// Keeps MapPage always mounted (never unmounts on /point/:gysId navigation)
// so the Leaflet instance and loaded points survive route changes.
const AppRoutes = () => {
  const location = useLocation();
  const isMapRoute = location.pathname === '/' || location.pathname.startsWith('/point/');

  return (
    <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
      {/* MapPage stays mounted; hidden when on other pages */}
      <Box sx={{ display: isMapRoute ? 'block' : 'none', height: '100%' }}>
        <MapPage />
      </Box>

      {!isMapRoute && (
        <Routes>
          <Route path="/stats" element={<StatisticsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route
            path="/admin"
            element={<AdminRoute><AdminPage /></AdminRoute>}
          />
        </Routes>
      )}
    </Box>
  );
};

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Toolbar />
        <AppRoutes />
      </Box>
    </Router>
  );
}

export default App;
