import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Autocomplete, TextField, Box, CircularProgress } from '@mui/material';
import apiClient from '../api';
import './SearchBar.css';

const SearchBar = () => {
  const map = useMap();
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (inputValue.trim() === '') {
        setOptions([]);
        return;
      }
      
      setLoading(true);
      apiClient.get(`/api/points/search?q=${inputValue}`)
        .then(response => {
          setOptions(response.data || []);
        })
        .catch(error => {
          console.error("Search failed:", error);
          setOptions([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  const handleSelect = (event, value) => {
    if (value) {
      const location = JSON.parse(value.location);
      const pointPosition = [location.coordinates[1], location.coordinates[0]];
      map.flyTo(pointPosition, 16);
    }
  };

  return (
    <Box className="search-bar-container">
      <Autocomplete
        id="trig-point-search"
        options={options}
        getOptionLabel={(option) => `${option.gys_id} - ${option.name || '(No Name)'}`}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterOptions={(x) => x}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={handleSelect}
        loading={loading}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search by ID or Name"
            variant="filled"
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {/* --- THIS IS THE FIX --- */}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Box>
  );
};

export default SearchBar;