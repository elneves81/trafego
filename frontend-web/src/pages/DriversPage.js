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
  Person,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as OnlineIcon,
  Cancel as OfflineIcon
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const DriversPage = () => {
  const { hasPermission } = useAuth();
  const { onlineUsers } = useSocket();
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [dialogMode, setDialogMode] = useState('create');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      setLoading(true);
      
      // TODO: Implementar chamada real para a API
      setTimeout(() => {
        setDrivers([
          {
            id: 1,
            name: 'Pedro Costa',
            email: 'pedro.costa@saude.gov.br',
            phone: '(11) 99999-1111',
            licenseNumber: '123456789',
            licenseCategory: 'D',
            licenseExpiry: '2025-06-15',
            status: 'active',
            currentVehicle: { id: 2, plate: 'AMB-002' },
            currentRide: { id: 1, number: 'C-2024-0001' },
            totalRides: 245,
            avgRating: 4.8,
            joinedAt: '2023-01-15',
            lastActivity: new Date().toISOString()
          },
          {
            id: 2,
            name: 'Carlos Mendes',
            email: 'carlos.mendes@saude.gov.br',
            phone: '(11) 99999-2222',
            licenseNumber: '987654321',
            licenseCategory: 'D',
            licenseExpiry: '2024-12-20',
            status: 'active',
            currentVehicle: null,
            currentRide: null,
            totalRides: 187,
            avgRating: 4.6,
            joinedAt: '2023-03-10',
            lastActivity: new Date(Date.now() - 1800000).toISOString()
          },
          {
            id: 3,
            name: 'Ana Silva',
            email: 'ana.silva@saude.gov.br',
            phone: '(11) 99999-3333',
            licenseNumber: '456789123',
            licenseCategory: 'D',
            licenseExpiry: '2024-08-30',
            status: 'inactive',
            currentVehicle: null,
            currentRide: null,
            totalRides: 156,
            avgRating: 4.9,
            joinedAt: '2022-11-05',
            lastActivity: new Date(Date.now() - 86400000).toISOString()
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar motoristas:', error);
      setLoading(false);
    }
  };

  const isDriverOnline = (driverId) => {
    return onlineUsers.some(user => user.id === driverId && user.role === 'driver');
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      suspended: 'error'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: 'Ativo',
      inactive: 'Inativo',
      suspended: 'Suspenso'
    };
    return labels[status] || status;
  };

  const isLicenseExpiringSoon = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const handleCreateDriver = () => {
    setDialogMode('create');
    setSelectedDriver(null);
    setOpenDialog(true);
  };

  const handleEditDriver = (driver) => {
    setDialogMode('edit');
    setSelectedDriver(driver);
    setOpenDialog(true);
  };

  const handleViewDriver = (driver) => {
    setDialogMode('view');
    setSelectedDriver(driver);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDriver(null);
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatLastActivity = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`;
    return `${Math.floor(diffMinutes / 1440)} dias atrás`;
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
            Gestão de Motoristas
          </Typography>
          
          {hasPermission('admin_access') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateDriver}
              size="large"
            >
              Novo Motorista
            </Button>
          )}
        </Box>

        {/* Filtros */}
        <Card sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por nome, email ou telefone..."
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
                  <MenuItem value="active">Ativo</MenuItem>
                  <MenuItem value="inactive">Inativo</MenuItem>
                  <MenuItem value="suspended">Suspenso</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadDrivers}
              >
                Atualizar
              </Button>
            </Grid>
          </Grid>
        </Card>
      </Box>

      {/* Tabela de Motoristas */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Motorista</TableCell>
                <TableCell>Contato</TableCell>
                <TableCell>CNH</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Situação Atual</TableCell>
                <TableCell>Estatísticas</TableCell>
                <TableCell>Última Atividade</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {driver.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {driver.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {isDriverOnline(driver.id) ? (
                            <OnlineIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                          ) : (
                            <OfflineIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {isDriverOnline(driver.id) ? 'Online' : 'Offline'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <EmailIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {driver.email}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {driver.phone}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {driver.licenseNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Categoria {driver.licenseCategory}
                      </Typography>
                      <br />
                      <Typography 
                        variant="caption" 
                        color={isLicenseExpiringSoon(driver.licenseExpiry) ? 'error.main' : 'text.secondary'}
                        fontWeight={isLicenseExpiringSoon(driver.licenseExpiry) ? 'bold' : 'normal'}
                      >
                        Vence: {formatDate(driver.licenseExpiry)}
                        {isLicenseExpiringSoon(driver.licenseExpiry) && ' (Vencendo!)'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={getStatusLabel(driver.status)}
                      color={getStatusColor(driver.status)}
                      size="small"
                    />
                  </TableCell>
                  
                  <TableCell>
                    {driver.currentRide ? (
                      <Box>
                        <Chip label="Em corrida" color="primary" size="small" />
                        <Typography variant="caption" color="text.secondary" display="block">
                          {driver.currentRide.number}
                        </Typography>
                        {driver.currentVehicle && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {driver.currentVehicle.plate}
                          </Typography>
                        )}
                      </Box>
                    ) : driver.currentVehicle ? (
                      <Box>
                        <Chip label="Disponível" color="success" size="small" />
                        <Typography variant="caption" color="text.secondary" display="block">
                          {driver.currentVehicle.plate}
                        </Typography>
                      </Box>
                    ) : (
                      <Chip label="Sem veículo" color="default" size="small" />
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {driver.totalRides} corridas
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Avaliação: {driver.avgRating.toFixed(1)} ★
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {formatLastActivity(driver.lastActivity)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Visualizar">
                        <IconButton size="small" onClick={() => handleViewDriver(driver)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {hasPermission('admin_access') && (
                        <Tooltip title="Editar">
                          <IconButton size="small" onClick={() => handleEditDriver(driver)}>
                            <EditIcon fontSize="small" />
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

      {/* Dialog para Criar/Editar/Visualizar Motorista */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'create' && 'Novo Motorista'}
          {dialogMode === 'edit' && 'Editar Motorista'}
          {dialogMode === 'view' && 'Detalhes do Motorista'}
        </DialogTitle>
        
        <DialogContent>
          {/* TODO: Implementar formulário completo */}
          <Typography variant="body1" sx={{ py: 2 }}>
            Formulário de {dialogMode === 'create' ? 'cadastro' : 
                         dialogMode === 'edit' ? 'edição' : 'visualização'} do motorista
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

export default DriversPage;