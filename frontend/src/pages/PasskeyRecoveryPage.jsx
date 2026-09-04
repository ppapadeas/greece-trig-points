import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  Container, Box, Card, CardContent, Typography, Button,
  Alert, CircularProgress, TextField,
} from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { runPasskeyRecovery, recoverPasskeyOptions } from '../utils/passkey';
import { useAuth } from '../context/AuthContext';

const PasskeyRecoveryPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [deviceName, setDeviceName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setStatus('invalid');
      setError(t('recovery.noToken'));
      return;
    }

    (async () => {
      try {
        const { user } = await recoverPasskeyOptions(token);
        if (cancelled) return;
        setUserInfo(user);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || t('recovery.invalidToken'));
        setStatus('invalid');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, t]);

  const handleRegister = async () => {
    setError('');
    setSubmitting(true);
    try {
      const result = await runPasskeyRecovery(token, deviceName || undefined);
      if (result.user) {
        setUser(result.user);
      }
      setStatus('success');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || t('recovery.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Helmet>
        <title>{t('recovery.title')}</title>
      </Helmet>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <FingerprintIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            {t('recovery.title')}
          </Typography>

          {status === 'checking' && (
            <Box sx={{ my: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {status === 'invalid' && (
            <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>
              {error}
            </Alert>
          )}

          {status === 'ready' && userInfo && (
            <>
              <Typography variant="body1" sx={{ mt: 1, mb: 3 }}>
                {t('recovery.intro', { email: userInfo.email })}
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                  {error}
                </Alert>
              )}
              <TextField
                label={t('recovery.deviceName')}
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                fullWidth
                placeholder={t('recovery.deviceNamePlaceholder')}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                size="large"
                startIcon={<FingerprintIcon />}
                onClick={handleRegister}
                disabled={submitting}
                fullWidth
              >
                {submitting ? t('recovery.registering') : t('recovery.registerButton')}
              </Button>
            </>
          )}

          {status === 'success' && (
            <Box sx={{ mt: 2 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="body1">{t('recovery.success')}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default PasskeyRecoveryPage;
