import React, { useState } from 'react';
import { useMap } from 'react-leaflet';
import { Fab, Tooltip } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';

// The component now accepts an onLocationFound prop
const LocationButton = ({ onLocationFound }) => {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    map.locate().on('locationfound', function (e) {
      map.flyTo(e.latlng, 13);
      // Pass the found coordinates up to the parent component
      onLocationFound(e.latlng);
      setIsLoading(false);
    }).on('locationerror', function(e){
        alert("Could not access your location. Please ensure you have granted permission.");
        setIsLoading(false);
    });
  };

  return (
    <Tooltip title="Find My Location & Nearest Point">
        <Fab 
            color="primary" 
            aria-label="find my location" 
            onClick={handleClick}
            sx={{
                position: 'absolute',
                bottom: 32,
                right: 32,
                zIndex: 1000,
            }}
        >
            {isLoading ? '...' : <MyLocationIcon />}
        </Fab>
    </Tooltip>
  );
};

export default LocationButton;