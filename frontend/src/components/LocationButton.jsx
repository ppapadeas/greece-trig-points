import React, { useState } from 'react';
import { useMap } from 'react-leaflet';
import { Fab, Tooltip } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import './LocationButton.css';

const LocationButton = ({ onLocationFound }) => {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
    // Remove any previously attached listeners before adding new ones
    map.off('locationfound');
    map.off('locationerror');
    map.on('locationfound', function (e) {
      map.flyTo(e.latlng, 13);
      onLocationFound(e.latlng);
      setIsLoading(false);
    });
    map.on('locationerror', function () {
      alert("Could not access your location. Please ensure you have granted permission.");
      setIsLoading(false);
    });
    map.locate();
  };

  return (
    <Tooltip title="Find My Location & Nearest Point">
        <Fab 
            color="primary" 
            aria-label="find my location" 
            onClick={handleClick}
            
        >
            {isLoading ? '...' : <MyLocationIcon />}
        </Fab>
    </Tooltip>
  );
};

export default LocationButton;