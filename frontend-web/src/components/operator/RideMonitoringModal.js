import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  Divider,
  Avatar,
  IconButton,
  LinearProgress,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  DirectionsCar,
  Chat,
  Send,
  Close,
  LocationOn,
  Speed,
  LocalGasStation,
  Build,
  CheckCircle,
  Warning,
  Info,
  Phone,
  Navigation,
  AccessTime,
  LocalHospital
} from '@mui/icons-material';

const RideMonitoringModal = ({ 
  open, 
  onClose, 
  rideData, 
  onUpdateRide 
}) => {
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [vehicleStatus, setVehicleStatus] = useState({
    currentKm: '',
    fuelLevel: 'Cheio',
    location: 'A caminho do local',
    eta: '5 minutos',
    observations: ''
  });
  const [rideStatus, setRideStatus] = useState('dispatched');
  const [rideProgress, setRideProgress] = useState(0);

  // Simular progresso da corrida
  useEffect(() => {
    if (open && rideStatus === 'dispatched') {
      const interval = setInterval(() => {
        setRideProgress(prev => {
          if (prev >= 100) {
            setRideStatus('completed');
            return 100;
          }
          return prev + 2;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open, rideStatus]);

  // Mensagens iniciais do chat
  useEffect(() => {
    if (open && chatMessages.length === 0) {
      const initialMessages = [
        {
          id: 1,
          sender: 'system',
          message: `🚑 Corrida iniciada para ${rideData?.patient || 'Paciente'}`,
          timestamp: new Date(),
          type: 'system'
        },
        {
          id: 2,
          sender: 'driver',
          message: `✅ Corrida aceita! Veículo ${rideData?.vehicle} saindo da base.\n\n📊 Status inicial:\n🛣️ KM: 45.320\n⛽ Combustível: Cheio\n📍 ETA: 7 minutos`,
          timestamp: new Date(Date.now() + 2000),
          type: 'status'
        }
      ];
      setChatMessages(initialMessages);
    }
  }, [open, rideData]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: 'operator',
        message: newMessage,
        timestamp: new Date(),
        type: 'chat'
      };

      setChatMessages(prev => [...prev, message]);
      setNewMessage('');

      // Simular resposta do motorista
      setTimeout(() => {
        const driverResponses = [
          "📍 Recebido! Chegando em 3 minutos",
          "🚑 Paciente coletado, seguindo para hospital",
          "⚠️ Trânsito um pouco congestionado, mas tudo OK",
          "🏥 Chegamos ao destino, paciente entregue",
          "✅ Retornando à base, disponível para nova corrida",
          "🔧 Preciso parar para combustível",
          "📊 KM atual: 45.456 - Tudo funcionando perfeitamente"
        ];
        
        const response = driverResponses[Math.floor(Math.random() * driverResponses.length)];
        const driverMessage = {
          id: Date.now() + 1,
          sender: 'driver',
          message: response,
          timestamp: new Date(),
          type: 'chat'
        };
        setChatMessages(prev => [...prev, driverMessage]);
      }, 1500);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'dispatched': return 'primary';
      case 'en_route': return 'info';
      case 'arrived': return 'warning';
      case 'transporting': return 'secondary';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'dispatched': return '🚀 Despachado';
      case 'en_route': return '🚗 A caminho';
      case 'arrived': return '📍 No local';
      case 'transporting': return '🚑 Transportando';
      case 'completed': return '✅ Concluído';
      default: return status;
    }
  };

  const quickMessages = [
    "📍 Qual sua localização atual?",
    "⏰ Quanto tempo para chegada?",
    "🆘 Situação do paciente?",
    "🏥 Confirmação do hospital de destino?",
    "⛽ Precisa abastecer?",
    "🔧 Algum problema com o veículo?"
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '85vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              🚑 Monitoramento da Corrida
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {rideData?.vehicle} - {rideData?.driver}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={getStatusLabel(rideStatus)} 
              color={getStatusColor(rideStatus)} 
              size="large"
            />
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Coluna Esquerda - Informações da Corrida */}
          <Grid item xs={12} md={6}>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 Dados da Corrida
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2"><strong>👤 Paciente:</strong> {rideData?.patient}</Typography>
                  <Typography variant="body2"><strong>📍 Origem:</strong> {rideData?.origin}</Typography>
                  <Typography variant="body2"><strong>🏥 Destino:</strong> {rideData?.destination}</Typography>
                  <Typography variant="body2"><strong>⚠️ Prioridade:</strong> {rideData?.priority}</Typography>
                  <Typography variant="body2"><strong>⏰ Despacho:</strong> {rideData?.dispatchTime?.toLocaleTimeString()}</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  📈 Progresso da Corrida
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={rideProgress} 
                  sx={{ height: 10, borderRadius: 5, mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {rideProgress.toFixed(0)}% concluído
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🚗 Status do Veículo
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="KM Atual"
                      value={vehicleStatus.currentKm}
                      onChange={(e) => setVehicleStatus(prev => ({ ...prev, currentKm: e.target.value }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Speed /></InputAdornment>
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Combustível</InputLabel>
                      <Select
                        value={vehicleStatus.fuelLevel}
                        onChange={(e) => setVehicleStatus(prev => ({ ...prev, fuelLevel: e.target.value }))}
                        startAdornment={<LocalGasStation sx={{ mr: 1, color: 'text.secondary' }} />}
                      >
                        <MenuItem value="Cheio">⛽ Cheio</MenuItem>
                        <MenuItem value="3/4">🟡 3/4</MenuItem>
                        <MenuItem value="1/2">🟠 1/2</MenuItem>
                        <MenuItem value="1/4">🔴 1/4</MenuItem>
                        <MenuItem value="Vazio">❌ Vazio</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Localização"
                      value={vehicleStatus.location}
                      onChange={(e) => setVehicleStatus(prev => ({ ...prev, location: e.target.value }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Tempo Estimado"
                      value={vehicleStatus.eta}
                      onChange={(e) => setVehicleStatus(prev => ({ ...prev, eta: e.target.value }))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><AccessTime /></InputAdornment>
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      label="Observações"
                      placeholder="Ex: Paciente estável, trânsito normal..."
                      value={vehicleStatus.observations}
                      onChange={(e) => setVehicleStatus(prev => ({ ...prev, observations: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Coluna Direita - Chat */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" gutterBottom>
                  💬 Chat com Motorista
                </Typography>
                
                {/* Mensagens Rápidas */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    📱 Mensagens Rápidas:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {quickMessages.map((msg, index) => (
                      <Chip
                        key={index}
                        label={msg}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => setNewMessage(msg)}
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </Box>
                
                {/* Área de Mensagens */}
                <Box 
                  sx={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    border: '1px solid', 
                    borderColor: 'grey.300', 
                    borderRadius: 1, 
                    p: 1, 
                    mb: 2,
                    minHeight: 300
                  }}
                >
                  {chatMessages.map((msg) => (
                    <Box
                      key={msg.id}
                      sx={{
                        display: 'flex',
                        justifyContent: msg.sender === 'operator' ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1,
                          maxWidth: '85%',
                          bgcolor: msg.sender === 'operator' ? 'primary.main' : 
                                  msg.sender === 'system' ? 'info.light' : 'grey.200',
                          color: msg.sender === 'operator' || msg.sender === 'system' ? 'white' : 'text.primary'
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {msg.message}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                          {msg.sender === 'operator' ? '👨‍💼 Operador' : 
                           msg.sender === 'system' ? '🤖 Sistema' : '🚗 Motorista'} - {msg.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>

                {/* Campo de Nova Mensagem */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Digite sua mensagem para o motorista..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={handleSendMessage} disabled={!newMessage.trim()}>
                            <Send />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Fechar Monitoramento
        </Button>
        <Button 
          variant="contained" 
          color="success"
          disabled={rideStatus === 'completed'}
          onClick={() => {
            setRideStatus('completed');
            setRideProgress(100);
            const completionMessage = {
              id: Date.now(),
              sender: 'system',
              message: '✅ Corrida finalizada com sucesso!\n\n📊 Resumo:\n🛣️ KM Final: 45.478\n⏱️ Tempo total: 23 minutos\n🏥 Paciente entregue no hospital',
              timestamp: new Date(),
              type: 'completion'
            };
            setChatMessages(prev => [...prev, completionMessage]);
          }}
        >
          ✅ Finalizar Corrida
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RideMonitoringModal;