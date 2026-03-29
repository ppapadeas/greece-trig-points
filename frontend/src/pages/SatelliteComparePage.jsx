import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Box, Typography, IconButton, Chip, Stack, Tooltip, Paper } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';

// -----------------------------------------------------------------------
// Satellite tile source definitions — all public, no API key required
// except Mapbox (requires VITE_MAPBOX_TOKEN in .env)
// -----------------------------------------------------------------------
const SATELLITE_PROVIDERS = [
  {
    id: 'esri_standard',
    label: 'ESRI Standard',
    sublabel: 'World Imagery (current)',
    color: '#e07b39',
    source: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 23,
      attribution: 'Tiles © Esri',
    },
  },
  {
    id: 'esri_clarity',
    label: 'ESRI Clarity',
    sublabel: 'Higher zoom, better res',
    color: '#4caf50',
    source: {
      type: 'raster',
      tiles: [
        'https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 23,
      attribution: 'Tiles © Esri Clarity',
    },
  },
  {
    id: 'ktimanet',
    label: 'Κτηματολόγιο',
    sublabel: 'Greek orthophotos (WMS)',
    color: '#2196f3',
    source: {
      type: 'raster',
      tiles: [
        'https://gis.ktimanet.gr/wms/wmsopen/wmsserver.aspx?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=KTBASEMAP&STYLES=&FORMAT=image/jpeg&TRANSPARENT=false&HEIGHT=256&WIDTH=256&SRS=EPSG:3857&BBOX={bbox-epsg-3857}',
      ],
      tileSize: 256,
      maxzoom: 20,
      attribution: '© Ελληνικό Κτηματολόγιο',
    },
  },
  {
    id: 'bing',
    label: 'Bing Aerial',
    sublabel: 'Microsoft (quadkey tiles)',
    color: '#9c27b0',
    source: {
      type: 'raster',
      tiles: [
        'https://ecn.t0.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1',
        'https://ecn.t1.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1',
        'https://ecn.t2.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1',
        'https://ecn.t3.tiles.virtualearth.net/tiles/a{quadkey}.jpeg?g=1',
      ],
      tileSize: 256,
      maxzoom: 21,
      attribution: '© Microsoft Bing',
    },
  },
];

// A test location: a known trig point area near Kalamata (zoom 17+)
const TEST_CENTER = [22.12, 37.02];
const TEST_ZOOM = 17;

const MapPanel = ({ provider, syncRef }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: { satellite: provider.source },
        layers: [{ id: 'satellite-tiles', type: 'raster', source: 'satellite' }],
      },
      center: TEST_CENTER,
      zoom: TEST_ZOOM,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    // Sync: when this map moves, update all others
    const onMove = () => {
      if (isSyncing.current) return;
      const center = map.getCenter();
      const zoom = map.getZoom();
      const bearing = map.getBearing();
      const pitch = map.getPitch();

      syncRef.current.forEach((other) => {
        if (other === map) return;
        isSyncing.current = true;
        other.jumpTo({ center, zoom, bearing, pitch });
        isSyncing.current = false;
      });
    };

    map.on('move', onMove);

    // Register in sync pool
    syncRef.current.push(map);

    return () => {
      map.remove();
      syncRef.current = syncRef.current.filter((m) => m !== map);
    };
  }, [provider, syncRef]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
      {/* Panel header */}
      <Paper
        elevation={0}
        sx={{
          px: 1.5,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: `3px solid ${provider.color}`,
          borderRadius: 0,
          bgcolor: 'background.paper',
          zIndex: 1,
        }}
      >
        <SatelliteAltIcon sx={{ fontSize: 18, color: provider.color }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
            {provider.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {provider.sublabel}
          </Typography>
        </Box>
        <Chip
          label={provider.id === 'esri_standard' ? 'current' : 'candidate'}
          size="small"
          sx={{
            ml: 'auto',
            bgcolor: provider.id === 'esri_standard' ? '#e07b3920' : `${provider.color}20`,
            color: provider.id === 'esri_standard' ? '#e07b39' : provider.color,
            fontWeight: 'bold',
            fontSize: '0.65rem',
          }}
        />
      </Paper>
      {/* Map */}
      <Box ref={containerRef} sx={{ flexGrow: 1 }} />
    </Box>
  );
};

const SatelliteComparePage = () => {
  // Shared sync pool — all maps register here and listen for moves
  const syncRef = useRef([]);
  const [currentZoom, setCurrentZoom] = useState(TEST_ZOOM);

  // Track zoom level for display (uses a dummy interval approach since we don't have a single map ref)
  useEffect(() => {
    const interval = setInterval(() => {
      if (syncRef.current.length > 0) {
        setCurrentZoom(Math.round(syncRef.current[0].getZoom()));
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Tooltip title="Back to Admin">
          <IconButton component={RouterLink} to="/admin" size="small">
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Satellite Layer Comparison
        </Typography>
        <Chip label={`zoom ${currentZoom}`} size="small" color="default" variant="outlined" />
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          Maps are synced — pan/zoom one to move all
        </Typography>
        <Chip
          label="start: Kalamata area z17"
          size="small"
          variant="outlined"
          color="info"
          sx={{ ml: 'auto' }}
        />
      </Box>

      {/* 2×2 grid of maps */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 0,
          overflow: 'hidden',
        }}
      >
        {SATELLITE_PROVIDERS.map((provider) => (
          <MapPanel key={provider.id} provider={provider} syncRef={syncRef} />
        ))}
      </Box>
    </Box>
  );
};

export default SatelliteComparePage;
