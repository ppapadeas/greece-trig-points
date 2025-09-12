import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const MapSpinner = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1100, // Ensure it's above the map and bottom bar
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '20px',
        borderRadius: '16px',
        boxShadow: 3,
      }}
    >
      <CircularProgress />
      <Typography sx={{ mt: 2 }}>Loading Points...</Typography>
    </Box>
  );
};

export default MapSpinner;