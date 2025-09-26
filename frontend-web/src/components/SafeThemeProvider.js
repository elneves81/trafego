import React from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';

// Tema de fallback completo caso o tema principal falhe
const fallbackTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
      contrastText: '#ffffff',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
      contrastText: '#ffffff',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
});

const SafeThemeProvider = ({ children, theme }) => {
  // Verificar e validar o tema de forma mais robusta
  const safeTheme = React.useMemo(() => {
    console.log('🔍 SafeThemeProvider - Validando tema:', theme);
    
    if (!theme) {
      console.warn('⚠️ Tema não fornecido, usando fallback');
      return fallbackTheme;
    }
    
    if (!theme.palette) {
      console.warn('⚠️ Tema sem palette, usando fallback');
      return fallbackTheme;
    }
    
    if (!theme.palette.primary || !theme.palette.primary.main) {
      console.warn('⚠️ Tema sem primary.main, usando fallback');
      return fallbackTheme;
    }
    
    if (!theme.palette.secondary || !theme.palette.secondary.main) {
      console.warn('⚠️ Tema sem secondary.main, usando fallback');
      return fallbackTheme;
    }
    
    console.log('✅ SafeThemeProvider - Tema válido:', {
      primary: theme.palette.primary.main,
      secondary: theme.palette.secondary.main
    });
    
    return theme;
  }, [theme]);

  return (
    <MuiThemeProvider theme={safeTheme}>
      {children}
    </MuiThemeProvider>
  );
};

export default SafeThemeProvider;