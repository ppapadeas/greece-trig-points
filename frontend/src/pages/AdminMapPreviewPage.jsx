import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import { layers, LIGHT } from '@protomaps/basemaps';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import apiClient from '../api';

const PMTILES_URL = import.meta.env.VITE_PMTILES_URL;

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

const ORDER_RADIUS = { I: 9, II: 7, III: 6, IV: 6 };

const AdminMapPreviewPage = () => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [pointCount, setPointCount] = useState(0);

  useEffect(() => {
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    const style = {
      version: 8,
      glyphs: 'https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf',
      sources: {
        protomaps: {
          type: 'vector',
          url: `pmtiles://${PMTILES_URL}/greece.pmtiles`,
        },
      },
      layers: layers('protomaps', LIGHT),
    };

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style,
      center: [23.83, 38.25],
      zoom: 7,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    map.on('load', async () => {
      try {
        const { data } = await apiClient.get('/api/points');
        setPointCount(data.length);

        const geojson = {
          type: 'FeatureCollection',
          features: data.map((p) => ({
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

        map.addSource('trig-points', { type: 'geojson', data: geojson });

        map.addLayer({
          id: 'trig-points-layer',
          type: 'circle',
          source: 'trig-points',
          paint: {
            'circle-radius': [
              'match', ['get', 'point_order'],
              'I', ORDER_RADIUS.I,
              'II', ORDER_RADIUS.II,
              'III', ORDER_RADIUS.III,
              'IV', ORDER_RADIUS.IV,
              6,
            ],
            'circle-color': [
              'match', ['get', 'status'],
              'OK', STATUS_COLORS.OK,
              'DAMAGED', STATUS_COLORS.DAMAGED,
              'DESTROYED', STATUS_COLORS.DESTROYED,
              'MISSING', STATUS_COLORS.MISSING,
              'UNKNOWN', STATUS_COLORS.UNKNOWN,
              STATUS_COLORS.UNKNOWN,
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff',
          },
        });

        map.on('click', 'trig-points-layer', (e) => {
          const f = e.features[0];
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`<strong>GYS ${f.properties.gys_id}</strong><br/>Status: ${f.properties.status}<br/>Order: ${f.properties.point_order}`)
            .addTo(map);
        });

        map.on('mouseenter', 'trig-points-layer', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'trig-points-layer', () => {
          map.getCanvas().style.cursor = '';
        });
      } catch (err) {
        console.error('Failed to load points:', err);
      }
    });

    return () => {
      maplibregl.removeProtocol('pmtiles');
      map.remove();
    };
  }, []);

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <IconButton component={RouterLink} to="/admin" size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Map Preview — MapLibre GL + Protomaps
        </Typography>
        <Chip label={`${pointCount.toLocaleString()} points`} size="small" color="primary" variant="outlined" />
        <Chip label="PMTiles" size="small" color="secondary" variant="outlined" />
      </Box>
      <Box ref={mapContainer} sx={{ flexGrow: 1 }} />
    </Box>
  );
};

export default AdminMapPreviewPage;
