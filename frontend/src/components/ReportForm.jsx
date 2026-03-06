import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import the hook
import apiClient from '../api';
import { Box, Select, MenuItem, TextField, Button, FormControl, InputLabel, Typography, CircularProgress, IconButton, Stack } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

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
  const { t } = useTranslation(); // Initialize the hook
  const [status, setStatus] = useState(point.status);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]); // array of File objects
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, MAX_PHOTOS - images.length);
    e.target.value = '';
    const compressed = await Promise.all(files.map(compressImage));
    setImages(prev => [...prev, ...compressed].slice(0, MAX_PHOTOS));
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData();
    formData.append('status', status);
    formData.append('comment', comment);
    images.forEach((img) => formData.append('images', img));

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
    }
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
    </Box>
  );
};

export default ReportForm;