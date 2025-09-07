#!/bin/bash

# A script to initialize the React frontend for the Greece Trig Points project

echo "🚀 Starting frontend setup..."

# 1. Check if we are in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from inside the 'frontend' directory."
    exit 1
fi

# 2. Clean up default Vite files
echo "🧹 Cleaning up boilerplate files..."
rm -f src/App.css src/index.css
rm -rf src/assets

# 3. Install necessary libraries
echo "📦 Installing Leaflet, React-Leaflet, and Axios..."
npm install leaflet react-leaflet axios

# 4. Create the global CSS file
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

# 5. Overwrite main.jsx to include the new CSS
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

# 6. Create the components folder and the Map component
echo "🗺️ Creating the Map component..."
mkdir -p src/components
cat > src/components/Map.jsx << EOF
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Map = () => {
  const position = [39.0742, 23.8243]; // Center of Greece

  return (
    <MapContainer center={position} zoom={7} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
};

export default Map;
EOF

# 7. Overwrite App.jsx to use the Map component
echo "♻️ Replacing App.jsx with our Map..."
cat > src/App.jsx << EOF
import Map from './components/Map';

function App() {
  return <Map />;
}

export default App;
EOF

echo "✅ Frontend setup complete!"
echo "➡️ Now, run 'npm run dev' to start the server."