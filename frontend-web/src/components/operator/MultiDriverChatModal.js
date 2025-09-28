import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  IconButton,
  Badge,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert
} from '@mui/material';
import {
  Chat as ChatIcon,
  Send as SendIcon,
  Person as PersonIcon,
  DirectionsCar as CarIcon,
  Add as AddIcon,
  Close as CloseTabIcon,
  Notifications as NotificationIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Assignment as RideIcon,
  LocalHospital as EmergencyIcon
} from '@mui/icons-material';

const MultiDriverChatModal = ({ 
  open, 
  onClose, 
  availableDrivers = [],
  onSendRideToDriver 
}) => {
  // Estados para múltiplos chats
  const [activeChats, setActiveChats] = useState([]);
  const [currentChatTab, setCurrentChatTab] = useState(0);
  const [newMessage, setNewMessage] = useState({});
  const [showNewRideForm, setShowNewRideForm] = useState({});
  
  // Estados para nova corrida
  const [newRideData, setNewRideData] = useState({
    caller: '',
    phone: '',
    location: '',
    description: '',
    priority: 'high',
    category: 'emergency'
  });

  const chatEndRefs = useRef({});

  // Inicializar com alguns chats ativos
  useEffect(() => {
    if (open && availableDrivers.length > 0 && activeChats.length === 0) {
      const initialChats = availableDrivers.slice(0, 3).map(driver => ({
        id: driver.id,
        driverName: driver.name,
        driverVehicle: driver.vehicle,
        status: driver.status,
        messages: [
          {
            id: 1,
            sender: 'system',
            senderName: 'Sistema',
            message: `Chat iniciado com ${driver.name}`,
            timestamp: new Date(),
            type: 'system'
          }
        ],
        unreadCount: 0
      }));
      
      setActiveChats(initialChats);
    }
  }, [open, availableDrivers]);

  // Auto scroll dos chats
  useEffect(() => {
    Object.keys(chatEndRefs.current).forEach(chatId => {
      chatEndRefs.current[chatId]?.scrollIntoView({ behavior: 'smooth' });
    });
  }, [activeChats]);

  // Adicionar novo chat
  const addNewChat = (driverId) => {
    const driver = availableDrivers.find(d => d.id === driverId);
    if (!driver || activeChats.find(chat => chat.id === driverId)) return;

    const newChat = {
      id: driver.id,
      driverName: driver.name,
      driverVehicle: driver.vehicle,
      status: driver.status,
      messages: [
        {
          id: 1,
          sender: 'system',
          senderName: 'Sistema',
          message: `Novo chat iniciado com ${driver.name}`,
          timestamp: new Date(),
          type: 'system'
        }
      ],
      unreadCount: 0
    };

    setActiveChats(prev => [...prev, newChat]);
    setCurrentChatTab(activeChats.length);
  };

  // Fechar chat
  const closeChat = (chatId) => {
    setActiveChats(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatTab >= activeChats.length - 1) {
      setCurrentChatTab(Math.max(0, activeChats.length - 2));
    }
  };

  // Enviar mensagem
  const sendMessage = (chatId) => {
    const message = newMessage[chatId]?.trim();
    if (!message) return;

    const messageObj = {
      id: Date.now(),
      sender: 'operator',
      senderName: 'Central SAMU',
      message: message,
      timestamp: new Date(),
      type: 'operator'
    };

    setActiveChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [...chat.messages, messageObj] }
        : chat
    ));

    setNewMessage(prev => ({ ...prev, [chatId]: '' }));

    // Simular resposta do motorista
    setTimeout(() => {
      const responses = [
        'Mensagem recebida, central.',
        'Entendido. Estou disponível.',
        'Ok, aguardo instruções.',
        'Roger. Pronto para atender.',
        'Ciente. Status atualizado.',
        'Perfeito, central!'
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      const driverResponse = {
        id: Date.now() + 1,
        sender: 'driver',
        senderName: activeChats.find(c => c.id === chatId)?.driverName || 'Motorista',
        message: randomResponse,
        timestamp: new Date(),
        type: 'driver'
      };

      setActiveChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { 
              ...chat, 
              messages: [...chat.messages, driverResponse],
              unreadCount: chat.id !== activeChats[currentChatTab]?.id ? chat.unreadCount + 1 : 0
            }
          : chat
      ));
    }, 1500);
  };

  // Enviar corrida para motorista
  const sendRideToDriver = (chatId) => {
    if (!newRideData.caller || !newRideData.location || !newRideData.description) {
      alert('Por favor, preencha todos os campos da corrida.');
      return;
    }

    const rideMessage = {
      id: Date.now(),
      sender: 'operator',
      senderName: 'Central SAMU',
      message: `🚨 NOVA CORRIDA ENVIADA:\n📞 ${newRideData.caller}\n📱 ${newRideData.phone}\n📍 ${newRideData.location}\n🏥 ${newRideData.description}\n🚨 Prioridade: ${newRideData.priority}`,
      timestamp: new Date(),
      type: 'ride_assignment',
      rideData: { ...newRideData, id: Date.now() }
    };

    setActiveChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, messages: [...chat.messages, rideMessage] }
        : chat
    ));

    // Limpar formulário
    setNewRideData({
      caller: '',
      phone: '',
      location: '',
      description: '',
      priority: 'high',
      category: 'emergency'
    });
    
    setShowNewRideForm(prev => ({ ...prev, [chatId]: false }));

    // Callback para o componente pai
    const driver = activeChats.find(c => c.id === chatId);
    onSendRideToDriver && onSendRideToDriver(driver, rideMessage.rideData);

    // Simular resposta do motorista
    setTimeout(() => {
      const driverResponse = {
        id: Date.now() + 1,
        sender: 'driver',
        senderName: driver?.driverName || 'Motorista',
        message: 'Corrida recebida! Analisando detalhes...',
        timestamp: new Date(),
        type: 'driver'
      };

      setActiveChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, messages: [...chat.messages, driverResponse] }
          : chat
      ));
    }, 2000);
  };

  // Marcar mensagens como lidas
  const markAsRead = (chatId) => {
    setActiveChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, unreadCount: 0 }
        : chat
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'success';
      case 'busy': return 'warning';
      case 'offline': return 'error';
      default: return 'default';
    }
  };

  const renderChatMessages = (chat) => (
    <Box sx={{ 
      flex: 1, 
      overflowY: 'auto',
      p: 1,
      bgcolor: '#f5f5f5',
      maxHeight: 400
    }}>
      {chat.messages.map((msg) => (
        <Box 
          key={msg.id} 
          sx={{ 
            mb: 1,
            display: 'flex',
            justifyContent: msg.sender === 'operator' ? 'flex-end' : 'flex-start'
          }}
        >
          <Paper 
            sx={{ 
              p: 1.5,
              maxWidth: '80%',
              bgcolor: msg.sender === 'operator' ? 'primary.light' : 
                      msg.sender === 'driver' ? 'success.light' :
                      msg.type === 'ride_assignment' ? 'error.light' : 'grey.200',
              color: msg.sender === 'operator' || msg.type === 'ride_assignment' ? 'white' : 'text.primary'
            }}
          >
            <Typography variant="caption" display="block">
              {msg.senderName} - {msg.timestamp.toLocaleTimeString()}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ whiteSpace: 'pre-line' }}
            >
              {msg.type === 'ride_assignment' && '🚨 '}
              {msg.message}
            </Typography>
          </Paper>
        </Box>
      ))}
      <div ref={el => chatEndRefs.current[chat.id] = el} />
    </Box>
  );

  const renderNewRideForm = (chatId) => (
    <Card sx={{ mt: 2, bgcolor: 'warning.light' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <RideIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Enviar Nova Corrida
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Nome do Paciente/Solicitante"
              value={newRideData.caller}
              onChange={(e) => setNewRideData(prev => ({ ...prev, caller: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Telefone"
              value={newRideData.phone}
              onChange={(e) => setNewRideData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Localização Completa"
              value={newRideData.location}
              onChange={(e) => setNewRideData(prev => ({ ...prev, location: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Descrição da Condição Médica"
              value={newRideData.description}
              onChange={(e) => setNewRideData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={newRideData.priority}
                label="Prioridade"
                onChange={(e) => setNewRideData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <MenuItem value="low">Baixa</MenuItem>
                <MenuItem value="medium">Média</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="emergency">Emergência</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                value={newRideData.category}
                label="Categoria"
                onChange={(e) => setNewRideData(prev => ({ ...prev, category: e.target.value }))}
              >
                <MenuItem value="basic">Básico</MenuItem>
                <MenuItem value="emergency">Emergência</MenuItem>
                <MenuItem value="critical">Crítico</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" gap={1}>
              <Button 
                variant="contained" 
                color="error"
                startIcon={<EmergencyIcon />}
                onClick={() => sendRideToDriver(chatId)}
              >
                Enviar Corrida
              </Button>
              <Button 
                variant="outlined"
                onClick={() => setShowNewRideForm(prev => ({ ...prev, [chatId]: false }))}
              >
                Cancelar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  if (!open) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        bgcolor: 'primary.main',
        color: 'white'
      }}>
        <ChatIcon />
        <Typography variant="h6" flex={1}>
          Central de Comunicação - Múltiplos Chats
        </Typography>
        <Typography variant="body2">
          {activeChats.length} chat(s) ativo(s)
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Tabs dos Chats */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}>
          <Box display="flex" alignItems="center">
            <Tabs 
              value={currentChatTab} 
              onChange={(e, newValue) => {
                setCurrentChatTab(newValue);
                if (activeChats[newValue]) {
                  markAsRead(activeChats[newValue].id);
                }
              }}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ flex: 1 }}
            >
              {activeChats.map((chat, index) => (
                <Tab 
                  key={chat.id}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Badge badgeContent={chat.unreadCount} color="error">
                        <Typography variant="body2">
                          {chat.driverName}
                        </Typography>
                      </Badge>
                      <Chip 
                        size="small" 
                        label={chat.status}
                        color={getStatusColor(chat.status)}
                        variant="outlined"
                      />
                      <IconButton 
                        size="small" 
                        onClick={(e) => {
                          e.stopPropagation();
                          closeChat(chat.id);
                        }}
                      >
                        <CloseTabIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                />
              ))}
            </Tabs>
            
            {/* Botão para adicionar novo chat */}
            <FormControl sx={{ m: 1, minWidth: 200 }}>
              <InputLabel>Adicionar Motorista</InputLabel>
              <Select
                size="small"
                label="Adicionar Motorista"
                value=""
                onChange={(e) => addNewChat(e.target.value)}
              >
                {availableDrivers
                  .filter(driver => !activeChats.find(chat => chat.id === driver.id))
                  .map(driver => (
                    <MenuItem key={driver.id} value={driver.id}>
                      {driver.name} - {driver.vehicle}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Conteúdo do Chat Ativo */}
        {activeChats.length > 0 && activeChats[currentChatTab] && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
            {/* Info do Motorista */}
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ py: 1 }}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                  </Grid>
                  <Grid item flex={1}>
                    <Typography variant="h6">
                      {activeChats[currentChatTab].driverName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activeChats[currentChatTab].driverVehicle}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Chip 
                      label={activeChats[currentChatTab].status.toUpperCase()}
                      color={getStatusColor(activeChats[currentChatTab].status)}
                      variant="filled"
                    />
                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      startIcon={<RideIcon />}
                      onClick={() => setShowNewRideForm(prev => ({ 
                        ...prev, 
                        [activeChats[currentChatTab].id]: !prev[activeChats[currentChatTab].id] 
                      }))}
                    >
                      Nova Corrida
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Formulário de Nova Corrida */}
            {showNewRideForm[activeChats[currentChatTab].id] && 
              renderNewRideForm(activeChats[currentChatTab].id)
            }

            {/* Mensagens */}
            {renderChatMessages(activeChats[currentChatTab])}

            {/* Input de Mensagem */}
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Digite sua mensagem..."
                    value={newMessage[activeChats[currentChatTab].id] || ''}
                    onChange={(e) => setNewMessage(prev => ({ 
                      ...prev, 
                      [activeChats[currentChatTab].id]: e.target.value 
                    }))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendMessage(activeChats[currentChatTab].id);
                      }
                    }}
                  />
                </Grid>
                <Grid item>
                  <IconButton 
                    color="primary" 
                    onClick={() => sendMessage(activeChats[currentChatTab].id)}
                    disabled={!newMessage[activeChats[currentChatTab].id]?.trim()}
                  >
                    <SendIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}

        {activeChats.length === 0 && (
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2
          }}>
            <ChatIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum chat ativo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Adicione um motorista para iniciar a comunicação
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MultiDriverChatModal;