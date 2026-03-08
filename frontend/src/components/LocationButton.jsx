import React, { useState } from 'react';
import { useMap } from '../context/MapContext';
import { Fab, Tooltip } from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import './LocationButton.css';

const LocationButton = ({ onLocationFound }) => {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (map) {
          map.flyTo({ center: [longitude, latitude], zoom: 13 });
        }
        onLocationFound({ lat: latitude, lng: longitude });
        setIsLoading(false);
      },
      () => {
        alert('Could not access your location. Please ensure you have granted permission.');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
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
