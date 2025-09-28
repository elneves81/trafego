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
  TablePagination,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  DirectionsCar as DispatchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  LocalHospital as EmergencyIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

const AttendanceList = () => {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    patientName: '',
    startDate: '',
    endDate: ''
  });

  const statusOptions = [
    { value: 'Recebida', label: 'Recebida', color: 'info' },
    { value: 'Triagem', label: 'Em Triagem', color: 'warning' },
    { value: 'Aprovada', label: 'Aprovada', color: 'success' },
    { value: 'Despachada', label: 'Despachada', color: 'primary' },
    { value: 'Em andamento', label: 'Em Andamento', color: 'secondary' },
    { value: 'Finalizada', label: 'Finalizada', color: 'success' },
    { value: 'Cancelada', label: 'Cancelada', color: 'default' },
    { value: 'Negada', label: 'Negada', color: 'error' }
  ];

  const priorityOptions = [
    { value: 'Baixa', label: 'Baixa', color: 'success' },
    { value: 'Média', label: 'Média', color: 'info' },
    { value: 'Alta', label: 'Alta', color: 'warning' },
    { value: 'Crítica', label: 'Crítica', color: 'error' }
  ];

  const urgencyColors = {
    'Verde': 'success',
    'Amarelo': 'warning',
    'Laranja': 'warning',
    'Vermelho': 'error'
  };

  useEffect(() => {
    fetchAttendances();
  }, [page, rowsPerPage, filters]);

  const fetchAttendances = async () => {
    setLoading(true);
    setError('');

    try {
      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      });

      const response = await api.get(`/attendances?${queryParams}`);

      if (response.data.success) {
        setAttendances(response.data.attendances || []);
        setTotalItems(response.data.pagination?.totalItems || 0);
      } else {
        setError(response.data.message || 'Erro ao carregar atendimentos');
        setAttendances([]);
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filtering
  };

  const handleApprove = async () => {
    if (!selectedAttendance) return;

    try {
      const response = await api.post(`/attendances/${selectedAttendance.id}/approve`);

      if (response.data.success) {
        setApproveDialog(false);
        setSelectedAttendance(null);
        fetchAttendances();
      } else {
        setError(response.data.message || 'Erro ao aprovar atendimento');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    }
  };

  const handleReject = async () => {
    if (!selectedAttendance || !rejectionReason.trim()) return;

    try {
      const response = await api.patch(`/attendances/${selectedAttendance.id}/cancel`, {
        reason: rejectionReason,
        status: 'Negada'
      });

      if (response.data.success) {
        setRejectDialog(false);
        setSelectedAttendance(null);
        setRejectionReason('');
        fetchAttendances();
      } else {
        setError(response.data.message || 'Erro ao negar atendimento');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
    }
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('pt-BR');
  };

  const getStatusChip = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return (
      <Chip 
        label={statusOption?.label || status} 
        color={statusOption?.color || 'default'} 
        size="small" 
      />
    );
  };

  const getPriorityChip = (priority) => {
    const priorityOption = priorityOptions.find(opt => opt.value === priority);
    return (
      <Chip 
        label={priorityOption?.label || priority} 
        color={priorityOption?.color || 'default'} 
        size="small" 
      />
    );
  };

  const getUrgencyChip = (urgencyCode) => {
    if (!urgencyCode) return null;
    return (
      <Chip 
        label={urgencyCode} 
        color={urgencyColors[urgencyCode] || 'default'} 
        size="small" 
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" component="h1">
            <EmergencyIcon sx={{ mr: 2, verticalAlign: 'middle', color: 'error.main' }} />
            Gerenciamento de Atendimentos
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAttendances}
            disabled={loading}
          >
            Atualizar
          </Button>
        </Box>

        {/* Filtros */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Filtros
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {statusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Prioridade</InputLabel>
                  <Select
                    value={filters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <MenuItem value="">Todas</MenuItem>
                    {priorityOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Nome do Paciente"
                  value={filters.patientName}
                  onChange={(e) => handleFilterChange('patientName', e.target.value)}
                />
              </Grid>
              
              <Grid item xs={12} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Data Inicial"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Data Final"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Data/Hora</TableCell>
                <TableCell>Paciente</TableCell>
                <TableCell>Solicitante</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>Urgência</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : (!attendances || attendances.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    Nenhum atendimento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                (attendances || []).map((attendance) => (
                  <TableRow key={attendance.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {attendance.attendanceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <TimeIcon sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {formatDateTime(attendance.callDateTime)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {attendance.patientName}
                          </Typography>
                          {attendance.patientAge && (
                            <Typography variant="caption" color="textSecondary">
                              {attendance.patientAge} anos
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
                        <Box>
                          <Typography variant="body2">
                            {attendance.callerName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {attendance.callerPhone}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getPriorityChip(attendance.priority)}
                    </TableCell>
                    <TableCell>
                      {getUrgencyChip(attendance.urgencyCode)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(attendance.status)}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Visualizar">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedAttendance(attendance);
                              setViewDialog(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {user.userType === 'supervisor' && attendance.status === 'Recebida' && (
                          <>
                            <Tooltip title="Aprovar">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  setSelectedAttendance(attendance);
                                  setApproveDialog(true);
                                }}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Negar">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedAttendance(attendance);
                                  setRejectDialog(true);
                                }}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Itens por página:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </Card>

      {/* Dialog de Visualização */}
      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Detalhes do Atendimento - {selectedAttendance?.attendanceNumber}
        </DialogTitle>
        <DialogContent>
          {selectedAttendance && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Dados da Chamada
                </Typography>
                <Typography variant="body2">
                  <strong>Data/Hora:</strong> {formatDateTime(selectedAttendance.callDateTime)}
                </Typography>
                <Typography variant="body2">
                  <strong>Solicitante:</strong> {selectedAttendance.callerName}
                </Typography>
                <Typography variant="body2">
                  <strong>Telefone:</strong> {selectedAttendance.callerPhone}
                </Typography>
                <Typography variant="body2">
                  <strong>Relação:</strong> {selectedAttendance.relationship}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Dados do Paciente
                </Typography>
                <Typography variant="body2">
                  <strong>Nome:</strong> {selectedAttendance.patientName}
                </Typography>
                <Typography variant="body2">
                  <strong>Documento:</strong> {selectedAttendance.patientDocument || 'Não informado'}
                </Typography>
                <Typography variant="body2">
                  <strong>Idade:</strong> {selectedAttendance.patientAge || 'Não informada'}
                </Typography>
                <Typography variant="body2">
                  <strong>Sexo:</strong> {selectedAttendance.patientGender}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Condição Médica
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedAttendance.medicalCondition}
                </Typography>
                
                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                  {getPriorityChip(selectedAttendance.priority)}
                  {getUrgencyChip(selectedAttendance.urgencyCode)}
                  {getStatusChip(selectedAttendance.status)}
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Localização
                </Typography>
                <Typography variant="body2">
                  <strong>Endereço:</strong> {selectedAttendance.originAddress}
                </Typography>
                {selectedAttendance.originReference && (
                  <Typography variant="body2">
                    <strong>Referência:</strong> {selectedAttendance.originReference}
                  </Typography>
                )}
                {selectedAttendance.preferredHospital && (
                  <Typography variant="body2">
                    <strong>Hospital Preferido:</strong> {selectedAttendance.preferredHospital}
                  </Typography>
                )}
              </Grid>
              
              {selectedAttendance.observations && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Observações
                  </Typography>
                  <Typography variant="body2">
                    {selectedAttendance.observations}
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Aprovação */}
      <Dialog
        open={approveDialog}
        onClose={() => setApproveDialog(false)}
      >
        <DialogTitle>Confirmar Aprovação</DialogTitle>
        <DialogContent>
          <Typography>
            Deseja aprovar o atendimento <strong>{selectedAttendance?.attendanceNumber}</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Uma corrida será criada automaticamente após a aprovação.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialog(false)}>Cancelar</Button>
          <Button onClick={handleApprove} color="success" variant="contained">
            Aprovar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Negação */}
      <Dialog
        open={rejectDialog}
        onClose={() => setRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Negar Atendimento</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Informe o motivo para negar o atendimento <strong>{selectedAttendance?.attendanceNumber}</strong>:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Digite o motivo da negação..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={!rejectionReason.trim()}
          >
            Negar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceList;