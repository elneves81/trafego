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
  Security
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketCompatibility';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const DashboardPage = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { connected } = useSocket();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    vehiclesInMaintenance: 0,
    vehiclesWithProblems: 0,
    activeRides: 0,
    pendingRides: 0,
    emergencyRides: 0,
    completedRides: 0,
    totalDrivers: 0,
    onlineDrivers: 0,
    driversInShift: 0,
    expiredLicenses: 0,
    expiringLicenses: 0
  });
  
  const [alerts, setAlerts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [shiftMetrics, setShiftMetrics] = useState({
    currentShift: 'Manhã',
    shiftStart: '06:00',
    shiftEnd: '14:00',
    activeTeams: 8,
    totalTeams: 12
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // TODO: Implementar chamadas reais para a API
      // Simulando dados para demonstração
      setTimeout(() => {
        setStats({
          totalVehicles: 15,
          availableVehicles: 8,
          activeRides: 12,
          completedRides: 89,
          totalDrivers: 20,
          onlineDrivers: 14
        });

        setRecentActivities([
          {
            id: 1,
            type: 'ride_created',
            title: 'Nova corrida criada',
            description: 'Corrida #1234 - Hospital Central para UPA Norte',
            time: '5 min atrás',
            status: 'info'
          },
          {
            id: 2,
            type: 'ride_completed',
            title: 'Corrida finalizada',
            description: 'Corrida #1231 finalizada com sucesso',
            time: '12 min atrás',
            status: 'success'
          },
          {
            id: 3,
            type: 'vehicle_maintenance',
            title: 'Veículo em manutenção',
            description: 'AMB-005 foi marcado para manutenção preventiva',
            time: '25 min atrás',
            status: 'warning'
          },
          {
            id: 4,
            type: 'driver_online',
            title: 'Motorista conectado',
            description: 'João Silva entrou no sistema',
            time: '35 min atrás',
            status: 'success'
          }
        ]);
        
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, total, icon: Icon, color, percentage }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            <Icon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div" fontWeight="bold">
              {value}
              {total && (
                <Typography component="span" variant="h6" color="text.secondary">
                  /{total}
                </Typography>
              )}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        
        {percentage !== undefined && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Taxa de utilização
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: `${color}.main`
                }
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type, status) => {
    switch (type) {
      case 'ride_created':
        return <Assignment color={status === 'info' ? 'info' : 'primary'} />;
      case 'ride_completed':
        return <CheckCircle color="success" />;
      case 'vehicle_maintenance':
        return <Warning color="warning" />;
      case 'driver_online':
        return <Person color="success" />;
      default:
        return <Circle color="primary" />;
    }
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting;
    
    if (hour < 12) greeting = 'Bom dia';
    else if (hour < 18) greeting = 'Boa tarde';
    else greeting = 'Boa noite';
    
    return `${greeting}, ${user?.name?.split(' ')[0]}!`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <LoadingSpinner size={60} />
      </Box>
    );
  }

  const vehicleUtilization = Math.round((stats.activeRides / stats.totalVehicles) * 100);
  const driverUtilization = Math.round((stats.onlineDrivers / stats.totalDrivers) * 100);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              {getWelcomeMessage()}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Bem-vindo ao painel de controle da Central de Ambulâncias
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<Circle />}
              label={connected ? 'Sistema Online' : 'Desconectado'}
              color={connected ? 'success' : 'error'}
            />
            <IconButton onClick={loadDashboardData} disabled={loading}>
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Cards de Estatísticas */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Veículos Disponíveis"
            value={stats.availableVehicles}
            total={stats.totalVehicles}
            icon={DirectionsCar}
            color="primary"
            percentage={Math.round((stats.availableVehicles / stats.totalVehicles) * 100)}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Corridas Ativas"
            value={stats.activeRides}
            icon={LocalHospital}
            color="error"
            percentage={vehicleUtilization}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Motoristas Online"
            value={stats.onlineDrivers}
            total={stats.totalDrivers}
            icon={Person}
            color="success"
            percentage={driverUtilization}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Corridas Finalizadas"
            value={stats.completedRides}
            icon={CheckCircle}
            color="info"
          />
        </Grid>

        {/* Atividades Recentes */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2" fontWeight="bold">
                  Atividades Recentes
                </Typography>
                <Chip
                  icon={<AccessTime />}
                  label="Tempo Real"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Box>

              <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                {recentActivities.map((activity, index) => (
                  <ListItem
                    key={activity.id}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 2,
                      mb: 1,
                      '&:last-child': { mb: 0 }
                    }}
                  >
                    <ListItemIcon>
                      {getActivityIcon(activity.type, activity.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {activity.time}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Rápido */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
                Status do Sistema
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: theme.palette.success.light,
                    color: theme.palette.success.contrastText
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CheckCircle sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Servidor Principal
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    Funcionando normalmente
                  </Typography>
                </Paper>

                <Paper
                  sx={{
                    p: 2,
                    mb: 2,
                    bgcolor: connected ? theme.palette.success.light : theme.palette.error.light,
                    color: connected ? theme.palette.success.contrastText : theme.palette.error.contrastText
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Circle sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      WebSocket
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {connected ? 'Conectado' : 'Desconectado'}
                  </Typography>
                </Paper>

                <Paper
                  sx={{
                    p: 2,
                    bgcolor: theme.palette.info.light,
                    color: theme.palette.info.contrastText
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Performance
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    Sistema funcionando em {Math.round(Math.random() * 10 + 90)}% da capacidade
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;