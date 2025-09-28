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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  AutoAwesome,
  Psychology,
  CheckCircle,
  Schedule,
  DirectionsCar,
  LocalHospital,
  Person,
  Assignment,
  Speed,
  TrendingUp
} from '@mui/icons-material';

const IntelligentDistributionPanel = ({ open, onClose }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pendingAttendances, setPendingAttendances] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [distributionResult, setDistributionResult] = useState(null);
  const [distributionProgress, setDistributionProgress] = useState(0);

  const steps = [
    'Análise de Atendimentos Pendentes',
    'Avaliação de Motoristas Disponíveis',
    'Cálculo de Distribuição Inteligente',
    'Execução da Distribuição',
    'Resultados e Confirmação'
  ];

  // Carregar dados para distribuição
  const loadDistributionData = async () => {
    setLoading(true);
    try {
      // Carregar atendimentos pendentes
      const attendancesResponse = await fetch('/api/attendances?status=Recebida', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (attendancesResponse.ok) {
        const attendancesData = await attendancesResponse.json();
        setPendingAttendances(attendancesData.data || []);
      }

      // Carregar motoristas disponíveis
      const driversResponse = await fetch('/api/driver-management/workload-dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        setAvailableDrivers(driversData.data.drivers || []);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Executar distribuição inteligente
  const executeDistribution = async () => {
    setLoading(true);
    setActiveStep(3);
    setDistributionProgress(0);

    // Simular progresso
    const progressInterval = setInterval(() => {
      setDistributionProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await fetch('/api/attendances/multi-driver-dispatch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setDistributionResult(result);
        setDistributionProgress(100);
        setActiveStep(4);
        
        // Recarregar dados após distribuição
        setTimeout(() => {
          loadDistributionData();
        }, 1000);
      }
    } catch (error) {
      console.error('Erro na distribuição:', error);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadDistributionData();
      setActiveStep(0);
      setDistributionResult(null);
      setDistributionProgress(0);
    }
  }, [open]);

  const handleNext = () => {
    if (activeStep === 2) {
      executeDistribution();
    } else {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const getDriverStatusColor = (driver) => {
    const totalLoad = driver.workload.pending + driver.workload.active;
    if (totalLoad === 0) return 'success';
    if (totalLoad <= 2) return 'info';
    if (totalLoad <= 4) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Crítica': return 'error';
      case 'Alta': return 'warning';
      case 'Média': return 'info';
      case 'Baixa': return 'success';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AutoAwesome sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5">🧠 Distribuição Inteligente de Corridas</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {/* Passo 1: Análise de Atendimentos */}
          <Step>
            <StepLabel>
              <Typography variant="h6">📋 Análise de Atendimentos Pendentes</Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {pendingAttendances.length} atendimentos aguardando distribuição
                </Typography>

                {pendingAttendances.length > 0 ? (
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Nº Atendimento</TableCell>
                          <TableCell>Paciente</TableCell>
                          <TableCell>Prioridade</TableCell>
                          <TableCell>Origem</TableCell>
                          <TableCell>Destino</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingAttendances.slice(0, 10).map((attendance) => (
                          <TableRow key={attendance.id}>
                            <TableCell>{attendance.attendanceNumber}</TableCell>
                            <TableCell>{attendance.patientName}</TableCell>
                            <TableCell>
                              <Chip 
                                label={attendance.priority} 
                                color={getPriorityColor(attendance.priority)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{attendance.originAddress?.substring(0, 30)}...</TableCell>
                            <TableCell>{attendance.destinationAddress?.substring(0, 30)}...</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">✅ Nenhum atendimento pendente no momento</Alert>
                )}

                <Box sx={{ mt: 2 }}>
                  <Button variant="contained" onClick={handleNext} disabled={loading}>
                    Próxima Etapa
                  </Button>
                </Box>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 2: Avaliação de Motoristas */}
          <Step>
            <StepLabel>
              <Typography variant="h6">👥 Avaliação de Motoristas Disponíveis</Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {availableDrivers.length} motoristas no sistema
                </Typography>

                <Grid container spacing={2}>
                  {availableDrivers.map((driver) => (
                    <Grid item xs={12} md={6} lg={4} key={driver.driverId}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Avatar sx={{ mr: 2, bgcolor: getDriverStatusColor(driver) + '.main' }}>
                              <Person />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {driver.driverName}
                              </Typography>
                              <Chip 
                                label={driver.status} 
                                color={getDriverStatusColor(driver)} 
                                size="small" 
                              />
                            </Box>
                          </Box>

                          <Divider sx={{ my: 1 }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Carga Atual:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {driver.workload.pending + driver.workload.active}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2">Performance:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {driver.workload.performanceScore}%
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Hoje:</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {driver.workload.todayCompleted} corridas
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button variant="outlined" onClick={handleBack} sx={{ mr: 1 }}>
                    Voltar
                  </Button>
                  <Button variant="contained" onClick={handleNext}>
                    Próxima Etapa
                  </Button>
                </Box>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 3: Cálculo Inteligente */}
          <Step>
            <StepLabel>
              <Typography variant="h6">🧠 Cálculo de Distribuição Inteligente</Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Analisando os melhores motoristas para cada atendimento baseado em:
                </Typography>

                <List dense>
                  <ListItem>
                    <ListItemText primary="• Carga de trabalho atual (30%)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Histórico de performance (25%)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Prioridade do atendimento (20%)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Disponibilidade temporal (15%)" />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="• Balanceamento de distribuição (10%)" />
                  </ListItem>
                </List>

                <Alert severity="info" sx={{ mt: 2 }}>
                  🎯 O algoritmo irá selecionar automaticamente o melhor motorista para cada corrida,
                  evitando sobrecarga e maximizando a eficiência do sistema.
                </Alert>

                <Box sx={{ mt: 3 }}>
                  <Button variant="outlined" onClick={handleBack} sx={{ mr: 1 }}>
                    Voltar
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleNext}
                    startIcon={<Psychology />}
                    size="large"
                  >
                    🚀 Executar Distribuição Inteligente
                  </Button>
                </Box>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 4: Execução */}
          <Step>
            <StepLabel>
              <Typography variant="h6">⚡ Executando Distribuição</Typography>
            </StepLabel>
            <StepContent>
              <Box sx={{ mb: 2, textAlign: 'center' }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Processando distribuição inteligente...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={distributionProgress} 
                  sx={{ width: '100%', height: 8, borderRadius: 4 }}
                />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {distributionProgress}% concluído
                </Typography>
              </Box>
            </StepContent>
          </Step>

          {/* Passo 5: Resultados */}
          <Step>
            <StepLabel>
              <Typography variant="h6">✅ Resultados da Distribuição</Typography>
            </StepLabel>
            <StepContent>
              {distributionResult && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="h6">
                      🎉 Distribuição concluída com sucesso!
                    </Typography>
                    <Typography>
                      {distributionResult.processed} corridas distribuídas entre {distributionResult.driversUsed} motoristas
                    </Typography>
                  </Alert>

                  {/* Resumo por Motorista */}
                  {distributionResult.driverSummary && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        📊 Resumo por Motorista:
                      </Typography>
                      <Grid container spacing={2}>
                        {distributionResult.driverSummary.map((driver) => (
                          <Grid item xs={12} md={6} key={driver.driverId}>
                            <Card>
                              <CardContent>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  {driver.driverName}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                  {driver.email}
                                </Typography>
                                <Chip 
                                  label={`${driver.ridesAssigned} corridas atribuídas`}
                                  color="primary"
                                  sx={{ mb: 2 }}
                                />
                                <List dense>
                                  {driver.rides.map((ride, index) => (
                                    <ListItem key={index} sx={{ py: 0 }}>
                                      <ListItemText
                                        primary={`${ride.rideNumber}: ${ride.patientName}`}
                                        secondary={
                                          <Chip 
                                            label={ride.priority} 
                                            size="small" 
                                            color={getPriorityColor(ride.priority)}
                                          />
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              )}
            </StepContent>
          </Step>
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Fechar
        </Button>
        {distributionResult && (
          <Button 
            onClick={() => window.location.reload()} 
            variant="contained"
            color="primary"
          >
            🔄 Atualizar Dashboard
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default IntelligentDistributionPanel;