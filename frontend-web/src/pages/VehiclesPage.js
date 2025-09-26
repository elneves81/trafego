import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Grid,
  Avatar,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  DirectionsCar,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Build as MaintenanceIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketCompatibility';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const VehiclesPage = () => {
  const { hasPermission } = useAuth();
  const { connected } = useSocket();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [dialogMode, setDialogMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      
      // TODO: Implementar chamada real para a API
      setTimeout(() => {
        setVehicles([
          {
            id: 1,
            plate: 'AMB-001',
            model: 'Mercedes Sprinter',
            year: 2022,
            type: 'ambulancia_basica',
            status: 'available',
            fuelLevel: 85,
            mileage: 45230,
            lastMaintenance: '2024-01-15',
            nextMaintenance: '2024-04-15',
            currentLocation: {
              lat: -23.5505,
              lng: -46.6333,
              address: 'Centro, São Paulo'
            },
            driver: null,
            currentRide: null
          },
          {
            id: 2,
            plate: 'AMB-002',
            model: 'Fiat Ducato',
            year: 2021,
            type: 'ambulancia_utx',
            status: 'in_use',
            fuelLevel: 62,
            mileage: 67840,
            lastMaintenance: '2023-12-20',
            nextMaintenance: '2024-03-20',
            currentLocation: {
              lat: -23.5489,
              lng: -46.6388,
              address: 'Vila Madalena, São Paulo'
            },
            driver: { id: 1, name: 'Pedro Costa' },
            currentRide: { id: 1, number: 'C-2024-0001' }
          },
          {
            id: 3,
            plate: 'AMB-003',
            model: 'Renault Master',
            year: 2020,
            type: 'ambulancia_basica',
            status: 'maintenance',
            fuelLevel: 45,
            mileage: 89125,
            lastMaintenance: '2024-01-20',
            nextMaintenance: '2024-01-25',
            currentLocation: {
              lat: -23.5577,
              lng: -46.6566,
              address: 'Oficina Central'
            },
            driver: null,
            currentRide: null
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      in_use: 'primary',
      maintenance: 'warning',
      unavailable: 'error'
    };
    return colors[status] || 'default';
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <AvailableIcon />;
      case 'in_use':
        return <DirectionsCar />;
      case 'maintenance':
        return <MaintenanceIcon />;
      case 'unavailable':
        return <UnavailableIcon />;
      default:
        return <DirectionsCar />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      ambulancia_basica: 'Ambulância Básica',
      ambulancia_utx: 'UTI Móvel',
      ambulancia_resgate: 'Resgate'
    };
    return labels[type] || type;
  };

  const getFuelLevelColor = (level) => {
    if (level >= 70) return 'success';
    if (level >= 30) return 'warning';
    return 'error';
  };

  const isMaintenanceDue = (nextMaintenance) => {
    const next = new Date(nextMaintenance);
    const today = new Date();
    const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const handleCreateVehicle = () => {
    setDialogMode('create');
    setSelectedVehicle(null);
    setOpenDialog(true);
  };

  const handleEditVehicle = (vehicle) => {
    setDialogMode('edit');
    setSelectedVehicle(vehicle);
    setOpenDialog(true);
  };

  const handleViewVehicle = (vehicle) => {
    setDialogMode('view');
    setSelectedVehicle(vehicle);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedVehicle(null);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = 
      vehicle.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return <LoadingSpinner size={60} />;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Gestão de Veículos
          </Typography>
          
          {hasPermission('admin_access') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateVehicle}
              size="large"
            >
              Novo Veículo
            </Button>
          )}
        </Box>

        {/* Filtros */}
        <Card sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por placa ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="available">Disponível</MenuItem>
                  <MenuItem value="in_use">Em Uso</MenuItem>
                  <MenuItem value="maintenance">Manutenção</MenuItem>
                  <MenuItem value="unavailable">Indisponível</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadVehicles}
              >
                Atualizar
              </Button>
            </Grid>
          </Grid>
        </Card>
      </Box>

      {/* Cards de Veículos */}
      <Grid container spacing={3}>
        {filteredVehicles.map((vehicle) => (
          <Grid item xs={12} sm={6} lg={4} key={vehicle.id}>
            <Card
              sx={{
                height: '100%',
                border: vehicle.status === 'in_use' ? '2px solid' : '1px solid',
                borderColor: vehicle.status === 'in_use' ? 'primary.main' : 'divider',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent>
                {/* Header do Card */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{
                        bgcolor: getStatusColor(vehicle.status) + '.main',
                        mr: 2,
                        width: 48,
                        height: 48
                      }}
                    >
                      {getStatusIcon(vehicle.status)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {vehicle.plate}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.model} • {vehicle.year}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Chip
                    label={getStatusLabel(vehicle.status)}
                    color={getStatusColor(vehicle.status)}
                    size="small"
                  />
                </Box>

                {/* Informações do Veículo */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Tipo: {getTypeLabel(vehicle.type)}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Quilometragem: {vehicle.mileage.toLocaleString()} km
                  </Typography>
                  
                  {vehicle.currentLocation && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {vehicle.currentLocation.address}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Nível de Combustível */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Combustível
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {vehicle.fuelLevel}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={vehicle.fuelLevel}
                    color={getFuelLevelColor(vehicle.fuelLevel)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {/* Informações da Corrida Atual */}
                {vehicle.currentRide && vehicle.driver && (
                  <Box
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      bgcolor: 'primary.50',
                      mb: 2
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium" color="primary">
                      Em corrida: {vehicle.currentRide.number}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Motorista: {vehicle.driver.name}
                    </Typography>
                  </Box>
                )}

                {/* Manutenção */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Última manutenção: {formatDate(vehicle.lastMaintenance)}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color={isMaintenanceDue(vehicle.nextMaintenance) ? 'error.main' : 'text.secondary'}
                    fontWeight={isMaintenanceDue(vehicle.nextMaintenance) ? 'bold' : 'normal'}
                  >
                    Próxima manutenção: {formatDate(vehicle.nextMaintenance)}
                    {isMaintenanceDue(vehicle.nextMaintenance) && ' (Próxima!)'}
                  </Typography>
                </Box>

                {/* Ações */}
                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                  <Tooltip title="Visualizar">
                    <IconButton size="small" onClick={() => handleViewVehicle(vehicle)}>
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {hasPermission('admin_access') && (
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleEditVehicle(vehicle)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {vehicle.status === 'available' && (
                    <Button size="small" variant="outlined" fullWidth>
                      Designar
                    </Button>
                  )}
                  
                  {vehicle.status === 'maintenance' && (
                    <Button size="small" variant="outlined" color="success" fullWidth>
                      Liberar
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog para Criar/Editar/Visualizar Veículo */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Novo Veículo'}
          {dialogMode === 'edit' && 'Editar Veículo'}
          {dialogMode === 'view' && 'Detalhes do Veículo'}
        </DialogTitle>
        
        <DialogContent>
          {/* TODO: Implementar formulário completo */}
          <Typography variant="body1" sx={{ py: 2 }}>
            Formulário de {dialogMode === 'create' ? 'cadastro' : 
                         dialogMode === 'edit' ? 'edição' : 'visualização'} do veículo
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Fechar' : 'Cancelar'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" onClick={handleCloseDialog}>
              {dialogMode === 'create' ? 'Cadastrar' : 'Salvar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VehiclesPage;