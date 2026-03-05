import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Divider, Box, Alert,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { loginWithPasskey, registerPasskeyNewUser } from '../utils/passkey';
import { useAuth } from '../context/AuthContext';

const LoginDialog = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  const handlePasskeyLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await loginWithPasskey();
      setUser(result.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('login.passkeyError'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyRegister = async () => {
    if (!email || !displayName) return;
    setError('');
    setLoading(true);
    try {
      const result = await registerPasskeyNewUser(email, displayName);
      setUser(result.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('login.passkeyError'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowRegister(false);
    setEmail('');
    setDisplayName('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('login.title')}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!showRegister ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              size="large"
            >
              {t('login.google')}
            </Button>

            <Divider>{t('login.or')}</Divider>

            <Button
              variant="contained"
              fullWidth
              startIcon={<FingerprintIcon />}
              onClick={handlePasskeyLogin}
              disabled={loading}
              size="large"
            >
              {t('login.passkey')}
            </Button>

            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer', textAlign: 'center', mt: 1 }}
              onClick={() => setShowRegister(true)}
            >
              {t('login.newUser')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label={t('login.displayName')}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              fullWidth
              autoFocus
            />
            <TextField
              label={t('login.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              fullWidth
              startIcon={<FingerprintIcon />}
              onClick={handlePasskeyRegister}
              disabled={loading || !email || !displayName}
              size="large"
            >
              {t('login.createAccount')}
            </Button>
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer', textAlign: 'center' }}
              onClick={() => setShowRegister(false)}
            >
              {t('login.backToLogin')}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('login.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginDialog;
