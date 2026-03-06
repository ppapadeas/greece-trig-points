import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api';
import Lightbox from './Lightbox';
import {
  Box, IconButton, Select, MenuItem, TextField,
  FormControl, InputLabel, CircularProgress, Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import './ReportList.css';

const VALID_STATUSES = ['OK', 'DAMAGED', 'DESTROYED', 'MISSING', 'UNKNOWN'];

const ReportList = ({ reports, pointId, onReportsChange }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });
  const openLightbox = (images, index) => setLightbox({ open: true, images, index });
  const closeLightbox = () => setLightbox(lb => ({ ...lb, open: false }));
  const prevImage = () => setLightbox(lb => ({ ...lb, index: (lb.index - 1 + lb.images.length) % lb.images.length }));
  const nextImage = () => setLightbox(lb => ({ ...lb, index: (lb.index + 1) % lb.images.length }));

  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editComment, setEditComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const startEdit = (report) => {
    setEditingId(report.id);
    setEditStatus(report.status);
    setEditComment(report.comment || '');
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (report) => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('status', editStatus);
      formData.append('comment', editComment);
      await apiClient.put(`/api/points/${pointId}/reports/${report.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditingId(null);
      onReportsChange();
    } catch (err) {
      console.error('Failed to update report', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (report) => {
    if (!window.confirm(t('reportList.confirmDelete'))) return;
    setDeletingId(report.id);
    try {
      await apiClient.delete(`/api/points/${pointId}/reports/${report.id}`);
      onReportsChange();
    } catch (err) {
      console.error('Failed to delete report', err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!reports || reports.length === 0) {
    return <p className="no-reports-message">{t('reportList.noReports')}</p>;
  }

  return (
    <>
      {lightbox.open && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={closeLightbox}
          onPrev={prevImage}
          onNext={nextImage}
        />
      )}

      <div className="report-list-container">
        <h4>{t('reportList.title')}</h4>
        <ul className="report-list">
          {reports.map((report) => {
            const isOwn = user && user.id === report.user_id;
            const isEditing = editingId === report.id;
            const isDeleting = deletingId === report.id;
            const resolvedUrls = (report.image_urls || []).map(u =>
              u.startsWith('http') ? u : `${import.meta.env.VITE_API_BASE_URL}${u}`
            );

            return (
              <li key={report.id} className="report-item">
                <div className="report-header">
                  <img src={report.profile_picture_url} alt={report.display_name} className="report-avatar" />
                  <div className="report-user-info">
                    <strong>{report.display_name}</strong>
                    <span className="report-date">
                      {new Date(report.created_at).toLocaleDateString()}
                      {report.updated_at && report.updated_at !== report.created_at && (
                        <span className="report-edited"> ({t('reportList.edited')})</span>
                      )}
                    </span>
                  </div>
                  {!isEditing && (
                    <span className={`status-badge status-${report.status.toLowerCase()}`}>
                      {t(`status.${report.status}`)}
                    </span>
                  )}
                  {isOwn && !isEditing && (
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 0.5 }}>
                      <Tooltip title={t('reportList.edit')}>
                        <IconButton size="small" onClick={() => startEdit(report)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('reportList.delete')}>
                        <IconButton size="small" onClick={() => handleDelete(report)} disabled={isDeleting}>
                          {isDeleting ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                  {isEditing && (
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                      <Tooltip title={t('reportList.save')}>
                        <IconButton size="small" color="primary" onClick={() => saveEdit(report)} disabled={saving}>
                          {saving ? <CircularProgress size={16} /> : <CheckIcon fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('reportList.cancel')}>
                        <IconButton size="small" onClick={cancelEdit}><CloseIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </div>

                {isEditing ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>{t('reportForm.newStatus')}</InputLabel>
                      <Select
                        value={editStatus}
                        label={t('reportForm.newStatus')}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        {VALID_STATUSES.map(s => (
                          <MenuItem key={s} value={s}>{t(`status.${s}`)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      multiline rows={3} fullWidth size="small"
                      label={t('reportForm.comments')}
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                    />
                  </Box>
                ) : (
                  report.comment && <p className="report-comment">{report.comment}</p>
                )}

                {resolvedUrls.length > 0 && (
                  <div className="report-image-container">
                    {resolvedUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="report-image-thumb"
                        onClick={() => openLightbox(resolvedUrls, i)}
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default ReportList;
