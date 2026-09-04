import { useEffect, useRef, useCallback, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
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

    // No NavigationControl — pinch / scroll-wheel / double-click handle zoom
    // on every modern device. The filter capsule top-right owns that corner.
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
        // 1/0 because MapLibre cluster_properties / boolean filters get
        // squirrelly with native bool values across data updates
        has_warning: p.has_warning_tag ? 1 : 0,
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
  // Cluster bubble — three concentric circles per the design handoff:
  //   r=22 ink @ 8%   ←  outer halo
  //   r=17 ink @ 14%  ←  inner halo
  //   r=13 ink solid  ←  the bubble
  // Sizes are fixed regardless of count (design intent).
  map.addLayer({
    id: 'clusters-halo-outer',
    type: 'circle',
    source: 'trig-points',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#1C1A14',
      'circle-opacity': 0.08,
      'circle-radius': 22,
    },
  });
  map.addLayer({
    id: 'clusters-halo-inner',
    type: 'circle',
    source: 'trig-points',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#1C1A14',
      'circle-opacity': 0.14,
      'circle-radius': 17,
    },
  });
  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'trig-points',
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': '#1C1A14',
      'circle-radius': 13,
    },
  });

  // Cluster count labels — parchment text, mono-style. Protomaps glyph stack
  // doesn't ship a mono face so we use Noto Sans Bold for the closest read.
  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'trig-points',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['Noto Sans Bold'],
      'text-size': 11,
      'text-letter-spacing': 0.04,
      'text-allow-overlap': true,
    },
    paint: { 'text-color': '#F7F2E8' },
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

  // Warning badge — small yellow circle offset to top-right of the marker.
  // Drawn ONLY for individual points whose has_warning=1; clusters are
  // intentionally NOT decorated (a busy cluster shouldn't read as a warning).
  // MapLibre GL JS v6 no longer accepts data-driven expressions for
  // `circle-translate`, so the per-order offset is expressed as one layer
  // per offset group instead of a single `match` expression.
  const WARNING_BADGES = [
    { suffix: 'i',   orders: ['I'],         radius: 5,   translate: [7, -7] },
    { suffix: 'ii',  orders: ['II'],        radius: 4.5, translate: [6, -6] },
    { suffix: 'low', orders: ['III', 'IV'], radius: 4,   translate: [5, -5] },
  ];
  for (const badge of WARNING_BADGES) {
    map.addLayer({
      id: `trig-points-warning-bg-${badge.suffix}`,
      type: 'circle',
      source: 'trig-points',
      filter: [
        'all',
        ['!', ['has', 'point_count']],
        ['==', ['get', 'has_warning'], 1],
        badge.suffix === 'low'
          ? ['!', ['in', ['get', 'point_order'], ['literal', ['I', 'II']]]]
          : ['==', ['get', 'point_order'], badge.orders[0]],
      ],
      paint: {
        'circle-radius': badge.radius,
        'circle-color': '#B8892A',
        'circle-stroke-width': 1.2,
        'circle-stroke-color': '#fff',
        'circle-translate': badge.translate,
      },
    });
  }

  // Glyph "!" centered on the badge — uses MapLibre's open-source font
  map.addLayer({
    id: 'trig-points-warning-glyph',
    type: 'symbol',
    source: 'trig-points',
    filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'has_warning'], 1]],
    layout: {
      'text-field': '!',
      'text-font': ['Noto Sans Bold'],
      'text-size': [
        'match', ['get', 'point_order'],
        'I', 9, 'II', 8, 'III', 7.5, 'IV', 7.5, 7.5,
      ],
      'text-offset': [
        'match', ['get', 'point_order'],
        'I', ['literal', [0.85, -0.85]],
        'II', ['literal', [0.85, -0.85]],
        'III', ['literal', [0.85, -0.85]],
        'IV', ['literal', [0.85, -0.85]],
        ['literal', [0.85, -0.85]],
      ],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': '#fff',
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
    minzoom: 12,
    paint: {
      'line-color': '#8B4513',
      'line-opacity': 0.15,
      'line-width': 0.4,
    },
    filter: ['all', ['>', ['get', 'elevation'], 0], ['!=', ['%', ['get', 'elevation'], 200], 0]],
  });

  // Major contours (200m intervals) — thicker, visible earlier
  map.addLayer({
    id: 'contour-lines-major',
    type: 'line',
    source: 'contours',
    'source-layer': 'contours',
    minzoom: 10,
    paint: {
      'line-color': '#8B4513',
      'line-opacity': 0.25,
      'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.4, 14, 1],
    },
    filter: ['all', ['>', ['get', 'elevation'], 0], ['==', ['%', ['get', 'elevation'], 200], 0]],
  });

  // Elevation labels on major contours
  map.addLayer({
    id: 'contour-labels',
    type: 'symbol',
    source: 'contours',
    'source-layer': 'contours',
    minzoom: 11,
    filter: ['all', ['>', ['get', 'elevation'], 0], ['==', ['%', ['get', 'elevation'], 200], 0]],
    layout: {
      'symbol-placement': 'line',
      'text-field': ['concat', ['to-string', ['get', 'elevation']], 'm'],
      'text-size': 10,
      'text-max-angle': 30,
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': 'rgba(139,69,19,0.5)',
      'text-halo-color': 'rgba(255,255,255,0.6)',
      'text-halo-width': 1,
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
