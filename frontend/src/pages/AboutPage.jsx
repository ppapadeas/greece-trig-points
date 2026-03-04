import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Paper, Box, Link, Divider, Button, CircularProgress } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import ForumIcon from '@mui/icons-material/Forum';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

const AboutPage = () => {
  const { t } = useTranslation();
  const [doiInfo, setDoiInfo] = useState(null);
  const [loadingDoi, setLoadingDoi] = useState(true);

  useEffect(() => {
    const fetchLatestDoi = async () => {
      try {
        const CONCEPT_ID = '17111961'; 
        const response = await axios.get(`https://zenodo.org/api/records/?q=conceptrecid:${CONCEPT_ID}&sort=mostrecent`);
        
        if (response.data.hits.hits.length > 0) {
          const latest = response.data.hits.hits[0];
          setDoiInfo({
            doi: latest.doi,
            url: latest.links.latest_html
          });
        }
      } catch (error) {
        console.error("Failed to fetch DOI from Zenodo:", error);
      } finally {
        setLoadingDoi(false);
      }
    };
    fetchLatestDoi();
  }, []);

  const renderDoiLink = () => {
    if (loadingDoi) {
      return <CircularProgress size={20} sx={{ my: 2 }} />;
    }
    if (doiInfo) {
      return (
        <Box sx={{ my: 2 }}>
          <Typography variant="body1" paragraph>
            {t('about.doiP1')}
          </Typography>
          <Link 
            href={doiInfo.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            sx={{ textDecoration: 'none', display: 'inline-flex', borderRadius: '4px', overflow: 'hidden', my: 1, border: '1px solid #ddd' }}
          >
            <Box sx={{ bgcolor: '#444', color: 'white', px: 1.5, py: 0.5 }}>
              <Typography variant="button">DOI</Typography>
            </Box>
            <Box sx={{ bgcolor: 'grey.200', color: 'black', px: 1.5, py: 0.5 }}>
              <Typography variant="button">{doiInfo.doi}</Typography>
            </Box>
          </Link>
        </Box>
      );
    }
    return null;
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('about.title')}
        </Typography>
        <Typography variant="body1" paragraph>
          {t('about.p1')}
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3 }}>
          {t('about.visionTitle')}
        </Typography>
        <Typography variant="body1" paragraph>
          {t('about.visionP1')}
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li>{t('about.visionL1')}</li>
          <li>{t('about.visionL2')}</li>
          <li>{t('about.visionL3')}</li>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          {t('about.opensourceTitle')}
        </Typography>
        
        {renderDoiLink()}
        
        <Typography variant="body1" paragraph>
          {t('about.codeP1')}{' '}
          <Link href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">
            AGPLv3
          </Link>
          .
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<GitHubIcon />}
          href="https://github.com/ppapadeas/greece-trig-points"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('about.githubBtn')}
        </Button>
        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          {t('about.contentP1')}{' '}
          <Link href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
            Creative Commons Attribution-ShareAlike (CC BY-SA)
          </Link>
          .
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" gutterBottom>
          {t('about.exportTitle')}
        </Typography>
        <Typography variant="body1" paragraph>
          {t('about.exportP1')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            href={`${import.meta.env.VITE_API_BASE_URL}/api/export/csv`}
          >
            {t('about.exportCSV')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            href={`${import.meta.env.VITE_API_BASE_URL}/api/export/kml`}
          >
            {t('about.exportKML')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            href={`${import.meta.env.VITE_API_BASE_URL}/api/export/gpx`}
          >
            {t('about.exportGPX')}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" gutterBottom>
          {t('about.communityTitle')}
        </Typography>
        <Typography variant="body1" paragraph>
          {t('about.communityP1')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ForumIcon />}
          href="https://discord.gg/Kqn3UEZsGp"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ bgcolor: '#5865F2', '&:hover': { bgcolor: '#4752C4' }, mb: 2 }}
        >
          {t('about.discordBtn')}
        </Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" gutterBottom>
          {t('about.ackTitle')}
        </Typography>
        <Typography variant="body1" paragraph>
          {t('about.ackP1')}{' '}
          <Link href="https://geodata.gov.gr/" target="_blank" rel="noopener noreferrer">
            Geodata.gov.gr
          </Link>
          {' and '}
          <Link href="http://www.gys.gr/" target="_blank" rel="noopener noreferrer">
            Hellenic Army Geographical Service (ΓΥΣ)
          </Link>.
        </Typography>

        <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {__GIT_HASH__} — {__GIT_MESSAGE__}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default AboutPage;