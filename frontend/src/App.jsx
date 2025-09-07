import { useState } from 'react';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function App() {
  const [selectedPoint, setSelectedPoint] = useState(null);

  const handleMarkerClick = (point) => {
    setSelectedPoint(point);
  };

  const handleCloseSidebar = () => {
    setSelectedPoint(null);
  };

  return (
    <div className="page-container">
      <Header />
      <div className="app-container">
        {/* The Map component now handles its own data fetching */}
        <Map onMarkerClick={handleMarkerClick} />
        <Sidebar point={selectedPoint} onClose={handleCloseSidebar} />
      </div>
    </div>
  );
}

export default App;
