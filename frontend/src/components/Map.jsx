import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { layers, LIGHT } from '@protomaps/basemaps';
import { MapProvider } from '../context/MapContext';
import MapControls from './MapControls';

const PMTILES_URL = import.meta.env.VITE_PMTILES_URL;

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const ORDER_RADIUS = { I: 9, II: 7, III: 6, IV: 6 };

const RASTER_SOURCES = {
  opentopomap: {
    type: 'raster',
    tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png', 'https://b.tile.opentopomap.org/{z}/{x}/{y}.png', 'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'],
    tileSize: 256,
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  },
  esri_satellite: {
    type: 'raster',
    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    tileSize: 256,
    attribution: 'Tiles &copy; Esri',
  },
};

// Build raster-only layer arrays for topo / satellite base layers
const topoLayers = [{ id: 'opentopomap-tiles', type: 'raster', source: 'opentopomap' }];
const satelliteLayers = [{ id: 'esri-satellite-tiles', type: 'raster', source: 'esri_satellite' }];

const Map = ({ points, onMarkerClick, userLocation, children, filters, onFilterChange, flyToCoords }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const pointsRef = useRef(points);
  pointsRef.current = points;
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  // Keep track of active base layer so we can switch
  const activeBaseRef = useRef('protomaps'); // 'protomaps' | 'topo' | 'satellite'

  const protomapsLayerIds = useRef([]);

  const setupMap = useCallback(() => {
    const baseLayers = layers('protomaps', LIGHT, { lang: 'en' });
    protomapsLayerIds.current = baseLayers.map(l => l.id);

    const style = {
      version: 8,
      glyphs: 'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',
      sources: {
        protomaps: {
          type: 'vector',
          url: `${PMTILES_URL}/greece.json`,
        },
        contours: {
          type: 'vector',
          url: `${PMTILES_URL}/contours.json`,
        },
        ...RASTER_SOURCES,
      },
      layers: baseLayers,
    };

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [23.83, 38.25],
      zoom: 7,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', () => {
      // Add the raster layers (hidden initially)
      topoLayers.forEach(l => map.addLayer({ ...l, layout: { visibility: 'none' } }, protomapsLayerIds.current[0]));
      satelliteLayers.forEach(l => map.addLayer({ ...l, layout: { visibility: 'none' } }, protomapsLayerIds.current[0]));

      // Add contour lines overlay
      addContourLayers(map);

      // Add trig points source with clustering
      addPointsSource(map);
      addPointsLayers(map);
      setupInteractions(map, onMarkerClickRef);

      setMapReady(true);
    });

    return map;
  }, []);

  // Initialize map
  useEffect(() => {
    const map = setupMap();
    return () => { map.remove(); };
  }, [setupMap]);

  // Update points when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const source = map.getSource('trig-points');
    if (source) {
      source.setData(buildGeojson(points));
    }
  }, [points, mapReady]);

  // FlyTo support
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToCoords) return;
    // flyToCoords is [lat, lng] (Leaflet convention) — MapLibre needs [lng, lat]
    map.flyTo({ center: [flyToCoords[1], flyToCoords[0]], zoom: 16 });
  }, [flyToCoords]);

  // User location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Remove previous user location layers/sources
    if (map.getLayer('user-location-pulse')) map.removeLayer('user-location-pulse');
    if (map.getLayer('user-location-dot')) map.removeLayer('user-location-dot');
    if (map.getSource('user-location')) map.removeSource('user-location');

    if (!userLocation) return;

    // userLocation is [lat, lng]
    map.addSource('user-location', {
      type: 'geojson',
      data: { type: 'Point', coordinates: [userLocation[1], userLocation[0]] },
    });
    map.addLayer({
      id: 'user-location-pulse',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': 20,
        'circle-color': '#4285F4',
        'circle-opacity': 0.15,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#4285F4',
        'circle-stroke-opacity': 0.3,
      },
    });
    map.addLayer({
      id: 'user-location-dot',
      type: 'circle',
      source: 'user-location',
      paint: {
        'circle-radius': 8,
        'circle-color': '#4285F4',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    });
  }, [userLocation, mapReady]);

  // Base layer switching
  const switchBaseLayer = useCallback((layerName) => {
    const map = mapRef.current;
    if (!map) return;

    activeBaseRef.current = layerName;

    // Toggle protomaps layers
    protomapsLayerIds.current.forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', layerName === 'protomaps' ? 'visible' : 'none');
      }
    });

    // Toggle raster layers
    topoLayers.forEach(l => {
      if (map.getLayer(l.id)) {
        map.setLayoutProperty(l.id, 'visibility', layerName === 'topo' ? 'visible' : 'none');
      }
    });
    satelliteLayers.forEach(l => {
      if (map.getLayer(l.id)) {
        map.setLayoutProperty(l.id, 'visibility', layerName === 'satellite' ? 'visible' : 'none');
      }
    });

    // Hide contours on satellite (too noisy over imagery)
    ['contour-lines', 'contour-lines-major', 'contour-labels'].forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', layerName === 'satellite' ? 'none' : 'visible');
      }
    });
  }, []);

  return (
    <div data-testid="map-container" style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      {mapReady && (
        <MapProvider value={mapRef.current}>
          <MapControls
            filters={filters}
            onFilterChange={onFilterChange}
            onBaseLayerChange={switchBaseLayer}
          />
          {children}
        </MapProvider>
      )}
    </div>
  );
};

function buildGeojson(points) {
  return {
    type: 'FeatureCollection',
    features: (points || []).map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
      properties: {
        id: p.id,
        gys_id: p.gys_id,
        status: p.status,
        point_order: p.point_order,
      },
    })),
  };
}

function addPointsSource(map) {
  map.addSource('trig-points', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
    cluster: true,
    clusterRadius: 25,
    clusterMaxZoom: 16,
    clusterMinPoints: 2,
  });
}

function addPointsLayers(map) {
  // Cluster circles
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'trig-points',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#51bbd6',
      'circle-radius': ['step', ['get', 'point_count'], 16, 100, 20, 1000, 24],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff',
    },
  });

  // Cluster count labels
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'trig-points',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-size': 12,
    },
    paint: { 'text-color': '#fff' },
  });

  // Individual points
  map.addLayer({
    id: 'trig-points-layer',
    type: 'circle',
    source: 'trig-points',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-radius': [
        'match', ['get', 'point_order'],
        'I', ORDER_RADIUS.I, 'II', ORDER_RADIUS.II,
        'III', ORDER_RADIUS.III, 'IV', ORDER_RADIUS.IV,
        6,
      ],
      'circle-color': [
        'match', ['get', 'status'],
        'OK', STATUS_COLORS.OK, 'DAMAGED', STATUS_COLORS.DAMAGED,
        'DESTROYED', STATUS_COLORS.DESTROYED, 'MISSING', STATUS_COLORS.MISSING,
        'UNKNOWN', STATUS_COLORS.UNKNOWN,
        STATUS_COLORS.UNKNOWN,
      ],
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
    },
  });
}

function addContourLayers(map) {
  // Minor contours (50m intervals) — thin lines visible at higher zoom
  map.addLayer({
    id: 'contour-lines',
    type: 'line',
    source: 'contours',
    'source-layer': 'contours',
    minzoom: 10,
    paint: {
      'line-color': '#8B4513',
      'line-opacity': 0.3,
      'line-width': 0.5,
    },
    filter: ['!=', ['%', ['get', 'elevation'], 200], 0],
  });

  // Major contours (200m intervals) — thicker, visible earlier
  map.addLayer({
    id: 'contour-lines-major',
    type: 'line',
    source: 'contours',
    'source-layer': 'contours',
    minzoom: 8,
    paint: {
      'line-color': '#8B4513',
      'line-opacity': 0.5,
      'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 1.5],
    },
    filter: ['==', ['%', ['get', 'elevation'], 200], 0],
  });

  // Elevation labels on major contours
  map.addLayer({
    id: 'contour-labels',
    type: 'symbol',
    source: 'contours',
    'source-layer': 'contours',
    minzoom: 11,
    filter: ['==', ['%', ['get', 'elevation'], 200], 0],
    layout: {
      'symbol-placement': 'line',
      'text-field': ['concat', ['to-string', ['get', 'elevation']], 'm'],
      'text-size': 10,
      'text-max-angle': 30,
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': '#8B4513',
      'text-halo-color': 'rgba(255,255,255,0.8)',
      'text-halo-width': 1.5,
    },
  });
}

function setupInteractions(map, onMarkerClickRef) {
  // Click cluster to expand
  map.on('click', 'clusters', async (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    const clusterId = features[0].properties.cluster_id;
    const zoom = await map.getSource('trig-points').getClusterExpansionZoom(clusterId);
    map.easeTo({ center: features[0].geometry.coordinates, zoom });
  });

  // Click individual point — trigger sidebar via onMarkerClick callback
  map.on('click', 'trig-points-layer', (e) => {
    const f = e.features[0];
    const [lng, lat] = f.geometry.coordinates;
    if (onMarkerClickRef.current) {
      onMarkerClickRef.current({
        id: f.properties.id,
        gys_id: f.properties.gys_id,
        status: f.properties.status,
        point_order: f.properties.point_order,
        lat,
        lon: lng,
      });
    }
  });

  // Cursor changes
  map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });
  map.on('mouseenter', 'trig-points-layer', () => { map.getCanvas().style.cursor = 'pointer'; });
  map.on('mouseleave', 'trig-points-layer', () => { map.getCanvas().style.cursor = ''; });
}

export default Map;
