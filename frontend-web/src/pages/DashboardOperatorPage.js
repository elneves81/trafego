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
  PersonAdd as BasicIcon,
  Psychology,
  AutoAwesome,
  PersonOff
} from '@mui/icons-material';

// Import dos novos componentes
import EmergencyAttendance from '../components/operator/EmergencyAttendance';
import AttendanceList from '../components/operator/AttendanceList';
import AppointmentScheduling from '../components/operator/AppointmentScheduling';
import AppointmentList from '../components/operator/AppointmentList';
import BasicAttendance from '../components/operator/BasicAttendance';
import DriverManagementDashboard from '../components/operator/DriverManagementDashboard';
import IntelligentDistributionPanel from '../components/operator/IntelligentDistributionPanel';
import BasicAttendanceList from '../components/operator/BasicAttendanceList';
import TestAppointmentList from '../components/operator/TestAppointmentList';
import RideDispatchModal from '../components/operator/RideDispatchModal';
import MultiDriverChatModal from '../components/operator/MultiDriverChatModal';

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
  const [showDistributionPanel, setShowDistributionPanel] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  
  // Estados para múltiplos chats
  const [multiChatOpen, setMultiChatOpen] = useState(false);

  // Carregar dados reais das APIs
  useEffect(() => {
    loadInitialData();
    loadRealPendingAttendances(); // Carregar atendimentos reais do banco
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Carregar dados sequencialmente para evitar rate limiting
      console.log('🔄 Carregando corridas ativas...');
      await loadActiveRides();
      await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
      
      console.log('🔄 Carregando motoristas disponíveis...');
      await loadAvailableDrivers();
      await new Promise(resolve => setTimeout(resolve, 300)); // 300ms delay
      
      console.log('🔄 Carregando atendimentos pendentes...');
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
        
        // Converter para formato de veículos com dados mais amigáveis
        const vehiclesData = (Array.isArray(driversData) ? driversData : []).map((driver, index) => ({
          id: driver.id,
          code: `Ambulância ${String(index + 1).padStart(2, '0')}`, // Ambulância 01, 02, etc.
          vehicleNumber: `AMB-${String(index + 1).padStart(3, '0')}`, // AMB-001, AMB-002, etc.
          driver: driver.name,
          phone: driver.phone || 'Não informado',
          status: driver.status === 'active' ? 'disponivel' : 'indisponivel',
          location: driver.location || 'Base Central',
          email: driver.email,
          licenseCategory: driver.licenseCategory || 'B'
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

  // � Função para enviar corrida para motorista via chat
  const handleSendRideToDriver = (driver, rideData) => {
    console.log('🚗 Enviando corrida para motorista:', driver.driverName, rideData);
    
    // Adicionar corrida à lista de ativas
    const newActiveRide = {
      id: rideData.id,
      driverId: driver.id,
      driverName: driver.driverName,
      patientName: rideData.caller,
      location: rideData.location,
      status: 'dispatched',
      priority: rideData.priority,
      startTime: new Date(),
      description: rideData.description
    };
    
    setActiveRides(prev => [...prev, newActiveRide]);
    
    // Remover da lista de chamadas pendentes se existir
    setIncomingCalls(prev => prev.filter(call => 
      call.caller !== rideData.caller || call.location !== rideData.location
    ));
    
    // Atualizar status do motorista para ocupado
    setDrivers(prev => prev.map(d => 
      d.id === driver.id 
        ? { ...d, status: 'busy' }
        : d
    ));
    
    console.log('✅ Corrida enviada e sistema atualizado');
  };

  // 💬 Função para abrir sistema de múltiplos chats
  const openMultiChat = () => {
    setMultiChatOpen(true);
  };

  // �📞 Função para carregar atendimentos pendentes reais do banco
  const loadRealPendingAttendances = async () => {
    try {
      console.log('📞 Carregando atendimentos pendentes reais...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/attendances/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const attendances = data.data?.attendances || data.attendances || data || [];
        
        console.log('📋 Atendimentos recebidos:', attendances);
        
        // Converter atendimentos para formato de chamadas
        const calls = attendances.map(att => ({
          id: att.id,
          caller: att.patientName || att.callerName || 'Nome não informado',
          phone: att.callerPhone || att.patientPhone || 'Telefone não informado',
          location: `${att.address || att.originAddress || ''}, ${att.city || ''} - ${att.state || ''}`,
          priority: att.priority === 'Alta' || att.category === 'emergency' ? 'emergency' : 'high',
          time: new Date(att.createdAt || att.callDateTime),
          description: att.medicalCondition || att.observations || att.description || 'Sem descrição médica',
          attendanceType: att.category || att.attendanceType || 'basic',
          patientDocument: att.patientDocument,
          patientAge: att.patientAge,
          urgencyCode: att.urgencyCode,
          attendanceNumber: att.attendanceNumber
        }));

        setIncomingCalls(calls);
        console.log('✅ Chamadas de atendimentos reais carregadas:', calls.length);
        
        // Se não houver atendimentos pendentes, carregar todos os atendimentos recentes
        if (calls.length === 0) {
          await loadRecentAttendances();
        }
      } else {
        console.error('❌ Erro ao carregar atendimentos pendentes:', response.status);
        await loadRecentAttendances(); // Fallback
      }
    } catch (error) {
      console.error('❌ Erro ao carregar atendimentos pendentes:', error);
      await loadRecentAttendances(); // Fallback
    }
  };

  // 📋 Função para carregar atendimentos recentes (fallback)
  const loadRecentAttendances = async () => {
    try {
      console.log('📋 Carregando atendimentos recentes como fallback...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8082'}/api/attendances?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const attendances = data.data?.attendances || data.attendances || data || [];
        
        console.log('📋 Atendimentos recentes:', attendances);
        
        // Filtrar apenas os que podem ser transformados em chamadas
        const validAttendances = attendances.filter(att => 
          att.patientName || att.callerName
        ).slice(0, 5); // Pegar apenas 5 mais recentes
        
        const calls = validAttendances.map(att => ({
          id: att.id,
          caller: att.patientName || att.callerName || 'Paciente',
          phone: att.callerPhone || att.patientPhone || 'Telefone não informado',
          location: `${att.address || att.originAddress || 'Endereço não informado'}, ${att.city || ''} - ${att.state || 'PR'}`,
          priority: att.priority === 'Alta' || att.category === 'emergency' ? 'emergency' : 'high',
          time: new Date(att.createdAt || att.callDateTime),
          description: att.medicalCondition || att.observations || 'Necessita transporte médico',
          attendanceType: att.category || 'basic',
          patientDocument: att.patientDocument,
          patientAge: att.patientAge,
          attendanceNumber: att.attendanceNumber,
          status: 'pending' // Forçar como pendente para teste
        }));

        setIncomingCalls(calls);
        console.log('✅ Chamadas de atendimentos recentes carregadas:', calls.length);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar atendimentos recentes:', error);
      // Como último recurso, criar uma chamada de exemplo com dados básicos
      setIncomingCalls([{
        id: 'example-001',
        caller: 'Paciente de Exemplo',
        phone: '(42) 99999-0000',
        location: 'Guarapuava - PR',
        priority: 'high',
        time: new Date(),
        description: 'Transporte médico necessário',
        attendanceType: 'basic'
      }]);
    }
  };

  // 📞 Função para despachar corrida via modal
  const handleDispatchRide = (rideData) => {
    console.log('🚀 Despachando corrida:', rideData);
    
    // Remover da lista de chamadas
    setIncomingCalls(prev => prev.filter(call => call.id !== rideData.callId));
    
    // Adicionar às corridas ativas
    const newRide = {
      id: `ride-${Date.now()}`,
      patient: rideData.caller,
      vehicle: rideData.vehicleCode,
      driver: rideData.driverName,
      origin: rideData.location,
      destination: 'Hospital Regional',
      status: 'dispatched',
      priority: rideData.priority,
      dispatchTime: new Date()
    };
    
    setActiveRides(prev => [...prev, newRide]);
    
    // Atualizar status do veículo
    setAvailableVehicles(prev => prev.map(vehicle => 
      vehicle.id === rideData.vehicleId 
        ? { ...vehicle, status: 'ocupado' }
        : vehicle
    ));

    setShowDispatchModal(false);
  };

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

  // Atualização periódica dos dados (sequencial para evitar rate limiting)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!loading) {
        try {
          // Chamadas sequenciais com pequeno delay entre elas
          await loadActiveRides();
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
          
          await loadAvailableDrivers();
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
          
          await loadPendingAttendances();
        } catch (error) {
          console.error('Erro na atualização periódica:', error);
        }
      }
    }, 45000); // Aumentado para 45 segundos

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
      case 5:
        return <DriverManagementDashboard />;
      default:
        return renderDashboardOverview();
    }
  };

  const renderDashboardOverview = () => (
    <Grid container spacing={3}>
      {/* Dashboard Status Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Emergency sx={{ mr: 1, color: 'error.main' }} />
              <Typography variant="h6">Emergências</Typography>
            </Box>
            <Typography variant="h4" color="error.main">
              {incomingCalls.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chamadas pendentes
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DirectionsCar sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">Ambulâncias</Typography>
            </Box>
            <Typography variant="h4" color="success.main">
              {availableVehicles.filter(v => v.status === 'disponivel').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Disponíveis de {availableVehicles.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonOff sx={{ mr: 1, color: 'warning.main' }} />
              <Typography variant="h6">Motoristas</Typography>
            </Box>
            <Typography variant="h4" color="primary.main">
              {drivers.filter(d => d.status === 'available').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Disponíveis de {drivers.length}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PlayArrow sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">Ativas</Typography>
            </Box>
            <Typography variant="h4" color="info.main">
              {activeRides.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Corridas em andamento
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Sistema Inteligente de Distribuição */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AutoAwesome sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h5" fontWeight="bold">
                🎯 Sistema Inteligente de Distribuição
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  console.log('🚀 Abrindo modal de despacho...');
                  console.log('📞 Chamadas disponíveis:', incomingCalls.length);
                  console.log('🚗 Veículos disponíveis:', availableVehicles.length);
                  setShowDispatchModal(true);
                }}
                startIcon={<Send />}
                disabled={false}
                size="large"
              >
                🚀 Despacho Manual ({incomingCalls.length})
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setShowDistributionPanel(!showDistributionPanel)}
                startIcon={<Psychology />}
              >
                {showDistributionPanel ? 'Ocultar' : 'Abrir'} IA
              </Button>
            </Box>
          </Box>
          
          {showDistributionPanel && (
            <IntelligentDistributionPanel />
          )}
        </Paper>
      </Grid>

      {/* Corridas Ativas - Status Visual */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DirectionsCar sx={{ mr: 1, color: 'success.main' }} />
              <Typography variant="h6">
                🚨 Ambulâncias em Atendimento ({activeRides.length})
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                🚑 Ambulâncias da Frota ({availableVehicles.length} veículos)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip 
                  label={`${availableVehicles.filter(v => v.status === 'disponivel').length} Disponíveis`} 
                  color="success" 
                  size="small"
                />
                <Chip 
                  label={`${availableVehicles.filter(v => v.status !== 'disponivel').length} Ocupadas`} 
                  color="error" 
                  size="small"
                />
              </Box>
            </Box>
            
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

  const renderBasicAttendanceList = () => <BasicAttendanceList refreshTrigger={refreshAttendances} />;

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
          <Tab 
            icon={<Psychology />} 
            label="🧠 Gestão de Motoristas" 
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

      {/* Sistema Manual de Distribuição de Corridas */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Send sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h5" fontWeight="bold">
                🎯 Central de Distribuição Manual de Corridas
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {/* Coluna Esquerda - Chamadas Pendentes */}
              <Grid item xs={12} md={6}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Phone sx={{ mr: 1, color: 'error.main' }} />
                      <Typography variant="h6" fontWeight="bold">
                        📞 Chamadas de Emergência ({incomingCalls.length})
                      </Typography>
                      <Badge badgeContent={incomingCalls.length} color="error" sx={{ ml: 1 }}>
                        <Notifications />
                      </Badge>
                    </Box>

                    {incomingCalls.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          ✅ Nenhuma chamada de emergência pendente
                        </Typography>
                      </Box>
                    ) : (
                      <List>
                        {incomingCalls.map((call, index) => (
                          <Paper key={call.id} sx={{ mb: 2, p: 2, border: '2px solid', borderColor: 'error.light' }} elevation={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="h6" fontWeight="bold" color="error.main">
                                    #{index + 1} - {call.caller}
                                  </Typography>
                                  <Chip 
                                    label={call.priority === 'emergency' ? '🚨 EMERGÊNCIA' : '⚠️ URGENTE'} 
                                    color={getPriorityColor(call.priority)}
                                    size="small" 
                                    sx={{ ml: 1 }}
                                  />
                                </Box>
                                
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                  📞 <strong>Telefone:</strong> {call.phone}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1 }}>
                                  📍 <strong>Local:</strong> {call.location}
                                </Typography>
                                <Typography variant="body1" sx={{ mb: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                                  <strong>Descrição:</strong> {call.description}
                                </Typography>
                                <Typography variant="caption" color="primary.main" fontWeight="bold">
                                  ⏰ Recebida às: {call.time.toLocaleTimeString()}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Coluna Direita - Motoristas e Veículos Disponíveis */}
              <Grid item xs={12} md={6}>
                <Card elevation={3}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <DirectionsCar sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="h6" fontWeight="bold">
                        🚗 Equipes Disponíveis para Distribuição
                      </Typography>
                    </Box>

                    {availableVehicles.filter(v => v.status === 'disponivel').length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          ❌ Nenhuma ambulância disponível no momento
                        </Typography>
                      </Box>
                    ) : (
                      <List>
                        {availableVehicles.filter(v => v.status === 'disponivel').map((vehicle) => (
                          <Paper key={vehicle.id} sx={{ mb: 2, p: 2, border: '2px solid', borderColor: 'success.light' }} elevation={2}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="h6" fontWeight="bold" color="success.main">
                                  🚑 {vehicle.code} - {vehicle.model}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  👨‍⚕️ Motorista: {vehicle.driver || 'A definir'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  📍 Base: {vehicle.location || 'Central'}
                                </Typography>
                                <Chip 
                                  label="✅ DISPONÍVEL" 
                                  color="success"
                                  size="small" 
                                  sx={{ mt: 1 }}
                                />
                              </Box>
                              
                              <Box sx={{ ml: 2 }}>
                                {incomingCalls.length > 0 ? (
                                  <>
                                    <Button
                                      variant="contained"
                                      color="primary"
                                      size="medium"
                                      fullWidth
                                      sx={{ mb: 1, minWidth: 140 }}
                                      onClick={() => setShowDispatchModal(true)}
                                      startIcon={<Send />}
                                    >
                                      🚀 Despachar Corrida
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      color="secondary"
                                      size="medium"
                                      fullWidth
                                      sx={{ mb: 1, minWidth: 140 }}
                                      onClick={openMultiChat}
                                      startIcon={<Chat />}
                                    >
                                      💬 Chat Múltiplo
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    color="success"
                                    size="small"
                                    disabled
                                  >
                                    ⏳ Aguardando
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Corridas Ativas */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DirectionsCar sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">
                  🚨 Ambulâncias em Atendimento ({activeRides.length})
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
              
              <Grid container spacing={3}>
                {availableVehicles.map((vehicle) => (
                  <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
                    <Paper 
                      sx={{ 
                        p: 3, 
                        borderRadius: 2,
                        border: vehicle.status === 'disponivel' ? '2px solid #4caf50' : '2px solid #f44336',
                        backgroundColor: vehicle.status === 'disponivel' ? '#f8fff8' : '#fff5f5'
                      }} 
                      elevation={2}
                    >
                      <Box sx={{ textAlign: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          🚑 {vehicle.code}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {vehicle.vehicleNumber}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          👨‍⚕️ Motorista:
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                          {vehicle.driver}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📞 {vehicle.phone}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          🏥 CNH: Categoria {vehicle.licenseCategory}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          📍 Localização:
                        </Typography>
                        <Typography variant="body2">
                          {vehicle.location}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Chip 
                          label={vehicle.status === 'disponivel' ? 'DISPONÍVEL' : 'INDISPONÍVEL'} 
                          color={vehicle.status === 'disponivel' ? 'success' : 'error'}
                          size="medium"
                          sx={{ fontWeight: 'bold' }}
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

      {/* Painel de Distribuição Inteligente */}
      <IntelligentDistributionPanel
        open={showDistributionPanel}
        onClose={() => setShowDistributionPanel(false)}
      />

      {/* Modal de Despacho de Corridas */}
      <RideDispatchModal
        open={showDispatchModal}
        onClose={() => setShowDispatchModal(false)}
        availableVehicles={availableVehicles}
        incomingCalls={incomingCalls}
        onDispatchRide={handleDispatchRide}
      />

      {/* Modal de Múltiplos Chats */}
      <MultiDriverChatModal
        open={multiChatOpen}
        onClose={() => setMultiChatOpen(false)}
        availableDrivers={drivers}
        onSendRideToDriver={handleSendRideToDriver}
      />
    </Box>
  );
};

export default DashboardOperatorPage;