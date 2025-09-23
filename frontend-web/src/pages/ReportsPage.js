import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as ReportIcon,
  DateRange as DateIcon,
  TrendingUp as TrendingUpIcon,
  DirectionsCar as VehicleIcon,
  Person as DriverIcon,
  Assignment as RideIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ReportsPage = () => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)),
    end: new Date()
  });
  const [reportType, setReportType] = useState('rides');
  const [periodType, setPeriodType] = useState('monthly');

  // Dados simulados para relatórios
  const reportData = {
    summary: {
      totalRides: 1847,
      completedRides: 1698,
      cancelledRides: 149,
      totalDistance: 12450.8,
      totalDuration: 45230,
      avgResponseTime: 8.5,
      activeVehicles: 12,
      activeDrivers: 18
    },
    ridesByStatus: [
      { status: 'Concluídas', value: 1698, percentage: 92 },
      { status: 'Canceladas', value: 149, percentage: 8 }
    ],
    ridesByPriority: [
      { priority: 'Urgente', value: 247, color: '#f44336' },
      { priority: 'Alta', value: 589, color: '#ff9800' },
      { priority: 'Média', value: 743, color: '#2196f3' },
      { priority: 'Baixa', value: 268, color: '#4caf50' }
    ],
    vehiclePerformance: [
      { plate: 'AMB-001', totalRides: 234, avgRating: 4.8, totalDistance: 1250.5 },
      { plate: 'AMB-002', totalRides: 198, avgRating: 4.6, totalDistance: 1089.2 },
      { plate: 'AMB-003', totalRides: 176, avgRating: 4.9, totalDistance: 945.8 }
    ],
    driverPerformance: [
      { name: 'Pedro Costa', totalRides: 156, avgRating: 4.9, totalHours: 78.5 },
      { name: 'Carlos Mendes', totalRides: 143, avgRating: 4.7, totalHours: 71.2 },
      { name: 'Ana Silva', totalRides: 134, avgRating: 4.8, totalHours: 67.8 }
    ]
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    
    // Simular geração de relatório
    setTimeout(() => {
      setLoading(false);
      console.log('Relatório gerado:', { reportType, periodType, dateRange });
    }, 2000);
  };

  const handleExportReport = (format) => {
    console.log('Exportando relatório em formato:', format);
    // TODO: Implementar exportação real
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDistance = (km) => {
    return `${km.toLocaleString('pt-BR')} km`;
  };

  const SummaryCard = ({ title, value, subtitle, icon: Icon, color = 'primary' }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              color: 'white',
              mr: 2
            }}
          >
            <Icon />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Relatórios e Análises
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visualize estatísticas e gere relatórios detalhados do sistema
          </Typography>
        </Box>

        {/* Filtros de Relatório */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configurações do Relatório
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Relatório</InputLabel>
                  <Select
                    value={reportType}
                    label="Tipo de Relatório"
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <MenuItem value="rides">Corridas</MenuItem>
                    <MenuItem value="vehicles">Veículos</MenuItem>
                    <MenuItem value="drivers">Motoristas</MenuItem>
                    <MenuItem value="performance">Performance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={periodType}
                    label="Período"
                    onChange={(e) => setPeriodType(e.target.value)}
                  >
                    <MenuItem value="daily">Diário</MenuItem>
                    <MenuItem value="weekly">Semanal</MenuItem>
                    <MenuItem value="monthly">Mensal</MenuItem>
                    <MenuItem value="custom">Personalizado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {periodType === 'custom' && (
                <>
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="Data Inicial"
                      type="date"
                      value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      label="Data Final"
                      type="date"
                      value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ''}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    onClick={handleGenerateReport}
                    disabled={loading}
                    startIcon={loading ? <LoadingSpinner size={20} /> : <ReportIcon />}
                    fullWidth
                  >
                    {loading ? 'Gerando...' : 'Gerar'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Total de Corridas"
              value={reportData.summary.totalRides.toLocaleString()}
              subtitle={`${reportData.summary.completedRides} concluídas`}
              icon={RideIcon}
              color="primary"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Distância Total"
              value={formatDistance(reportData.summary.totalDistance)}
              subtitle="Últimos 30 dias"
              icon={TrendingUpIcon}
              color="success"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Veículos Ativos"
              value={reportData.summary.activeVehicles}
              subtitle="Disponíveis agora"
              icon={VehicleIcon}
              color="info"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <SummaryCard
              title="Motoristas Ativos"
              value={reportData.summary.activeDrivers}
              subtitle="Online no sistema"
              icon={DriverIcon}
              color="warning"
            />
          </Grid>
        </Grid>

        {/* Gráficos e Tabelas */}
        <Grid container spacing={3}>
          {/* Corridas por Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Corridas por Status
                </Typography>
                
                {reportData.ridesByStatus.map((item, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{item.status}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {item.value} ({item.percentage}%)
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        bgcolor: 'grey.200',
                        borderRadius: 4,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: `${item.percentage}%`,
                          height: '100%',
                          bgcolor: index === 0 ? 'success.main' : 'error.main'
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Corridas por Prioridade */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Corridas por Prioridade
                </Typography>
                
                <Grid container spacing={2}>
                  {reportData.ridesByPriority.map((item, index) => (
                    <Grid item xs={6} key={index}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Box
                          sx={{
                            width: 60,
                            height: 60,
                            borderRadius: '50%',
                            bgcolor: item.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mx: 'auto',
                            mb: 1
                          }}
                        >
                          <Typography variant="h6" color="white" fontWeight="bold">
                            {item.value}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="medium">
                          {item.priority}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance dos Veículos */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Performance dos Veículos
                  </Typography>
                  <Box>
                    <Tooltip title="Exportar Excel">
                      <IconButton onClick={() => handleExportReport('excel')}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Veículo</TableCell>
                        <TableCell align="center">Total de Corridas</TableCell>
                        <TableCell align="center">Avaliação Média</TableCell>
                        <TableCell align="center">Distância Total</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.vehiclePerformance.map((vehicle, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {vehicle.plate}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{vehicle.totalRides}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={`${vehicle.avgRating} ★`} 
                              color="success" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="center">
                            {formatDistance(vehicle.totalDistance)}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver detalhes">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance dos Motoristas */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Performance dos Motoristas
                  </Typography>
                  <Box>
                    <Tooltip title="Exportar PDF">
                      <IconButton onClick={() => handleExportReport('pdf')}>
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Motorista</TableCell>
                        <TableCell align="center">Total de Corridas</TableCell>
                        <TableCell align="center">Avaliação Média</TableCell>
                        <TableCell align="center">Horas Trabalhadas</TableCell>
                        <TableCell align="center">Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.driverPerformance.map((driver, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {driver.name}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{driver.totalRides}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={`${driver.avgRating} ★`} 
                              color="success" 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="center">
                            {driver.totalHours}h
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver detalhes">
                              <IconButton size="small">
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default ReportsPage;