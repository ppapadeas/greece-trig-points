import { MapContainer, TileLayer, LayersControl, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MarkerCluster from './MarkerCluster';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Map = ({ points, onMarkerClick, nearestPoint, children }) => {
  const position = [38.25, 23.83];

  let nearestPointPosition = null;
  if (nearestPoint) {
    const location = JSON.parse(nearestPoint.location);
    nearestPointPosition = [location.coordinates[1], location.coordinates[0]];
  }

  return (
    <MapContainer center={position} zoom={7} scrollWheelZoom={true}>
      <LayersControl position="topright" />
      
      <TileLayer
        attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
      />
      
      <MarkerCluster points={points} onMarkerClick={onMarkerClick} />
      
      {nearestPointPosition && (
        <Circle
          center={nearestPointPosition}
          radius={100}
          pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
        />
      )}

      {children}
    </MapContainer>
  );
};

export default Map;
