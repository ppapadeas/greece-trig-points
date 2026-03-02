// Minimal re-implementation of App's route structure for testing
// Avoids importing App directly (which pulls in AuthContext provider etc.)
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MapPage from '../../pages/MapPage';
import StatisticsPage from '../../pages/StatisticsPage';
import AboutPage from '../../pages/AboutPage';

const AppRoutes = ({ initialPath = '/' }) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/point/:gysId" element={<MapPage />} />
      <Route path="/stats" element={<StatisticsPage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  </MemoryRouter>
);

export default AppRoutes;
