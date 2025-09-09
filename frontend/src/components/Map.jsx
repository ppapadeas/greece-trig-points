import { MapContainer, TileLayer, LayersControl, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MarkerCluster from './MarkerCluster';
import LocationButton from './LocationButton';

// FIX for broken marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// The component now accepts 'children' as a prop
const Map = ({ points, onMarkerClick, children, nearestPoint, onLocationFound }) => {
  const position = [39.0742, 23.8243];

  let nearestPointPosition = null;
  if (nearestPoint) {
    const location = JSON.parse(nearestPoint.location);
    nearestPointPosition = [location.coordinates[1], location.coordinates[0]];
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

      {/* If a nearest point is found, display a special circle marker for it */}
      {nearestPointPosition && (
        <Circle
          center={nearestPointPosition}
          radius={100}
          pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3 }}
        />
      )}

      {children}

      <LocationButton onLocationFound={onLocationFound} />
    </MapContainer>
  );
};

export default Map;