import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  IconButton,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  DirectionsCar,
  LocalHospital as Emergency,
  Room as LocationIcon,
  FilterList as FilterIcon,
  Fullscreen as FullscreenIcon,
  MyLocation as CenterIcon
} from '@mui/icons-material';

import { useSocket } from '../contexts/SocketCompatibility';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const MapPage = () => {
  const { connected, subscribeToLocationUpdates } = useSocket();
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [autoCenter, setAutoCenter] = useState(true);

  // Dados simulados para demonstração
  const simulatedVehicles = [
    {
      id: 1,
      plate: 'AMB-001',
      model: 'Mercedes Sprinter',
      status: 'available',
      location: {
        lat: -23.5505,
        lng: -46.6333,
        address: 'Centro, São Paulo',
        timestamp: new Date().toISOString()
      },
      driver: null,
      currentRide: null,
      speed: 0,
      heading: 0
    },
    {
      id: 2,
      plate: 'AMB-002',
      model: 'Fiat Ducato',
      status: 'in_use',
      location: {
        lat: -23.5489,
        lng: -46.6388,
        address: 'Vila Madalena, São Paulo',
        timestamp: new Date().toISOString()
      },
      driver: { id: 1, name: 'Pedro Costa' },
      currentRide: { id: 1, number: 'C-2024-0001', origin: 'Hospital A', destination: 'UPA B' },
      speed: 45,
      heading: 90
    },
    {
      id: 3,
      plate: 'AMB-003',
      model: 'Renault Master',
      status: 'maintenance',
      location: {
        lat: -23.5577,
        lng: -46.6566,
        address: 'Oficina Central',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      driver: null,
      currentRide: null,
      speed: 0,
      heading: 0
    }
  ];

  useEffect(() => {
    // Simular dados de veículos
    setVehicles(simulatedVehicles);

    // Inicializar mapa (usando Leaflet)
    initializeMap();

    // Subscrever atualizações de localização em tempo real
    const unsubscribe = subscribeToLocationUpdates((locationUpdate) => {
      handleLocationUpdate(locationUpdate);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const initializeMap = () => {
    // TODO: Implementar inicialização do mapa com Leaflet
    // Por enquanto, simular carregamento do mapa
    setTimeout(() => {
      setMapLoaded(true);
    }, 2000);
  };

  const handleLocationUpdate = (locationUpdate) => {
    // Atualizar localização do veículo em tempo real
    setVehicles(prevVehicles => 
      prevVehicles.map(vehicle => 
        vehicle.id === locationUpdate.vehicleId 
          ? { ...vehicle, location: locationUpdate }
          : vehicle
      )
    );

    // TODO: Atualizar marcadores no mapa
  };

  const getStatusColor = (status) => {
    const colors = {
      available: '#4caf50',
      in_use: '#2196f3',
      maintenance: '#ff9800',
      unavailable: '#f44336'
    };
    return colors[status] || '#757575';
  };

  const getStatusLabel = (status) => {
    const labels = {
      available: 'Disponível',
      in_use: 'Em Uso',
      maintenance: 'Manutenção',
      unavailable: 'Indisponível'
    };
    return labels[status] || status;
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    // TODO: Centralizar mapa no veículo selecionado
  };

  const handleRefresh = () => {
    // TODO: Recarregar dados dos veículos
    console.log('Atualizando dados dos veículos...');
  };

  const handleCenterMap = () => {
    // TODO: Centralizar mapa na cidade
    console.log('Centralizando mapa...');
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    if (vehicleFilter === 'all') return true;
    return vehicle.status === vehicleFilter;
  });

  const formatLastUpdate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora';
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    return `${Math.floor(diffMinutes / 1440)} dias atrás`;
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', gap: 2 }}>
      {/* Painel Lateral */}
      <Paper sx={{ width: 350, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header do Painel */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Mapa ao Vivo
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip
              label={connected ? 'Conectado' : 'Desconectado'}
              color={connected ? 'success' : 'error'}
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              {filteredVehicles.length} veículos
            </Typography>
          </Box>

          {/* Controles */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Tooltip title="Atualizar">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Centralizar Mapa">
              <IconButton size="small" onClick={handleCenterMap}>
                <CenterIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Tela Cheia">
              <IconButton size="small">
                <FullscreenIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Filtros */}
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Filtrar por Status</InputLabel>
            <Select
              value={vehicleFilter}
              label="Filtrar por Status"
              onChange={(e) => setVehicleFilter(e.target.value)}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="available">Disponível</MenuItem>
              <MenuItem value="in_use">Em Uso</MenuItem>
              <MenuItem value="maintenance">Manutenção</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showTraffic}
                  onChange={(e) => setShowTraffic(e.target.checked)}
                  size="small"
                />
              }
              label="Trânsito"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={autoCenter}
                  onChange={(e) => setAutoCenter(e.target.checked)}
                  size="small"
                />
              }
              label="Auto Center"
            />
          </Box>
        </Box>

        {/* Lista de Veículos */}
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <List dense>
            {filteredVehicles.map((vehicle) => (
              <ListItem
                key={vehicle.id}
                button
                onClick={() => handleVehicleSelect(vehicle)}
                selected={selectedVehicle?.id === vehicle.id}
                sx={{
                  borderLeft: '4px solid',
                  borderColor: getStatusColor(vehicle.status),
                  mb: 1,
                  borderRadius: 1,
                  mx: 1
                }}
              >
                <ListItemIcon>
                  <DirectionsCar sx={{ color: getStatusColor(vehicle.status) }} />
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {vehicle.plate}
                      </Typography>
                      <Chip
                        label={getStatusLabel(vehicle.status)}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(vehicle.status),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {vehicle.model}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 12, mr: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                          {vehicle.location.address}
                        </Typography>
                      </Box>
                      {vehicle.currentRide && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Emergency sx={{ fontSize: 12, mr: 0.5, color: 'primary.main' }} />
                          <Typography variant="caption" color="primary">
                            {vehicle.currentRide.number}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block">
                        Atualizado: {formatLastUpdate(vehicle.location.timestamp)}
                      </Typography>
                      {vehicle.speed > 0 && (
                        <Typography variant="caption" color="info.main" display="block">
                          {vehicle.speed} km/h
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Container do Mapa */}
      <Paper sx={{ flexGrow: 1, position: 'relative' }}>
        {!mapLoaded ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <LoadingSpinner size={60} />
            <Typography variant="body1" color="text.secondary">
              Carregando mapa...
            </Typography>
          </Box>
        ) : (
          <Box
            ref={mapRef}
            sx={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Card sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Mapa Interativo
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Integração com mapas será implementada usando Leaflet ou Google Maps API
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredVehicles.length} veículos sendo rastreados em tempo real
              </Typography>
            </Card>
          </Box>
        )}

        {/* Detalhes do Veículo Selecionado */}
        {selectedVehicle && mapLoaded && (
          <Card
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 300,
              zIndex: 1000
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {selectedVehicle.plate}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedVehicle.model}
              </Typography>
              
              <Chip
                label={getStatusLabel(selectedVehicle.status)}
                color={selectedVehicle.status === 'available' ? 'success' : 
                       selectedVehicle.status === 'in_use' ? 'primary' : 'warning'}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography variant="body2" gutterBottom>
                <strong>Localização:</strong> {selectedVehicle.location.address}
              </Typography>

              {selectedVehicle.driver && (
                <Typography variant="body2" gutterBottom>
                  <strong>Motorista:</strong> {selectedVehicle.driver.name}
                </Typography>
              )}

              {selectedVehicle.currentRide && (
                <Typography variant="body2" gutterBottom>
                  <strong>Corrida:</strong> {selectedVehicle.currentRide.number}
                </Typography>
              )}

              {selectedVehicle.speed > 0 && (
                <Typography variant="body2" gutterBottom>
                  <strong>Velocidade:</strong> {selectedVehicle.speed} km/h
                </Typography>
              )}

              <Typography variant="caption" color="text.secondary">
                Última atualização: {formatLastUpdate(selectedVehicle.location.timestamp)}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Paper>
    </Box>
  );
};

export default MapPage;