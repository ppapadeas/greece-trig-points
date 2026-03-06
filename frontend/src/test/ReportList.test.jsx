import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReportList from '../components/ReportList';

const baseReport = {
  id: 1,
  display_name: 'Test User',
  profile_picture_url: 'https://example.com/avatar.jpg',
  status: 'OK',
  comment: 'Looks good',
  created_at: '2025-01-01T00:00:00Z',
  image_url: null,
  image_urls: [],
};

describe('ReportList', () => {
  it('shows no-reports message when empty', () => {
    render(<ReportList reports={[]} />);
    expect(screen.getByText('reportList.noReports')).toBeInTheDocument();
  });

  it('renders a report without images', () => {
    render(<ReportList reports={[baseReport]} />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('Looks good')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Photo/ })).not.toBeInTheDocument();
  });

  it('renders a single image from image_urls', () => {
    const report = {
      ...baseReport,
      image_urls: ['https://cdn.example.com/img1.webp'],
    };
    render(<ReportList reports={[report]} />);
    const imgs = screen.getAllByRole('img', { name: /Photo/ });
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute('src', 'https://cdn.example.com/img1.webp');
  });

  it('renders multiple images from image_urls', () => {
    const report = {
      ...baseReport,
      image_urls: [
        'https://cdn.example.com/img1.webp',
        'https://cdn.example.com/img2.webp',
        'https://cdn.example.com/img3.webp',
      ],
    };
    render(<ReportList reports={[report]} />);
    const imgs = screen.getAllByRole('img', { name: /Photo/ });
    expect(imgs).toHaveLength(3);
  });

  it('does NOT render image section when image_urls is empty', () => {
    render(<ReportList reports={[{ ...baseReport, image_urls: [] }]} />);
    expect(screen.queryByRole('img', { name: /Photo/ })).not.toBeInTheDocument();
  });

  it('renders multiple reports', () => {
    const reports = [
      { ...baseReport, id: 1, display_name: 'Alice' },
      { ...baseReport, id: 2, display_name: 'Bob' },
    ];
    render(<ReportList reports={reports} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
