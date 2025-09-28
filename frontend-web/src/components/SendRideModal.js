import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { Send, LocalHospital, LocationOn } from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';

const SendRideModal = ({ open, onClose, attendanceData }) => {
  const { socket, isConnected } = useSocket();
  const [sending, setSending] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [priority, setPriority] = useState('média');
  const [observacoes, setObservacoes] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendRide = async () => {
    if (!socket || !isConnected) {
      alert('Conexão WebSocket não disponível');
      return;
    }

    setSending(true);

    const rideData = {
      attendanceId: attendanceData?.id,
      patientName: attendanceData?.patient || 'Paciente',
      patientPhone: attendanceData?.phone || '',
      originAddress: attendanceData?.address || 'Endereço de origem',
      destinationAddress: 'Hospital/UPA de destino',
      priority: priority,
      urgency: priority === 'alta' ? 'urgente' : 'normal',
      type: attendanceData?.type || 'outros',
      observations: observacoes,
      estimatedDistance: '5.2 km',
      estimatedDuration: '12 min',
      createdAt: new Date()
    };

    // Enviar via Socket.IO para todos os motoristas
    socket.emit('create_ride', rideData);

    // Feedback visual
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSending(false);
      onClose();
    }, 2000);
  };

  if (!attendanceData) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Send color="primary" />
          <Typography variant="h6">
            Enviar Corrida para Motoristas
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            🚨 Corrida enviada para todos os motoristas disponíveis!
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Dados do Paciente */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle1" gutterBottom>
                <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                Dados do Atendimento
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Paciente"
                    value={attendanceData.patient || ''}
                    disabled
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    value={attendanceData.phone || ''}
                    disabled
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Endereço"
                    value={attendanceData.address || ''}
                    disabled
                    variant="outlined"
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Configurações da Corrida */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select
                value={priority}
                label="Prioridade"
                onChange={(e) => setPriority(e.target.value)}
              >
                <MenuItem value="baixa">
                  <Chip label="Baixa" color="success" size="small" sx={{ mr: 1 }} />
                  Baixa
                </MenuItem>
                <MenuItem value="média">
                  <Chip label="Média" color="warning" size="small" sx={{ mr: 1 }} />
                  Média
                </MenuItem>
                <MenuItem value="alta">
                  <Chip label="Alta" color="error" size="small" sx={{ mr: 1 }} />
                  Alta
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Tipo de Atendimento"
              value={attendanceData.type || 'Outros'}
              disabled
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observações para o Motorista"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              multiline
              rows={3}
              placeholder="Instruções especiais, medicamentos, equipamentos necessários..."
            />
          </Grid>

          {/* Status da Conexão */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="textSecondary">
                Status da conexão:
              </Typography>
              <Chip 
                label={isConnected ? 'Conectado' : 'Desconectado'} 
                color={isConnected ? 'success' : 'error'} 
                size="small" 
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={sending}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSendRide} 
          variant="contained" 
          disabled={sending || !isConnected}
          startIcon={<Send />}
        >
          {sending ? 'Enviando...' : 'Enviar para Motoristas'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SendRideModal;