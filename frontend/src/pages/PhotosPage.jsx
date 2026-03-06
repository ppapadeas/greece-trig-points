import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Box, Typography, CircularProgress, Chip } from '@mui/material';
import apiClient from '../api';
import Lightbox from '../components/Lightbox';

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  DESTROYED: '#dc3545',
  MISSING: '#6c757d',
  UNKNOWN: '#17a2b8',
};

export default function PhotosPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { images: [], index: 0 }
  const [brokenIds, setBrokenIds] = useState(new Set());
  const sentinelRef = useRef(null);
  const loadedPages = useRef(new Set());

  const loadPage = useCallback(async (pageNum) => {
    if (loadedPages.current.has(pageNum) || loading) return;
    loadedPages.current.add(pageNum);
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/images/recent?page=${pageNum}`);
      const data = res.data;
      setItems(prev => [...prev, ...data]);
      if (data.length < 24) setHasMore(false);
    } catch {
      loadedPages.current.delete(pageNum);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial load
  useEffect(() => {
    loadPage(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage(p => {
            const next = p + 1;
            loadPage(next);
            return next;
          });
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadPage]);

  const visibleItems = items.filter(i => !brokenIds.has(i.image_id));

  const handleImageClick = (item) => {
    const urls = visibleItems.map(i => i.image_url);
    const index = visibleItems.findIndex(i => i.image_id === item.image_id);
    setLightbox({ images: urls, index, items: visibleItems });
  };

  const handleLightboxClose = () => setLightbox(null);
  const handleLightboxPrev = () => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }));
  const handleLightboxNext = () => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length }));

  const goToPoint = (gysId) => {
    setLightbox(null);
    navigate(`/point/${gysId}`);
  };

  return (
    <>
      <Helmet>
        <title>{t('photos.title')} — vathra.xyz</title>
      </Helmet>
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 1, sm: 2, md: 3 }, py: 3 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          {t('photos.title')}
        </Typography>

        {/* Masonry via CSS columns */}
        <Box
          sx={{
            columnCount: { xs: 2, sm: 3, md: 4, lg: 5 },
            columnGap: '8px',
          }}
        >
          {visibleItems.map((item) => (
            <Box
              key={item.image_id}
              onClick={() => handleImageClick(item)}
              sx={{
                breakInside: 'avoid',
                mb: '8px',
                position: 'relative',
                cursor: 'pointer',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'block',
                '&:hover .photo-overlay': { opacity: 1 },
              }}
            >
              <Box
                component="img"
                src={item.image_url}
                alt={item.point_name || `GYS ${item.gys_id}`}
                loading="lazy"
                onError={() => setBrokenIds(prev => new Set([...prev, item.image_id]))}
                sx={{
                  width: '100%',
                  display: 'block',
                  borderRadius: '8px',
                }}
              />
              <Box
                className="photo-overlay"
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  borderRadius: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  p: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, lineHeight: 1.2 }}>
                  {item.point_name || `GYS ${item.gys_id}`}
                </Typography>
                <Chip
                  label={t(`status.${item.status}`)}
                  size="small"
                  sx={{
                    mt: 0.5,
                    height: 18,
                    fontSize: '0.65rem',
                    bgcolor: STATUS_COLORS[item.status] || '#999',
                    color: item.status === 'DAMAGED' ? '#000' : '#fff',
                    alignSelf: 'flex-start',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>

        {/* Sentinel for infinite scroll */}
        {hasMore && <Box ref={sentinelRef} sx={{ height: 1 }} />}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {!hasMore && items.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            {t('photos.allLoaded', { count: items.length })}
          </Typography>
        )}

        {!loading && items.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
            {t('photos.empty')}
          </Typography>
        )}
      </Box>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={handleLightboxClose}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
          footer={
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'white' }}>
                {lightbox.items[lightbox.index]?.point_name || `GYS ${lightbox.items[lightbox.index]?.gys_id}`}
              </Typography>
              <Box
                component="span"
                onClick={() => goToPoint(lightbox.items[lightbox.index]?.gys_id)}
                sx={{
                  color: '#90caf9',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  textDecoration: 'underline',
                  '&:hover': { color: 'white' },
                }}
              >
                {t('photos.goToPoint')}
              </Box>
            </Box>
          }
        />
      )}
    </>
  );
}
