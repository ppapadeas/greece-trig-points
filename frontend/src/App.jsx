import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import StatisticsPage from './pages/StatisticsPage';

function App() {
  return (
    <Router>
      <div className="page-container">
        <Header />
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/stats" element={<StatisticsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;