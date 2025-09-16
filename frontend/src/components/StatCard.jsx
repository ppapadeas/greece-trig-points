import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';

const StatCard = ({ title, value, icon, color = 'primary.main' }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="overline">{title}</Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, height: 56, width: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatCard;