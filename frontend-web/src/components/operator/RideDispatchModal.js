import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  Chip,
  Avatar,
  Divider,
  Alert,
  IconButton,
  List,
  Card,
  CardContent,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Snackbar
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Send,
  Close,
  DirectionsCar,
  Speed
} from '@mui/icons-material';
import { useSocket } from '../../contexts/SocketContext';

const RideDispatchModal = ({
  open,
  onClose,
  availableVehicles = [],
  pendingCalls = [],
  onDispatchRide
}) => {
  const { socket, isConnected } = useSocket();

  const [selectedCall, setSelectedCall] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [rideData, setRideData] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'info' });

  const [vehicleInfo, setVehicleInfo] = useState({
    initialKm: '',
    fuelLevel: '',
    observations: ''
  });

  // Refs para auto-scroll e timeouts
  const chatBoxRef = useRef(null);
  const timeouts = useRef([]);

  const steps = [
    'Selecionar Chamada',
    'Escolher Veículo',
    'Enviar para Motorista',
    'Aguardar Confirmação',
    'Monitoramento'
  ];

  // Auto-scroll do chat
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Cleanup de timeouts ao desmontar
  useEffect(() => {
    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, []);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
      setSelectedCall(null);
      setSelectedVehicle(null);
      setRideData({});
      setChatMessages([]);
      setSnack({ open: false, msg: '', severity: 'info' });
      setVehicleInfo({ initialKm: '', fuelLevel: '', observations: '' });
    }
  }, [open]);

  // Listeners do Socket.IO para respostas do motorista
  useEffect(() => {
    if (!socket) return;

    const handleRideAccepted = (data) => {
      const message = {
        id: Date.now(),
        sender: 'driver',
        message:
          `✅ CORRIDA ACEITA!\n\n` +
          `🚗 Motorista: ${data.driverName}\n` +
          `📋 Corrida ID: ${data.rideId}\n\n` +
          `🏁 Saindo para atendimento!`,
        timestamp: new Date(),
        type: 'acceptance'
      };
      setChatMessages((prev) => [...prev, message]);
      setCurrentStep(4);
    };

    const handleRideRejected = (data) => {
      const message = {
        id: Date.now(),
        sender: 'driver',
        message:
          `❌ CORRIDA REJEITADA\n\n` +
          `🚗 Motorista: ${data.driverName}\n` +
          `📋 Corrida ID: ${data.rideId}\n\n` +
          `⚠️ Necessário redespachar para outro motorista.`,
        timestamp: new Date(),
        type: 'rejection'
      };
      setChatMessages((prev) => [...prev, message]);
    };

    socket.on('ride_accepted', handleRideAccepted);
    socket.on('ride_rejected', handleRideRejected);

    return () => {
      socket.off('ride_accepted', handleRideAccepted);
      socket.off('ride_rejected', handleRideRejected);
    };
  }, [socket]);

  const handleSelectCall = (call) => {
    setSelectedCall(call);
    setRideData({
      ...call,
      dispatchTime: new Date(),
      operatorId: 1
    });
    setCurrentStep(1);
  };

  const handleSelectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setRideData((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      driverId: vehicle.driverId,
      vehicleCode: vehicle.code
    }));
    setCurrentStep(2);
  };

  const handleDispatchToDriver = async () => {
    if (!socket || !isConnected) {
      setSnack({ open: true, msg: '❌ Conexão WebSocket não disponível', severity: 'error' });
      return;
    }
    if (!selectedCall || !selectedVehicle) {
      setSnack({ open: true, msg: '❌ Selecione uma chamada e um veículo antes de despachar', severity: 'warning' });
      return;
    }

    setIsDispatching(true);
    try {
      const dispatchData = {
        id: `RIDE-${Date.now()}`,
        attendanceId: selectedCall.id,
        patientName: selectedCall.caller || selectedCall.patient,
        patientPhone: selectedCall.phone,
        originAddress: selectedCall.location || selectedCall.address,
        destinationAddress: 'Hospital/UPA - a definir',
        priority: selectedCall.priority || 'média',
        urgency: selectedCall.priority === 'URGENTE' ? 'urgente' : 'normal',
        type: selectedCall.type || 'emergência',
        vehicleId: selectedVehicle.id,
        vehicleCode: selectedVehicle.code,
        driverId: selectedVehicle.driverId,
        driverName: selectedVehicle.driver,
        observations: vehicleInfo.observations || selectedCall.description || '',
        estimatedDistance: '5.2 km',
        estimatedDuration: '12 min',
        status: 'pendente',
        dispatchedAt: new Date(),
        operatorId: 1
      };

      // Emite criação da corrida ao motorista com ACK
      socket.emit('create_ride', dispatchData, (ack) => {
        setIsDispatching(false);
        
        if (ack?.success) {
          // Feedback positivo
          setSnack({ open: true, msg: '✅ Corrida enviada com sucesso!', severity: 'success' });
          
          const successMessage = {
            id: Date.now(),
            sender: 'system',
            message:
              `✅ Corrida enviada com sucesso!\n\n` +
              `� Status: Confirmada pelo servidor\n` +
              `🎯 Motorista: ${selectedVehicle.driver}\n` +
              `🚗 Veículo: ${selectedVehicle.code}`,
            timestamp: new Date(),
            type: 'confirmation'
          };
          setChatMessages((prev) => [...prev, successMessage]);
          setCurrentStep(3);
        } else {
          setSnack({ open: true, msg: '❌ Falha no envio da corrida', severity: 'error' });
        }
      });

      // Mensagem inicial no chat
      const initialMessage = {
        id: Date.now(),
        sender: 'operator',
        message:
          `🚑 CORRIDA DESPACHADA!\n\n` +
          `👤 Paciente: ${dispatchData.patientName}\n` +
          `📞 Telefone: ${dispatchData.patientPhone}\n` +
          `📍 Local: ${dispatchData.originAddress}\n` +
          `� Veículo: ${selectedVehicle.code}\n` +
          `👨‍⚕️ Motorista: ${selectedVehicle.driver}\n` +
          `🆘 Prioridade: ${dispatchData.priority}\n\n` +
          `⏰ Aguardando confirmação do motorista...`,
        timestamp: new Date(),
        type: 'dispatch'
      };

      setChatMessages([initialMessage]);

      // Callback externo opcional
      if (typeof onDispatchRide === 'function') {
        onDispatchRide(dispatchData);
      }
    } catch (error) {
      console.error('Erro ao enviar corrida:', error);
      setIsDispatching(false);
      setSnack({ open: true, msg: '❌ Erro ao enviar corrida. Tente novamente.', severity: 'error' });
    }
  };

  const handleSendMessage = () => {
    const text = newMessage.trim();
    if (!text) return;

    const message = {
      id: Date.now(),
      sender: 'operator',
      message: text,
      timestamp: new Date(),
      type: 'chat'
    };
    setChatMessages((prev) => [...prev, message]);
    setNewMessage('');

    // Simular resposta do motorista
    setTimeout(() => {
      const responses = [
        '📍 Entendido, chegando ao local em 5 minutos',
        '🚑 Paciente coletado, seguindo para destino',
        '🏥 Chegamos ao hospital, paciente entregue com sucesso',
        '✅ Aguardando novas instruções da base',
        '🔧 Preciso abastecer antes da próxima corrida'
      ];
      const randomResponse =
        responses[Math.floor(Math.random() * responses.length)];
      const driverMessage = {
        id: Date.now() + 1,
        sender: 'driver',
        message: randomResponse,
        timestamp: new Date(),
        type: 'chat'
      };
      setChatMessages((prev) => [...prev, driverMessage]);
    }, 2000);
  };

  const renderChat = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          💬 Chat com Motorista
        </Typography>

        <Box
          sx={{
            height: 300,
            overflowY: 'auto',
            border: '1px solid',
            borderColor: 'grey.300',
            borderRadius: 1,
            p: 1,
            mb: 2
          }}
        >
          {chatMessages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent:
                  msg.sender === 'operator' ? 'flex-end' : 'flex-start',
                mb: 1
              }}
            >
              <Box
                sx={{
                  p: 1,
                  maxWidth: '80%',
                  borderRadius: 1,
                  bgcolor:
                    msg.sender === 'operator' ? 'primary.main' : 'grey.200',
                  color: msg.sender === 'operator' ? 'white' : 'text.primary'
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {msg.message}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {msg.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendMessage();
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    aria-label="Enviar"
                  >
                    <Send />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );

  const renderVehicleInfo = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          🚗 Informações do Veículo
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="KM Inicial"
              placeholder="Ex: 45.320"
              value={vehicleInfo.initialKm}
              onChange={(e) =>
                setVehicleInfo((prev) => ({ ...prev, initialKm: e.target.value }))
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Speed />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nível de Combustível"
              placeholder="Ex: 3/4 do tanque"
              value={vehicleInfo.fuelLevel}
              onChange={(e) =>
                setVehicleInfo((prev) => ({ ...prev, fuelLevel: e.target.value }))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Observações"
              placeholder="Ex: Veículo em perfeitas condições..."
              value={vehicleInfo.observations}
              onChange={(e) =>
                setVehicleInfo((prev) => ({ ...prev, observations: e.target.value }))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>
              Status da Corrida:
            </Typography>
            <Chip label="🚑 Em Andamento" color="primary" />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              📞 Selecione a Chamada para Despachar
            </Typography>
            <List sx={{ p: 0 }}>
              {pendingCalls.map((call, index) => (
                <Card
                  key={call.id ?? index}
                  sx={{
                    mb: 2,
                    cursor: 'pointer',
                    border: selectedCall?.id === call.id ? '2px solid' : '1px solid',
                    borderColor:
                      selectedCall?.id === call.id ? 'primary.main' : 'grey.300',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handleSelectCall(call)}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" color="error.main" gutterBottom>
                          🚨 Chamada #{index + 1}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          👤 <strong>Solicitante:</strong> {call.caller}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          📞 <strong>Telefone:</strong> {call.phone}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          📍 <strong>Local:</strong> {call.location}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          📝 <strong>Descrição:</strong> {call.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ⏰ Recebida às:{' '}
                          {call.time instanceof Date
                            ? call.time.toLocaleTimeString()
                            : call.time}
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          call.priority === 'emergency'
                            ? '🚨 EMERGÊNCIA'
                            : '⚠️ URGENTE'
                        }
                        color={call.priority === 'emergency' ? 'error' : 'warning'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              🚗 Selecione o Veículo/Motorista
            </Typography>
            <List sx={{ p: 0 }}>
              {availableVehicles
                .filter((v) => (v.status || '').toLowerCase() === 'disponivel')
                .map((vehicle) => (
                  <Card
                    key={vehicle.id}
                    sx={{
                      mb: 2,
                      cursor: 'pointer',
                      border:
                        selectedVehicle?.id === vehicle.id
                          ? '2px solid'
                          : '1px solid',
                      borderColor:
                        selectedVehicle?.id === vehicle.id
                          ? 'success.main'
                          : 'grey.300',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                    onClick={() => handleSelectVehicle(vehicle)}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                            <DirectionsCar />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" color="success.main">
                              🚑 {vehicle.code}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              👨‍⚕️ Motorista: {vehicle.driver || 'A definir'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              📍 Base: {vehicle.location || 'Central'}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip label="✅ DISPONÍVEL" color="success" />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
            </List>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              📋 Confirmar Dados do Despacho
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="error.main" gutterBottom>
                      📞 Dados da Chamada
                    </Typography>
                    <Typography variant="body2">
                      <strong>Solicitante:</strong> {selectedCall?.caller}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Telefone:</strong> {selectedCall?.phone}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Local:</strong> {selectedCall?.location}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Prioridade:</strong> {selectedCall?.priority}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Descrição:</strong> {selectedCall?.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      🚑 Dados do Veículo
                    </Typography>
                    <Typography variant="body2">
                      <strong>Veículo:</strong> {selectedVehicle?.code}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Motorista:</strong> {selectedVehicle?.driver}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Base:</strong> {selectedVehicle?.location}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> Disponível
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {isDispatching && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
                  Enviando corrida via WebSocket...
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <LoadingButton
                variant="contained"
                color="primary"
                size="large"
                startIcon={<Send />}
                onClick={handleDispatchToDriver}
                loading={isDispatching}
                loadingPosition="start"
              >
                🚀 Enviar Corrida para Motorista
              </LoadingButton>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              ⏳ Aguardando Confirmação do Motorista
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Corrida enviada para <strong>{selectedVehicle?.code}</strong> — Motorista:{' '}
              <strong>{selectedVehicle?.driver}</strong>
            </Alert>
            {renderChat()}
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              📱 Monitoramento da Corrida
            </Typography>
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Corrida confirmada pelo motorista!
            </Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                {renderVehicleInfo()}
              </Grid>
              <Grid item xs={12} md={6}>
                {renderChat()}
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { minHeight: '80vh' } }}
    >
      <DialogTitle>
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Typography variant="h5" fontWeight="bold">
            🚑 Central de Despacho de Corridas
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      </DialogTitle>

      <DialogContent>{renderStepContent()}</DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary" startIcon={<Close />}>
          Fechar
        </Button>

        {currentStep > 0 && currentStep < 2 && (
          <Button onClick={() => setCurrentStep((prev) => prev - 1)} color="primary">
            ← Voltar
          </Button>
        )}
      </DialogActions>

      <Snackbar
        open={snack.open}
        autoHideDuration={6000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default RideDispatchModal;