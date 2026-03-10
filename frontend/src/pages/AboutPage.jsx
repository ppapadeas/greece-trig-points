import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  Container, Typography, Paper, Box, Link, Button, CircularProgress, Grid, Avatar,
} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ForumIcon from '@mui/icons-material/Forum';
import DownloadIcon from '@mui/icons-material/Download';
import ArticleIcon from '@mui/icons-material/Article';
import ExploreIcon from '@mui/icons-material/Explore';
import CodeIcon from '@mui/icons-material/Code';
import axios from 'axios';
import LogoMark from '../components/Brand';

const DoiBadge = ({ label, doi, href }) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    sx={{ textDecoration: 'none', display: 'inline-flex', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(28,26,20,0.12)' }}
  >
    <Box sx={{ bgcolor: '#1C1A14', color: '#F7F2E8', px: 1.5, py: 0.5 }}>
      <Typography variant="button">{label}</Typography>
    </Box>
    <Box sx={{ bgcolor: '#EDE4D3', color: '#1C1A14', px: 1.5, py: 0.5 }}>
      <Typography variant="button">{doi}</Typography>
    </Box>
  </Link>
);

const SectionCard = ({ icon, title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3, height: '100%',
      border: '1px solid', borderColor: 'divider',
      display: 'flex', flexDirection: 'column',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Avatar sx={{ bgcolor: '#C2652A', width: 36, height: 36 }}>
        {icon}
      </Avatar>
      <Typography variant="h6" component="h2">{title}</Typography>
    </Box>
    <Box sx={{ flex: 1 }}>{children}</Box>
  </Paper>
);

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
          setDoiInfo({ doi: latest.doi, url: latest.links.latest_html });
        }
      } catch (error) {
        console.error("Failed to fetch DOI from Zenodo:", error);
      } finally {
        setLoadingDoi(false);
      }
    };
    fetchLatestDoi();
  }, []);

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>{t('about.title')} — vathra.xyz</title>
        <link rel="canonical" href="https://vathra.xyz/about" />
      </Helmet>

      {/* Hero */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: '#1C1A14', color: '#F7F2E8',
          p: { xs: 3, sm: 5 }, mb: 3,
          borderRadius: 2,
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
          <LogoMark size={56} variant="dark" />
        </Box>
        <Typography
          variant="h3" component="h1"
          sx={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 300, letterSpacing: '-0.02em', mb: 1, fontSize: { xs: '2rem', sm: '3rem' } }}
        >
          vathra.xyz
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(247,242,232,0.7)', maxWidth: 520, mx: 'auto', px: 1 }}>
          {t('about.p1')}
        </Typography>
      </Paper>

      {/* Card Grid */}
      <Grid container spacing={2.5}>
        {/* Vision */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <SectionCard icon={<ExploreIcon fontSize="small" />} title={t('about.visionTitle')}>
            <Typography variant="body2" paragraph>
              {t('about.visionP1')}
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
              <Typography component="li" variant="body2">{t('about.visionL1')}</Typography>
              <Typography component="li" variant="body2">{t('about.visionL2')}</Typography>
              <Typography component="li" variant="body2">{t('about.visionL3')}</Typography>
            </Box>
          </SectionCard>
        </Grid>

        {/* Research */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <SectionCard icon={<ArticleIcon fontSize="small" />} title={t('about.paperTitle')}>
            <Typography variant="body2" paragraph>
              {t('about.paperP1')}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'flex-start' }}>
              <DoiBadge label="DOI" doi="10.31223/X5VN13" href="https://doi.org/10.31223/X5VN13" />
              <Button
                variant="outlined" size="small"
                startIcon={<ArticleIcon />}
                href="https://eartharxiv.org/repository/view/12028/"
                target="_blank" rel="noopener noreferrer"
              >
                {t('about.paperBtn')}
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        {/* Open Source */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <SectionCard icon={<CodeIcon fontSize="small" />} title={t('about.opensourceTitle')}>
            {loadingDoi ? (
              <CircularProgress size={20} sx={{ mb: 2 }} />
            ) : doiInfo ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>{t('about.doiP1')}</Typography>
                <DoiBadge label="DOI" doi={doiInfo.doi} href={doiInfo.url} />
              </Box>
            ) : null}
            <Typography variant="body2" paragraph>
              {t('about.codeP1')}{' '}
              <Link href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">AGPLv3</Link>.
            </Typography>
            <Typography variant="body2" paragraph>
              {t('about.contentP1')}{' '}
              <Link href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA</Link>.
            </Typography>
            <Button
              variant="outlined" size="small"
              startIcon={<GitHubIcon />}
              href="https://github.com/ppapadeas/greece-trig-points"
              target="_blank" rel="noopener noreferrer"
            >
              {t('about.githubBtn')}
            </Button>
          </SectionCard>
        </Grid>

        {/* Export */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <SectionCard icon={<DownloadIcon fontSize="small" />} title={t('about.exportTitle')}>
            <Typography variant="body2" paragraph>
              {t('about.exportP1')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />} href={`${import.meta.env.VITE_API_BASE_URL}/api/export/csv`}>
                {t('about.exportCSV')}
              </Button>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />} href={`${import.meta.env.VITE_API_BASE_URL}/api/export/kml`}>
                {t('about.exportKML')}
              </Button>
              <Button variant="outlined" size="small" startIcon={<DownloadIcon />} href={`${import.meta.env.VITE_API_BASE_URL}/api/export/gpx`}>
                {t('about.exportGPX')}
              </Button>
            </Box>
          </SectionCard>
        </Grid>

        {/* Community */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <SectionCard icon={<ForumIcon fontSize="small" />} title={t('about.communityTitle')}>
            <Typography variant="body2" paragraph>
              {t('about.communityP1')}
            </Typography>
            <Button
              variant="contained" size="small"
              startIcon={<ForumIcon />}
              href="https://discord.gg/Kqn3UEZsGp"
              target="_blank" rel="noopener noreferrer"
              sx={{ bgcolor: '#5865F2', '&:hover': { bgcolor: '#4752C4' } }}
            >
              {t('about.discordBtn')}
            </Button>
          </SectionCard>
        </Grid>

        {/* Support */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <SectionCard icon={<FavoriteIcon fontSize="small" />} title={t('about.supportTitle')}>
            <Typography variant="body2" paragraph>
              {t('about.supportP1')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained" size="small"
                startIcon={<FavoriteIcon />}
                href="https://ko-fi.com/papadeas"
                target="_blank" rel="noopener noreferrer"
                sx={{ bgcolor: '#FF5E5B', '&:hover': { bgcolor: '#e04e4b' } }}
              >
                {t('about.kofiBtn')}
              </Button>
              <Button
                variant="outlined" size="small"
                startIcon={<GitHubIcon />}
                href="https://github.com/sponsors/ppapadeas"
                target="_blank" rel="noopener noreferrer"
              >
                {t('about.sponsorBtn')}
              </Button>
            </Box>
          </SectionCard>
        </Grid>
      </Grid>

      {/* Acknowledgments + Git hash */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('about.ackP1')}{' '}
          <Link href="http://www.gys.gr/" target="_blank" rel="noopener noreferrer">
            Hellenic Army Geographical Service (ΓΥΣ)
          </Link>.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}>
          {__GIT_HASH__} — {__GIT_MESSAGE__}
        </Typography>
      </Box>
    </Container>
  );
};

export default AboutPage;
