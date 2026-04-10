import React from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Container, Typography, Paper, Box, Link } from '@mui/material';

const Section = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" component="h2" gutterBottom>
      {title}
    </Typography>
    {children}
  </Box>
);

const TermsPage = () => {
  const { t } = useTranslation();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>{t('terms.title')} — vathra.xyz</title>
        <link rel="canonical" href="https://vathra.xyz/terms" />
      </Helmet>

      <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 300 }}>
          {t('terms.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('terms.lastUpdated', { date: '2026-04-11' })}
        </Typography>

        <Section title={t('terms.acceptanceTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.acceptanceP1')}
          </Typography>
        </Section>

        <Section title={t('terms.descriptionTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.descriptionP1')}
          </Typography>
        </Section>

        <Section title={t('terms.accountsTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.accountsP1')}
          </Typography>
        </Section>

        <Section title={t('terms.contentTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.contentP1')}
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
            <Typography component="li" variant="body2">{t('terms.contentL1')}</Typography>
            <Typography component="li" variant="body2">{t('terms.contentL2')}</Typography>
            <Typography component="li" variant="body2">{t('terms.contentL3')}</Typography>
          </Box>
        </Section>

        <Section title={t('terms.licensingTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.licensingP1')}
          </Typography>
        </Section>

        <Section title={t('terms.conductTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.conductP1')}
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
            <Typography component="li" variant="body2">{t('terms.conductL1')}</Typography>
            <Typography component="li" variant="body2">{t('terms.conductL2')}</Typography>
            <Typography component="li" variant="body2">{t('terms.conductL3')}</Typography>
            <Typography component="li" variant="body2">{t('terms.conductL4')}</Typography>
          </Box>
        </Section>

        <Section title={t('terms.disclaimerTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.disclaimerP1')}
          </Typography>
        </Section>

        <Section title={t('terms.terminationTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.terminationP1')}
          </Typography>
        </Section>

        <Section title={t('terms.changesTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.changesP1')}
          </Typography>
        </Section>

        <Section title={t('terms.contactTitle')}>
          <Typography variant="body2" paragraph>
            {t('terms.contactP1')}{' '}
            <Link href="mailto:legal@vathra.xyz">legal@vathra.xyz</Link>
          </Typography>
        </Section>
      </Paper>
    </Container>
  );
};

export default TermsPage;
