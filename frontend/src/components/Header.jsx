import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppBar, Toolbar, Typography, Button, Box, Avatar, CircularProgress } from '@mui/material';

const Header = () => {
  const { user, loading } = useAuth();

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
          <Typography>Welcome, {user.display_name}</Typography>
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
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Βάθρα Τριγωνομετρικού Δικτύου Ελλάδας
        </Typography>
        {renderAuthContent()}
      </Toolbar>
    </AppBar>
  );
};

export default Header;