import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Paper, Select, MenuItem, FormControl, InputLabel, Divider, IconButton,
  Tooltip, Box, useMediaQuery, useTheme, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { useMap } from '../context/MapContext';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FilterListIcon from '@mui/icons-material/FilterList';
import MapIcon from '@mui/icons-material/Map';
import TerrainIcon from '@mui/icons-material/Terrain';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';

const FilterOptions = ({ filters, onFilterChange, isMobile }) => {
  const { t } = useTranslation();
  const STATUS_COLORS = {
    OK: '#28a745',
    DAMAGED: '#ffc107',
    DESTROYED: '#dc3545',
    MISSING: '#6c757d',
    UNKNOWN: '#17a2b8',
  };

  return (
    <>
      <FormControl fullWidth={isMobile} variant="standard" sx={{ m: 1, minWidth: 150 }}>
        <InputLabel id="filter-status-label">Status</InputLabel>
        <Select
          labelId="filter-status-label"
          id="filter-status"
          name="status"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          label="Status"
        >
          <MenuItem value="ALL"><em>All</em></MenuItem>
          {Object.keys(STATUS_COLORS).map((status) => (
            <MenuItem key={status} value={status}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: STATUS_COLORS[status], mr: 1.5 }} />
                {t(`status.${status}`)}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth={isMobile} variant="standard" sx={{ m: 1, minWidth: 150 }}>
        <InputLabel id="filter-order-label">Order</InputLabel>
        <Select
          labelId="filter-order-label"
          id="filter-order"
          name="order"
          value={filters.order}
          onChange={(e) => onFilterChange('order', e.target.value)}
          label="Order"
        >
          <MenuItem value="ALL"><em>All</em></MenuItem>
          <MenuItem value="I">I</MenuItem>
          <MenuItem value="II">II</MenuItem>
          <MenuItem value="III">III</MenuItem>
          <MenuItem value="IV">IV</MenuItem>
        </Select>
      </FormControl>
    </>
  );
};

const BASE_LAYERS = [
  { value: 'protomaps', label: 'Map', icon: <MapIcon fontSize="small" /> },
  { value: 'topo', label: 'Topo', icon: <TerrainIcon fontSize="small" /> },
  { value: 'satellite', label: 'Satellite', icon: <SatelliteAltIcon fontSize="small" /> },
];

const MapControls = ({ filters, onFilterChange, onBaseLayerChange }) => {
  const map = useMap();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [baseLayer, setBaseLayer] = useState('protomaps');

  const handleBaseLayerChange = (_, value) => {
    if (!value) return;
    setBaseLayer(value);
    onBaseLayerChange(value);
  };

  const baseLayerToggle = (
    <ToggleButtonGroup
      value={baseLayer}
      exclusive
      onChange={handleBaseLayerChange}
      size="small"
      sx={{ m: 1 }}
    >
      {BASE_LAYERS.map((bl) => (
        <ToggleButton key={bl.value} value={bl.value} aria-label={bl.label}>
          <Tooltip title={bl.label}>{bl.icon}</Tooltip>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  if (isMobile) {
    return (
      <>
        <Paper sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}>
          {baseLayerToggle}
        </Paper>
        <Paper sx={{ position: 'absolute', top: 72, right: 10, zIndex: 1000 }}>
          <Tooltip title="Filters">
            <IconButton onClick={() => setDialogOpen(true)}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        </Paper>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
          <DialogTitle>Filter Points</DialogTitle>
          <DialogContent>
            <FilterOptions filters={filters} onFilterChange={onFilterChange} isMobile={true} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute', top: 10, left: 10, zIndex: 1000, p: 1,
        bgcolor: 'rgba(255, 255, 255, 0.9)', display: 'flex', flexDirection: 'column',
      }}
    >
      {baseLayerToggle}
      <Divider sx={{ my: 1 }} />
      <FilterOptions filters={filters} onFilterChange={onFilterChange} />
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Zoom In"><IconButton onClick={() => map?.zoomIn()}><ZoomInIcon /></IconButton></Tooltip>
        <Tooltip title="Zoom Out"><IconButton onClick={() => map?.zoomOut()}><ZoomOutIcon /></IconButton></Tooltip>
      </Box>
    </Paper>
  );
};

export default MapControls;
