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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  Fab,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Cancel as CancelIcon,
  PlayArrow as StartIcon,
  Stop as FinishIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketCompatibility';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const RidesPage = () => {
  const { hasPermission } = useAuth();
  const { connected } = useSocket();
  
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  const [dialogMode, setDialogMode] = useState('create'); // create, edit, view
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dados simulados para demonstração
  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      setLoading(true);
      
      // TODO: Implementar chamada real para a API
      setTimeout(() => {
        setRides([
          {
            id: 1,
            rideNumber: 'C-2024-0001',
            patient: 'Maria Santos',
            origin: 'Residência - Rua das Flores, 123',
            destination: 'Hospital Central - Ala de Emergência',
            status: 'pending',
            priority: 'high',
            vehicle: null,
            driver: null,
            createdAt: new Date().toISOString(),
            estimatedDuration: 25,
            distance: 12.5
          },
          {
            id: 2,
            rideNumber: 'C-2024-0002',
            patient: 'João Silva',
            origin: 'UPA Norte',
            destination: 'Hospital São José',
            status: 'assigned',
            priority: 'medium',
            vehicle: { id: 1, plate: 'AMB-001', model: 'Sprinter' },
            driver: { id: 1, name: 'Pedro Costa' },
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            estimatedDuration: 35,
            distance: 18.2
          },
          {
            id: 3,
            rideNumber: 'C-2024-0003',
            patient: 'Ana Oliveira',
            origin: 'Clínica Santa Rita',
            destination: 'Hospital Regional',
            status: 'in_progress',
            priority: 'urgent',
            vehicle: { id: 2, plate: 'AMB-002', model: 'Ducato' },
            driver: { id: 2, name: 'Carlos Mendes' },
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            estimatedDuration: 30,
            distance: 15.8,
            startedAt: new Date(Date.now() - 1200000).toISOString()
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar corridas:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      assigned: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendente',
      assigned: 'Designada',
      in_progress: 'Em Andamento',
      completed: 'Concluída',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error',
      urgent: 'error'
    };
    return colors[priority] || 'default';
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      urgent: 'Urgente'
    };
    return labels[priority] || priority;
  };

  const handleCreateRide = () => {
    setDialogMode('create');
    setSelectedRide(null);
    setOpenDialog(true);
  };

  const handleEditRide = (ride) => {
    setDialogMode('edit');
    setSelectedRide(ride);
    setOpenDialog(true);
  };

  const handleViewRide = (ride) => {
    setDialogMode('view');
    setSelectedRide(ride);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedRide(null);
  };

  const filteredRides = rides.filter(ride => {
    const matchesSearch = 
      ride.rideNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ride.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const calculateDuration = (startedAt) => {
    if (!startedAt) return '-';
    const duration = Math.floor((Date.now() - new Date(startedAt)) / 60000);
    return `${duration} min`;
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
            Gestão de Corridas
          </Typography>
          
          {hasPermission('manage_rides') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateRide}
              size="large"
            >
              Nova Corrida
            </Button>
          )}
        </Box>

        {!connected && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Sistema desconectado. As informações podem não estar atualizadas.
          </Alert>
        )}

        {/* Filtros */}
        <Card sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por número, paciente ou endereço..."
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
                  <MenuItem value="pending">Pendente</MenuItem>
                  <MenuItem value="assigned">Designada</MenuItem>
                  <MenuItem value="in_progress">Em Andamento</MenuItem>
                  <MenuItem value="completed">Concluída</MenuItem>
                  <MenuItem value="cancelled">Cancelada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadRides}
              >
                Atualizar
              </Button>
            </Grid>
          </Grid>
        </Card>
      </Box>

      {/* Tabela de Corridas */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Paciente</TableCell>
                <TableCell>Origem → Destino</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>Veículo/Motorista</TableCell>
                <TableCell>Duração</TableCell>
                <TableCell>Criada em</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRides.map((ride) => (
                <TableRow key={ride.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {ride.rideNumber}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {ride.patient}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        <strong>De:</strong> {ride.origin}
                      </Typography>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        <strong>Para:</strong> {ride.destination}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ride.distance} km • ~{ride.estimatedDuration} min
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={getStatusLabel(ride.status)}
                      color={getStatusColor(ride.status)}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={getPriorityLabel(ride.priority)}
                      color={getPriorityColor(ride.priority)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    {ride.vehicle && ride.driver ? (
                      <Box>
                        <Typography variant="body2">
                          {ride.vehicle.plate} - {ride.vehicle.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ride.driver.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Não designado
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {ride.status === 'in_progress' ? 
                      calculateDuration(ride.startedAt) : 
                      '-'
                    }
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {formatDateTime(ride.createdAt)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Visualizar">
                        <IconButton size="small" onClick={() => handleViewRide(ride)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {hasPermission('manage_rides') && ride.status === 'pending' && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleEditRide(ride)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      
                      {hasPermission('manage_rides') && ['pending', 'assigned'].includes(ride.status) && (
                        <Tooltip title="Cancelar">
                          <IconButton size="small" color="error">
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* FAB para Nova Corrida */}
      {hasPermission('manage_rides') && (
        <Fab
          color="primary"
          aria-label="Nova Corrida"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24
          }}
          onClick={handleCreateRide}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialog para Criar/Editar/Visualizar Corrida */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Nova Corrida'}
          {dialogMode === 'edit' && 'Editar Corrida'}
          {dialogMode === 'view' && 'Detalhes da Corrida'}
        </DialogTitle>
        
        <DialogContent>
          {/* TODO: Implementar formulário completo */}
          <Typography variant="body1" sx={{ py: 2 }}>
            Formulário de {dialogMode === 'create' ? 'criação' : 
                         dialogMode === 'edit' ? 'edição' : 'visualização'} da corrida
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Fechar' : 'Cancelar'}
          </Button>
          {dialogMode !== 'view' && (
            <Button variant="contained" onClick={handleCloseDialog}>
              {dialogMode === 'create' ? 'Criar' : 'Salvar'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RidesPage;