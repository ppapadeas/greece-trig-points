import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { Autocomplete, TextField, Box } from '@mui/material';
import apiClient from '../api';
import './SearchBar.css';

const SearchBar = () => {
  const map = useMap();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Debounce mechanism: wait for user to stop typing
    const delayDebounceFn = setTimeout(() => {
      if (inputValue) {
        setLoading(true);
        apiClient.get(`/api/points/search?q=${inputValue}`)
          .then(response => {
            setOptions(response.data);
            setLoading(false);
          })
          .catch(error => {
            console.error("Search failed:", error);
            setLoading(false);
          });
      } else {
        setOptions([]);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [inputValue]);

  const handleSelect = (event, value) => {
    if (value) {
      const location = JSON.parse(value.location);
      const pointPosition = [location.coordinates[1], location.coordinates[0]];
      map.flyTo(pointPosition, 16); // Zoom in closer on selection
    }
  };

  return (
    <Box className="search-bar-container">
      <Autocomplete
        id="trig-point-search"
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        options={options}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={loading}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        onChange={handleSelect}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Search by Point ID or Name"
            variant="filled"
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <span className="search-loader"></span> : null}
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