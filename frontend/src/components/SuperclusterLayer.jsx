import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import Supercluster from 'supercluster';

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const ORDER_RADIUS = { I: 9, II: 7, III: 6, IV: 6 };

const SuperclusterLayer = ({ points = [], onMarkerClick }) => {
  const map = useMap();
  const mapRef = useRef(map);
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  const indexRef = useRef(new Supercluster({
    radius: 60,
    maxZoom: 16,
    minPoints: 2,
  }));
  const loadedRef = useRef(false);

  const rendererRef = useRef(L.canvas({ padding: 0.5 }));
  const layerGroupRef = useRef(L.layerGroup());
  const visibleMarkersRef = useRef(new Map()); // key → layer

  const getFeatureKey = (feature) => {
    const props = feature.properties;
    if (props.cluster) return `c_${feature.id}`;
    return `p_${props.id}`;
  };

  const createMarker = useCallback((feature) => {
    const [lng, lat] = feature.geometry.coordinates;
    const props = feature.properties;
    const m = mapRef.current;

    if (props.cluster) {
      const count = props.point_count;
      const size = count < 100 ? 33 : count < 1000 ? 40 : 48;
      const marker = L.marker([lat, lng], {
        icon: L.divIcon({
          html: `<span>${count}</span>`,
          className: 'custom-marker-cluster',
          iconSize: L.point(size, size),
        }),
      });
      marker.on('click', () => {
        const ez = Math.min(indexRef.current.getClusterExpansionZoom(feature.id), 18);
        m.flyTo([lat, lng], ez);
      });
      return marker;
    } else {
      const status = props.status || 'UNKNOWN';
      const order = props.point_order || 'IV';
      const cm = L.circleMarker([lat, lng], {
        renderer: rendererRef.current,
        radius: ORDER_RADIUS[order] || 6,
        fillColor: STATUS_COLORS[status] || STATUS_COLORS.UNKNOWN,
        fillOpacity: 1,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
      });
      cm.on('click', () => {
        onMarkerClickRef.current({
          id: props.id,
          gys_id: props.gys_id,
          status: props.status,
          point_order: props.point_order,
          lat,
          lon: lng,
        });
      });
      return cm;
    }
  }, []);

  const updateMarkers = useCallback(() => {
    const m = mapRef.current;
    if (!m || !loadedRef.current) return;

    const bounds = m.getBounds();
    const bbox = [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
    const zoom = m.getZoom();
    const clusters = indexRef.current.getClusters(bbox, zoom);

    const group = layerGroupRef.current;
    const prev = visibleMarkersRef.current;
    const next = new Map();

    clusters.forEach(feature => {
      const key = getFeatureKey(feature);
      if (prev.has(key)) {
        next.set(key, prev.get(key));
        prev.delete(key);
      } else {
        const layer = createMarker(feature);
        group.addLayer(layer);
        next.set(key, layer);
      }
    });

    // Remove markers no longer visible
    prev.forEach(layer => group.removeLayer(layer));

    visibleMarkersRef.current = next;
  }, [createMarker]);

  // Load data into Supercluster when points change
  useEffect(() => {
    if (points.length === 0) return;

    const geojson = points.map(p => ({
      type: 'Feature',
      properties: {
        id: p.id,
        gys_id: p.gys_id,
        status: p.status,
        point_order: p.point_order,
      },
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
    }));
    indexRef.current.load(geojson);
    loadedRef.current = true;
    // Clear diff cache on data reload so stale markers don't persist
    const group = layerGroupRef.current;
    visibleMarkersRef.current.forEach(layer => group.removeLayer(layer));
    visibleMarkersRef.current = new Map();
    updateMarkers();
  }, [points, updateMarkers]);

  // Bind map events
  useEffect(() => {
    mapRef.current = map;
    map.addLayer(layerGroupRef.current);
    map.on('moveend', updateMarkers);
    updateMarkers();

    return () => {
      map.off('moveend', updateMarkers);
      map.removeLayer(layerGroupRef.current);
    };
  }, [map, updateMarkers]);

  return null;
};

export default SuperclusterLayer;
