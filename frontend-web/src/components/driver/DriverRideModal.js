import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Badge
} from '@mui/material';
import {
  LocalHospital as EmergencyIcon,
  Person as PatientIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Schedule as TimeIcon,
  Warning as WarningIcon,
  CheckCircle as AcceptIcon,
  Cancel as DeclineIcon,
  DirectionsCar as CarIcon,
  Speed as SpeedIcon,
  LocalGasStation as FuelIcon,
  Build as MaintenanceIcon,
  Chat as ChatIcon,
  Send as SendIcon,
  Notifications as NotificationIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const DriverRideModal = ({ 
  open, 
  onClose, 
  rideData, 
  driverInfo,
  onAcceptRide,
  onDeclineRide 
}) => {
  // Estados do modal
  const [currentStep, setCurrentStep] = useState(0);
  const [rideAccepted, setRideAccepted] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    currentKm: '',
    fuelLevel: '',
    vehicleCondition: 'Bom',
    equipmentStatus: 'Funcionando',
    observations: ''
  });

  // Estados do chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatOpen, setChatOpen] = useState(true); // Chat sempre aberto
  const chatEndRef = useRef(null);

  // Simular mensagens iniciais da central
  useEffect(() => {
    if (open && rideData) {
      const initialMessages = [
        {
          id: 1,
          sender: 'central',
          senderName: 'Central SAMU',
          message: `Nova corrida disponível para você: ${rideData.caller}`,
          timestamp: new Date(),
          type: 'system'
        },
        {
          id: 2,
          sender: 'central',
          senderName: 'Operador Maria',
          message: 'Por favor, confirme se pode aceitar esta corrida de alta prioridade.',
          timestamp: new Date(),
          type: 'operator'
        }
      ];
      setChatMessages(initialMessages);
    }
  }, [open, rideData]);

  // Auto scroll do chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Enviar mensagem
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        sender: 'driver',
        senderName: driverInfo?.name || 'Motorista',
        message: newMessage,
        timestamp: new Date(),
        type: 'driver'
      };
      
      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Simular resposta da central
      setTimeout(() => {
        const responses = [
          'Mensagem recebida, motorista.',
          'Entendido. Aguardo sua confirmação.',
          'Obrigado pela informação.',
          'Central ciente. Prossiga conforme orientação.',
          'Perfeito! Continue atualizando sobre o status.'
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const centralResponse = {
          id: Date.now() + 1,
          sender: 'central',
          senderName: 'Central SAMU',
          message: randomResponse,
          timestamp: new Date(),
          type: 'system'
        };
        
        setChatMessages(prev => [...prev, centralResponse]);
      }, 1500);
    }
  };

  // Aceitar corrida
  const handleAcceptRide = () => {
    if (!vehicleData.currentKm || !vehicleData.fuelLevel) {
      alert('Por favor, preencha os dados do veículo antes de aceitar a corrida.');
      return;
    }

    setRideAccepted(true);
    setCurrentStep(1);
    
    // Enviar mensagem automática
    const acceptMessage = {
      id: Date.now(),
      sender: 'driver',
      senderName: driverInfo?.name || 'Motorista',
      message: `✅ CORRIDA ACEITA! Dados do veículo: ${vehicleData.currentKm}km, Combustível: ${vehicleData.fuelLevel}%, Condição: ${vehicleData.vehicleCondition}`,
      timestamp: new Date(),
      type: 'acceptance'
    };
    
    setChatMessages(prev => [...prev, acceptMessage]);
    
    // Chamar callback
    onAcceptRide && onAcceptRide(rideData, vehicleData);
  };

  // Recusar corrida
  const handleDeclineRide = () => {
    const declineMessage = {
      id: Date.now(),
      sender: 'driver',
      senderName: driverInfo?.name || 'Motorista',
      message: '❌ Corrida recusada. Não posso atender no momento.',
      timestamp: new Date(),
      type: 'decline'
    };
    
    setChatMessages(prev => [...prev, declineMessage]);
    
    setTimeout(() => {
      onDeclineRide && onDeclineRide(rideData);
      onClose();
    }, 1000);
  };

  const steps = [
    'Análise da Corrida',
    'Em Deslocamento',
    'No Local',
    'Transportando',
    'Finalizada'
  ];

  if (!rideData) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh', maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        bgcolor: rideData.priority === 'emergency' ? 'error.main' : 'primary.main',
        color: 'white'
      }}>
        <EmergencyIcon />
        <Box flex={1}>
          <Typography variant="h6">
            Nova Corrida - {rideData.attendanceNumber || `#${rideData.id}`}
          </Typography>
          <Typography variant="caption">
            {driverInfo?.name} - {driverInfo?.vehicle}
          </Typography>
        </Box>
        <Chip 
          label={rideData.priority === 'emergency' ? 'EMERGÊNCIA' : 'ALTA'} 
          color={rideData.priority === 'emergency' ? 'error' : 'warning'}
          variant="filled"
        />
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', height: '100%' }}>
        {/* Lado Esquerdo - Informações da Corrida */}
        <Box sx={{ flex: 1, p: 3 }}>
          {/* Informações do Paciente */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PatientIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Informações do Paciente
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Paciente:</strong> {rideData.caller}</Typography>
                  <Typography><strong>Telefone:</strong> {rideData.phone}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Prioridade:</strong> 
                    <Chip 
                      size="small" 
                      label={rideData.priority === 'emergency' ? 'EMERGÊNCIA' : 'ALTA'}
                      color={rideData.priority === 'emergency' ? 'error' : 'warning'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  <Typography><strong>Horário:</strong> {rideData.time?.toLocaleTimeString()}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Localização
              </Typography>
              <Typography>{rideData.location}</Typography>
            </CardContent>
          </Card>

          {/* Condição Médica */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <EmergencyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Condição Médica
              </Typography>
              <Alert severity={rideData.priority === 'emergency' ? 'error' : 'warning'}>
                {rideData.description}
              </Alert>
            </CardContent>
          </Card>

          {/* Dados do Veículo */}
          {!rideAccepted && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dados do Veículo
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Quilometragem Atual"
                      value={vehicleData.currentKm}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, currentKm: e.target.value }))}
                      type="number"
                      InputProps={{
                        startAdornment: <SpeedIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Nível de Combustível (%)"
                      value={vehicleData.fuelLevel}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, fuelLevel: e.target.value }))}
                      type="number"
                      InputProps={{
                        startAdornment: <FuelIcon sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Condição do Veículo</InputLabel>
                      <Select
                        value={vehicleData.vehicleCondition}
                        label="Condição do Veículo"
                        onChange={(e) => setVehicleData(prev => ({ ...prev, vehicleCondition: e.target.value }))}
                      >
                        <MenuItem value="Excelente">Excelente</MenuItem>
                        <MenuItem value="Bom">Bom</MenuItem>
                        <MenuItem value="Regular">Regular</MenuItem>
                        <MenuItem value="Ruim">Ruim</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status dos Equipamentos</InputLabel>
                      <Select
                        value={vehicleData.equipmentStatus}
                        label="Status dos Equipamentos"
                        onChange={(e) => setVehicleData(prev => ({ ...prev, equipmentStatus: e.target.value }))}
                      >
                        <MenuItem value="Funcionando">Funcionando</MenuItem>
                        <MenuItem value="Parcial">Funcionamento Parcial</MenuItem>
                        <MenuItem value="Problema">Com Problemas</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Observações"
                      value={vehicleData.observations}
                      onChange={(e) => setVehicleData(prev => ({ ...prev, observations: e.target.value }))}
                      multiline
                      rows={2}
                      placeholder="Informações adicionais sobre o veículo..."
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Stepper de Progresso */}
          {rideAccepted && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status da Corrida
                </Typography>
                <Stepper activeStep={currentStep} orientation="vertical">
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                      <StepContent>
                        <Typography>
                          {index === 0 && 'Corrida aceita, preparando deslocamento...'}
                          {index === 1 && 'A caminho do local de origem...'}
                          {index === 2 && 'Chegou ao local, atendendo paciente...'}
                          {index === 3 && 'Transportando paciente para hospital...'}
                          {index === 4 && 'Corrida finalizada com sucesso!'}
                        </Typography>
                        {index === currentStep && (
                          <Box sx={{ mt: 2 }}>
                            <Button
                              variant="contained"
                              onClick={() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))}
                              disabled={currentStep === steps.length - 1}
                            >
                              {currentStep === steps.length - 1 ? 'Finalizada' : 'Próxima Etapa'}
                            </Button>
                          </Box>
                        )}
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Lado Direito - Chat Permanente */}
        <Box sx={{ 
          width: 400, 
          borderLeft: '1px solid #e0e0e0',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          {/* Header do Chat */}
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <ChatIcon />
            <Typography variant="h6" flex={1}>
              Comunicação com Central
            </Typography>
            <Badge badgeContent={chatMessages.length} color="secondary">
              <NotificationIcon />
            </Badge>
          </Box>

          {/* Mensagens */}
          <Box sx={{ 
            flex: 1, 
            overflowY: 'auto',
            p: 1,
            bgcolor: '#f5f5f5'
          }}>
            {chatMessages.map((msg) => (
              <Box 
                key={msg.id} 
                sx={{ 
                  mb: 1,
                  display: 'flex',
                  justifyContent: msg.sender === 'driver' ? 'flex-end' : 'flex-start'
                }}
              >
                <Paper 
                  sx={{ 
                    p: 1.5,
                    maxWidth: '80%',
                    bgcolor: msg.sender === 'driver' ? 'primary.light' : 'white',
                    color: msg.sender === 'driver' ? 'white' : 'text.primary'
                  }}
                >
                  <Typography variant="caption" display="block">
                    {msg.senderName} - {msg.timestamp.toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2">
                    {msg.message}
                  </Typography>
                </Paper>
              </Box>
            ))}
            <div ref={chatEndRef} />
          </Box>

          {/* Input de Mensagem */}
          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
              </Grid>
              <Grid item>
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </DialogContent>

      {/* Ações */}
      {!rideAccepted && (
        <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5' }}>
          <Button 
            variant="outlined" 
            color="error"
            startIcon={<DeclineIcon />}
            onClick={handleDeclineRide}
          >
            Recusar Corrida
          </Button>
          <Button 
            variant="contained" 
            color="success"
            startIcon={<AcceptIcon />}
            onClick={handleAcceptRide}
            disabled={!vehicleData.currentKm || !vehicleData.fuelLevel}
          >
            Aceitar Corrida
          </Button>
        </DialogActions>
      )}

      {rideAccepted && (
        <DialogActions sx={{ p: 3, bgcolor: '#f5f5f5' }}>
          <Button 
            variant="outlined"
            onClick={onClose}
          >
            Minimizar
          </Button>
          <Button 
            variant="contained"
            disabled={currentStep < steps.length - 1}
            onClick={() => {
              if (currentStep === steps.length - 1) {
                onClose();
              }
            }}
          >
            {currentStep === steps.length - 1 ? 'Finalizar' : 'Aguardando...'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DriverRideModal;