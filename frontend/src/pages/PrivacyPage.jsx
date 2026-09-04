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

const PrivacyPage = () => {
  const { t } = useTranslation();

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Helmet>
        <title>{t('privacy.title')} — vathra.xyz</title>
        <link rel="canonical" href="https://vathra.xyz/privacy" />
      </Helmet>

      <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 300 }}>
          {t('privacy.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          {t('privacy.lastUpdated', { date: '2026-04-11' })}
        </Typography>

        <Section title={t('privacy.introTitle')}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('privacy.introP1')}
          </Typography>
        </Section>

        <Section title={t('privacy.dataCollectedTitle')}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('privacy.dataCollectedP1')}
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
            <Typography component="li" variant="body2">{t('privacy.dataCollectedL1')}</Typography>
            <Typography component="li" variant="body2">{t('privacy.dataCollectedL2')}</Typography>
            <Typography component="li" variant="body2">{t('privacy.dataCollectedL3')}</Typography>
            <Typography component="li" variant="body2">{t('privacy.dataCollectedL4')}</Typography>
          </Box>
        </Section>

        <Section title={t('privacy.howWeUseTitle')}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('privacy.howWeUseP1')}
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
            <Typography component="li" variant="body2">{t('privacy.howWeUseL1')}</Typography>
            <Typography component="li" variant="body2">{t('privacy.howWeUseL2')}</Typography>
            <Typography component="li" variant="body2">{t('privacy.howWeUseL3')}</Typography>
          </Box>
        </Section>

        <Section title={t('privacy.thirdPartyTitle')}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('privacy.thirdPartyP1')}
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
            <Typography component="li" variant="body2">{t('privacy.thirdPartyL1')}</Typography>
            <Typography component="li" variant="body2">{t('privacy.thirdPartyL2')}</Typography>
            <Typography component="li" variant="body2">{t('privacy.thirdPartyL3')}</Typography>
          </Box>
        </Section>

        <Section title={t('privacy.cookiesTitle')}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('privacy.cookiesP1')}
          </Typography>
        </Section>

        <Section title={t('privacy.retentionTitle')}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('privacy.retentionP1')}
          </Typography>
        </Section>

        <Section title={t('privacy.rightsTitle')}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('privacy.rightsP1')}
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
            <Typography component="li" variant="body2">{t('privacy.rightsL1')}</Typography>
            <Typography component="li" variant="body2">{t('privacy.rightsL2')}</Typography>
            <Typography component="li" variant="body2">{t('privacy.rightsL3')}</Typography>
          </Box>
        </Section>

        <Section title={t('privacy.contactTitle')}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {t('privacy.contactP1')}{' '}
            <Link href="mailto:privacy@vathra.xyz">privacy@vathra.xyz</Link>
          </Typography>
        </Section>
      </Paper>
    </Container>
  );
};

export default PrivacyPage;
