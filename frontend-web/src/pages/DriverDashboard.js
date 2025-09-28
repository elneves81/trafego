import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Badge,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
  Notifications as NotificationIcon,
  Chat as ChatIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  CheckCircle as AvailableIcon,
  Cancel as UnavailableIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import DriverRideModal from '../components/driver/DriverRideModal';

const DriverDashboard = () => {
  // Estados
  const [driverStatus, setDriverStatus] = useState('available'); // available, busy, offline
  const [currentRide, setCurrentRide] = useState(null);
  const [pendingRides, setPendingRides] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  
  // Estados do modal
  const [rideModalOpen, setRideModalOpen] = useState(false);
  const [selectedRide, setSelectedRide] = useState(null);
  
  // Informações do motorista (normalmente viriam da API)
  const [driverInfo] = useState({
    id: 1,
    name: 'CARLOS SILVA SANTOS',
    licenseNumber: 'CNH123456789',
    phone: '(42) 99999-8888',
    vehicle: 'AMBULÂNCIA 01 - UTI MÓVEL',
    vehiclePlate: 'ABC-1234',
    shift: 'Manhã (06:00 - 18:00)',
    zone: 'Zona Central'
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadPendingRides();
    loadRideHistory();
    loadNotifications();
    
    // Simular recebimento de nova corrida a cada 30 segundos
    const interval = setInterval(() => {
      if (driverStatus === 'available' && Math.random() > 0.7) {
        receiveNewRide();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [driverStatus]);

  const loadPendingRides = () => {
    // Simular corridas pendentes
    const mockRides = [
      {
        id: 1,
        caller: 'MARIA SANTOS',
        phone: '(42) 99111-2222',
        location: 'RUA XV DE NOVEMBRO, 234 - CENTRO',
        priority: 'emergency',
        time: new Date(),
        description: 'PACIENTE COM DORES NO PEITO E DIFICULDADE PARA RESPIRAR',
        attendanceNumber: 'ATD-2025-001',
        estimatedDistance: '2.5 km',
        estimatedTime: '8 min'
      }
    ];
    setPendingRides(mockRides);
  };

  const loadRideHistory = () => {
    // Simular histórico
    const mockHistory = [
      {
        id: 101,
        caller: 'JOÃO OLIVEIRA',
        location: 'AV. GETÚLIO VARGAS, 567',
        completedAt: new Date(Date.now() - 3600000), // 1 hora atrás
        status: 'completed',
        duration: '45 min'
      },
      {
        id: 102,
        caller: 'ANA COSTA',
        location: 'RUA CORONEL PIRES, 123',
        completedAt: new Date(Date.now() - 7200000), // 2 horas atrás
        status: 'completed',
        duration: '32 min'
      }
    ];
    setRideHistory(mockHistory);
  };

  const loadNotifications = () => {
    const mockNotifications = [
      {
        id: 1,
        type: 'new_ride',
        title: 'Nova corrida disponível',
        message: 'Corrida de alta prioridade aguardando confirmação',
        time: new Date(),
        read: false
      },
      {
        id: 2,
        type: 'system',
        title: 'Sistema atualizado',
        message: 'Nova versão do aplicativo disponível',
        time: new Date(Date.now() - 1800000),
        read: true
      }
    ];
    setNotifications(mockNotifications);
  };

  const receiveNewRide = () => {
    const newRide = {
      id: Date.now(),
      caller: 'PACIENTE URGENTE',
      phone: '(42) 99000-0000',
      location: 'LOCAL DE EMERGÊNCIA',
      priority: 'emergency',
      time: new Date(),
      description: 'NOVA EMERGÊNCIA MÉDICA',
      attendanceNumber: `ATD-${Date.now()}`,
      estimatedDistance: `${(Math.random() * 5 + 1).toFixed(1)} km`,
      estimatedTime: `${Math.floor(Math.random() * 15 + 5)} min`
    };
    
    setPendingRides(prev => [newRide, ...prev]);
    
    // Mostrar automaticamente o modal da nova corrida
    setSelectedRide(newRide);
    setRideModalOpen(true);
    
    // Adicionar notificação
    const notification = {
      id: Date.now(),
      type: 'new_ride',
      title: 'NOVA CORRIDA!',
      message: `${newRide.caller} - ${newRide.location}`,
      time: new Date(),
      read: false
    };
    setNotifications(prev => [notification, ...prev]);
  };

  const handleAcceptRide = (ride, vehicleData) => {
    console.log('Corrida aceita:', ride, vehicleData);
    
    // Remove da lista de pendentes
    setPendingRides(prev => prev.filter(r => r.id !== ride.id));
    
    // Define como corrida atual
    setCurrentRide({ ...ride, vehicleData, status: 'accepted' });
    setDriverStatus('busy');
    
    // Adicionar ao histórico
    setRideHistory(prev => [{
      ...ride,
      acceptedAt: new Date(),
      status: 'in_progress',
      vehicleData
    }, ...prev]);
  };

  const handleDeclineRide = (ride) => {
    console.log('Corrida recusada:', ride);
    
    // Remove da lista de pendentes
    setPendingRides(prev => prev.filter(r => r.id !== ride.id));
  };

  const toggleDriverStatus = () => {
    const newStatus = driverStatus === 'available' ? 'offline' : 'available';
    setDriverStatus(newStatus);
    
    if (newStatus === 'offline') {
      setCurrentRide(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available': return 'DISPONÍVEL';
      case 'busy': return 'EM CORRIDA';
      case 'offline': return 'OFFLINE';
      default: return 'DESCONHECIDO';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header do Motorista */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
        <Grid container alignItems="center" spacing={2}>
          <Grid item>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.dark' }}>
              <PersonIcon sx={{ fontSize: 32 }} />
            </Avatar>
          </Grid>
          <Grid item flex={1}>
            <Typography variant="h5" gutterBottom>
              {driverInfo.name}
            </Typography>
            <Typography variant="body2">
              {driverInfo.vehicle} • {driverInfo.vehiclePlate}
            </Typography>
            <Typography variant="body2">
              {driverInfo.shift} • {driverInfo.zone}
            </Typography>
          </Grid>
          <Grid item>
            <Box textAlign="center">
              <Chip 
                icon={driverStatus === 'available' ? <AvailableIcon /> : 
                      driverStatus === 'busy' ? <WarningIcon /> : <UnavailableIcon />}
                label={getStatusText(driverStatus)}
                color={getStatusColor(driverStatus)}
                variant="filled"
                sx={{ mb: 1, fontWeight: 'bold' }}
              />
              <Box>
                <Button 
                  variant="outlined" 
                  color="inherit"
                  onClick={toggleDriverStatus}
                  disabled={driverStatus === 'busy'}
                >
                  {driverStatus === 'available' ? 'Ficar Offline' : 'Ficar Disponível'}
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {/* Corrida Atual */}
        {currentRide && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'warning.light' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Corrida em Andamento
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography><strong>Paciente:</strong> {currentRide.caller}</Typography>
                    <Typography><strong>Local:</strong> {currentRide.location}</Typography>
                    <Typography><strong>Condição:</strong> {currentRide.description}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Button 
                      fullWidth 
                      variant="contained"
                      onClick={() => {
                        setSelectedRide(currentRide);
                        setRideModalOpen(true);
                      }}
                    >
                      Abrir Detalhes
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Corridas Pendentes */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NotificationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Corridas Pendentes
                {pendingRides.length > 0 && (
                  <Badge badgeContent={pendingRides.length} color="error" sx={{ ml: 2 }} />
                )}
              </Typography>
              
              {pendingRides.length === 0 ? (
                <Alert severity="info">
                  Nenhuma corrida pendente no momento. Status: {getStatusText(driverStatus)}
                </Alert>
              ) : (
                <List>
                  {pendingRides.map((ride) => (
                    <ListItem 
                      key={ride.id}
                      sx={{ 
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: ride.priority === 'emergency' ? 'error.light' : 'background.paper'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: ride.priority === 'emergency' ? 'error.main' : 'primary.main' }}>
                          {ride.priority === 'emergency' ? <WarningIcon /> : <PersonIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle1">
                              {ride.caller}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={ride.priority === 'emergency' ? 'EMERGÊNCIA' : 'ALTA'}
                              color={ride.priority === 'emergency' ? 'error' : 'warning'}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              📍 {ride.location}
                            </Typography>
                            <Typography variant="body2">
                              🏥 {ride.description}
                            </Typography>
                            <Typography variant="caption">
                              📞 {ride.phone} • ⏱️ {ride.time.toLocaleTimeString()} • 
                              🚗 {ride.estimatedDistance} • ⏰ {ride.estimatedTime}
                            </Typography>
                          </Box>
                        }
                      />
                      <Button
                        variant="contained"
                        color={ride.priority === 'emergency' ? 'error' : 'primary'}
                        onClick={() => {
                          setSelectedRide(ride);
                          setRideModalOpen(true);
                        }}
                        disabled={driverStatus !== 'available'}
                      >
                        Ver Detalhes
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Painel Lateral */}
        <Grid item xs={12} md={4}>
          {/* Estatísticas */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estatísticas do Dia
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">
                    {rideHistory.filter(r => r.status === 'completed').length}
                  </Typography>
                  <Typography variant="caption">
                    Corridas Completas
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="warning.main">
                    {pendingRides.length}
                  </Typography>
                  <Typography variant="caption">
                    Pendentes
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ChatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Notificações
              </Typography>
              
              {notifications.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Nenhuma notificação
                </Typography>
              ) : (
                <List dense>
                  {notifications.slice(0, 5).map((notification) => (
                    <ListItem key={notification.id} sx={{ pl: 0 }}>
                      <ListItemText
                        primary={notification.title}
                        secondary={notification.message}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: notification.read ? 'normal' : 'bold'
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Histórico Recente */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Histórico Recente
              </Typography>
              
              {rideHistory.length === 0 ? (
                <Alert severity="info">
                  Nenhuma corrida no histórico hoje
                </Alert>
              ) : (
                <List>
                  {rideHistory.slice(0, 5).map((ride) => (
                    <ListItem key={ride.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <AvailableIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={ride.caller}
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              📍 {ride.location}
                            </Typography>
                            <Typography variant="caption">
                              ✅ Concluída às {ride.completedAt?.toLocaleTimeString()} • 
                              ⏱️ Duração: {ride.duration}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        size="small" 
                        label={ride.status === 'completed' ? 'Concluída' : 'Em Andamento'}
                        color={ride.status === 'completed' ? 'success' : 'warning'}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modal de Corrida */}
      <DriverRideModal
        open={rideModalOpen}
        onClose={() => setRideModalOpen(false)}
        rideData={selectedRide}
        driverInfo={driverInfo}
        onAcceptRide={handleAcceptRide}
        onDeclineRide={handleDeclineRide}
      />
    </Box>
  );
};

export default DriverDashboard;