import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api';
import {
  Box, Select, MenuItem, TextField, Button, FormControl, InputLabel, Typography,
  IconButton, Stack, Collapse, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TagPickerInline from './TagPickerInline';
import { tagLabel } from '../lib/tags';

const MAX_PHOTOS = 3;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

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

const ReportForm = ({ point, onReportSubmit }) => {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState(point.status);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]); // array of File objects
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [tagsOpen, setTagsOpen] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(() => (point.tags || []).map(tg => tg.slug));
  const [confirmingTags, setConfirmingTags] = useState(null); // array of warning tag objects awaiting OK

  useEffect(() => {
    setSelectedTags((point.tags || []).map(tg => tg.slug));
  }, [point.id]);

  useEffect(() => {
    // Tolerate test mocks that don't stub this endpoint (returns undefined).
    const p = apiClient.get('/api/points/tags');
    if (p && typeof p.then === 'function') {
      p.then(r => setAllTags(r.data)).catch(() => {});
    }
  }, []);

  // Compute deltas vs the point's currently-applied tags
  const tagDeltas = useMemo(() => {
    const original = new Set((point.tags || []).map(tg => tg.slug));
    const next = new Set(selectedTags);
    const added = [...next].filter(s => !original.has(s));
    const removed = [...original].filter(s => !next.has(s));
    return { added, removed };
  }, [point.tags, selectedTags]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, MAX_PHOTOS - images.length);
    e.target.value = '';
    const compressed = await Promise.all(files.map(compressImage));
    setImages(prev => [...prev, ...compressed].slice(0, MAX_PHOTOS));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitReport = async () => {
    setIsSubmitting(true);
    setMessage('');
    const formData = new FormData();
    formData.append('status', status);
    formData.append('comment', comment);
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

      if (onReportSubmit) {
        onReportSubmit(response.data);
      }
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
    // If any newly-added tag is a warning, intercept with a confirm dialog
    const newWarnings = (allTags || []).filter(tg => tg.is_warning && tagDeltas.added.includes(tg.slug));
    if (newWarnings.length > 0) {
      setConfirmingTags(newWarnings);
      return;
    }
    submitReport();
  };

  return (
    <Box sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 3 }}>
      <Typography variant="h6" gutterBottom>{t('reportForm.title')}</Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="status-select-label">{t('reportForm.newStatus')}</InputLabel>
          <Select
            labelId="status-select-label"
            id="status"
            value={status}
            label={t('reportForm.newStatus')}
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="OK">OK</MenuItem>
            <MenuItem value="DAMAGED">Damaged</MenuItem>
            <MenuItem value="DESTROYED">Destroyed</MenuItem>
            <MenuItem value="MISSING">Missing</MenuItem>
            <MenuItem value="UNKNOWN">Unknown</MenuItem>
          </Select>
        </FormControl>
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
          sx={{ mb: 2 }}
        />

        {/* Tags accordion — same picker UI as the map filter, but for editing */}
        <Box
          role="button"
          tabIndex={0}
          onClick={() => setTagsOpen(!tagsOpen)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setTagsOpen(!tagsOpen)}
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', userSelect: 'none', mb: 1 }}
        >
          <ExpandMoreIcon sx={{ fontSize: 18, transition: 'transform 200ms', transform: tagsOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
            {t('reportForm.tagsToggle')}
          </Typography>
          {(tagDeltas.added.length > 0 || tagDeltas.removed.length > 0) && (
            <Typography sx={{ ml: 1, fontSize: 11, color: '#C2652A' }}>
              {tagDeltas.added.length > 0 && `+${tagDeltas.added.length}`}
              {tagDeltas.added.length > 0 && tagDeltas.removed.length > 0 && ' · '}
              {tagDeltas.removed.length > 0 && `−${tagDeltas.removed.length}`}
            </Typography>
          )}
        </Box>
        <Collapse in={tagsOpen} timeout={320}>
          <Box sx={{ mb: 2, p: 1.5, borderRadius: 1, bgcolor: 'rgba(28,26,20,0.03)' }}>
            <TagPickerInline allTags={allTags} selected={selectedTags} onChange={setSelectedTags} />
          </Box>
        </Collapse>

        {images.length < MAX_PHOTOS && (
          <Button variant="outlined" component="label" fullWidth sx={{ mb: 1 }}>
            {t('reportForm.uploadPhoto')}{images.length > 0 ? ` (${images.length}/${MAX_PHOTOS})` : ''}
            <input
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
          </Button>
        )}
        {images.length > 0 && (
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            {images.map((img, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" noWrap sx={{ flex: 1 }}>{img.name}</Typography>
                <IconButton size="small" onClick={() => removeImage(i)}><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            ))}
          </Stack>
        )}
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isSubmitting}
        >
          {isSubmitting ? t('reportForm.submitting') : t('reportForm.submit')}
        </Button>
        {message && <Typography sx={{ mt: 2 }}>{message}</Typography>}
      </Box>

      {/* Warning-tag confirmation — flagging an inaccessible/dangerous point
          deserves a deliberate click since it'll warn future visitors. */}
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
