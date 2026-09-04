import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Avatar, Chip, Divider,
  List, ListItem, ListItemText, IconButton, CircularProgress,
  Alert, TextField, Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import apiClient from '../api';
import { useAuth } from '../context/AuthContext';

const fmt = (v) => (v ? new Date(v).toLocaleString() : '—');

const ConfirmDialog = ({ open, title, body, confirmLabel, confirmColor, requireText, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');
  useEffect(() => { if (open) setTyped(''); }, [open]);
  const canConfirm = !requireText || typed === requireText;
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{body}</Typography>
        {requireText && (
          <TextField
            sx={{ mt: 2 }}
            fullWidth
            size="small"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={requireText}
            autoFocus
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t('admin.userDetail.cancel')}</Button>
        <Button color={confirmColor || 'primary'} variant="contained" disabled={!canConfirm} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const UserDetailDialog = ({ open, userId, onClose, onChanged }) => {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recoveryLink, setRecoveryLink] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const isSelf = detail && currentUser && detail.id === currentUser.id;

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    setRecoveryLink(null);
    try {
      const { data } = await apiClient.get(`/api/admin/users/${userId}`);
      setDetail(data);
    } catch (err) {
      setError(err.response?.data?.message || t('admin.userDetail.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [userId, t]);

  useEffect(() => {
    if (open && userId) load();
    if (!open) {
      setDetail(null);
      setRecoveryLink(null);
      setError('');
      setConfirm(null);
    }
  }, [open, userId, load]);

  const run = async (fn, successMsg) => {
    setError('');
    try {
      await fn();
      await load();
      if (onChanged) onChanged();
      if (successMsg) console.log(successMsg);
    } catch (err) {
      setError(err.response?.data?.message || t('admin.userDetail.actionFailed'));
    }
  };

  const handleDeletePasskey = (pkid) =>
    setConfirm({
      title: t('admin.userDetail.deletePasskeyTitle'),
      body: t('admin.userDetail.deletePasskeyBody'),
      confirmLabel: t('admin.userDetail.deleteAction'),
      confirmColor: 'error',
      action: () =>
        run(() => apiClient.delete(`/api/admin/users/${userId}/passkeys/${pkid}`)),
    });

  const handleResetPasskeys = () =>
    setConfirm({
      title: t('admin.userDetail.resetPasskeysTitle'),
      body: t('admin.userDetail.resetPasskeysBody', { count: detail?.passkeys?.length || 0 }),
      confirmLabel: t('admin.userDetail.resetAction'),
      confirmColor: 'warning',
      action: () =>
        run(() => apiClient.delete(`/api/admin/users/${userId}/passkeys`)),
    });

  const handleToggleRole = () =>
    setConfirm({
      title: detail?.role === 'ADMIN'
        ? t('admin.userDetail.demoteTitle')
        : t('admin.userDetail.promoteTitle'),
      body: detail?.role === 'ADMIN'
        ? t('admin.userDetail.demoteBody', { name: detail?.display_name })
        : t('admin.userDetail.promoteBody', { name: detail?.display_name }),
      confirmLabel: t('admin.userDetail.confirmAction'),
      confirmColor: 'primary',
      action: () =>
        run(() =>
          apiClient.patch(`/api/admin/users/${userId}/role`, {
            role: detail?.role === 'ADMIN' ? 'USER' : 'ADMIN',
          })
        ),
    });

  const handleGenerateRecoveryLink = async () => {
    setError('');
    setRecoveryLink(null);
    try {
      const { data } = await apiClient.post(`/api/admin/users/${userId}/recovery-link`);
      setRecoveryLink(data);
    } catch (err) {
      setError(err.response?.data?.message || t('admin.userDetail.recoveryFailed'));
    }
  };

  const copyRecoveryLink = () => {
    if (recoveryLink?.url) navigator.clipboard?.writeText(recoveryLink.url);
  };

  const handleAnonymize = () =>
    setConfirm({
      title: t('admin.userDetail.anonymizeTitle'),
      body: t('admin.userDetail.anonymizeBody', {
        reports: detail?.report_count,
        email: detail?.email,
      }),
      confirmLabel: t('admin.userDetail.anonymizeAction'),
      confirmColor: 'warning',
      requireText: detail?.email,
      action: () => run(() => apiClient.post(`/api/admin/users/${userId}/anonymize`)),
    });

  const handleHardDelete = () =>
    setConfirm({
      title: t('admin.userDetail.deleteUserTitle'),
      body: t('admin.userDetail.deleteUserBody', {
        reports: detail?.report_count,
        email: detail?.email,
      }),
      confirmLabel: t('admin.userDetail.deleteUserAction'),
      confirmColor: 'error',
      requireText: detail?.email,
      action: async () => {
        await apiClient.delete(`/api/admin/users/${userId}`);
        if (onChanged) onChanged();
        onClose();
      },
    });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {detail
          ? t('admin.userDetail.title', { name: detail.display_name || detail.email })
          : t('admin.userDetail.loading')}
      </DialogTitle>
      <DialogContent dividers>
        {loading && <CircularProgress />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {detail && (
          <Box>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Avatar src={detail.profile_picture_url} sx={{ width: 56, height: 56 }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{detail.display_name || '—'}</Typography>
                <Typography variant="body2" color="text.secondary">{detail.email}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  {detail.role === 'ADMIN' && (
                    <Chip icon={<AdminPanelSettingsIcon />} label="ADMIN" color="warning" size="small" />
                  )}
                  <Chip
                    label={detail.google_id ? t('admin.userDetail.googleLinked') : t('admin.userDetail.passkeyOnly')}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Stack>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
              <Typography variant="body2"><b>{t('admin.userDetail.registered')}:</b> {fmt(detail.created_at)}</Typography>
              <Typography variant="body2"><b>{t('admin.userDetail.lastLogin')}:</b> {fmt(detail.last_login)}</Typography>
              <Typography variant="body2"><b>{t('admin.userDetail.reports')}:</b> {detail.report_count}</Typography>
              <Typography variant="body2"><b>{t('admin.userDetail.pointsCovered')}:</b> {detail.points_covered}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              {t('admin.userDetail.passkeys')} ({detail.passkeys.length})
            </Typography>
            {detail.passkeys.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('admin.userDetail.noPasskeys')}
              </Typography>
            ) : (
              <List dense>
                {detail.passkeys.map((pk) => (
                  <ListItem
                    key={pk.id}
                    secondaryAction={
                      <IconButton edge="end" color="error" onClick={() => handleDeletePasskey(pk.id)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <FingerprintIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <ListItemText
                      primary={pk.device_name || t('admin.userDetail.unnamedDevice')}
                      secondary={`${t('admin.userDetail.created')}: ${fmt(pk.created_at)}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
              <Button
                size="small"
                color="warning"
                variant="outlined"
                startIcon={<DeleteIcon />}
                disabled={detail.passkeys.length === 0}
                onClick={handleResetPasskeys}
              >
                {t('admin.userDetail.resetAllPasskeys')}
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={handleGenerateRecoveryLink}
              >
                {t('admin.userDetail.generateRecoveryLink')}
              </Button>
            </Stack>

            {recoveryLink && (
              <Alert severity="info" sx={{ mt: 2 }} icon={<LinkIcon />}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {t('admin.userDetail.recoveryLinkReady', {
                    expires: new Date(recoveryLink.expiresAt).toLocaleString(),
                  })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={recoveryLink.url}
                    InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.75rem' } }}
                  />
                  <IconButton onClick={copyRecoveryLink}><ContentCopyIcon /></IconButton>
                </Box>
              </Alert>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>
              {t('admin.userDetail.dangerZone')}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={handleToggleRole}
                disabled={isSelf}
              >
                {detail.role === 'ADMIN'
                  ? t('admin.userDetail.demoteToUser')
                  : t('admin.userDetail.promoteToAdmin')}
              </Button>
              <Button
                size="small"
                color="warning"
                variant="outlined"
                startIcon={<WarningAmberIcon />}
                onClick={handleAnonymize}
                disabled={isSelf}
              >
                {t('admin.userDetail.anonymize')}
              </Button>
              <Button
                size="small"
                color="error"
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={handleHardDelete}
                disabled={isSelf}
              >
                {t('admin.userDetail.deleteUser')}
              </Button>
            </Stack>
            {isSelf && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('admin.userDetail.selfBlocked')}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('admin.userDetail.close')}</Button>
      </DialogActions>

      {confirm && (
        <ConfirmDialog
          open={!!confirm}
          title={confirm.title}
          body={confirm.body}
          confirmLabel={confirm.confirmLabel}
          confirmColor={confirm.confirmColor}
          requireText={confirm.requireText}
          onCancel={() => setConfirm(null)}
          onConfirm={async () => {
            const action = confirm.action;
            setConfirm(null);
            await action();
          }}
        />
      )}
    </Dialog>
  );
};

export default UserDetailDialog;
