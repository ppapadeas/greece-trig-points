import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Box, Fab, useMediaQuery, useTheme } from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import SearchBar from './SearchBar';
import LocationButton from './LocationButton';

const BottomBar = ({ onLocationFound }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <AppBar
      position="fixed"
      color="transparent"
      elevation={0}
      sx={{
        top: 'auto',
        bottom: 0,
        zIndex: 1100,
        // MUI's color="transparent" still leaves a dark backgroundImage in some
        // themes — explicitly null it so the map shows through behind the bar.
        bgcolor: 'transparent',
        backgroundImage: 'none',
        boxShadow: 'none',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', padding: 2, bgcolor: 'transparent' }}>
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
      </Toolbar>
    </AppBar>
  );
};

export default BottomBar;
