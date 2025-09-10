import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, CircularProgress, useMediaQuery, useTheme, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
// Import icons for the menu
import MenuIcon from '@mui/icons-material/Menu';
import GoogleIcon from '@mui/icons-material/Google';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Header = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Use a smaller breakpoint for a better feel

  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  const handleLogout = () => {
    handleMenuClose();
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/logout`;
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // The content for the desktop view
  const renderDesktopMenu = () => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button component={RouterLink} to="/stats" color="inherit">
        Statistics
      </Button>
      <Box sx={{ ml: 2 }}>
        {loading ? <CircularProgress size={24} color="inherit" /> : (
          user ? (
            <IconButton onClick={handleMenuOpen}>
              <Avatar src={user.profile_picture_url} alt={user.display_name} />
            </IconButton>
          ) : (
            <Button 
              color="inherit" 
              variant="outlined" 
              onClick={handleLogin}
              startIcon={<GoogleIcon />}
            >
              Login
            </Button>
          )
        )}
      </Box>
    </Box>
  );

  // The content for the mobile view (the burger icon)
  const renderMobileMenu = () => (
    <IconButton
      color="inherit"
      aria-label="open menu"
      edge="end"
      onClick={handleMenuOpen}
    >
      <MenuIcon />
    </IconButton>
  );

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
            vathra.gr
          </Typography>
          {isMobile ? renderMobileMenu() : renderDesktopMenu()}
        </Toolbar>
      </AppBar>
      
      {/* This Menu is for BOTH the user avatar click on desktop and the burger click on mobile */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        // This makes the menu position correctly on mobile
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {user ? [
          <MenuItem key="profile" disabled>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{user.display_name}</ListItemText>
          </MenuItem>,
          <MenuItem key="stats" component={RouterLink} to="/stats" onClick={handleMenuClose}>
            <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Statistics</ListItemText>
          </MenuItem>,
          <MenuItem key="logout" onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        ] : [
          <MenuItem key="stats" component={RouterLink} to="/stats" onClick={handleMenuClose}>
            <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Statistics</ListItemText>
          </MenuItem>,
          <MenuItem key="login" onClick={handleLogin}>
            <ListItemIcon><GoogleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Login</ListItemText>
          </MenuItem>
        ]}
      </Menu>
    </>
  );
};

export default Header;