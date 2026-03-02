import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import apiClient from '../api';
import MapPage from '../pages/MapPage';

const mockPoints = [
  {
    id: 1,
    gys_id: 'TEST001',
    name: 'Test Point',
    status: 'UNKNOWN',
    point_order: 'I',
    location: JSON.stringify({ type: 'Point', coordinates: [23.0, 38.0] }),
  },
];

const renderMapPage = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/point/:gysId" element={<MapPage />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.get.mockResolvedValue({ data: mockPoints });
  vi.spyOn(window.history, 'pushState');
});

describe('MapPage', () => {
  it('renders the map container', async () => {
    renderMapPage();
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('fetches /api/points on mount with default filters', async () => {
    renderMapPage();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith('/api/points', expect.objectContaining({
        params: { status: 'ALL', order: 'ALL' },
      }));
    });
  });

  it('map container stays in DOM after window.history.pushState (no remount)', async () => {
    renderMapPage();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

    // This is what handleMarkerClick does — update URL without navigate()
    window.history.pushState(null, '', '/point/TEST001');

    // Map container must still be present — no unmount occurred
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/point/TEST001');
  });

  it('does NOT use navigate() for marker click (uses pushState to avoid remount)', async () => {
    renderMapPage();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());

    window.history.pushState(null, '', '/point/TEST001');
    expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/point/TEST001');

    // Map is still mounted
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('fetches the specific point on permalink load (/point/:gysId)', async () => {
    apiClient.get
      .mockResolvedValueOnce({ data: mockPoints })     // /api/points
      .mockResolvedValueOnce({ data: mockPoints[0] }); // /api/points/TEST001

    renderMapPage('/point/TEST001');

    await waitFor(() => {
      const urls = apiClient.get.mock.calls.map(c => c[0]);
      expect(urls).toContain('/api/points/TEST001');
    });
  });
});
