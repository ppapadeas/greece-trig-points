import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../api';

// Render App routes directly using MemoryRouter for path control
import AppRoutes from './helpers/AppRoutes';

beforeEach(() => {
  apiClient.get.mockResolvedValue({ data: [] });
});

describe('App routing', () => {
  it('renders the map on /', () => {
    render(<AppRoutes initialPath="/" />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('renders the map on /point/:gysId (permalink)', () => {
    render(<AppRoutes initialPath="/point/ABC123" />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('does NOT render the map on /stats', () => {
    render(<AppRoutes initialPath="/stats" />);
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
  });

  it('does NOT render the map on /about', () => {
    render(<AppRoutes initialPath="/about" />);
    expect(screen.queryByTestId('map-container')).not.toBeInTheDocument();
  });
});
