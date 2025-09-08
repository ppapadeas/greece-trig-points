import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, CircularProgress, useMediaQuery, useTheme, IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { user, loading } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
  };

  const handleLogout = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/logout`;
  };

  const renderAuthContent = () => {
    if (loading) {
      return <CircularProgress size={24} color="inherit" />;
    }
    if (user) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={user.profile_picture_url} alt={user.display_name} />
          {!isMobile && <Typography>Welcome, {user.display_name}</Typography>}
          <Button color="inherit" variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      );
    }
    return (
      <Button color="inherit" variant="outlined" onClick={handleLogin}>
        Login with Google
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
          Hellas Trig Points
        </Typography>
        <Button component={RouterLink} to="/stats" color="inherit">
          Statistics
        </Button>
        {renderAuthContent()}
      </Toolbar>
    </AppBar>
  );
};

export default Header;