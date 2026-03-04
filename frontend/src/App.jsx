import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import StatisticsPage from './pages/StatisticsPage';
import AdminPage from './pages/AdminPage';
import AdminRoute from './components/AdminRoute';
import AboutPage from './pages/AboutPage';
import UserProfilePage from './pages/UserProfilePage';
import CompassPage from './pages/CompassPage';
import { Box, Toolbar } from '@mui/material';

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Toolbar />
        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/point/:gysId" element={<MapPage />} />
            <Route path="/stats" element={<StatisticsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            <Route path="/compass" element={<CompassPage />} />
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
