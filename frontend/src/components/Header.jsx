import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, CircularProgress, useMediaQuery, useTheme, IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import GoogleIcon from '@mui/icons-material/Google'; // Import the Google icon
import { Link as RouterLink } from 'react-router-dom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const Header = ({ onMenuClick }) => {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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

  const renderAuthContent = () => {
    if (loading) {
      return <CircularProgress size={24} color="inherit" />;
    }
    if (user) {
      return (
        <>
          <IconButton onClick={handleMenuOpen}>
            <Avatar src={user.profile_picture_url} alt={user.display_name} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={isMenuOpen}
            onClose={handleMenuClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
            <MenuItem disabled>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </>
      );
    }
    return (
      <Button 
        color="inherit" 
        variant="outlined" 
        onClick={handleLogin}
        startIcon={<GoogleIcon />}
      >
        Login
      </Button>
    );
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {isMobile && onMenuClick && (
          <IconButton
            color="inherit"
            edge="start"
            sx={{ mr: 1 }}
            onClick={onMenuClick}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
          Vathra.gr
        </Typography>
        <Button component={RouterLink} to="/stats" color="inherit">
          Statistics
        </Button>

        {/* Show Admin button only if user is an ADMIN */}
        {user && user.role === 'ADMIN' && (
          <Button 
            component={RouterLink} 
            to="/admin" 
            color="inherit"
            startIcon={<AdminPanelSettingsIcon />}
          >
            Admin
          </Button>
        )}

        <Box sx={{ ml: 2 }}>
          {renderAuthContent()}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;