import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Paper, Select, MenuItem, FormControl, InputLabel, Divider, IconButton, 
  Tooltip, Box, Chip, useMediaQuery, useTheme, Button, Dialog, DialogTitle,
  DialogContent, DialogActions 
} from '@mui/material';
import { useMap } from 'react-leaflet';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FilterListIcon from '@mui/icons-material/FilterList';

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
        <InputLabel>Status</InputLabel>
        <Select
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
        <InputLabel>Order</InputLabel>
        <Select
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

const MapControls = ({ filters, onFilterChange }) => {
  const map = useMap();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isMobile) {
    return (
      <>
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
        position: 'absolute', top: 72, right: 10, zIndex: 1000, p: 1,
        bgcolor: 'rgba(255, 255, 255, 0.9)', display: 'flex', flexDirection: 'column'
      }}
    >
      <FilterOptions filters={filters} onFilterChange={onFilterChange} />
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Zoom In"><IconButton onClick={() => map.zoomIn()}><ZoomInIcon /></IconButton></Tooltip>
        <Tooltip title="Zoom Out"><IconButton onClick={() => map.zoomOut()}><ZoomOutIcon /></IconButton></Tooltip>
      </Box>
    </Paper>
  );
};

export default MapControls;