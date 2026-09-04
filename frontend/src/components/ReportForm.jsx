import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';
import {
  Box, TextField, Button, Typography, Collapse, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TagPickerInline from './TagPickerInline';
import { tagLabel } from '../lib/tags';

const MAX_PHOTOS = 3;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

const STATUS_COLORS = {
  OK: '#28a745',
  DAMAGED: '#ffc107',
  UNKNOWN: '#17a2b8',
  MISSING: '#6c757d',
  DESTROYED: '#dc3545',
};
const STATUSES = ['OK', 'DAMAGED', 'UNKNOWN', 'MISSING', 'DESTROYED'];

const compressImage = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        JPEG_QUALITY
      );
    };
    img.src = url;
  });

const Eyebrow = ({ children, sx }) => (
  <Typography
    component="div"
    sx={{
      fontFamily: 'monospace',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'rgba(28,26,20,0.65)',
      mb: '8px',
      ...sx,
    }}
  >
    {children}
  </Typography>
);

const StatusPill = ({ status, active, onClick, t }) => (
  <Box
    role="button"
    tabIndex={0}
    aria-pressed={active}
    onClick={onClick}
    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      height: 30,
      px: 1.5,
      borderRadius: '15px',
      border: '1px solid',
      borderColor: active ? STATUS_COLORS[status] : 'rgba(28,26,20,0.23)',
      bgcolor: active ? `${STATUS_COLORS[status]}24` : 'transparent',
      cursor: 'pointer',
      userSelect: 'none',
      transition: 'background-color 200ms cubic-bezier(0.4,0,0.2,1)',
      '&:hover': { bgcolor: active ? `${STATUS_COLORS[status]}36` : 'rgba(28,26,20,0.06)' },
    }}
  >
    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_COLORS[status], opacity: active ? 1 : 0.55 }} />
    <Typography sx={{ fontSize: 13, fontWeight: 500, color: active ? '#1C1A14' : 'rgba(28,26,20,0.7)' }}>
      {t(`status.${status}`)}
    </Typography>
  </Box>
);

const ReportForm = ({ point, onReportSubmit, onCancel }) => {
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [status, setStatus] = useState(point.status);
  const [comment, setComment] = useState('');
  const [observedAt, setObservedAt] = useState(today);
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [tagsOpen, setTagsOpen] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(() => (point.tags || []).map(tg => tg.slug));
  const [confirmingTags, setConfirmingTags] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setSelectedTags((point.tags || []).map(tg => tg.slug));
  }, [point.id]);

  useEffect(() => {
    const p = apiClient.get('/api/points/tags');
    if (p && typeof p.then === 'function') {
      p.then(r => setAllTags(r.data)).catch(() => {});
    }
  }, []);

  const tagDeltas = useMemo(() => {
    const original = new Set((point.tags || []).map(tg => tg.slug));
    const next = new Set(selectedTags);
    const added = [...next].filter(s => !original.has(s));
    const removed = [...original].filter(s => !next.has(s));
    return { added, removed };
  }, [point.tags, selectedTags]);

  const acceptFiles = async (files) => {
    const incoming = Array.from(files || []).slice(0, MAX_PHOTOS - images.length);
    const compressed = await Promise.all(incoming.map(compressImage));
    setImages(prev => [...prev, ...compressed].slice(0, MAX_PHOTOS));
  };

  const handleImageChange = async (e) => {
    await acceptFiles(e.target.files);
    e.target.value = '';
  };
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    if (images.length >= MAX_PHOTOS) return;
    await acceptFiles(e.dataTransfer.files);
  };
  const removeImage = (i) => setImages(prev => prev.filter((_, idx) => idx !== i));

  const submitReport = async () => {
    setIsSubmitting(true);
    setMessage('');
    const formData = new FormData();
    formData.append('status', status);
    formData.append('comment', comment);
    formData.append('observed_at', observedAt);
    images.forEach((img) => formData.append('images', img));
    formData.append('tags_added', JSON.stringify(tagDeltas.added));
    formData.append('tags_removed', JSON.stringify(tagDeltas.removed));

    try {
      const response = await apiClient.post(`/api/points/${point.id}/reports`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(t('reportForm.success'));
      setImages([]);
      setComment('');
      if (onReportSubmit) onReportSubmit(response.data);
    } catch (error) {
      setMessage(t('reportForm.fail'));
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
      setConfirmingTags(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newWarnings = (allTags || []).filter(tg => tg.is_warning && tagDeltas.added.includes(tg.slug));
    if (newWarnings.length > 0) {
      setConfirmingTags(newWarnings);
      return;
    }
    submitReport();
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{
        position: 'relative',
        bgcolor: '#F7F2E8',
        border: '1px solid rgba(28,26,20,0.10)',
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(28,26,20,0.08)',
      }}
    >
      {/* Thin terracotta accent line */}
      <Box sx={{ height: 3, bgcolor: '#C2652A' }} />

      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5, position: 'relative' }}>
        <Eyebrow sx={{ color: '#C2652A', mb: '4px' }}>{t('reportForm.eyebrow')}</Eyebrow>
        <Typography
          component="h3"
          sx={{
            fontFamily: 'IBM Plex Serif, Georgia, serif',
            fontWeight: 350,
            fontSize: 22,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            color: '#1C1A14',
            mb: '4px',
            pr: 4,
          }}
        >
          {t('reportForm.title')}
        </Typography>
        <Typography sx={{ fontFamily: 'monospace', fontSize: 11, color: 'rgba(28,26,20,0.55)' }}>
          GYS {point.gys_id}{point.name ? ` · ${point.name}` : ''}
        </Typography>
        {onCancel && (
          <IconButton
            onClick={onCancel}
            size="small"
            aria-label="Close"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 28,
              height: 28,
              borderRadius: 0.5,
              bgcolor: 'rgba(28,26,20,0.06)',
              color: '#1C1A14',
              '&:hover': { bgcolor: 'rgba(28,26,20,0.12)' },
            }}
          >
            <CloseIcon fontSize="inherit" sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      <Box sx={{ px: 2, pb: 2 }}>
        {/* Date observed */}
        <Eyebrow>{t('reportForm.dateObserved')}</Eyebrow>
        <TextField
          type="date"
          fullWidth
          size="small"
          value={observedAt}
          inputProps={{ max: today, min: '1900-01-01' }}
          onChange={(e) => setObservedAt(e.target.value)}
          sx={{ mb: 2, '& .MuiInputBase-root': { bgcolor: '#fff' } }}
        />

        {/* Status pills */}
        <Eyebrow>{t('reportForm.newStatus')}</Eyebrow>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }} role="radiogroup">
          {STATUSES.map(s => (
            <StatusPill key={s} status={s} active={status === s} onClick={() => setStatus(s)} t={t} />
          ))}
        </Box>

        {/* Field notes */}
        <Eyebrow>{t('reportForm.fieldNotes')}</Eyebrow>
        <TextField
          id="report-comment"
          name="comment"
          label={t('reportForm.comments')}
          fullWidth
          multiline
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('reportForm.commentsPlaceholder')}
          sx={{ mb: 2, '& .MuiInputBase-root': { bgcolor: '#fff' } }}
        />

        {/* Photos drop zone */}
        <Eyebrow>{t('reportForm.photos')}</Eyebrow>
        {images.length < MAX_PHOTOS && (
          <Box
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            sx={{
              border: '1.5px dashed',
              borderColor: dragOver ? '#C2652A' : 'rgba(28,26,20,0.30)',
              bgcolor: dragOver ? 'rgba(194,101,42,0.06)' : 'transparent',
              borderRadius: 1,
              py: 2.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              cursor: 'pointer',
              transition: 'all 200ms',
              mb: 1,
              '&:hover': { borderColor: 'rgba(28,26,20,0.45)' },
            }}
          >
            <PhotoCameraIcon sx={{ color: 'rgba(28,26,20,0.55)' }} />
            <Typography sx={{ fontSize: 14, color: 'rgba(28,26,20,0.7)' }}>
              {t('reportForm.uploadPhoto')}
              {images.length > 0 && ` (${images.length}/${MAX_PHOTOS})`}
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
          </Box>
        )}
        {images.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {images.map((img, i) => (
              <Chip
                key={i}
                label={img.name}
                onDelete={() => removeImage(i)}
                deleteIcon={<CloseIcon aria-label="remove" />}
                sx={{ maxWidth: '100%', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
              />
            ))}
          </Box>
        )}

        {/* Tags accordion */}
        <Box
          role="button"
          tabIndex={0}
          aria-expanded={tagsOpen}
          onClick={() => setTagsOpen(!tagsOpen)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setTagsOpen(!tagsOpen)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            userSelect: 'none',
            border: '1px solid rgba(28,26,20,0.15)',
            borderRadius: 1,
            bgcolor: '#fff',
            px: 1.5,
            py: 1.25,
            mt: 1,
            mb: tagsOpen ? 1 : 2,
            transition: 'border-color 200ms',
            '&:hover': { borderColor: 'rgba(28,26,20,0.30)' },
          }}
        >
          <LocalOfferIcon sx={{ fontSize: 18, color: 'rgba(28,26,20,0.55)' }} />
          <Typography sx={{ flex: 1, fontSize: 14 }}>{t('reportForm.tagsToggle')}</Typography>
          {(tagDeltas.added.length > 0 || tagDeltas.removed.length > 0) && (
            <Typography sx={{ fontSize: 11, color: '#C2652A', fontFamily: 'monospace' }}>
              {tagDeltas.added.length > 0 && `+${tagDeltas.added.length}`}
              {tagDeltas.added.length > 0 && tagDeltas.removed.length > 0 && ' · '}
              {tagDeltas.removed.length > 0 && `−${tagDeltas.removed.length}`}
            </Typography>
          )}
          <ExpandMoreIcon sx={{ fontSize: 20, color: 'rgba(28,26,20,0.55)', transition: 'transform 200ms', transform: tagsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
        </Box>
        <Collapse in={tagsOpen} timeout={320}>
          <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: 'rgba(28,26,20,0.03)' }}>
            <TagPickerInline allTags={allTags} selected={selectedTags} onChange={setSelectedTags} />
          </Box>
        </Collapse>
      </Box>

      {/* Footer actions */}
      <Box
        sx={{
          px: 2, py: 1.5,
          borderTop: '1px solid rgba(28,26,20,0.08)',
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {onCancel && (
          <Button
            onClick={onCancel}
            sx={{
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#1C1A14',
              border: '1px solid rgba(28,26,20,0.20)',
              px: 2,
              py: 1,
              '&:hover': { bgcolor: 'rgba(28,26,20,0.04)' },
            }}
          >
            {t('reportForm.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          sx={{
            flex: 1,
            bgcolor: '#C2652A',
            color: '#F7F2E8',
            fontFamily: 'monospace',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            px: 2,
            py: 1,
            boxShadow: 'none',
            '&:hover': { bgcolor: '#A8511F', boxShadow: 'none' },
            '&.Mui-disabled': { bgcolor: 'rgba(194,101,42,0.45)', color: '#F7F2E8' },
          }}
        >
          {isSubmitting ? t('reportForm.submitting') : t('reportForm.submit')}
        </Button>
      </Box>

      {/* Live-update note (no review — everything is immediate) */}
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography
          sx={{
            fontStyle: 'italic',
            fontSize: 12,
            color: 'rgba(28,26,20,0.55)',
            lineHeight: 1.5,
          }}
        >
          {t('reportForm.disclaimer')}
        </Typography>
        {message && <Typography sx={{ mt: 1, fontSize: 13 }}>{message}</Typography>}
      </Box>

      {/* Warning-tag confirmation */}
      <Dialog open={!!confirmingTags} onClose={() => setConfirmingTags(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon sx={{ color: '#B8892A' }} />
          {t('reportForm.confirmTagTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>{t('reportForm.confirmTagBody')}</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1 }}>
            {(confirmingTags || []).map(tg => (
              <Typography key={tg.slug} sx={{ fontStyle: 'italic', color: '#6b4f15' }}>
                · {tagLabel(tg, i18n.language)}
              </Typography>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmingTags(null)}>{t('reportForm.confirmTagCancel')}</Button>
          <Button variant="contained" color="warning" onClick={submitReport}>
            {t('reportForm.confirmTagConfirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportForm;
