import '@testing-library/jest-dom';
import React from 'react';

// MapLibre GL JS — stub the full module so tests don't need WebGL
vi.mock('maplibre-gl', () => {
  class MockMap {
    constructor() {
      this._handlers = {};
    }
    addControl() {}
    on(event, layerOrCb, cb) {
      const handler = cb || layerOrCb;
      this._handlers[event] = handler;
      // Fire 'load' synchronously so map.on('load', ...) works in tests
      if (event === 'load') setTimeout(() => handler(), 0);
    }
    off() {}
    remove() {}
    flyTo() {}
    easeTo() {}
    zoomIn() {}
    zoomOut() {}
    getSource() { return { setData() {}, getClusterExpansionZoom() {} }; }
    getLayer() { return null; }
    addSource() {}
    addLayer() {}
    removeLayer() {}
    removeSource() {}
    setLayoutProperty() {}
    queryRenderedFeatures() { return []; }
    getCanvas() { return { style: {} }; }
  }

  class MockNavigationControl {}

  class MockPopup {
    setLngLat() { return this; }
    setHTML() { return this; }
    addTo() {}
  }

  return {
    default: {
      Map: MockMap,
      NavigationControl: MockNavigationControl,
      Popup: MockPopup,
      addProtocol: vi.fn(),
      removeProtocol: vi.fn(),
    },
  };
});

vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

// MapContext — provide a mock map object
vi.mock('../context/MapContext', () => ({
  MapProvider: ({ children }) => <>{children}</>,
  useMap: () => ({
    flyTo: vi.fn(),
    easeTo: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    getSource: vi.fn(() => ({ setData: vi.fn() })),
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

// Axios client
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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
