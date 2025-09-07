#!/bin/bash

# A script to configure the backend for CORS and set up the frontend map.
# IMPORTANT: Run this from the project's root directory.

echo "🚀 Starting full-stack setup for the map view..."

# 1. Check if we are in the correct directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the root project directory (greece-trig-points)."
    exit 1
fi

# --- BACKEND SETUP ---
echo "⚙️  Configuring backend for CORS..."
(
    cd backend || exit
    npm install cors
)

# Modify backend/index.js to include CORS middleware
# Using a temporary file for safety, works on all systems
cp backend/index.js backend/index.js.bak
sed "/const express = require('express');/a const cors = require('cors');" backend/index.js.bak > backend/index.js.tmp
sed "/const app = express();/a app.use(cors());" backend/index.js.tmp > backend/index.js
rm backend/index.js.tmp backend/index.js.bak
echo "✅ Backend CORS setup complete."

# --- FRONTEND SETUP ---
echo "🎨 Setting up frontend map component..."
(
    cd frontend || exit
    
    echo "🧹 Cleaning up boilerplate files..."
    rm -f src/App.css src/index.css
    rm -rf src/assets

    echo "📦 Installing Leaflet, React-Leaflet, and Axios..."
    npm install leaflet react-leaflet axios

    echo "🎨 Creating new global styles..."
    cat > src/index.css << EOF
body, #root {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden; /* Prevents scrollbars */
}
.leaflet-container {
  height: 100%;
  width: 100%;
}
EOF

    echo "✏️ Updating main.jsx..."
    cat > src/main.jsx << EOF
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

    echo "🗺️ Creating the Map component..."
    mkdir -p src/components
    cat > src/components/Map.jsx << EOF
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// FIX for broken marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Map = () => {
  const [points, setPoints] = useState([]);
  const position = [39.0742, 23.8243]; // Center of Greece

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/points');
        setPoints(response.data);
        console.log(\`Fetched \${response.data.length} points.\`);
      } catch (error) {
        console.error("Failed to fetch points:", error);
      }
    };
    fetchPoints();
  }, []);

  return (
    <MapContainer center={position} zoom={7} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {points.map(point => {
        const location = JSON.parse(point.location);
        const pointPosition = [location.coordinates[1], location.coordinates[0]];
        
        return (
          <Marker key={point.id} position={pointPosition}>
            <Popup>
              <b>ID: {point.name}</b><br/>
              EGSA87 X: {point.egsa87_x}<br/>
              EGSA87 Y: {point.egsa87_y}<br/>
              Elevation: {point.elevation}m
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default Map;
EOF

    echo "♻️ Replacing App.jsx with our Map..."
    cat > src/App.jsx << EOF
import Map from './components/Map';

function App() {
  return <Map />;
}

export default App;
EOF
)
echo "✅ Frontend setup complete."

echo ""
echo "---"
echo "🎉 All steps are done! Now, you need to:"
echo "1. Open a terminal, 'cd backend', and run 'npm run dev'"
echo "2. Open another terminal, 'cd frontend', and run 'npm run dev'"