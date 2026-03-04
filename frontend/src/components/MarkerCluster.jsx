import { useEffect, useRef } from 'react';
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
  const clusterGroupRef = useRef(null);
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  // Create cluster group once and keep it alive — never destroy/recreate
  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 40,
      iconCreateFunction: createCustomClusterIcon,
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 10,
      removeOutsideVisibleBounds: true,
      disableClusteringAtZoom: 16,
      animate: false,
      spiderfyOnMaxZoom: false,
    });
    group.on('click', (e) => onMarkerClickRef.current(e.layer.pointData));
    map.addLayer(group);
    clusterGroupRef.current = group;

    return () => {
      map.removeLayer(group);
      clusterGroupRef.current = null;
    };
  }, [map]); // only on mount/unmount

  // When points change (filter): clear and re-add layers, no group recreation
  useEffect(() => {
    const group = clusterGroupRef.current;
    if (!group) return;

    group.clearLayers();
    if (points.length === 0) return;

    const layers = points.map(point => {
      let iconSize = 16;
      if (point.point_order === 'I') iconSize = 22;
      else if (point.point_order === 'II') iconSize = 18;

      const marker = L.marker([point.lat, point.lon], {
        icon: L.divIcon({
          className: `custom-marker-pin marker-status-${point.status.toLowerCase()}`,
          iconSize: [iconSize, iconSize],
          iconAnchor: [iconSize / 2, iconSize / 2],
        }),
      });
      marker.pointData = point;
      return marker;
    });

    group.addLayers(layers); // batch add — much faster than addLayer() in a loop
  }, [points]);

  return null;
};

export default MarkerCluster;
