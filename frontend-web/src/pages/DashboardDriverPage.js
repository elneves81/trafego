import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Divider
} from '@mui/material';
import {
  LocalHospital,
  PlayArrow,
  Stop,
  LocationOn,
  Chat,
  CheckCircle,
  Cancel,
  Navigation,
  Phone,
  LocalHospital as Emergency,
  Send,
  MyLocation
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketCompatibility';

const DashboardDriverPage = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  // Estados
  const [availableRides, setAvailableRides] = useState([]);
  const [currentRide, setCurrentRide] = useState(null);
  const [rideHistory, setRideHistory] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Estados do veículo
  const [vehicleStatus, setVehicleStatus] = useState('disponivel');
  const [shift, setShift] = useState('ativo');

  // Dados simulados para demonstração
  useEffect(() => {
    setAvailableRides([
      {
        id: 1,
        patient: 'José Silva',
        origin: 'Rua das Flores, 123 - Centro',
        destination: 'Hospital Regional',
        priority: 'emergency',
        distance: '2.5 km',
        estimatedTime: '8 min',
        description: 'Idoso com dificuldades respiratórias',
        assignedAt: new Date()
      },
      {
        id: 2,
        patient: 'Maria Santos',
        origin: 'Av. Brasil, 456 - Vila Nova', 
        destination: 'Hospital Municipal',
        priority: 'urgent',
        distance: '1.8 km',
        estimatedTime: '6 min',
        description: 'Mulher grávida com contrações',
        assignedAt: new Date(Date.now() - 300000)
      }
    ]);

    setRideHistory([
      {
        id: 'hist1',
        patient: 'Pedro Costa',
        origin: 'Rua A, 100',
        destination: 'Hospital Regional',
        completedAt: new Date(Date.now() - 3600000),
        duration: '45 min',
        status: 'concluida'
      }
    ]);
  }, []);

  // Geolocalização
  useEffect(() => {
    if (navigator.geolocation && locationEnabled) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setCurrentLocation(location);
          
          // Enviar localização via socket
          if (socket) {
            socket.emit('location_update', {
              userId: user.id,
              location: location,
              timestamp: new Date()
            });
          }
        },
        (error) => {
          console.error('Erro de geolocalização:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [locationEnabled, socket, user.id]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('ride_assigned', (ride) => {
      setAvailableRides(prev => [ride, ...prev]);
    });

    socket.on('chat_message', (message) => {
      setChatHistory(prev => [...prev, message]);
    });

    socket.on('ride_cancelled', (rideId) => {
      setAvailableRides(prev => prev.filter(r => r.id !== rideId));
      if (currentRide && currentRide.id === rideId) {
        setCurrentRide(null);
      }
    });

    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('ride_assigned');
        socket.off('chat_message');
        socket.off('ride_cancelled');
      }
    };
  }, [socket, currentRide]);

  const acceptRide = (ride) => {
    setCurrentRide({
      ...ride,
      status: 'aceita',
      acceptedAt: new Date()
    });
    setAvailableRides(prev => prev.filter(r => r.id !== ride.id));
    
    if (socket) {
      socket.emit('ride_accepted', {
        rideId: ride.id,
        driverId: user.id,
        acceptedAt: new Date()
      });
    }
  };

  const rejectRide = (rideId) => {
    setAvailableRides(prev => prev.filter(r => r.id !== rideId));
    
    if (socket) {
      socket.emit('ride_rejected', {
        rideId: rideId,
        driverId: user.id,
        rejectedAt: new Date()
      });
    }
  };

  const updateRideStatus = (status) => {
    if (currentRide) {
      const updatedRide = {
        ...currentRide,
        status: status,
        [`${status}At`]: new Date()
      };
      setCurrentRide(updatedRide);

      if (socket) {
        socket.emit('ride_status_update', updatedRide);
      }

      if (status === 'concluida') {
        setRideHistory(prev => [updatedRide, ...prev]);
        setCurrentRide(null);
      }
    }
  };

  const openChat = () => {
    setChatOpen(true);
    // Carregar histórico do chat
    setChatHistory([
      { sender: 'Central', message: 'Corrida atribuída. Confirme o recebimento.', time: new Date() },
      { sender: user.name, message: 'Corrida recebida, a caminho do local', time: new Date() }
    ]);
  };

  const sendChatMessage = () => {
    if (chatMessage.trim()) {
      const message = {
        sender: user.name,
        recipient: 'Central',
        message: chatMessage.trim(),
        time: new Date()
      };

      setChatHistory(prev => [...prev, message]);
      setChatMessage('');

      if (socket) {
        socket.emit('send_message', message);
      }
    }
  };

  const toggleLocation = () => {
    setLocationEnabled(!locationEnabled);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return 'error';
      case 'urgent': return 'warning';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Painel do Motorista
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6" color="text.secondary">
            {user?.name} | Turno: {shift}
          </Typography>
          <Chip 
            label={isConnected ? 'Online' : 'Offline'} 
            color={isConnected ? 'success' : 'error'}
            size="small"
          />
          <Chip 
            label={vehicleStatus === 'disponivel' ? 'Disponível' : 'Ocupado'} 
            color={vehicleStatus === 'disponivel' ? 'success' : 'warning'}
            size="small"
          />
          <Button
            variant={locationEnabled ? 'contained' : 'outlined'}
            size="small"
            startIcon={<MyLocation />}
            onClick={toggleLocation}
            color={locationEnabled ? 'success' : 'default'}
          >
            GPS {locationEnabled ? 'Ativo' : 'Inativo'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Corrida Atual */}
        {currentRide && (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalHospital sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" color="primary">
                    Corrida em Andamento
                  </Typography>
                  <Chip 
                    label={currentRide.priority === 'emergency' ? 'EMERGÊNCIA' : 'URGENTE'} 
                    color={getPriorityColor(currentRide.priority)}
                    size="small" 
                    sx={{ ml: 2 }}
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      Paciente: {currentRide.patient}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      📍 Origem: {currentRide.origin}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      🏥 Destino: {currentRide.destination}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {currentRide.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {currentRide.status} | Distância: {currentRide.distance} | Tempo estimado: {currentRide.estimatedTime}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {currentRide.status === 'aceita' && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<PlayArrow />}
                          onClick={() => updateRideStatus('iniciada')}
                          fullWidth
                        >
                          Iniciar Corrida
                        </Button>
                      )}
                      
                      {currentRide.status === 'iniciada' && (
                        <>
                          <Button
                            variant="contained"
                            color="warning"
                            startIcon={<LocationOn />}
                            onClick={() => updateRideStatus('chegou_origem')}
                            fullWidth
                          >
                            Chegou no Local
                          </Button>
                        </>
                      )}

                      {currentRide.status === 'chegou_origem' && (
                        <Button
                          variant="contained"
                          color="info"
                          startIcon={<Emergency />}
                          onClick={() => updateRideStatus('paciente_embarcado')}
                          fullWidth
                        >
                          Paciente Embarcado
                        </Button>
                      )}

                      {currentRide.status === 'paciente_embarcado' && (
                        <>
                          <Button
                            variant="contained"
                            color="warning"
                            startIcon={<LocalHospital />}
                            onClick={() => updateRideStatus('chegou_destino')}
                            fullWidth
                          >
                            Chegou ao Hospital
                          </Button>
                        </>
                      )}

                      {currentRide.status === 'chegou_destino' && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => updateRideStatus('concluida')}
                          fullWidth
                        >
                          Concluir Corrida
                        </Button>
                      )}

                      <Button
                        variant="outlined"
                        startIcon={<Chat />}
                        onClick={openChat}
                        fullWidth
                      >
                        Chat com Central
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<Navigation />}
                        color="primary"
                        fullWidth
                      >
                        Abrir GPS
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Corridas Disponíveis */}
        {!currentRide && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Corridas Disponíveis ({availableRides.length})
                </Typography>

                {availableRides.length === 0 ? (
                  <Alert severity="info">
                    Nenhuma corrida disponível no momento. Mantenha-se conectado para receber novas solicitações.
                  </Alert>
                ) : (
                  <List>
                    {availableRides.map((ride) => (
                      <Paper key={ride.id} sx={{ mb: 2, p: 2 }} elevation={2}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6">
                                {ride.patient}
                              </Typography>
                              <Chip 
                                label={ride.priority === 'emergency' ? 'EMERGÊNCIA' : 'URGENTE'} 
                                color={getPriorityColor(ride.priority)}
                                size="small" 
                                sx={{ ml: 2 }}
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary">
                              📍 Origem: {ride.origin}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              🏥 Destino: {ride.destination}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {ride.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              📏 {ride.distance} | ⏱️ {ride.estimatedTime} | ⏰ Atribuída: {ride.assignedAt.toLocaleTimeString()}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => acceptRide(ride)}
                              >
                                Aceitar
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => rejectRide(ride.id)}
                              >
                                Recusar
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Histórico de Corridas */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Últimas Corridas
              </Typography>
              
              <List>
                {rideHistory.map((ride) => (
                  <ListItem key={ride.id} divider>
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          {ride.patient}
                        </Typography>
                        <Chip label="Concluída" color="success" size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {ride.origin} → {ride.destination}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Concluída em {ride.completedAt.toLocaleString()} | Duração: {ride.duration}
                      </Typography>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Chat Dialog */}
      <Dialog 
        open={chatOpen} 
        onClose={() => setChatOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          Chat com Central
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, height: 300, overflowY: 'auto' }}>
            {chatHistory.map((msg, index) => (
              <Box 
                key={index} 
                sx={{ 
                  mb: 1, 
                  display: 'flex', 
                  justifyContent: msg.sender === user.name ? 'flex-end' : 'flex-start' 
                }}
              >
                <Paper 
                  sx={{ 
                    p: 1, 
                    maxWidth: '70%',
                    bgcolor: msg.sender === user.name ? 'primary.main' : 'grey.100',
                    color: msg.sender === user.name ? 'white' : 'black'
                  }}
                >
                  <Typography variant="body2">
                    {msg.message}
                  </Typography>
                  <Typography variant="caption">
                    {msg.time.toLocaleTimeString()}
                  </Typography>
                </Paper>
              </Box>
            ))}
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Digite sua mensagem..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
            />
            <Button 
              variant="contained" 
              onClick={sendChatMessage}
              disabled={!chatMessage.trim()}
            >
              <Send />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DashboardDriverPage;