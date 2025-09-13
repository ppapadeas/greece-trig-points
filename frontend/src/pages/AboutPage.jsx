import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Box, Link, Divider, Button, CircularProgress } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import axios from 'axios';

const AboutPage = () => {
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
            To ensure long-term preservation and citability, the dataset is periodically archived at Zenodo.
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
          About vathra.xyz
        </Typography>
        <Typography variant="body1" paragraph>
          This project is a digital initiative dedicated to mapping and documenting the Hellenic Army Geographical Service (ΓΥΣ) trigonometric points. These markers, scattered across the Greek landscape from mountain peaks to coastal plains, are more than just survey points; they are a quiet testament to the scientific and cartographic history of Greece. For nearly a century, they formed the backbone of all national mapping efforts.
        </Typography>
        
        <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3 }}>
          Purpose & Aspirations
        </Typography>
        <Typography variant="body1" paragraph>
          Many of these historical points are now forgotten, damaged, or lost to time. Our mission is to create a living, crowd-sourced archive to preserve this heritage. By combining official public data with on-the-ground reports from a community of users, we aspire to:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <li>Build the most complete and up-to-date public record of the status and condition of these points.</li>
          <li>Foster a community of explorers—hikers, surveyors, historians, and enthusiasts—who actively contribute to this digital preservation effort.</li>
          <li>Provide a valuable, open-access resource for research, education, and recreation.</li>
          <li>Encourage a deeper connection with the Greek landscape through the lens of its hidden scientific history.</li>
        </Box>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h5" component="h2" gutterBottom>
          Open Source & Data
        </Typography>
        
        {renderDoiLink()}
        
        <Typography variant="body1" paragraph>
          This project is fully open source. The code for the entire application lives on GitHub and is licensed under the{' '}
          <Link href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">
            AGPLv3
          </Link>
          . Contributions are welcome. All user-submitted content, including reports and photos, is licensed under the{' '}
          <Link href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
            Creative Commons Attribution-ShareAlike (CC BY-SA)
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
          View Code on GitHub
        </Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h5" component="h2" gutterBottom>
          Acknowledgements
        </Typography>
        <Typography variant="body1" paragraph>
          This project utilizes public data from{' '}
          <Link href="https://geodata.gov.gr/" target="_blank" rel="noopener noreferrer">
            Geodata.gov.gr
          </Link>
          {' '}and is based on the foundational work of the{' '}
          <Link href="http://www.gys.gr/" target="_blank" rel="noopener noreferrer">
            Hellenic Army Geographical Service (ΓΥΣ)
          </Link>.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AboutPage;