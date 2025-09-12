import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import StatisticsPage from './pages/StatisticsPage';
import AdminPage from './pages/AdminPage';
import AdminRoute from './components/AdminRoute'; // Import the protected route
import AboutPage from './pages/AboutPage';

function App() {
  return (
    <Router>
      <div className="page-container">
        <Header />
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/stats" element={<StatisticsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;