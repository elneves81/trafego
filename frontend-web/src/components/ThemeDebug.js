import React from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

const ThemeDebug = () => {
  const theme = useTheme();
  
  console.log('🎭 Theme Debug:', theme);
  console.log('🎨 Primary main:', theme?.palette?.primary?.main);
  
  return (
    <Box p={2}>
      <Typography variant="h6">Theme Debug</Typography>
      <Typography>Primary color: {theme?.palette?.primary?.main || 'UNDEFINED'}</Typography>
      <Typography>Theme mode: {theme?.palette?.mode || 'UNDEFINED'}</Typography>
      <Typography>Theme exists: {theme ? 'YES' : 'NO'}</Typography>
    </Box>
  );
};

export default ThemeDebug;