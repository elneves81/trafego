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
  ListItemText,
  ListItemIcon,
  Chip,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
  Fab
} from '@mui/material';
import {
  LocalHospital,
  DirectionsCar,
  Phone,
  Chat,
  PlayArrow,
  Stop,
  LocationOn,
  Notifications,
  Schedule,
  LocalHospital as Emergency,
  Send,
  Add as AddIcon,
  Event as EventIcon,
  Assessment as ReportIcon,
  PersonAdd as BasicIcon
} from '@mui/icons-material';

// Import dos novos componentes
import EmergencyAttendance from '../components/operator/EmergencyAttendance';
import AttendanceList from '../components/operator/AttendanceList';
import AppointmentScheduling from '../components/operator/AppointmentScheduling';
import AppointmentList from '../components/operator/AppointmentList';
import BasicAttendance from '../components/operator/BasicAttendance';
import BasicAttendanceList from '../components/operator/BasicAttendanceList';
import TestAppointmentList from '../components/operator/TestAppointmentList';

import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketCompatibility';

const DashboardOperatorPage = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  // Estados
  const [currentTab, setCurrentTab] = useState(0);
  const [incomingCalls, setIncomingCalls] = useState([]);
  const [activeRides, setActiveRides] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showBasicAttendanceForm, setShowBasicAttendanceForm] = useState(false);
  const [refreshAttendances, setRefreshAttendances] = useState(0);

  // Dados simulados para demonstração
  useEffect(() => {
    setIncomingCalls([
      {
        id: 1,
        caller: 'José Silva',
        phone: '(47) 99999-1234',
        location: 'Rua das Flores, 123 - Centro',
        priority: 'emergency',
        time: new Date(),
        description: 'Idoso com dificuldades respiratórias'
      },
      {
        id: 2,
        caller: 'Maria Santos',
        phone: '(47) 88888-5678',
        location: 'Av. Brasil, 456 - Vila Nova',
        priority: 'urgent',
        time: new Date(Date.now() - 300000),
        description: 'Mulher grávida com contrações'
      }
    ]);

    setActiveRides([
      {
        id: 1,
        driver: 'João Silva',
        vehicle: 'AMB-001',
        patient: 'Pedro Costa',
        origin: 'Rua A, 100',
        destination: 'Hospital Regional',
        status: 'em_andamento',
        startTime: new Date(Date.now() - 900000)
      }
    ]);

    setAvailableVehicles([
      { id: 1, code: 'AMB-001', driver: 'João Silva', status: 'disponivel', location: 'Base Central' },
      { id: 2, code: 'AMB-002', driver: 'Pedro Santos', status: 'disponivel', location: 'Base Norte' },
      { id: 3, code: 'AMB-003', driver: 'Carlos Lima', status: 'manutencao', location: 'Oficina' }
    ]);
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('new_call', (call) => {
      setIncomingCalls(prev => [call, ...prev]);
    });

    socket.on('ride_update', (ride) => {
      setActiveRides(prev => prev.map(r => r.id === ride.id ? ride : r));
    });

    socket.on('chat_message', (message) => {
      setChatHistory(prev => [...prev, message]);
    });

    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('new_call');
        socket.off('ride_update');
        socket.off('chat_message');
      }
    };
  }, [socket]);

  const handleAssignRide = (callId, vehicleId) => {
    const call = incomingCalls.find(c => c.id === callId);
    const vehicle = availableVehicles.find(v => v.id === vehicleId);
    
    if (call && vehicle) {
      const newRide = {
        id: Date.now(),
        driver: vehicle.driver,
        vehicle: vehicle.code,
        patient: call.caller,
        origin: call.location,
        destination: 'Hospital Regional',
        status: 'aguardando_aceite',
        callId: call.id
      };

      setActiveRides(prev => [...prev, newRide]);
      setIncomingCalls(prev => prev.filter(c => c.id !== callId));
      
      // Emitir via socket
      if (socket) {
        socket.emit('assign_ride', newRide);
      }
    }
  };

  const openChat = (driver) => {
    setSelectedDriver(driver);
    setChatOpen(true);
    // Carregar histórico do chat
    setChatHistory([
      { sender: driver, message: 'Estou a caminho do local', time: new Date() },
      { sender: 'Central', message: 'Ok, mantenha contato', time: new Date() }
    ]);
  };

  const sendChatMessage = () => {
    if (chatMessage.trim() && selectedDriver) {
      const message = {
        sender: 'Central',
        recipient: selectedDriver,
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'emergency': return 'error';
      case 'urgent': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'disponivel': return 'success';
      case 'ocupado': return 'warning';
      case 'manutencao': return 'error';
      default: return 'default';
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return renderDashboardOverview();
      case 1:
        return showEmergencyForm ? <EmergencyAttendance /> : <AttendanceList />;
      case 2:
        return showBasicAttendanceForm ? (
          <BasicAttendance 
            onSuccess={() => {
              setShowBasicAttendanceForm(false);
              setRefreshAttendances(prev => prev + 1); // Força refresh da lista
              setCurrentTab(1); // Redireciona para aba de corridas
            }}
          />
        ) : renderBasicAttendanceList();
      case 3:
        return showAppointmentForm ? <AppointmentScheduling /> : renderAppointmentList();
      case 4:
        return renderReports();
      default:
        return renderDashboardOverview();
    }
  };

  const renderDashboardOverview = () => (
    <Grid container spacing={3}>
      {/* Chamadas Pendentes */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Phone sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6">
                Chamadas Pendentes
                <Badge badgeContent={incomingCalls.length} color="error" sx={{ ml: 1 }}>
                  <Notifications />
                </Badge>
              </Typography>
            </Box>

            <List>
              {incomingCalls.map((call) => (
                <Paper key={call.id} sx={{ mb: 1, p: 2 }} elevation={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {call.caller}
                        </Typography>
                        <Chip 
                          label={call.priority === 'emergency' ? 'EMERGÊNCIA' : 'URGENTE'} 
                          color={getPriorityColor(call.priority)}
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        📞 {call.phone}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📍 {call.location}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {call.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ⏰ {call.time.toLocaleTimeString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ ml: 2 }}>
                      {availableVehicles.filter(v => v.status === 'disponivel').map(vehicle => (
                        <Button
                          key={vehicle.id}
                          variant="contained"
                          size="small"
                          sx={{ mb: 1, display: 'block' }}
                          onClick={() => handleAssignRide(call.id, vehicle.id)}
                        >
                          {vehicle.code}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Corridas Ativas */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DirectionsCar sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">
                Corridas Ativas ({activeRides.length})
              </Typography>
            </Box>

            <List>
              {activeRides.map((ride) => (
                <Paper key={ride.id} sx={{ mb: 1, p: 2 }} elevation={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {ride.vehicle} - {ride.driver}
                        </Typography>
                        <Chip 
                          label={ride.status.replace('_', ' ').toUpperCase()} 
                          color="primary"
                          size="small" 
                          sx={{ ml: 1 }}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary">
                        👤 Paciente: {ride.patient}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        📍 Origem: {ride.origin}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        🏥 Destino: {ride.destination}
                      </Typography>
                      {ride.startTime && (
                        <Typography variant="caption" color="text.secondary">
                          ⏰ Iniciado: {ride.startTime.toLocaleTimeString()}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ ml: 2 }}>
                      <IconButton 
                        color="primary" 
                        onClick={() => openChat(ride.driver)}
                      >
                        <Chat />
                      </IconButton>
                      <IconButton color="success">
                        <LocationOn />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Veículos Disponíveis */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Status da Frota
            </Typography>
            
            <Grid container spacing={2}>
              {availableVehicles.map((vehicle) => (
                <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                  <Paper sx={{ p: 2 }} elevation={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {vehicle.code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.driver}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📍 {vehicle.location}
                        </Typography>
                      </Box>
                      <Chip 
                        label={vehicle.status.toUpperCase()} 
                        color={getStatusColor(vehicle.status)}
                        size="small"
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderBasicAttendanceList = () => <BasicAttendanceList key={refreshAttendances} />;

  const renderAppointmentList = () => <AppointmentList />;

  const renderReports = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Relatórios e Estatísticas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Relatórios de atendimentos e agendamentos serão implementados aqui.
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Central de Operações - Gestor/Atendente
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Bem-vindo(a), {user?.name} | Status: {isConnected ? 'Conectado' : 'Desconectado'}
        </Typography>
      </Paper>

      {/* Navigation Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            icon={<LocalHospital />} 
            label="Painel Geral" 
          />
          <Tab 
            icon={<Emergency />} 
            label="Atendimentos de Emergência" 
          />
          <Tab 
            icon={<BasicIcon />} 
            label="Atendimento Básico" 
          />
          <Tab 
            icon={<EventIcon />} 
            label="Agendamentos" 
          />
          <Tab 
            icon={<ReportIcon />} 
            label="Relatórios" 
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ p: 3 }}>
        {renderTabContent()}
      </Box>

      {/* Floating Action Buttons */}
      {currentTab === 1 && (
        <Fab
          color="error"
          aria-label="nova emergência"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowEmergencyForm(!showEmergencyForm)}
        >
          <AddIcon />
        </Fab>
      )}

      {currentTab === 2 && (
        <Fab
          color="info"
          aria-label="novo atendimento básico"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowBasicAttendanceForm(!showBasicAttendanceForm)}
        >
          <AddIcon />
        </Fab>
      )}

      {currentTab === 3 && (
        <Fab
          color="primary"
          aria-label="novo agendamento"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowAppointmentForm(!showAppointmentForm)}
        >
          <AddIcon />
        </Fab>
      )}

      <Grid container spacing={3}>
        {/* Chamadas Pendentes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Phone sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">
                  Chamadas Pendentes
                  <Badge badgeContent={incomingCalls.length} color="error" sx={{ ml: 1 }}>
                    <Notifications />
                  </Badge>
                </Typography>
              </Box>

              <List>
                {incomingCalls.map((call) => (
                  <Paper key={call.id} sx={{ mb: 1, p: 2 }} elevation={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {call.caller}
                          </Typography>
                          <Chip 
                            label={call.priority === 'emergency' ? 'EMERGÊNCIA' : 'URGENTE'} 
                            color={getPriorityColor(call.priority)}
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          📞 {call.phone}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📍 {call.location}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {call.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ⏰ {call.time.toLocaleTimeString()}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ ml: 2 }}>
                        {availableVehicles.filter(v => v.status === 'disponivel').map(vehicle => (
                          <Button
                            key={vehicle.id}
                            variant="contained"
                            size="small"
                            sx={{ mb: 1, display: 'block' }}
                            onClick={() => handleAssignRide(call.id, vehicle.id)}
                          >
                            {vehicle.code}
                          </Button>
                        ))}
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Corridas Ativas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">
                  Corridas Ativas ({activeRides.length})
                </Typography>
              </Box>

              <List>
                {activeRides.map((ride) => (
                  <Paper key={ride.id} sx={{ mb: 1, p: 2 }} elevation={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {ride.vehicle} - {ride.driver}
                          </Typography>
                          <Chip 
                            label={ride.status.replace('_', ' ').toUpperCase()} 
                            color="primary"
                            size="small" 
                            sx={{ ml: 1 }}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          👤 Paciente: {ride.patient}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📍 Origem: {ride.origin}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          🏥 Destino: {ride.destination}
                        </Typography>
                        {ride.startTime && (
                          <Typography variant="caption" color="text.secondary">
                            ⏰ Iniciado: {ride.startTime.toLocaleTimeString()}
                          </Typography>
                        )}
                      </Box>
                      
                      <Box sx={{ ml: 2 }}>
                        <IconButton 
                          color="primary" 
                          onClick={() => openChat(ride.driver)}
                        >
                          <Chat />
                        </IconButton>
                        <IconButton color="success">
                          <LocationOn />
                        </IconButton>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Veículos Disponíveis */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status da Frota
              </Typography>
              
              <Grid container spacing={2}>
                {availableVehicles.map((vehicle) => (
                  <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                    <Paper sx={{ p: 2 }} elevation={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {vehicle.code}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {vehicle.driver}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            📍 {vehicle.location}
                          </Typography>
                        </Box>
                        <Chip 
                          label={vehicle.status.toUpperCase()} 
                          color={getStatusColor(vehicle.status)}
                          size="small"
                        />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
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
          Chat com {selectedDriver}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, height: 300, overflowY: 'auto' }}>
            {chatHistory.map((msg, index) => (
              <Box 
                key={index} 
                sx={{ 
                  mb: 1, 
                  display: 'flex', 
                  justifyContent: msg.sender === 'Central' ? 'flex-end' : 'flex-start' 
                }}
              >
                <Paper 
                  sx={{ 
                    p: 1, 
                    maxWidth: '70%',
                    bgcolor: msg.sender === 'Central' ? 'primary.main' : 'grey.100',
                    color: msg.sender === 'Central' ? 'white' : 'black'
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

export default DashboardOperatorPage;