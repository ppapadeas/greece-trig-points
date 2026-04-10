import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppBar, Toolbar, Box, Fab, Link, useMediaQuery, useTheme } from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import SearchBar from './SearchBar';
import LocationButton from './LocationButton';

const BottomBar = ({ onLocationFound }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar position="fixed" color="transparent" elevation={0} sx={{ top: 'auto', bottom: 0, zIndex: 1100 }}>
      <Toolbar sx={{ justifyContent: 'space-between', padding: 2 }}>
        <Box sx={{ flexGrow: 1, marginRight: 2 }}>
          <SearchBar />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isMobile && (
            <Fab
              size="small"
              color="primary"
              onClick={() => navigate('/compass')}
              aria-label="AR Compass"
              sx={{ boxShadow: 2 }}
            >
              <ExploreIcon />
            </Fab>
          )}
          <LocationButton onLocationFound={onLocationFound} />
        </Box>
        <Link
          component={RouterLink}
          to="/privacy"
          variant="caption"
          sx={{ color: 'text.secondary', opacity: 0.6, '&:hover': { opacity: 1 }, ml: 1 }}
        >
          {t('footer.privacy')}
        </Link>
      </Toolbar>
    </AppBar>
  );
};

export default BottomBar;
