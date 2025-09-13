import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Import the hook
import apiClient from '../api';
import { Box, Select, MenuItem, TextField, Button, FormControl, InputLabel, Typography, CircularProgress } from '@mui/material';

const ReportForm = ({ point, onReportSubmit }) => {
  const { t } = useTranslation(); // Initialize the hook
  const [status, setStatus] = useState(point.status);
  const [comment, setComment] = useState('');
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    const formData = new FormData();
    formData.append('status', status);
    formData.append('comment', comment);
    if (image) {
      formData.append('image', image);
    }

    try {
      const response = await apiClient.post(`/api/points/${point.id}/reports`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(t('reportForm.success'));

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
          label={t('reportForm.comments')}
          fullWidth
          multiline
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('reportForm.commentsPlaceholder')}
          sx={{ mb: 2 }}
        />
        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{ mb: 2 }}
        >
          {t('reportForm.uploadPhoto')}
          <input type="file" hidden accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        </Button>
        {image && <Typography variant="body2" sx={{ mb: 2 }}>{t('reportForm.selectedFile', { fileName: image.name })}</Typography>}
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