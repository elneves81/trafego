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
  const [drivers, setDrivers] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [showEmergencyForm, setShowEmergencyForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showBasicAttendanceForm, setShowBasicAttendanceForm] = useState(false);
  const [refreshAttendances, setRefreshAttendances] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar dados reais das APIs
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Carregar corridas ativas
      await loadActiveRides();
      
      // Carregar veículos/motoristas disponíveis
      await loadAvailableDrivers();
      
      // Carregar atendimentos pendentes
      await loadPendingAttendances();
      
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      setError('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveRides = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/rides/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const rides = await response.json();
        setActiveRides(Array.isArray(rides) ? rides : []);
        console.log('✅ Corridas ativas carregadas:', rides);
      } else {
        console.error('❌ Erro na API de corridas ativas:', response.status);
        setActiveRides([]); // Garantir array vazio
      }
    } catch (err) {
      console.error('❌ Erro ao carregar corridas ativas:', err);
      setActiveRides([]); // Garantir array vazio
    }
  };

  const loadAvailableDrivers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/drivers/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const driversData = await response.json();
        setDrivers(Array.isArray(driversData) ? driversData : []);
        
        // Converter para formato de veículos para compatibilidade
        const vehiclesData = (Array.isArray(driversData) ? driversData : []).map(driver => ({
          id: driver.id,
          code: driver.vehicle || `VEH-${driver.id}`,
          driver: driver.name,
          status: driver.status || 'disponivel',
          location: driver.location || 'Base Central',
          email: driver.email
        }));
        
        setAvailableVehicles(vehiclesData);
        console.log('✅ Motoristas disponíveis carregados:', driversData);
      } else {
        console.error('❌ Erro na API de motoristas:', response.status);
        setDrivers([]);
        setAvailableVehicles([]);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar motoristas:', err);
      setDrivers([]);
      setAvailableVehicles([]);
    }
  };

  const loadPendingAttendances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/attendances/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const attendances = await response.json();
        
        // Converter atendimentos para formato de chamadas
        const calls = (Array.isArray(attendances) ? attendances : []).map(att => ({
          id: att.id,
          caller: att.callerName || 'Nome não informado',
          phone: att.callerPhone || 'Telefone não informado',
          location: `${att.address || ''}, ${att.city || ''} - ${att.state || ''}`,
          priority: att.type === 'emergency' ? 'emergency' : 'normal',
          time: new Date(att.createdAt),
          description: att.description || 'Sem descrição',
          attendanceType: att.type
        }));
        
        setIncomingCalls(calls);
        console.log('✅ Atendimentos pendentes carregados:', calls);
      } else {
        console.error('❌ Erro na API de atendimentos pendentes:', response.status);
        setIncomingCalls([]);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar atendimentos pendentes:', err);
      setIncomingCalls([]);
    }
  };

  // Socket listeners para comunicação em tempo real
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log('🔌 Configurando listeners do WebSocket para operador');

    // Novo atendimento criado
    socket.on('new_attendance', (attendance) => {
      console.log('📞 Novo atendimento recebido:', attendance);
      const newCall = {
        id: attendance.id,
        caller: attendance.callerName || 'Nome não informado',
        phone: attendance.callerPhone || 'Telefone não informado',
        location: `${attendance.address || ''}, ${attendance.city || ''} - ${attendance.state || ''}`,
        priority: attendance.type === 'emergency' ? 'emergency' : 'normal',
        time: new Date(attendance.createdAt),
        description: attendance.description || 'Sem descrição',
        attendanceType: attendance.type
      };
      setIncomingCalls(prev => [newCall, ...prev]);
    });

    // Corrida aceita por motorista
    socket.on('ride_accepted', (data) => {
      console.log('✅ Corrida aceita por motorista:', data);
      setActiveRides(prev => [...prev, data.ride]);
      
      // Remover da lista de chamadas pendentes
      setIncomingCalls(prev => prev.filter(call => call.id !== data.attendanceId));
      
      // Atualizar status do motorista
      setAvailableVehicles(prev => prev.map(vehicle => 
        vehicle.email === data.driverEmail 
          ? { ...vehicle, status: 'ocupado' }
          : vehicle
      ));
    });

    // Corrida rejeitada por motorista
    socket.on('ride_rejected', (data) => {
      console.log('❌ Corrida rejeitada por motorista:', data);
      // Corrida volta para lista de pendentes (pode ser atribuída a outro motorista)
    });

    // Status da corrida atualizado
    socket.on('ride_status_update', (data) => {
      console.log('🔄 Status da corrida atualizado:', data);
      setActiveRides(prev => prev.map(ride => 
        ride.id === data.rideId 
          ? { ...ride, status: data.status, location: data.location }
          : ride
      ));
      
      // Se corrida foi finalizada, liberar motorista
      if (data.status === 'finalizada') {
        setAvailableVehicles(prev => prev.map(vehicle => 
          vehicle.email === data.driverEmail 
            ? { ...vehicle, status: 'disponivel' }
            : vehicle
        ));
      }
    });

    // Motorista ficou online/offline
    socket.on('driver_status_change', (data) => {
      console.log('👤 Status do motorista alterado:', data);
      setAvailableVehicles(prev => prev.map(vehicle => 
        vehicle.email === data.email 
          ? { ...vehicle, status: data.isOnline ? 'disponivel' : 'offline' }
          : vehicle
      ));
    });

    // Localização do motorista atualizada
    socket.on('location_update', (data) => {
      console.log('📍 Localização do motorista atualizada:', data);
      setAvailableVehicles(prev => prev.map(vehicle => 
        vehicle.email === data.email 
          ? { ...vehicle, location: data.address || 'Localização em tempo real' }
          : vehicle
      ));
    });

    // Mensagem de chat recebida
    socket.on('chat_message', (message) => {
      console.log('💬 Mensagem de chat recebida:', message);
      setChatHistory(prev => [...prev, message]);
    });

    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('new_attendance');
        socket.off('ride_accepted');
        socket.off('ride_rejected');
        socket.off('ride_status_update');
        socket.off('driver_status_change');
        socket.off('location_update');
        socket.off('chat_message');
      }
    };
  }, [socket, isConnected]);

  const handleAssignRide = async (callId, vehicleId) => {
    const call = incomingCalls.find(c => c.id === callId);
    const vehicle = availableVehicles.find(v => v.id === vehicleId);
    
    if (!call || !vehicle) {
      setError('Erro: Chamada ou veículo não encontrado');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/rides/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          attendanceId: callId,
          driverId: vehicleId,
          driverEmail: vehicle.email,
          priority: call.priority
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Corrida atribuída com sucesso:', result);
        
        // Emitir evento via WebSocket para notificar o motorista
        if (socket && isConnected) {
          socket.emit('assign_ride', {
            attendanceId: callId,
            driverEmail: vehicle.email,
            rideData: {
              id: result.rideId,
              patient: call.caller,
              origin: call.location,
              destination: 'A definir',
              priority: call.priority,
              description: call.description,
              phone: call.phone
            }
          });
        }
        
        // Atualizar UI localmente (o WebSocket confirmará depois)
        setIncomingCalls(prev => prev.filter(c => c.id !== callId));
        setAvailableVehicles(prev => prev.map(v => 
          v.id === vehicleId 
            ? { ...v, status: 'aguardando_confirmacao' }
            : v
        ));
        
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Erro ao atribuir corrida');
      }
      
    } catch (err) {
      console.error('❌ Erro ao atribuir corrida:', err);
      setError('Erro de comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (driver) => {
    setSelectedDriver(driver);
    setChatOpen(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/chat/history/${driver.email}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const history = await response.json();
        setChatHistory(history);
      } else {
        setChatHistory([
          { sender: driver.driver, message: 'Histórico não disponível', time: new Date() }
        ]);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar histórico do chat:', err);
      setChatHistory([
        { sender: driver.driver, message: 'Erro ao carregar histórico', time: new Date() }
      ]);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim() || !selectedDriver) return;

    const messageData = {
      sender: user.name || 'Central',
      senderType: 'operator',
      recipient: selectedDriver.email,
      recipientType: 'driver',
      message: chatMessage.trim(),
      time: new Date()
    };

    try {
      // Salvar mensagem na API
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        // Atualizar UI localmente
        setChatHistory(prev => [...prev, messageData]);
        setChatMessage('');

        // Enviar via WebSocket para tempo real
        if (socket && isConnected) {
          socket.emit('chat_message', messageData);
        }
      } else {
        console.error('❌ Erro ao enviar mensagem');
      }
    } catch (err) {
      console.error('❌ Erro ao enviar mensagem:', err);
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

  // Atualização periódica dos dados (a cada 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        loadActiveRides();
        loadAvailableDrivers();
        loadPendingAttendances();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [loading]);

  // Função para forçar atualização manual
  const refreshData = () => {
    loadInitialData();
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Central de Operações - Gestor/Atendente
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Bem-vindo(a), {user?.name}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {/* Status da Conexão WebSocket */}
            <Chip
              icon={isConnected ? <LocationOn /> : <Stop />}
              label={isConnected ? 'Conectado' : 'Desconectado'}
              color={isConnected ? 'success' : 'error'}
              variant="outlined"
            />
            
            {/* Quantidade de Motoristas Online */}
            <Chip
              icon={<DirectionsCar />}
              label={`${availableVehicles.filter(v => v.status === 'disponivel').length} Motoristas Disponíveis`}
              color="primary"
              variant="outlined"
            />
            
            {/* Botão de Refresh */}
            <Button
              variant="outlined"
              onClick={refreshData}
              disabled={loading}
              startIcon={loading ? <Stop /> : <PlayArrow />}
            >
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Button>
            
            {/* Chamadas Pendentes */}
            <Badge badgeContent={incomingCalls.length} color="error">
              <Chip
                icon={<Notifications />}
                label="Pendentes"
                color={incomingCalls.length > 0 ? 'warning' : 'default'}
                variant="outlined"
              />
            </Badge>
          </Box>
        </Box>
        
        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
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