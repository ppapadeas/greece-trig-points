import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const createCustomClusterIcon = (cluster) => {
  return L.divIcon({
    html: `<span>${cluster.getChildCount()}</span>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(33, 33, true),
  });
};

const MarkerCluster = ({ points = [], onMarkerClick }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    const markers = L.markerClusterGroup({
      maxClusterRadius: 40,
      iconCreateFunction: createCustomClusterIcon,
    });

    points.forEach(point => {
      const location = JSON.parse(point.location);
      const pointPosition = [location.coordinates[1], location.coordinates[0]];
      
      // --- THE FIX IS HERE ---
      // We create a simpler icon with a dynamic class name
      // and ensure the size and anchor are perfectly centered.
      const customMarkerIcon = L.divIcon({
        className: `custom-marker-pin marker-status-${point.status.toLowerCase()}`,
        iconSize: [16, 16], // Corresponds to the CSS width/height
        iconAnchor: [8, 8], // The center of the icon
      });

      const marker = L.marker(pointPosition, { icon: customMarkerIcon });
      
      marker.pointData = point;
      
      markers.addLayer(marker);
    });

    markers.on('click', (e) => {
      onMarkerClick(e.layer.pointData);
    });

    map.addLayer(markers);

    return () => {
      map.removeLayer(markers);
    };
  }, [points, map, onMarkerClick]);

  return null;
};

export default MarkerCluster;