import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import AdminRoute from './components/AdminRoute';
import { Box, Toolbar, CircularProgress } from '@mui/material';

const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const UserProfilePage = lazy(() => import('./pages/UserProfilePage'));
const CompassPage = lazy(() => import('./pages/CompassPage'));
const PhotosPage = lazy(() => import('./pages/PhotosPage'));
const AdminMapPreviewPage = lazy(() => import('./pages/AdminMapPreviewPage'));
const SatelliteComparePage = lazy(() => import('./pages/SatelliteComparePage'));

function App() {
  return (
    <Router>
      <Helmet defaultTitle="vathra.xyz — Τριγωνομετρικά Σημεία Ελλάδας" titleTemplate="%s" />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <Header />
        <Toolbar />
        <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
          <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>}>
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/point/:gysId" element={<MapPage />} />
            <Route path="/stats" element={<StatisticsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/profile/:userId" element={<UserProfilePage />} />
            <Route path="/compass" element={<CompassPage />} />
            <Route path="/photos" element={<PhotosPage />} />
            <Route
              path="/admin"
              element={<AdminRoute><AdminPage /></AdminRoute>}
            />
            <Route
              path="/admin/map-preview"
              element={<AdminRoute><AdminMapPreviewPage /></AdminRoute>}
            />
            <Route
              path="/admin/satellite-compare"
              element={<AdminRoute><SatelliteComparePage /></AdminRoute>}
            />
          </Routes>
          </Suspense>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
