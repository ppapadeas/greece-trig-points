import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../api';
import L from 'leaflet';
import MarkerCluster from './MarkerCluster';
import LoadingSpinner from './LoadingSpinner';

// FIX for broken marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Map = ({ onMarkerClick }) => {
  const [points, setPoints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const position = [39.0742, 23.8243];

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const response = await apiClient.get('/api/points');
        setPoints(response.data);
      } catch (error) {
        console.error("Failed to fetch points:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPoints();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <MapContainer center={position} zoom={7} scrollWheelZoom={true}>
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Map">
          <TileLayer
            attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      
      <MarkerCluster points={points} onMarkerClick={onMarkerClick} />
    </MapContainer>
  );
};

export default Map;