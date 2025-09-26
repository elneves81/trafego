import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  DirectionsCar as CarIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { api } from '../../services/api';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('view'); // 'view', 'edit', 'cancel'
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // Carregar agendamentos
  const loadAppointments = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando agendamentos...');
      
      const response = await api.get('/appointments');
      console.log('📋 Resposta da API:', response.data);
      
      if (response.data.success) {
        const appointments = response.data.appointments || [];
        console.log('✅ Agendamentos carregados:', appointments.length);
        setAppointments(appointments);
        setError('');
      } else {
        console.error('❌ Erro na resposta da API:', response.data);
        setError('Erro ao carregar agendamentos');
      }
    } catch (err) {
      console.error('❌ Erro ao carregar agendamentos:', err);
      setError(`Erro de conexão: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 AppointmentList montado, iniciando carregamento...');
    loadAppointments();
  }, []);

  // Filtrar e pesquisar agendamentos
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesSearch = !searchTerm || 
      appointment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.appointmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.requesterName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Cores dos status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'solicitado': return 'info';
      case 'análise': return 'warning';
      case 'aprovado': return 'success';
      case 'agendado': return 'primary';
      case 'confirmado': return 'success';
      case 'em andamento': return 'secondary';
      case 'finalizado': return 'success';
      case 'cancelado': return 'error';
      case 'reagendado': return 'warning';
      case 'não compareceu': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  // Traduzir status
  const translateStatus = (status) => {
    const statusMap = {
      'pending': 'Pendente',
      'solicitado': 'Solicitado',
      'análise': 'Em Análise',
      'aprovado': 'Aprovado',
      'agendado': 'Agendado',
      'confirmado': 'Confirmado',
      'em andamento': 'Em Andamento',
      'finalizado': 'Finalizado',
      'cancelado': 'Cancelado',
      'reagendado': 'Reagendado',
      'não compareceu': 'Não Compareceu'
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  // Traduzir tipo de agendamento
  const translateAppointmentType = (type) => {
    const typeMap = {
      'consultation': 'Consulta',
      'exam': 'Exame',
      'treatment': 'Tratamento',
      'surgery': 'Cirurgia',
      'therapy': 'Terapia',
      'vaccine': 'Vacinação',
      'emergency': 'Emergência',
      'return': 'Retorno',
      'other': 'Outros'
    };
    return typeMap[type] || type;
  };

  // Abrir dialog
  const openDialog = (appointment, type) => {
    setSelectedAppointment(appointment);
    setDialogType(type);
    setDialogOpen(true);
    setMenuAnchor(null);
  };

  // Fechar dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedAppointment(null);
    setCancelReason('');
  };

  // Confirmar agendamento
  const confirmAppointment = async (appointmentId) => {
    try {
      const response = await api.patch(`/appointments/${appointmentId}`, {
        status: 'confirmado',
        confirmedAt: new Date().toISOString()
      });

      if (response.data.success) {
        loadAppointments(); // Recarregar lista
        setError('');
      } else {
        setError('Erro ao confirmar agendamento');
      }
    } catch (err) {
      setError('Erro ao confirmar agendamento');
    }
  };

  // Cancelar agendamento
  const cancelAppointment = async () => {
    if (!cancelReason.trim()) {
      setError('Motivo do cancelamento é obrigatório');
      return;
    }

    try {
      const response = await api.patch(`/appointments/${selectedAppointment.id}`, {
        status: 'cancelado',
        cancelReason: cancelReason,
        cancelledAt: new Date().toISOString()
      });

      if (response.data.success) {
        loadAppointments(); // Recarregar lista
        closeDialog();
        setError('');
      } else {
        setError('Erro ao cancelar agendamento');
      }
    } catch (err) {
      setError('Erro ao cancelar agendamento');
    }
  };

  // Formatação de data e hora
  const formatDateTime = (date, time) => {
    if (!date) return '-';
    
    const formattedDate = new Date(date).toLocaleDateString('pt-BR');
    return time ? `${formattedDate} às ${time}` : formattedDate;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography color="primary">🔄 Carregando agendamentos...</Typography>
          <Typography variant="body2" color="text.secondary">
            Verificando console do navegador para logs detalhados...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Pesquisar"
                placeholder="Nome do paciente, número do agendamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">Todos os Status</MenuItem>
                  <MenuItem value="pending">Pendente</MenuItem>
                  <MenuItem value="solicitado">Solicitado</MenuItem>
                  <MenuItem value="aprovado">Aprovado</MenuItem>
                  <MenuItem value="confirmado">Confirmado</MenuItem>
                  <MenuItem value="finalizado">Finalizado</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={loadAppointments}
                disabled={loading}
              >
                Atualizar Lista
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Agendamentos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Agendamentos ({filteredAppointments.length})
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Paciente</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Data/Hora</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        Nenhum agendamento encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {appointment.appointmentNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {appointment.patientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Solicitante: {appointment.requesterName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {translateAppointmentType(appointment.appointmentType)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">
                            {formatDateTime(appointment.scheduledDate, appointment.scheduledTime)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {appointment.destinationAddress}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={translateStatus(appointment.status)}
                          color={getStatusColor(appointment.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Visualizar">
                            <IconButton
                              size="small"
                              onClick={() => openDialog(appointment, 'view')}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          
                          {appointment.status === 'pending' && (
                            <Tooltip title="Confirmar">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => confirmAppointment(appointment.id)}
                              >
                                <CheckIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {['pending', 'solicitado', 'aprovado'].includes(appointment.status) && (
                            <Tooltip title="Cancelar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDialog(appointment, 'cancel')}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog de Visualização/Cancelamento */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogType === 'view' && 'Detalhes do Agendamento'}
          {dialogType === 'cancel' && 'Cancelar Agendamento'}
        </DialogTitle>
        
        <DialogContent>
          {selectedAppointment && dialogType === 'view' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Informações do Agendamento */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Informações Gerais
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Número do Agendamento"
                  value={selectedAppointment.appointmentNumber}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={translateStatus(selectedAppointment.status)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              {/* Dados do Paciente */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Dados do Paciente
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Paciente"
                  value={selectedAppointment.patientName}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={selectedAppointment.patientPhone}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              {/* Dados do Agendamento */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Dados do Agendamento
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tipo de Agendamento"
                  value={translateAppointmentType(selectedAppointment.appointmentType)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data e Hora"
                  value={formatDateTime(selectedAppointment.scheduledDate, selectedAppointment.scheduledTime)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço de Origem"
                  value={selectedAppointment.originAddress || 'Não informado'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço de Destino"
                  value={selectedAppointment.destinationAddress}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              {selectedAppointment.observations && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Observações"
                    value={selectedAppointment.observations}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
            </Grid>
          )}
          
          {selectedAppointment && dialogType === 'cancel' && (
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                Tem certeza que deseja cancelar o agendamento <strong>{selectedAppointment.appointmentNumber}</strong>?
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Motivo do Cancelamento"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
                sx={{ mt: 2 }}
              />
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDialog}>
            {dialogType === 'cancel' ? 'Cancelar' : 'Fechar'}
          </Button>
          {dialogType === 'cancel' && (
            <Button 
              onClick={cancelAppointment} 
              color="error" 
              variant="contained"
              disabled={!cancelReason.trim()}
            >
              Confirmar Cancelamento
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AppointmentList;