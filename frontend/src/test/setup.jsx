import '@testing-library/jest-dom';
import React from 'react';

// Leaflet uses browser APIs not available in jsdom
vi.mock('leaflet', () => ({
  default: {
    Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
    divIcon: vi.fn(() => ({})),
    marker: vi.fn(() => ({ on: vi.fn(), pointData: null })),
    markerClusterGroup: vi.fn(() => ({
      addLayer: vi.fn(),
      on: vi.fn(),
    })),
    point: vi.fn(),
  },
}));

vi.mock('leaflet.markercluster', () => ({}));
vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet.markercluster/dist/MarkerCluster.css', () => ({}));
vi.mock('leaflet.markercluster/dist/MarkerCluster.Default.css', () => ({}));

// LayersControl with BaseLayer as a nested component
const LayersControlMock = ({ children }) => <>{children}</>;
LayersControlMock.BaseLayer = ({ children }) => <>{children}</>;

// React-leaflet hooks/components — stub so tests don't need a real map DOM
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  LayersControl: LayersControlMock,
  Circle: () => null,
  CircleMarker: () => null,
  useMap: () => ({
    flyTo: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    getBounds: vi.fn(() => ({})),
  }),
  useMapEvents: vi.fn(),
}));

// Axios client
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

// i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'en', changeLanguage: vi.fn() } }),
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

// Auth context
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: null, loading: false }),
}));
