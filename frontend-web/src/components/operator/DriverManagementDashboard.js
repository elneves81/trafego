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
  Alert,
  Fab,
  Tooltip,
  LinearProgress,
  Avatar,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  DirectionsCar,
  Warning,
  CheckCircle,
  Error,
  Schedule,
  PersonOff,
  Assignment,
  Speed,
  LocationOn,
  Phone,
  Refresh,
  AutoAwesome,
  Psychology,
  Balance,
  Visibility,
  VisibilityOff,
  Block,
  TaskAlt,
  LocalHospital
} from '@mui/icons-material';

const DriverManagementDashboard = () => {
  const [drivers, setDrivers] = useState([]);
  const [workloadData, setWorkloadData] = useState(null);
  const [fujaoDetection, setFujaoDetection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [autoDistribution, setAutoDistribution] = useState(false);
  const [showFujaoOnly, setShowFujaoOnly] = useState(false);

  // Carregar dados dos motoristas
  const loadDriverData = async () => {
    try {
      setLoading(true);
      
      // Carregar dashboard de carga de trabalho
      const workloadResponse = await fetch('/api/driver-management/workload-dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (workloadResponse.ok) {
        const workloadData = await workloadResponse.json();
        setWorkloadData(workloadData.data);
        setDrivers(workloadData.data.drivers);
        
        // Detectar fujões
        detectFujoes(workloadData.data.drivers);
      }
    } catch (error) {
      console.error('Erro ao carregar dados dos motoristas:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔍 ALGORITMO DE DETECÇÃO DE FUJÕES
  const detectFujoes = (driversData) => {
    const fujoes = driversData.filter(driver => {
      const workload = driver.workload;
      const totalCurrent = workload.pending + workload.active;
      
      // Critérios para identificar fujão:
      return (
        // 1. Zero corridas enquanto outros têm muito trabalho
        (totalCurrent === 0 && workload.todayCompleted === 0) ||
        // 2. Performance muito baixa (menos de 50%)
        workload.performanceScore < 50 ||
        // 3. Muitos cancelamentos esta semana
        (workload.weekCancelled > 2 && workload.weekCompleted < 3) ||
        // 4. Status suspeito (disponível mas sem pegar corridas)
        (driver.status === 'Disponível' && totalCurrent === 0 && workload.todayCompleted === 0)
      );
    });

    setFujaoDetection(fujoes);
  };

  // Distribuição inteligente automática
  const executeIntelligentDistribution = async () => {
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
        alert(`✅ Distribuição concluída! ${result.processed} corridas distribuídas entre ${result.driversUsed} motoristas`);
        loadDriverData(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro na distribuição inteligente:', error);
      alert('❌ Erro na distribuição automática');
    }
  };

  // Balanceamento de carga
  const executeLoadBalancing = async () => {
    try {
      const response = await fetch('/api/driver-management/balance-workload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`⚖️ Balanceamento concluído! ${result.redistributed} corridas redistribuídas`);
        loadDriverData(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro no balanceamento:', error);
      alert('❌ Erro no balanceamento automático');
    }
  };

  // Cores para status dos motoristas
  const getStatusColor = (driver) => {
    if (fujaoDetection.find(f => f.driverId === driver.driverId)) return 'error';
    switch (driver.statusColor) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  // Ícone para status do motorista
  const getStatusIcon = (driver) => {
    const isFujao = fujaoDetection.find(f => f.driverId === driver.driverId);
    if (isFujao) return <PersonOff />;
    
    switch (driver.status) {
      case 'Disponível': return <CheckCircle />;
      case 'Em Corrida': return <DirectionsCar />;
      case 'Sobrecarregado': return <Warning />;
      default: return <Schedule />;
    }
  };

  useEffect(() => {
    loadDriverData();
    const interval = setInterval(loadDriverData, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const filteredDrivers = showFujaoOnly 
    ? drivers.filter(d => fujaoDetection.find(f => f.driverId === d.driverId))
    : drivers;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>🔄 Carregando Dashboard...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header com Estatísticas */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Psychology sx={{ mr: 2, color: 'primary.main' }} />
          Dashboard Anti-Fujão - Gestão Inteligente de Motoristas
        </Typography>

        {workloadData && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h4">{workloadData.summary.totalDrivers}</Typography>
                  <Typography variant="caption">Total Motoristas</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h4">{workloadData.summary.availableDrivers}</Typography>
                  <Typography variant="caption">Disponíveis</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h4">{workloadData.summary.busyDrivers}</Typography>
                  <Typography variant="caption">Ocupados</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h4">{fujaoDetection.length}</Typography>
                  <Typography variant="caption">🚨 Fujões</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h4">{workloadData.summary.utilizationRate}%</Typography>
                  <Typography variant="caption">Taxa Utilização</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center', py: 1 }}>
                  <Typography variant="h4">{workloadData.summary.overloadedDrivers}</Typography>
                  <Typography variant="caption">Sobrecarregados</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Controles de Ação */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AutoAwesome />}
            onClick={executeIntelligentDistribution}
            size="large"
          >
            🧠 Distribuição Inteligente
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Balance />}
            onClick={executeLoadBalancing}
            size="large"
          >
            ⚖️ Balancear Carga
          </Button>

          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadDriverData}
          >
            🔄 Atualizar
          </Button>

          <FormControlLabel
            control={
              <Switch
                checked={showFujaoOnly}
                onChange={(e) => setShowFujaoOnly(e.target.checked)}
                color="error"
              />
            }
            label="🚨 Mostrar apenas Fujões"
          />
        </Box>

        {/* Alertas de Fujões */}
        {fujaoDetection.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6">🚨 ALERTA: {fujaoDetection.length} motorista(s) com comportamento suspeito detectado!</Typography>
            <Typography>
              Motoristas fujões: {fujaoDetection.map(f => f.driverName).join(', ')}
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Lista de Motoristas */}
      <Grid container spacing={2}>
        {filteredDrivers.map((driver) => {
          const isFujao = fujaoDetection.find(f => f.driverId === driver.driverId);
          const workload = driver.workload;
          const totalCurrent = workload.pending + workload.active;

          return (
            <Grid item xs={12} md={6} lg={4} key={driver.driverId}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: isFujao ? '2px solid red' : 'none',
                  bgcolor: isFujao ? 'error.light' : 'background.paper',
                  position: 'relative'
                }}
              >
                {isFujao && (
                  <Chip
                    label="🚨 FUJÃO"
                    color="error"
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 'bold' }}
                  />
                )}

                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: getStatusColor(driver) + '.main' }}>
                      {getStatusIcon(driver)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {driver.driverName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {driver.email}
                      </Typography>
                    </Box>
                    <Chip
                      label={driver.status}
                      color={getStatusColor(driver)}
                      size="small"
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Carga de Trabalho */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      📊 Carga de Trabalho Atual
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Pendentes:</Typography>
                      <Chip label={workload.pending} color={workload.pending > 3 ? 'error' : 'default'} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Ativas:</Typography>
                      <Chip label={workload.active} color={workload.active > 0 ? 'warning' : 'default'} size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Total Atual:</Typography>
                      <Chip 
                        label={totalCurrent} 
                        color={totalCurrent > 4 ? 'error' : totalCurrent > 2 ? 'warning' : 'success'} 
                        size="small" 
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Performance */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      📈 Performance
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Hoje:</Typography>
                      <Typography variant="body2">{workload.todayCompleted} completadas</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Esta semana:</Typography>
                      <Typography variant="body2">{workload.weekCompleted} completadas</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Cancelamentos:</Typography>
                      <Chip 
                        label={workload.weekCancelled} 
                        color={workload.weekCancelled > 2 ? 'error' : 'default'} 
                        size="small" 
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Score:</Typography>
                      <Chip 
                        label={`${workload.performanceScore}%`}
                        color={workload.performanceScore < 50 ? 'error' : workload.performanceScore < 75 ? 'warning' : 'success'}
                        size="small"
                      />
                    </Box>
                  </Box>

                  {/* Veículo */}
                  {driver.vehicle && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          🚗 Veículo
                        </Typography>
                        <Typography variant="body2">
                          {driver.vehicle.model} - {driver.vehicle.plateNumber}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {driver.vehicle.vehicleType}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {/* Ações */}
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Phone />}
                      disabled={!driver.phone}
                    >
                      Ligar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Assignment />}
                      onClick={() => setSelectedDriver(driver)}
                    >
                      Detalhes
                    </Button>
                    {isFujao && (
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<Block />}
                      >
                        Ação
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* FABs de Ação Rápida */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <Tooltip title="Distribuição Inteligente Automática">
          <Fab 
            color="primary" 
            sx={{ mr: 1 }}
            onClick={executeIntelligentDistribution}
          >
            <AutoAwesome />
          </Fab>
        </Tooltip>
        <Tooltip title="Balancear Carga de Trabalho">
          <Fab 
            color="secondary"
            onClick={executeLoadBalancing}
          >
            <Balance />
          </Fab>
        </Tooltip>
      </Box>

      {/* Dialog de Detalhes do Motorista */}
      <Dialog
        open={selectedDriver !== null}
        onClose={() => setSelectedDriver(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedDriver && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2 }}>
                  {getStatusIcon(selectedDriver)}
                </Avatar>
                Detalhes: {selectedDriver.driverName}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Aqui seriam exibidos todos os detalhes, histórico, corridas atribuídas, 
                localização atual, etc.
              </Typography>
              {/* TODO: Implementar detalhes completos */}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedDriver(null)}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default DriverManagementDashboard;