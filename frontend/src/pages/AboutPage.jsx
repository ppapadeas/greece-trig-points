import React from 'react';
import { Container, Typography, Paper, Box, Link, Divider, Button } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

const AboutPage = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom>
          About This Project
        </Typography>
        <Typography variant="body1" paragraph>
          This project, available at vathra.gr, is a digital initiative dedicated to mapping and documenting the status of the Hellenic Army Geographical Service (ΓΥΣ) trigonometric points across Greece. These points are not just markers on a map; they are a vital part of our country's geodetic and cultural heritage.
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3 }}>
          Our Mission
        </Typography>
        <Typography variant="body1" paragraph>
          Our mission is to create a living, crowd-sourced archive. By combining official data with on-the-ground reports from users like you, we aim to:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li>Provide an accurate, up-to-date status for each point.</li>
          <li>Collect and display photographs and accessibility information.</li>
          <li>Foster a community of enthusiasts, including hikers, surveyors, and historians, dedicated to preserving this network.</li>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        <Typography variant="h5" component="h2" gutterBottom>
          Open Source
        </Typography>
        <Typography variant="body1" paragraph>
          This project is fully open source. Contributions are welcome! The code for the entire application lives on GitHub and is licensed under the{' '}
          <Link href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">
            AGPLv3
          </Link>
          {' '}license.
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<GitHubIcon />}
          href="https://github.com/ppapadeas/greece-trig-points"
          target="_blank"
          rel="noopener noreferrer"
        >
          View Code on GitHub
        </Button>
        <Typography variant="body1" paragraph sx={{ mt: 2 }}>
          All user-submitted content, including reports and photos, is licensed under the{' '}
          <Link href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
            Creative Commons Attribution-ShareAlike (CC BY-SA)
          </Link>
          {' '}license to ensure the data remains open and shareable.
        </Typography>
        
        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" gutterBottom>
          Acknowledgements
        </Typography>
        <Typography variant="body1" paragraph>
          This project would not be possible without the public data provided by{' '}
          <Link href="https://geodata.gov.gr/" target="_blank" rel="noopener noreferrer">
            Geodata.gov.gr
          </Link>
          {' '}and the foundational geodetic work of the{' '}
          <Link href="http://www.gys.gr/" target="_blank" rel="noopener noreferrer">
            Hellenic Army Geographical Service (ΓΥΣ)
          </Link>.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AboutPage;