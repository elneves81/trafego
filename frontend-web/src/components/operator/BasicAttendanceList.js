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
  Tooltip
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import api from '../../services/api';

const BasicAttendanceList = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Carregar atendimentos
  const loadAttendances = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/attendances?category=basic&_t=${Date.now()}`);
      
      if (response.data.success) {
        const attendancesData = response.data.data?.attendances || [];
        setAttendances(attendancesData);
      } else {
        setError('Erro ao carregar atendimentos');
      }
    } catch (err) {
      console.error('Erro ao carregar atendimentos:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendances();
  }, []);

  // Filtrar e pesquisar atendimentos
  const filteredAttendances = attendances.filter(attendance => {
    const matchesStatus = filterStatus === 'all' || attendance.status === filterStatus;
    const matchesSearch = !searchTerm || 
      attendance.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendance.attendanceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Cores dos status  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Traduzir status
  const translateStatus = (status) => {
    const statusMap = {
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'in_progress': 'Em Andamento',
      'completed': 'Finalizado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  // Traduzir tipo de atendimento
  const translateAttendanceType = (type) => {
    const typeMap = {
      'consultation': 'Consulta Médica',
      'exam': 'Exame',
      'treatment': 'Tratamento',
      'transfer': 'Transferência',
      'discharge': 'Alta Hospitalar',
      'return': 'Retorno',
      'therapy': 'Terapia/Fisioterapia',
      'other': 'Outros'
    };
    return typeMap[type] || type;
  };

  // Traduzir prioridade
  const translatePriority = (priority) => {
    const priorityMap = {
      'low': 'Baixa',
      'normal': 'Normal',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return priorityMap[priority] || priority;
  };

  // Abrir dialog
  const openDialog = (attendance) => {
    setSelectedAttendance(attendance);
    setDialogOpen(true);
  };

  // Fechar dialog
  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedAttendance(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography color="primary">🔄 Carregando atendimentos básicos...</Typography>
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
                placeholder="Nome do paciente, número do atendimento..."
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
                  <MenuItem value="confirmed">Confirmado</MenuItem>
                  <MenuItem value="in_progress">Em Andamento</MenuItem>
                  <MenuItem value="completed">Finalizado</MenuItem>
                  <MenuItem value="cancelled">Cancelado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={loadAttendances}
                disabled={loading}
              >
                Atualizar Lista
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Atendimentos */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Atendimentos Básicos ({filteredAttendances.length})
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Número</TableCell>
                  <TableCell>Paciente</TableCell>
                  <TableCell>Endereço</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Prioridade</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAttendances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary">
                        Nenhum atendimento básico encontrado
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendances.map((attendance) => (
                    <TableRow key={attendance.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {attendance.attendanceNumber || `#${attendance.id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {attendance.patientName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            📞 {attendance.callerPhone} ({attendance.callerName})
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {attendance.address}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {attendance.city && `${attendance.city}, ${attendance.state}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {translateAttendanceType(attendance.attendanceType)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={translatePriority(attendance.priority)}
                          color={attendance.priority === 'urgent' ? 'error' : attendance.priority === 'high' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={translateStatus(attendance.status)}
                          color={getStatusColor(attendance.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Visualizar">
                            <IconButton
                              size="small"
                              onClick={() => openDialog(attendance)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          
                          <Tooltip title="Ligar para Solicitante">
                            <IconButton
                              size="small"
                              color="primary"
                              href={`tel:${attendance.callerPhone}`}
                            >
                              <PhoneIcon />
                            </IconButton>
                          </Tooltip>
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

      {/* Dialog de Visualização */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalhes do Atendimento Básico
        </DialogTitle>
        
        <DialogContent>
          {selectedAttendance && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Informações do Solicitante */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary">
                  <PhoneIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dados do Solicitante
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Solicitante"
                  value={selectedAttendance.callerName || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telefone do Solicitante"
                  value={selectedAttendance.callerPhone || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              {selectedAttendance.callerCpf && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CPF do Solicitante"
                    value={selectedAttendance.callerCpf}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}

              {/* Informações do Paciente */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Dados do Paciente
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Paciente"
                  value={selectedAttendance.patientName || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              {selectedAttendance.patientCpf && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CPF do Paciente"
                    value={selectedAttendance.patientCpf}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
              
              {selectedAttendance.patientPhone && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telefone do Paciente"
                    value={selectedAttendance.patientPhone}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
              
              {selectedAttendance.patientAge && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Idade"
                    value={selectedAttendance.patientAge}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
              
              {selectedAttendance.patientGender && (
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Gênero"
                    value={selectedAttendance.patientGender === 'masculino' ? 'Masculino' : 
                           selectedAttendance.patientGender === 'feminino' ? 'Feminino' : 
                           'Outro'}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
              
              {/* Endereço */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Endereço de Origem
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço Completo"
                  value={selectedAttendance.address || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={selectedAttendance.city || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Estado"
                  value={selectedAttendance.state || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="CEP"
                  value={selectedAttendance.cep || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              {selectedAttendance.originReference && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ponto de Referência"
                    value={selectedAttendance.originReference}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
              
              {/* Dados do Atendimento */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                  Dados do Atendimento
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tipo de Atendimento"
                  value={translateAttendanceType(selectedAttendance.attendanceType) || 'Atendimento Básico'}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Prioridade"
                  value={translatePriority(selectedAttendance.priority)}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              {selectedAttendance.medicalCondition && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Condição Médica"
                    value={selectedAttendance.medicalCondition}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Destino"
                  value={selectedAttendance.destinationAddress || ''}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              {selectedAttendance.observations && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Observações"
                    value={selectedAttendance.observations}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDialog}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BasicAttendanceList;