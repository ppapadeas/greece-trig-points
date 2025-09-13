import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, CircularProgress, useMediaQuery, useTheme, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import GoogleIcon from '@mui/icons-material/Google';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InfoIcon from '@mui/icons-material/Info';

const Header = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  const renderDesktopMenu = () => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button component={RouterLink} to="/about" color="inherit">
        About
      </Button>
      <Button component={RouterLink} to="/stats" color="inherit">
        Statistics
      </Button>
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

  const renderMobileMenu = () => (
    <IconButton color="inherit" aria-label="open menu" edge="end" onClick={handleMenuOpen}>
      <MenuIcon />
    </IconButton>
  );

  return (
    <>
      {/* --- THIS IS THE FIX --- */}
      <AppBar position="static" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
            vathra.gr
          </Typography>
          {isMobile ? renderMobileMenu() : renderDesktopMenu()}
        </Toolbar>
      </AppBar>
      
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {user ? [
          <MenuItem key="profile" disabled>
            <ListItemIcon><AccountCircleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>{user.display_name}</ListItemText>
          </MenuItem>,
          <Divider key="divider1" />,
          user.role === 'ADMIN' && (
            <MenuItem key="admin" component={RouterLink} to="/admin" onClick={handleMenuClose}>
              <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>
              <ListItemText>Admin Panel</ListItemText>
            </MenuItem>
          ),
           <MenuItem key="about" component={RouterLink} to="/about" onClick={handleMenuClose}>
            <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
            <ListItemText>About</ListItemText>
          </MenuItem>,
          <MenuItem key="stats" component={RouterLink} to="/stats" onClick={handleMenuClose}>
            <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Statistics</ListItemText>
          </MenuItem>,
          <Divider key="divider2" />,
          <MenuItem key="logout" onClick={handleLogout}>
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        ] : [
          <MenuItem key="about" component={RouterLink} to="/about" onClick={handleMenuClose}>
            <ListItemIcon><InfoIcon fontSize="small" /></ListItemIcon>
            <ListItemText>About</ListItemText>
          </MenuItem>,
          <MenuItem key="stats" component={RouterLink} to="/stats" onClick={handleMenuClose}>
            <ListItemIcon><BarChartIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Statistics</ListItemText>
          </MenuItem>,
          <MenuItem key="login" onClick={handleLogin}>
            <ListItemIcon><GoogleIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Login with Google</ListItemText>
          </MenuItem>
        ]}
      </Menu>
    </>
  );
};

export default Header;