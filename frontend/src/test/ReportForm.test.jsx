import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReportForm from '../components/ReportForm';
import apiClient from '../api';

const mockPoint = { id: 42, gys_id: 'TEST001', status: 'UNKNOWN' };

// jsdom doesn't implement HTMLCanvasElement.toBlob — stub it
beforeEach(() => {
  vi.clearAllMocks();

  // Stub URL.createObjectURL / revokeObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = vi.fn();

  // Stub Image load — immediately fires onload with fixed dimensions
  global.Image = class {
    constructor() {
      this.width = 800;
      this.height = 600;
    }
    set src(_) {
      setTimeout(() => this.onload && this.onload(), 0);
    }
  };

  // Stub canvas toBlob — returns a minimal JPEG blob
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  }));
  HTMLCanvasElement.prototype.toBlob = vi.fn((cb) => {
    cb(new Blob(['img'], { type: 'image/jpeg' }));
  });

  apiClient.post.mockResolvedValue({
    data: { id: 1, status: 'OK', image_urls: [] },
  });
});

describe('ReportForm', () => {
  it('renders status pills, comment field and upload button', () => {
    render(<ReportForm point={mockPoint} />);
    // Status now lives in 5 pill buttons (radiogroup) instead of a Select
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    expect(screen.getByLabelText('reportForm.comments')).toBeInTheDocument();
    expect(screen.getByText('reportForm.uploadPhoto')).toBeInTheDocument();
  });

  it('adds a compressed image file to the list', async () => {
    render(<ReportForm point={mockPoint} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      // Wait for async compression (Image onload + toBlob)
      await new Promise(r => setTimeout(r, 50));
    });

    // File name shown in list (compressImage renames to .jpg)
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
  });

  it('hides upload button after MAX_PHOTOS (3) are added', async () => {
    render(<ReportForm point={mockPoint} />);
    const input = document.querySelector('input[type="file"]');

    for (let i = 0; i < 3; i++) {
      const file = new File(['x'], `p${i}.jpg`, { type: 'image/jpeg' });
      await act(async () => {
        fireEvent.change(input, { target: { files: [file] } });
        await new Promise(r => setTimeout(r, 50));
      });
    }

    expect(screen.queryByText(/reportForm.uploadPhoto/)).not.toBeInTheDocument();
  });

  it('removes an image when delete button is clicked', async () => {
    render(<ReportForm point={mockPoint} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File(['x'], 'remove-me.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise(r => setTimeout(r, 50));
    });

    expect(screen.getByText('remove-me.jpg')).toBeInTheDocument();
    // The Chip's delete icon is the only "remove"-labelled button
    fireEvent.click(screen.getByLabelText('remove'));
    expect(screen.queryByText('remove-me.jpg')).not.toBeInTheDocument();
  });

  it('submits with field name "images" (not "image")', async () => {
    render(<ReportForm point={mockPoint} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File(['x'], 'shot.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise(r => setTimeout(r, 50));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'reportForm.submit' }));
    });

    await waitFor(() => expect(apiClient.post).toHaveBeenCalled());

    const [url, formData] = apiClient.post.mock.calls[0];
    expect(url).toBe('/api/points/42/reports');
    // FormData has an 'images' key
    expect([...formData.keys()]).toContain('images');
    // 'image' (old field name) must NOT be present
    expect([...formData.keys()]).not.toContain('image');
  });

  it('shows success message and clears images after submit', async () => {
    render(<ReportForm point={mockPoint} />);
    const input = document.querySelector('input[type="file"]');
    const file = new File(['x'], 'success.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise(r => setTimeout(r, 50));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'reportForm.submit' }));
    });

    await waitFor(() => expect(screen.getByText('reportForm.success')).toBeInTheDocument());
    expect(screen.queryByText('success.jpg')).not.toBeInTheDocument();
  });

  it('shows error message when submit fails', async () => {
    apiClient.post.mockRejectedValue(new Error('500'));
    render(<ReportForm point={mockPoint} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'reportForm.submit' }));
    });

    await waitFor(() => expect(screen.getByText('reportForm.fail')).toBeInTheDocument());
  });
});
