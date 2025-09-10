import React from 'react';
import { AppBar, Toolbar, Box } from '@mui/material';
import SearchBar from './SearchBar';
import LocationButton from './LocationButton';

const BottomBar = ({ onLocationFound }) => {
  return (
    <AppBar position="fixed" color="transparent" elevation={0} sx={{ top: 'auto', bottom: 0, zIndex: 1100 }}>
      <Toolbar sx={{ justifyContent: 'space-between', padding: 2 }}>
        <Box sx={{ flexGrow: 1, marginRight: 2 }}>
          <SearchBar />
        </Box>
        <LocationButton onLocationFound={onLocationFound} />
      </Toolbar>
    </AppBar>
  );
};

export default BottomBar;
