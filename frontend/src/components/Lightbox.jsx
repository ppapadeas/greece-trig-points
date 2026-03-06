import React, { useEffect, useCallback } from 'react';
import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const Lightbox = ({ images, index, onClose, onPrev, onNext }) => {
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (images.length === 0) return null;

  return (
    <Box
      onClick={onClose}
      sx={{
        position: 'fixed', inset: 0, zIndex: 2000,
        bgcolor: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 12, right: 12, color: '#fff' }}
      >
        <CloseIcon />
      </IconButton>

      {images.length > 1 && (
        <IconButton
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          sx={{ position: 'absolute', left: 12, color: '#fff' }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
      )}

      <Box
        component="img"
        src={images[index]}
        onClick={(e) => e.stopPropagation()}
        sx={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: 1,
          boxShadow: 24,
        }}
      />

      {images.length > 1 && (
        <IconButton
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          sx={{ position: 'absolute', right: 12, color: '#fff' }}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      )}

      {images.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: 16, color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
          {index + 1} / {images.length}
        </Box>
      )}
    </Box>
  );
};

export default Lightbox;
