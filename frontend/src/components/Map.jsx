import React, { useEffect } from 'react';
import { MapContainer, TileLayer, LayersControl, Circle, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MarkerCluster from './MarkerCluster';
import MapControls from './MapControls';

// A helper component to control the map imperatively
const MapController = ({ flyToCoords }) => {
  const map = useMap();
  useEffect(() => {
    if (flyToCoords) {
      map.flyTo(flyToCoords, 16);
    }
  }, [flyToCoords, map]);
  return null;
};

// Fires onBoundsChange on map move/zoom and on initial mount
const BoundsWatcher = ({ onBoundsChange }) => {
  const map = useMap();
  useEffect(() => {
    const handler = () => onBoundsChange(map.getBounds());
    map.on('moveend', handler);
    map.on('zoomend', handler);
    // Fire immediately so initial viewport loads points
    onBoundsChange(map.getBounds());
    return () => {
      map.off('moveend', handler);
      map.off('zoomend', handler);
    };
  }, [map, onBoundsChange]);
  return null;
};

// FIX for broken marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const Map = ({ points, onMarkerClick, userLocation, children, filters, onFilterChange, flyToCoords, onBoundsChange }) => {
  const position = [38.25, 23.83];

  return (
    <MapContainer center={position} zoom={7} scrollWheelZoom={true} zoomControl={false}>
      <LayersControl position="topleft">
        <LayersControl.BaseLayer checked name="Map">
          <TileLayer
            attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Topographic">
          <TileLayer
            attribution='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
           <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <MapControls filters={filters} onFilterChange={onFilterChange} />

      <MarkerCluster points={points} onMarkerClick={onMarkerClick} />

      {onBoundsChange && <BoundsWatcher onBoundsChange={onBoundsChange} />}

      {userLocation && (
        <>
          <CircleMarker
            center={userLocation}
            radius={8}
            pathOptions={{ color: 'white', weight: 2, fillColor: '#4285F4', fillOpacity: 1 }}
          />
          <Circle
            center={userLocation}
            radius={60}
            pathOptions={{ color: '#4285F4', weight: 1, fillColor: '#4285F4', fillOpacity: 0.15 }}
          />
        </>
      )}

      {children}

      <MapController flyToCoords={flyToCoords} />
    </MapContainer>
  );
};

export default Map;