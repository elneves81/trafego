import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Badge,
  Alert,
  AlertTitle,
  Divider,
  useTheme
} from '@mui/material';
import {
  DirectionsCar,
  Person,
  Assignment,
  TrendingUp,
  Circle,
  Refresh,
  LocalHospital,
  CheckCircle,
  Warning,
  AccessTime,
  Build,
  Notifications,
  CreditCard,
  People,
  CarRepair,
  Schedule,
  PriorityHigh as Priority,
  Chat,
  LocalHospital as Emergency,
  MonitorHeart,
  Security,
  Add
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const DashboardAdminPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { connected } = useSocket();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 15,
    availableVehicles: 8,
    vehiclesInMaintenance: 2,
    vehiclesWithProblems: 1,
    activeRides: 12,
    pendingRides: 5,
    emergencyRides: 2,
    completedRidesHour: 18,
    completedRidesDay: 145,
    totalDrivers: 45,
    onlineDrivers: 28,
    driversInShift: 24,
    expiredLicenses: 3,
    expiringLicenses: 7,
    averageResponseTime: 8.5
  });
  
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'error',
      title: 'CNH Vencida',
      message: 'João Silva - CNH vencida há 3 dias',
      timestamp: new Date(),
      urgent: true
    },
    {
      id: 2,
      type: 'warning',
      title: 'Manutenção Preventiva',
      message: 'Ambulância AMB-001 precisa de revisão',
      timestamp: new Date(),
      urgent: false
    },
    {
      id: 3,
      type: 'info',
      title: 'CNH Vencendo',
      message: '7 motoristas com CNH vencendo em 30 dias',
      timestamp: new Date(),
      urgent: false
    }
  ]);

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'ride_completed',
      message: 'Corrida finalizada - Hospital Central',
      driver: 'Carlos Santos',
      vehicle: 'AMB-003',
      timestamp: '10:45'
    },
    {
      id: 2,
      type: 'emergency',
      message: 'Chamada de emergência aceita',
      driver: 'Ana Costa',
      vehicle: 'AMB-001',
      timestamp: '10:42'
    },
    {
      id: 3,
      type: 'maintenance',
      message: 'Veículo enviado para manutenção',
      vehicle: 'AMB-007',
      timestamp: '10:30'
    },
    {
      id: 4,
      type: 'user_created',
      message: 'Novo motorista cadastrado',
      user: 'Pedro Oliveira',
      timestamp: '09:15'
    }
  ]);

  const [shiftMetrics, setShiftMetrics] = useState({
    currentShift: 'Manhã',
    shiftStart: '06:00',
    shiftEnd: '14:00',
    activeTeams: 8,
    totalTeams: 12,
    nextShift: 'Tarde (14:00-22:00)'
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Implementar chamadas reais para a API
      // Por enquanto, simulando carregamento
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return theme.palette.success.main;
      case 'busy': return theme.palette.warning.main;
      case 'maintenance': return theme.palette.error.main;
      case 'offline': return theme.palette.grey[400];
      default: return theme.palette.primary.main;
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, actionLabel, onAction, alert }) => (
    <Card sx={{ height: '100%', position: 'relative' }}>
      {alert && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 12,
            height: 12,
            backgroundColor: 'error.main',
            borderRadius: '50%',
            animation: 'pulse 2s infinite'
          }}
        />
      )}
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Avatar sx={{ backgroundColor: color, width: 48, height: 48 }}>
            <Icon />
          </Avatar>
          {actionLabel && (
            <Button size="small" variant="outlined" onClick={onAction} startIcon={<Add />}>
              {actionLabel}
            </Button>
          )}
        </Box>
        <Typography variant="h4" fontWeight="bold" color="text.primary">
          {value}
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  const AlertCard = ({ alert }) => (
    <Alert 
      severity={alert.type} 
      action={
        <IconButton size="small" color="inherit">
          <CheckCircle fontSize="small" />
        </IconButton>
      }
      sx={{ mb: 1 }}
    >
      <AlertTitle>{alert.title}</AlertTitle>
      {alert.message}
    </Alert>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Painel Administrativo
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Sistema de Gestão de Ambulâncias - Plantão {shiftMetrics.currentShift}
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Chip 
            icon={<Schedule />} 
            label={`${shiftMetrics.shiftStart} às ${shiftMetrics.shiftEnd}`} 
            color="primary" 
            variant="outlined"
          />
          <Chip 
            icon={connected ? <CheckCircle /> : <Warning />} 
            label={connected ? 'Sistema Online' : 'Sistema Offline'} 
            color={connected ? 'success' : 'error'}
          />
          <IconButton onClick={loadDashboardData} title="Atualizar dados">
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {/* Alertas Críticos */}
      {alerts.filter(alert => alert.urgent).length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom color="error">
            <Warning /> Alertas Críticos
          </Typography>
          {alerts.filter(alert => alert.urgent).map(alert => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Métricas Principais */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ambulâncias Ativas"
            value={stats.availableVehicles}
            subtitle={`${stats.totalVehicles} total na frota`}
            icon={LocalHospital}
            color={theme.palette.success.main}
            actionLabel="Adicionar"
            alert={stats.vehiclesWithProblems > 0}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Corridas em Andamento"
            value={stats.activeRides}
            subtitle={`${stats.emergencyRides} emergências`}
            icon={Emergency}
            color={theme.palette.warning.main}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Motoristas em Plantão"
            value={stats.driversInShift}
            subtitle={`${stats.onlineDrivers} online agora`}
            icon={People}
            color={theme.palette.primary.main}
            actionLabel="Cadastrar"
            alert={stats.expiredLicenses > 0}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Tempo Médio Resposta"
            value={`${stats.averageResponseTime} min`}
            subtitle={`${stats.completedRidesHour} corridas/hora`}
            icon={AccessTime}
            color={theme.palette.info.main}
          />
        </Grid>

        {/* Métricas Secundárias */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Fila de Espera"
            value={stats.pendingRides}
            subtitle="Aguardando atendimento"
            icon={Priority}
            color={theme.palette.error.main}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Em Manutenção"
            value={stats.vehiclesInMaintenance}
            subtitle="Veículos indisponíveis"
            icon={Build}
            color={theme.palette.grey[600]}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="CNH Vencidas"
            value={stats.expiredLicenses}
            subtitle={`${stats.expiringLicenses} vencendo em 30d`}
            icon={CreditCard}
            color={theme.palette.error.main}
            alert={stats.expiredLicenses > 0}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Corridas Hoje"
            value={stats.completedRidesDay}
            subtitle="Total finalizado"
            icon={Assignment}
            color={theme.palette.success.main}
          />
        </Grid>

        {/* Alertas e Notificações */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  <Notifications /> Alertas do Sistema
                </Typography>
                <Badge badgeContent={alerts.length} color="error">
                  <Button variant="outlined" size="small">
                    Ver Todos
                  </Button>
                </Badge>
              </Box>
              <Box sx={{ maxHeight: '320px', overflow: 'auto' }}>
                {alerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Atividades Recentes */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '400px' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUp /> Atividades Recentes
              </Typography>
              <List sx={{ maxHeight: '320px', overflow: 'auto' }}>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem>
                      <ListItemIcon>
                        <Circle 
                          sx={{ 
                            fontSize: 12,
                            color: activity.type === 'emergency' ? 'error.main' : 'primary.main'
                          }} 
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.message}
                        secondary={
                          <Box>
                            {activity.driver && `Motorista: ${activity.driver}`}
                            {activity.vehicle && ` • Veículo: ${activity.vehicle}`}
                            {activity.user && `Usuário: ${activity.user}`}
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {activity.timestamp}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Informações do Plantão */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Schedule /> Controle de Plantão
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Plantão Atual
                </Typography>
                <Typography variant="h6">
                  {shiftMetrics.currentShift} ({shiftMetrics.shiftStart} - {shiftMetrics.shiftEnd})
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Equipes Ativas
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">
                    {shiftMetrics.activeTeams}/{shiftMetrics.totalTeams}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(shiftMetrics.activeTeams / shiftMetrics.totalTeams) * 100}
                    sx={{ flexGrow: 1 }}
                  />
                </Box>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Próximo Plantão
                </Typography>
                <Typography variant="body1">
                  {shiftMetrics.nextShift}
                </Typography>
              </Box>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<People />}
              >
                Gerenciar Escalas
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Ações Rápidas */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security /> Ações Administrativas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    color="primary"
                  >
                    Nova Ambulância
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Person />}
                    color="secondary"
                  >
                    Cadastrar Motorista
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Build />}
                  >
                    Manutenção
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Assignment />}
                  >
                    Relatórios
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardAdminPage;