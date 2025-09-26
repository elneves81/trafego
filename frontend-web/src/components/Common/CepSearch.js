import React, { useState, useCallback } from 'react';
import {
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  Grid,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { api } from '../../services/api';

const CepSearch = ({ 
  onAddressFound, 
  initialCep = '', 
  disabled = false,
  label = 'CEP',
  placeholder = 'Digite o CEP (ex: 85010-260)',
  showFullAddress = true 
}) => {
  const [cep, setCep] = useState(initialCep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [address, setAddress] = useState(null);

  // Formatar CEP enquanto digita
  const formatCep = (value) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 8) {
      return cleanValue.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    }
    return cleanValue.substring(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Validar CEP
  const isValidCep = (cepValue) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    return cleanCep.length === 8;
  };

  // Buscar endereço por CEP
  const buscarEndereco = useCallback(async (cepValue = cep) => {
    if (!isValidCep(cepValue)) {
      setError('CEP deve conter 8 dígitos');
      return;
    }

    setLoading(true);
    setError('');
    setAddress(null);

    try {
      const cleanCep = cepValue.replace(/\D/g, '');
      const response = await api.get(`/cep/${cleanCep}`);
      
      if (response.data.sucesso) {
        const addressData = response.data;
        setAddress(addressData);
        
        // Callback para componente pai
        if (onAddressFound) {
          onAddressFound(addressData);
        }
      } else {
        setError(response.data.erro || 'CEP não encontrado');
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      setError(
        err.response?.data?.erro || 
        'Erro ao buscar CEP. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  }, [cep, onAddressFound]);

  // Manipular mudança no input
  const handleCepChange = (e) => {
    const formattedValue = formatCep(e.target.value);
    setCep(formattedValue);
    setError('');
    
    // Auto-busca quando CEP estiver completo
    if (formattedValue.replace(/\D/g, '').length === 8) {
      setTimeout(() => buscarEndereco(formattedValue), 500);
    }
  };

  // Limpar dados
  const handleClear = () => {
    setCep('');
    setAddress(null);
    setError('');
    if (onAddressFound) {
      onAddressFound(null);
    }
  };

  // Buscar manualmente
  const handleSearch = () => {
    buscarEndereco();
  };

  // Enter para buscar
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      buscarEndereco();
    }
  };

  return (
    <Box>
      {/* Campo de CEP */}
      <Box display="flex" alignItems="flex-start" gap={1}>
        <TextField
          label={label}
          placeholder={placeholder}
          value={cep}
          onChange={handleCepChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || loading}
          error={!!error}
          helperText={error || 'Digite apenas números. Formato automático aplicado.'}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />,
            endAdornment: (
              <Box display="flex" gap={0.5}>
                {cep && (
                  <Tooltip title="Limpar">
                    <span>
                      <IconButton
                        size="small"
                        onClick={handleClear}
                        disabled={disabled || loading}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
                
                <Tooltip title="Buscar endereço">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleSearch}
                      disabled={disabled || loading || !isValidCep(cep)}
                      color="primary"
                    >
                      {loading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <SearchIcon fontSize="small" />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            )
          }}
        />
      </Box>

      {/* Endereço encontrado */}
      {address && showFullAddress && (
        <Paper 
          elevation={1} 
          sx={{ 
            mt: 2, 
            p: 2, 
            backgroundColor: 'success.light',
            color: 'success.contrastText'
          }}
        >
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <LocationIcon color="inherit" />
            <Typography variant="subtitle2" fontWeight="bold">
              Endereço encontrado via {address.fonte}
            </Typography>
          </Box>
          
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="body2">
                <strong>CEP:</strong> {address.cep}
              </Typography>
            </Grid>
            
            {address.logradouro && (
              <Grid item xs={12}>
                <Typography variant="body2">
                  <strong>Logradouro:</strong> {address.logradouro}
                </Typography>
              </Grid>
            )}
            
            {address.bairro && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Bairro:</strong> {address.bairro}
                </Typography>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Cidade:</strong> {address.cidade}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Estado:</strong> {address.estado}
              </Typography>
            </Grid>
            
            {address.ddd && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>DDD:</strong> {address.ddd}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {/* Loading */}
      {loading && (
        <Box display="flex" alignItems="center" gap={1} mt={1}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            Buscando endereço...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CepSearch;