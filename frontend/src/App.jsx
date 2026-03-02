import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import StatisticsPage from './pages/StatisticsPage';
import AdminPage from './pages/AdminPage';
import AdminRoute from './components/AdminRoute';
import AboutPage from './pages/AboutPage';
import { Box, Toolbar } from '@mui/material';

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Toolbar />
        <Box component="main" sx={{ flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
          <Routes>
            {/* Same key prevents unmount when navigating between / and /point/:gysId */}
            <Route path="/" element={<MapPage key="map" />} />
            <Route path="/point/:gysId" element={<MapPage key="map" />} />
            <Route path="/stats" element={<StatisticsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route
              path="/admin"
              element={<AdminRoute><AdminPage /></AdminRoute>}
            />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
