import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  LocalHospital
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleInputChange = (field) => (event) => {
    setCredentials(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    // Limpar erro ao digitar
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login(credentials);
      
      if (!result.success) {
        setError(result.message);
      }
    } catch (err) {
      setError('Erro interno do servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          boxShadow: 24
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: 'white',
                mb: 2
              }}
            >
              <LocalHospital sx={{ fontSize: 40 }} />
            </Box>
            
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              textAlign="center"
              fontWeight="bold"
              color="primary"
            >
              Sistema de Transporte
            </Typography>
            
            <Typography
              variant="subtitle1"
              color="text.secondary"
              textAlign="center"
            >
              Secretaria de Saúde
            </Typography>
          </Box>

          {/* Formulário de Login */}
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={credentials.email}
              onChange={handleInputChange('email')}
              margin="normal"
              required
              autoComplete="email"
              autoFocus
              disabled={loading}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={handleInputChange('password')}
              margin="normal"
              required
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 3 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              sx={{
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Central de Ambulâncias
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Versão 1.0
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;