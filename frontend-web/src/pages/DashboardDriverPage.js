import React, { useState, useEffect, useCallback } from 'react';
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
import api from '../services/api';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados do veículo
  const [vehicleStatus, setVehicleStatus] = useState('disponivel');
  const [shift, setShift] = useState('ativo');

  // Carregar corridas disponíveis da API
  const loadAvailableRides = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/rides/available');
      setAvailableRides(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar corridas:', error);
      setError('Erro ao carregar corridas disponíveis');
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar corrida atual
  const loadCurrentRide = useCallback(async () => {
    try {
      const response = await api.get('/rides/current');
      setCurrentRide(response.data);
    } catch (error) {
      console.error('Erro ao carregar corrida atual:', error);
    }
  }, []);

  // Carregar histórico de corridas
  const loadRideHistory = useCallback(async () => {
    try {
      const response = await api.get('/rides/history');
      setRideHistory(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    if (user) {
      loadAvailableRides();
      loadCurrentRide();
      loadRideHistory();
    }
  }, [user, loadAvailableRides, loadCurrentRide, loadRideHistory]);

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
    if (!socket || !user) return;

    console.log('🔌 Driver WebSocket conectado para:', user.email);

    // Registrar como motorista online
    socket.emit('driver_online', {
      userId: user.id,
      name: user.name,
      email: user.email,
      status: vehicleStatus,
      location: currentLocation
    });

    // Escutar nova corrida atribuída
    socket.on('ride_assigned', (ride) => {
      console.log('🚨 Nova corrida recebida:', ride);
      setAvailableRides(prev => {
        const exists = prev.find(r => r.id === ride.id);
        if (exists) return prev;
        return [ride, ...prev];
      });
      
      // Notificação sonora/visual
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Nova Corrida!', {
          body: `Paciente: ${ride.patientName || 'N/I'}\nDestino: ${ride.destination}`,
          icon: '/favicon.ico'
        });
      }
    });

    // Escutar mensagens do chat
    socket.on('chat_message', (message) => {
      setChatHistory(prev => [...prev, message]);
    });

    // Escutar cancelamento de corrida
    socket.on('ride_cancelled', (rideId) => {
      console.log('❌ Corrida cancelada:', rideId);
      setAvailableRides(prev => prev.filter(r => r.id !== rideId));
      if (currentRide?.id === rideId) {
        setCurrentRide(null);
      }
    });

    // Escutar atualização de status
    socket.on('status_update', (data) => {
      console.log('📊 Atualização de status:', data);
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.emit('driver_offline', { userId: user.id });
        socket.off('ride_assigned');
        socket.off('chat_message');
        socket.off('ride_cancelled');
        socket.off('status_update');
      }
    };
  }, [socket, user, vehicleStatus, currentLocation]);

  // Aceitar corrida
  const acceptRide = async (ride) => {
    try {
      setLoading(true);
      
      const response = await api.post(`/rides/${ride.id}/accept`, {
        driverId: user.id,
        acceptedAt: new Date().toISOString(),
        location: currentLocation
      });

      const acceptedRide = response.data;
      setCurrentRide(acceptedRide);
      setAvailableRides(prev => prev.filter(r => r.id !== ride.id));
      
      // Notificar via WebSocket
      if (socket) {
        socket.emit('ride_accepted', {
          rideId: ride.id,
          driverId: user.id,
          driverName: user.name,
          acceptedAt: new Date().toISOString(),
          location: currentLocation
        });
      }

      console.log('✅ Corrida aceita:', acceptedRide);
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
      setError('Erro ao aceitar corrida. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Rejeitar corrida
  const rejectRide = async (rideId) => {
    try {
      await api.post(`/rides/${rideId}/reject`, {
        driverId: user.id,
        rejectedAt: new Date().toISOString(),
        reason: 'Motorista rejeitou'
      });

      setAvailableRides(prev => prev.filter(r => r.id !== rideId));
      
      // Notificar via WebSocket
      if (socket) {
        socket.emit('ride_rejected', {
          rideId: rideId,
          driverId: user.id,
          driverName: user.name,
          rejectedAt: new Date().toISOString()
        });
      }

      console.log('❌ Corrida rejeitada:', rideId);
    } catch (error) {
      console.error('Erro ao rejeitar corrida:', error);
      setError('Erro ao rejeitar corrida.');
    }
  };

  // Atualizar status da corrida
  const updateRideStatus = async (status) => {
    if (!currentRide) return;

    try {
      setLoading(true);

      const response = await api.put(`/rides/${currentRide.id}/status`, {
        status: status,
        driverId: user.id,
        location: currentLocation,
        timestamp: new Date().toISOString()
      });

      const updatedRide = response.data;
      setCurrentRide(updatedRide);

      // Notificar via WebSocket
      if (socket) {
        socket.emit('ride_status_update', {
          rideId: currentRide.id,
          status: status,
          driverId: user.id,
          driverName: user.name,
          location: currentLocation,
          timestamp: new Date().toISOString()
        });
      }

      // Se concluída, mover para histórico
      if (status === 'concluida') {
        setRideHistory(prev => [updatedRide, ...prev]);
        setCurrentRide(null);
        loadAvailableRides(); // Recarregar corridas disponíveis
      }

      console.log('📊 Status atualizado:', status);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setError('Erro ao atualizar status da corrida.');
    } finally {
      setLoading(false);
    }
  };

  // Abrir chat e carregar histórico
  const openChat = async () => {
    setChatOpen(true);
    
    try {
      // Carregar histórico de mensagens
      const response = await api.get(`/messages/history?rideId=${currentRide?.id || 'general'}`);
      setChatHistory(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar chat:', error);
      // Usar dados de fallback
      setChatHistory([
        { 
          sender: 'Central', 
          message: 'Chat iniciado. Como posso ajudar?', 
          timestamp: new Date().toISOString(),
          type: 'system'
        }
      ]);
    }
  };

  // Enviar mensagem do chat
  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    try {
      const messageData = {
        senderId: user.id,
        senderName: user.name,
        senderType: 'driver',
        message: chatMessage.trim(),
        rideId: currentRide?.id || null,
        timestamp: new Date().toISOString()
      };

      // Enviar via API
      await api.post('/messages/send', messageData);

      // Adicionar à lista local
      setChatHistory(prev => [...prev, messageData]);
      setChatMessage('');

      // Enviar via WebSocket para tempo real
      if (socket) {
        socket.emit('chat_message', messageData);
      }

      console.log('💬 Mensagem enviada:', messageData);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setError('Erro ao enviar mensagem.');
    }
  };

  // Alternar localização GPS
  const toggleLocation = async () => {
    const newStatus = !locationEnabled;
    setLocationEnabled(newStatus);

    try {
      // Atualizar status no backend
      await api.put('/drivers/location-status', {
        enabled: newStatus,
        timestamp: new Date().toISOString()
      });

      // Notificar via WebSocket
      if (socket) {
        socket.emit('driver_location_status', {
          driverId: user.id,
          driverName: user.name,
          locationEnabled: newStatus,
          timestamp: new Date().toISOString()
        });
      }

      console.log(`📍 GPS ${newStatus ? 'ativado' : 'desativado'}`);
    } catch (error) {
      console.error('Erro ao atualizar status de localização:', error);
    }

    // Solicitar permissão de notificação se ativando GPS
    if (newStatus && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
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
            color={locationEnabled ? 'success' : 'inherit'}
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
              onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
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