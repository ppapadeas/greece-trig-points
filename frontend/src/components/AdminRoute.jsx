import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    // If user is not logged in or is not an admin, redirect to home page
    return <Navigate to="/" replace />;
  }

  // If user is an admin, render the page
  return children;
};

export default AdminRoute;