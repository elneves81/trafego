import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSSE } from '../contexts/SSEContext';
import { api } from '../services/api';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  Button,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  DirectionsCar,
  PersonAdd,
  Assignment,
  Warning,
  CheckCircle,
  Schedule,
  LocationOn,
  Phone,
  Email,
  AccessTime,
  TrendingUp,
  LocalHospital,
  ReportProblem,
  Group,
  Badge,
  CalendarToday,
  Build,
  Assessment,
  Settings,
  Add,
  Edit,
  Visibility,
  CarRental,
  Security,
  EventAvailable,
  Error
} from '@mui/icons-material';

// Componente StatCard otimizado com React.memo
const StatCard = React.memo(({ title, value, icon: IconComponent, color, subtitle, loading }) => {
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${color}25`
        }
      }}
      role="region"
      aria-label={`Estatística: ${title}`}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar sx={{ bgcolor: color, mr: 2, width: 48, height: 48 }}>
            <IconComponent />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <LinearProgress sx={{ height: 4, borderRadius: 2 }} />
            ) : (
              <>
                <Typography variant="h4" component="div" color={color} fontWeight="bold">
                  {value}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {subtitle}
                  </Typography>
                )}
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

StatCard.displayName = 'StatCard';

// Componente AlertCard otimizado com React.memo
const AlertCard = React.memo(({ alerts, onResolveAlert, loading }) => {
  const urgentCount = useMemo(() => 
    alerts?.filter(alert => alert.priority === 'urgent')?.length || 0,
    [alerts]
  );

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alertas do Sistema
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', maxHeight: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Alertas do Sistema
          </Typography>
          {urgentCount > 0 && (
            <Chip 
              icon={<Warning />} 
              label={`${urgentCount} Urgente${urgentCount !== 1 ? 's' : ''}`}
              color="error" 
              size="small"
              aria-label={`${urgentCount} alertas urgentes`}
            />
          )}
        </Box>
      </CardContent>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {!alerts || alerts.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" textAlign="center">
              Nenhum alerta ativo no momento
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }} role="list" aria-label="Lista de alertas do sistema">
            {alerts.map((alert, index) => (
              <React.Fragment key={alert.id || index}>
                <ListItem 
                  sx={{ 
                    py: 2,
                    '&:hover': { backgroundColor: 'action.hover' }
                  }}
                  role="listitem"
                >
                  <ListItemIcon>
                    {alert.priority === 'urgent' ? (
                      <Warning color="error" />
                    ) : alert.priority === 'high' ? (
                      <Warning color="warning" />
                    ) : (
                      <Warning color="info" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle2" 
                        component="span"
                        color={alert.priority === 'urgent' ? 'error.main' : 'text.primary'}
                        gutterBottom
                      >
                        {alert.title || alert.message}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        {alert.description && (
                          <Typography variant="body2" component="span" color="text.secondary" sx={{ mb: 1 }}>
                            {alert.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          {alert.time && (
                            <Chip 
                              icon={<AccessTime />} 
                              label={new Date(alert.time).toLocaleTimeString('pt-BR')}
                              size="small" 
                              variant="outlined"
                            />
                          )}
                          {alert.location && (
                            <Chip 
                              icon={<LocationOn />} 
                              label={alert.location}
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                  <Box sx={{ ml: 2 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={() => onResolveAlert(alert.id)}
                      aria-label={`Resolver alerta: ${alert.title || alert.message}`}
                    >
                      Resolver
                    </Button>
                  </Box>
                </ListItem>
                {index < alerts.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Card>
  );
});

AlertCard.displayName = 'AlertCard';

// Componente principal DashboardAdminPage
const DashboardAdminPage = () => {
  const { user } = useAuth();
  const { lastMessage, isConnected } = useSSE();
  
  const online = typeof isConnected !== 'undefined' ? isConnected : false;
  
  const [dashboardData, setDashboardData] = useState({
    totalVehicles: 0,
    activeRides: 0,
    totalUsers: 0,
    systemAlerts: [],
    recentActivities: [],
    vehicleStatus: {},
    performanceMetrics: {},
    drivers: [],
    vehicles: [],
    cnhExpirations: [],
    cnhExpired: [],
    cnhValid: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isViewMode, setIsViewMode] = useState(false);

  // Função memoizada para carregar dados do dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [vehiclesResponse, ridesResponse, usersResponse, alertsResponse, driversResponse] = await Promise.all([
        api.get('/vehicles').catch(() => ({ data: [] })),
        api.get('/rides').catch(() => ({ data: [] })),
        api.get('/users').catch(() => ({ data: [] })),
        api.get('/system/alerts').catch(() => ({ data: [] })),
        api.get('/drivers').catch(() => ({ data: [] }))
      ]);

      const vehicles = vehiclesResponse.data || [];
      const rides = ridesResponse.data || [];
      const users = usersResponse.data || [];
      const alerts = alertsResponse.data || [];
      const drivers = driversResponse.data || [];

      // Garantir que vehicles seja um array - considerar estrutura da API
      const vehiclesArray = Array.isArray(vehicles) ? vehicles : 
                          (vehicles?.data?.vehicles || vehicles?.vehicles || vehicles?.data || []);
      const ridesArray = Array.isArray(rides) ? rides : 
                        (rides?.data?.rides || rides?.rides || rides?.data || []);
      const usersArray = Array.isArray(users) ? users : 
                        (users?.data?.users || users?.users || users?.data || []);
      const alertsArray = Array.isArray(alerts) ? alerts : 
                         (alerts?.data?.alerts || alerts?.alerts || alerts?.data || []);
      const driversArray = Array.isArray(drivers) ? drivers : 
                          (drivers?.data?.drivers || drivers?.drivers || drivers?.data || []);

      // Processar dados dos veículos
      const vehicleStatus = vehiclesArray.reduce((acc, vehicle) => {
        const status = vehicle.status || 'available';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Calcular rides ativas
      const activeRides = ridesArray.filter(ride => 
        ['pending', 'in_progress', 'assigned'].includes(ride.status)
      ).length;

      // Simular métricas de performance
      const performanceMetrics = {
        averageResponseTime: '4.2 min',
        completionRate: '94.5%',
        customerSatisfaction: '4.7/5.0'
      };

      // Calcular status das CNHs
      const today = new Date();
      const cnhExpirations = driversArray.filter(driver => {
        const expiryField = driver.cnh_expiry || driver.licenseExpiry;
        if (!expiryField) return false;
        const expiryDate = new Date(expiryField);
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0; // CNH vence em 30 dias ou menos
      });
      
      const cnhExpired = driversArray.filter(driver => {
        const expiryField = driver.cnh_expiry || driver.licenseExpiry;
        if (!expiryField) return false;
        const expiryDate = new Date(expiryField);
        return expiryDate < today; // CNH já vencida
      });
      
      const cnhValid = driversArray.filter(driver => {
        const expiryField = driver.cnh_expiry || driver.licenseExpiry;
        if (!expiryField) return false;
        const expiryDate = new Date(expiryField);
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 30; // CNH válida por mais de 30 dias
      });

      setDashboardData({
        totalVehicles: vehiclesArray.length,
        activeRides,
        totalUsers: usersArray.length,
        systemAlerts: alertsArray,
        recentActivities: ridesArray.slice(0, 5),
        vehicleStatus,
        performanceMetrics,
        drivers: driversArray,
        vehicles: vehiclesArray,
        cnhExpirations,
        cnhExpired,
        cnhValid
      });

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados do dashboard. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Função memoizada para resolver alertas
  const handleResolveAlert = useCallback(async (alertId) => {
    try {
      const response = await api.post(`/system/alerts/${alertId}/resolve`);

      if (response.status === 200) {
        setDashboardData(prev => ({
          ...prev,
          systemAlerts: prev.systemAlerts.filter(alert => alert.id !== alertId)
        }));
      }
    } catch (err) {
      console.error('Erro ao resolver alerta:', err);
    }
  }, []);

  // Funções para controle de tabs e dialogs
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleOpenDialog = useCallback((type, item = null, viewMode = false) => {
    setDialogType(type);
    setSelectedItem(item);
    setIsViewMode(viewMode);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedItem(null);
    setDialogType('');
    setIsViewMode(false);
  }, []);

  const handleSaveItem = useCallback(async (data) => {
    try {
      const endpoint = dialogType === 'driver' ? '/drivers' : '/vehicles';
      
      const toISODate = (d) => {
        if (!d) return undefined;
        // aceita 'YYYY-MM-DD' ou Date/strings e força YYYY-MM-DD
        const dt = typeof d === 'string' ? new Date(d) : d instanceof Date ? d : new Date(String(d));
        if (Number.isNaN(dt.getTime())) return undefined;
        const yyyy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, '0');
        const dd = String(dt.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };



      // Normalização dos campos conforme o tipo
      const payload = dialogType === 'driver'
        ? {
            name: data.name?.trim(),
            cpf: data.cpf?.replace(/\D/g, '').trim(), // Backend espera apenas números (11 dígitos)
            cnh: (data.cnh_number ?? data.cnh)?.toString().replace(/\D/g, '').trim(), // Backend espera apenas números (11 dígitos)
            cnh_category: data.cnh_category?.trim(),
            cnh_expiry: /^\d{4}-\d{2}-\d{2}$/.test(data.cnh_expiry || '') 
                          ? data.cnh_expiry 
                          : toISODate(data.cnh_expiry),
            phone: data.phone?.trim(), // Backend espera formato (00) 00000-0000
            email: data.email?.trim(),
            status: data.status === 'available' ? 'active' : 
                   data.status === 'inactive' ? 'inactive' : 
                   data.status === 'busy' ? 'active' : // Mantém como ativo mas podemos adicionar campo específico para busy
                   data.status === 'suspended' ? 'suspended' :
                   data.status || 'active'
          }
        : {
            plateNumber: data.license_plate?.toUpperCase().replace(/\s/g, ''),
            vehicleType: data.type || 'ambulance',
            model: data.model?.trim(),
            brand: data.brand?.trim() || 'Não informado',
            year: data.year ? Number(data.year) : new Date().getFullYear(),
            color: data.color?.trim() || 'Branco',
            capacity: data.capacity ? Number(data.capacity) : 4,
            status: data.status || 'available',
            odometer: data.mileage ? Number(data.mileage) : 0,
            notes: data.notes?.trim(),
            nextMaintenance: data.nextMaintenance ? toISODate(data.nextMaintenance) : undefined,
            lastMaintenance: data.lastMaintenance ? toISODate(data.lastMaintenance) : undefined
          };

      // Remove undefined, strings vazias e valores null (evita campos vazios no backend)
      Object.keys(payload).forEach(k => {
        if (payload[k] === undefined || payload[k] === '' || payload[k] === null) {
          delete payload[k];
        }
      });

      console.log('=== DEBUG FRONTEND ===');
      console.log('dialogType:', dialogType);
      console.log('isViewMode:', isViewMode);
      console.log('payload enviado:', JSON.stringify(payload, null, 2));

      const url = selectedItem ? `${endpoint}/${selectedItem.id}` : endpoint;
      const method = selectedItem ? 'put' : 'post';
      const response = await api[method](url, payload);

      if (response.status === 200 || response.status === 201) {
        loadDashboardData(); // Recarregar dados
        handleCloseDialog();
      }
    } catch (err) {
      console.error('Erro detalhado:', err.response?.data);
      console.error('Status:', err.response?.status);
      console.error('Errors array detalhado:');
      console.table(err.response?.data?.errors);
      err.response?.data?.errors?.forEach((error, index) => {
        console.log(`Error ${index}:`, error);
        console.log(`  - msg: ${error.msg}`);
        console.log(`  - param: ${error.param}`);
        console.log(`  - value: ${error.value}`);
      });
      
      const data = err.response?.data;
      // 1) Express-Validator: errors = [{ msg, param, ... }]
      if (Array.isArray(data?.errors)) {
        const msgs = data.errors.map(e =>
          e?.msg || e?.message || (e?.param ? `${e.param} inválido` : 'Campo inválido')
        );
        setError(`Erro de validação: ${msgs.join(' | ')}`);
      // 2) Laravel: errors = { field: [ 'msg1', 'msg2' ], ... }
      } else if (data?.errors && typeof data.errors === 'object') {
        const msgs = Object.values(data.errors).flat().map(String);
        setError(`Erro de validação: ${msgs.join(' | ')}`);
      } else {
        const backendMsg = data?.message || data?.error || err.message;
        setError(backendMsg ? `Erro ao salvar: ${backendMsg}` : 'Erro ao salvar: verifique os campos obrigatórios.');
      }
      console.error('Erro ao salvar:', err.response?.status, data || err.message);
    }
  }, [dialogType, selectedItem, loadDashboardData]);

  // Carregar dados iniciais
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Atualizar dados baseado em mensagens SSE
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
        
        if (message.type === 'dashboard_update' || message.type === 'ride_update') {
          loadDashboardData();
        } else if (message.type === 'system_alert') {
          setDashboardData(prev => ({
            ...prev,
            systemAlerts: [message.data, ...prev.systemAlerts]
          }));
        }
      } catch (err) {
        console.error('Erro ao processar mensagem SSE:', err);
      }
    }
  }, [lastMessage, loadDashboardData]);

  // Memoizar alertas urgentes
  const urgentAlerts = useMemo(() => 
    dashboardData?.systemAlerts?.filter(alert => alert.priority === 'urgent') || [],
    [dashboardData?.systemAlerts]
  );

  // Memoizar cálculo de preenchimento de turno
  const getShiftFill = useMemo(() => {
    const totalCapacity = (dashboardData?.totalVehicles || 0) * 3; // Assumindo 3 turnos
    const activeUsers = dashboardData?.totalUsers || 0;
    return totalCapacity > 0 ? Math.round((activeUsers / totalCapacity) * 100) : 0;
  }, [dashboardData?.totalVehicles, dashboardData?.totalUsers]);

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={loadDashboardData}>
            Tentar Novamente
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} role="main">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Dashboard Administrativo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bem-vindo(a), {user?.name || 'Administrador'}. Aqui está o resumo do sistema de transporte.
        </Typography>
      </Box>

      {/* Alert de erro */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Alertas Urgentes */}
      {urgentAlerts.length > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          icon={<ReportProblem />}
          action={
            <Button color="inherit" size="small" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
              Ver Todos
            </Button>
          }
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {urgentAlerts.length} alerta{urgentAlerts.length !== 1 ? 's' : ''} urgente{urgentAlerts.length !== 1 ? 's' : ''} requer{urgentAlerts.length === 1 ? '' : 'em'} atenção imediata
          </Typography>
        </Alert>
      )}

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Veículos"
            value={dashboardData?.totalVehicles || 0}
            icon={DirectionsCar}
            color="#1976d2"
            subtitle={`${dashboardData?.vehicleStatus?.available || 0} disponíveis`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Corridas Ativas"
            value={dashboardData?.activeRides || 0}
            icon={Assignment}
            color="#ed6c02"
            subtitle="Em andamento"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Motoristas Ativos"
            value={dashboardData?.drivers?.length || 0}
            icon={Group}
            color="#2e7d32"
            subtitle={`${dashboardData?.cnhExpirations?.length || 0} CNH vencendo`}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Alertas Sistema"
            value={dashboardData?.systemAlerts?.length || 0}
            icon={Warning}
            color={(dashboardData?.systemAlerts?.length || 0) > 0 ? "#d32f2f" : "#2e7d32"}
            subtitle={urgentAlerts.length > 0 ? `${urgentAlerts.length} urgentes` : "Sistema normal"}
            loading={loading}
          />
        </Grid>

        {/* Segunda linha de estatísticas */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="CNH Vencendo"
            value={dashboardData?.cnhExpirations?.length || 0}
            icon={Badge}
            color="#d32f2f"
            subtitle="Próximos 30 dias"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ambulâncias"
            value={dashboardData?.vehicles?.filter(v => v.type === 'ambulance')?.length || 0}
            icon={LocalHospital}
            color="#7b1fa2"
            subtitle="Veículos especializados"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Veículos Manutenção"
            value={dashboardData?.vehicles?.filter(v => v.status === 'maintenance')?.length || 0}
            icon={Build}
            color="#f57c00"
            subtitle="Em manutenção"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taxa de Uso"
            value={`${getShiftFill}%`}
            icon={Assessment}
            color="#388e3c"
            subtitle="Ocupação média"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Métricas de Performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
              Tempo Médio Resposta
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {dashboardData?.performanceMetrics?.averageResponseTime || '0 min'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" color="success.main" gutterBottom>
              <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
              Taxa de Conclusão
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {dashboardData?.performanceMetrics?.completionRate || '0%'}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', height: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography variant="h6" color="warning.main" gutterBottom>
              <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Satisfação Cliente
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {dashboardData?.performanceMetrics?.customerSatisfaction || '0/5'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Sistema de Abas para diferentes seções */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="Seções administrativas">
            <Tab icon={<Assessment />} label="Visão Geral" />
            <Tab icon={<Group />} label="Motoristas" />
            <Tab icon={<DirectionsCar />} label="Veículos" />
            <Tab icon={<Badge />} label="CNH & Licenças" />
            <Tab icon={<Build />} label="Manutenção" />
            <Tab icon={<Settings />} label="Configurações" />
          </Tabs>
        </Box>

        {/* Conteúdo da aba ativa */}
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <OverviewTab 
              dashboardData={dashboardData} 
              loading={loading}
              onResolveAlert={handleResolveAlert}
            />
          )}
          {activeTab === 1 && (
            <DriversTab 
              drivers={dashboardData?.drivers || []}
              cnhExpirations={dashboardData?.cnhExpirations || []}
              loading={loading}
              onOpenDialog={handleOpenDialog}
            />
          )}
          {activeTab === 2 && (
            <VehiclesTab 
              vehicles={dashboardData?.vehicles || []}
              loading={loading}
              onOpenDialog={handleOpenDialog}
            />
          )}
          {activeTab === 3 && (
            <LicenseTab 
              cnhExpirations={dashboardData?.cnhExpirations || []}
              drivers={dashboardData?.drivers || []}
              loading={loading}
            />
          )}
          {activeTab === 4 && (
            <MaintenanceTab 
              vehicles={dashboardData?.vehicles?.filter(v => v.status === 'maintenance' || v.nextMaintenance) || []}
              loading={loading}
            />
          )}
          {activeTab === 5 && (
            <SettingsTab />
          )}
        </Box>
      </Card>

      {/* Dialog para criar/editar itens */}
      <ItemDialog 
        open={dialogOpen}
        type={dialogType}
        item={selectedItem}
        isViewMode={isViewMode}
        onClose={handleCloseDialog}
        onSave={handleSaveItem}
      />

      {/* Seção de Alertas e Atividades Recentes - só exibe na aba overview */}
      {activeTab === 0 && (
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <AlertCard
            alerts={dashboardData.systemAlerts}
            onResolveAlert={handleResolveAlert}
            loading={loading}
          />
        </Grid>
        
        <Grid item xs={12} lg={6}>
          <Card sx={{ height: '100%', maxHeight: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ pb: 1 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Atividades Recentes
              </Typography>
            </CardContent>
            
            <Box sx={{ flex: 1, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ p: 2 }}>
                  <LinearProgress />
                </Box>
              ) : dashboardData.recentActivities.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <Schedule sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    Nenhuma atividade recente
                  </Typography>
                </Box>
              ) : (
                <List sx={{ py: 0 }} role="list" aria-label="Atividades recentes">
                  {dashboardData.recentActivities.map((activity, index) => (
                    <React.Fragment key={activity.id || index}>
                      <ListItem sx={{ py: 2 }} role="listitem">
                        <ListItemIcon>
                          <LocalHospital color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" component="span" gutterBottom>
                              Corrida #{activity.id} - {activity.status === 'completed' ? 'Concluída' : 'Em Andamento'}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                De: {activity.pickup_location || 'N/A'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Para: {activity.destination || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {activity.created_at ? new Date(activity.created_at).toLocaleString('pt-BR') : 'Data não disponível'}
                              </Typography>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                      {index < dashboardData.recentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
      )}
    </Container>
  );
};

// Componentes das abas
const OverviewTab = React.memo(({ dashboardData, loading, onResolveAlert }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} lg={6}>
      <AlertCard
        alerts={dashboardData?.systemAlerts || []}
        onResolveAlert={onResolveAlert}
        loading={loading}
      />
    </Grid>
    
    <Grid item xs={12} lg={6}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Métricas de Performance
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Tempo Médio Resposta</Typography>
              <Typography variant="h6" color="primary">{dashboardData?.performanceMetrics?.averageResponseTime || '4.2 min'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Taxa de Conclusão</Typography>
              <Typography variant="h6" color="success.main">{dashboardData?.performanceMetrics?.completionRate || '94.5%'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2">Satisfação</Typography>
              <Typography variant="h6" color="warning.main">{dashboardData?.performanceMetrics?.customerSatisfaction || '4.7/5'}</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  </Grid>
));

const DriversTab = React.memo(({ drivers, cnhExpirations, loading, onOpenDialog }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5" component="h2">
        Gestão de Motoristas
      </Typography>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => onOpenDialog('driver')}
        sx={{ borderRadius: 2 }}
      >
        Adicionar Motorista
      </Button>
    </Box>

    {cnhExpirations.length > 0 && (
      <Alert severity="warning" sx={{ mb: 3 }} icon={<CalendarToday />}>
        <Typography variant="subtitle2" fontWeight="bold">
          {cnhExpirations.length} motorista(s) com CNH vencendo nos próximos 30 dias
        </Typography>
      </Alert>
    )}

    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell><strong>Nome</strong></TableCell>
            <TableCell><strong>CNH</strong></TableCell>
            <TableCell><strong>Validade</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Telefone</strong></TableCell>
            <TableCell align="center"><strong>Ações</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <LinearProgress />
              </TableCell>
            </TableRow>
          ) : drivers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography variant="body2" color="text.secondary">
                  Nenhum motorista cadastrado
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            drivers.map((driver) => (
              <TableRow key={driver.id || driver.name} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      {driver.name?.charAt(0) || 'M'}
                    </Avatar>
                    {driver.name || 'Nome não informado'}
                  </Box>
                </TableCell>
                <TableCell>{driver.licenseNumber || 'Não informado'}</TableCell>
                <TableCell>
                  {driver.licenseExpiry ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {new Date(driver.licenseExpiry).toLocaleDateString('pt-BR')}
                      {cnhExpirations.some(exp => exp.id === driver.id) && (
                        <Chip size="small" color="error" label="Vencendo" />
                      )}
                    </Box>
                  ) : 'Não informado'}
                </TableCell>
                <TableCell>
                  <Chip 
                    size="small" 
                    color={driver.status === 'active' || driver.status === 'ativo' ? 'success' : 'default'}
                    label={driver.status === 'active' || driver.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  />
                </TableCell>
                <TableCell>{driver.phone || 'Não informado'}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Visualizar">
                    <IconButton size="small" onClick={() => onOpenDialog('driver', driver, true)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => onOpenDialog('driver', driver, false)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
));

const VehiclesTab = React.memo(({ vehicles, loading, onOpenDialog }) => (
  <Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h5" component="h2">
        Gestão de Veículos
      </Typography>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => onOpenDialog('vehicle')}
        sx={{ borderRadius: 2 }}
      >
        Adicionar Veículo
      </Button>
    </Box>

    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.50' }}>
            <TableCell><strong>Placa</strong></TableCell>
            <TableCell><strong>Tipo</strong></TableCell>
            <TableCell><strong>Modelo</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Km</strong></TableCell>
            <TableCell><strong>Próx. Manutenção</strong></TableCell>
            <TableCell align="center"><strong>Ações</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <LinearProgress />
              </TableCell>
            </TableRow>
          ) : vehicles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary">
                  Nenhum veículo cadastrado
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            vehicles.map((vehicle) => (
              <TableRow key={vehicle.id || vehicle.plateNumber} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {vehicle.vehicleType === 'ambulance' ? <LocalHospital color="error" /> : <DirectionsCar color="primary" />}
                    <strong>{vehicle.plateNumber || 'Não informado'}</strong>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    size="small" 
                    color={vehicle.vehicleType === 'ambulance' ? 'error' : 'primary'}
                    label={vehicle.vehicleType === 'ambulance' ? 'Ambulância' : 'Veículo'}
                  />
                </TableCell>
                <TableCell>{vehicle.model || 'Não informado'}</TableCell>
                <TableCell>
                  <Chip 
                    size="small" 
                    color={
                      vehicle.status === 'available' ? 'success' : 
                      vehicle.status === 'maintenance' ? 'warning' : 
                      vehicle.status === 'in_use' ? 'info' : 'default'
                    }
                    label={
                      vehicle.status === 'available' ? 'Disponível' :
                      vehicle.status === 'maintenance' ? 'Manutenção' :
                      vehicle.status === 'in_use' ? 'Em Uso' : 'Inativo'
                    }
                  />
                </TableCell>
                <TableCell>{vehicle.odometer !== null && vehicle.odometer !== undefined ? `${vehicle.odometer.toLocaleString()} km` : 'Não informado'}</TableCell>
                <TableCell>
                  {vehicle.nextMaintenance ? new Date(vehicle.nextMaintenance).toLocaleDateString('pt-BR') : 'Não agendado'}
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Visualizar">
                    <IconButton size="small" onClick={() => onOpenDialog('vehicle', vehicle, true)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => onOpenDialog('vehicle', vehicle, false)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
));

const LicenseTab = React.memo(({ cnhExpirations, drivers, loading }) => (
  <Box>
    <Typography variant="h5" component="h2" gutterBottom>
      Controle de CNH e Licenças
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
              CNH Vencendo (30 dias)
            </Typography>
            {cnhExpirations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Todas as CNH estão válidas
                </Typography>
              </Box>
            ) : (
              <List>
                {cnhExpirations.map((driver, index) => (
                  <React.Fragment key={driver.id || index}>
                    <ListItem>
                      <ListItemIcon>
                        <Badge color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={driver.name || 'Nome não informado'}
                        secondary={`Vence em: ${new Date(driver.cnh_expiry).toLocaleDateString('pt-BR')}`}
                      />
                    </ListItem>
                    {index < cnhExpirations.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
              Resumo de Licenças
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Total de Motoristas</Typography>
                <Typography variant="h6">{drivers.length}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">CNH Válidas</Typography>
                <Typography variant="h6" color="success.main">
                  {dashboardData.cnhValid?.length || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">CNH Vencendo (30 dias)</Typography>
                <Typography variant="h6" color="warning.main">
                  {dashboardData.cnhExpirations?.length || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">CNH Vencidas</Typography>
                <Typography variant="h6" color="error.main">
                  {dashboardData.cnhExpired?.length || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Sem Informação</Typography>
                <Typography variant="h6" color="text.secondary">
                  {drivers.filter(d => !d.cnh_expiry && !d.licenseExpiry).length}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>

    {/* Detalhes dos Vencimentos */}
    {(dashboardData.cnhExpirations?.length > 0 || dashboardData.cnhExpired?.length > 0) && (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Warning sx={{ mr: 1, color: 'warning.main' }} />
          Alertas de Vencimento
        </Typography>
        
        <Grid container spacing={2}>
          {/* CNHs Vencidas */}
          {dashboardData.cnhExpired?.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid', borderColor: 'error.main', bgcolor: 'error.light', color: 'error.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Error sx={{ mr: 1 }} />
                    CNHs Vencidas ({dashboardData.cnhExpired.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {dashboardData.cnhExpired.map((driver, index) => {
                      const expiryField = driver.cnh_expiry || driver.licenseExpiry;
                      const expiryDate = new Date(expiryField);
                      const diffDays = Math.floor((new Date() - expiryDate) / (1000 * 60 * 60 * 24));
                      return (
                        <Box key={driver.id || index} sx={{ py: 1, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {driver.name || 'Nome não informado'}
                          </Typography>
                          <Typography variant="caption">
                            Vencida há {diffDays} dias ({expiryDate.toLocaleDateString('pt-BR')})
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* CNHs Vencendo */}
          {dashboardData.cnhExpirations?.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card sx={{ border: '1px solid', borderColor: 'warning.main', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ mr: 1 }} />
                    CNHs Vencendo ({dashboardData.cnhExpirations.length})
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {dashboardData.cnhExpirations.map((driver, index) => {
                      const expiryField = driver.cnh_expiry || driver.licenseExpiry;
                      const expiryDate = new Date(expiryField);
                      const diffDays = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                      return (
                        <Box key={driver.id || index} sx={{ py: 1, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {driver.name || 'Nome não informado'}
                          </Typography>
                          <Typography variant="caption">
                            Vence em {diffDays} dias ({expiryDate.toLocaleDateString('pt-BR')})
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    )}
  </Box>
));

const MaintenanceTab = React.memo(({ vehicles, loading }) => (
  <Box>
    <Typography variant="h5" component="h2" gutterBottom>
      <Build sx={{ mr: 1, verticalAlign: 'middle' }} />
      Manutenção de Veículos
    </Typography>

    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Build sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" color="warning.main">
              {vehicles.filter(v => v.status === 'maintenance').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Em Manutenção
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <EventAvailable sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" color="info.main">
              {vehicles.filter(v => v.nextMaintenance && new Date(v.nextMaintenance) <= new Date(Date.now() + 30*24*60*60*1000)).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manutenção Agendada
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" color="success.main">
              {vehicles.filter(v => v.status === 'available').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Operacionais
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><strong>Veículo</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Última Manutenção</strong></TableCell>
                <TableCell><strong>Próxima Manutenção</strong></TableCell>
                <TableCell><strong>Quilometragem</strong></TableCell>
                <TableCell><strong>Observações</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id || vehicle.plateNumber} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {vehicle.vehicleType === 'ambulance' ? <LocalHospital color="error" /> : <DirectionsCar />}
                      {vehicle.plateNumber || 'Não informado'}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      size="small" 
                      color={vehicle.status === 'maintenance' ? 'warning' : 'success'}
                      label={vehicle.status === 'maintenance' ? 'Manutenção' : 'Operacional'}
                    />
                  </TableCell>
                  <TableCell>
                    {vehicle.lastMaintenance ? new Date(vehicle.lastMaintenance).toLocaleDateString('pt-BR') : 'Não registrado'}
                  </TableCell>
                  <TableCell>
                    {vehicle.nextMaintenance ? new Date(vehicle.nextMaintenance).toLocaleDateString('pt-BR') : 'Não agendado'}
                  </TableCell>
                  <TableCell>{vehicle.odometer !== null && vehicle.odometer !== undefined ? `${vehicle.odometer.toLocaleString()} km` : 'Não informado'}</TableCell>
                  <TableCell>{vehicle.notes || 'Nenhuma observação'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Grid>
    </Grid>
  </Box>
));

const SettingsTab = React.memo(() => (
  <Box>
    <Typography variant="h5" component="h2" gutterBottom>
      <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
      Configurações do Sistema
    </Typography>
    
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configurações Gerais
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel control={<Checkbox defaultChecked />} label="Notificações por email" />
              <FormControlLabel control={<Checkbox defaultChecked />} label="Alertas de CNH vencendo" />
              <FormControlLabel control={<Checkbox />} label="Backup automático" />
              <FormControlLabel control={<Checkbox defaultChecked />} label="Log de atividades" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configurações de Manutenção
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Intervalo padrão (km)"
                type="number"
                defaultValue="10000"
                size="small"
                fullWidth
              />
              <TextField
                label="Dias de antecedência para alerta"
                type="number"
                defaultValue="30"
                size="small"
                fullWidth
              />
              <FormControlLabel control={<Checkbox defaultChecked />} label="Alerta automático de manutenção" />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </Box>
));

// Dialog para criar/editar motoristas e veículos
const ItemDialog = React.memo(({ open, type, item, isViewMode, onClose, onSave }) => {
  const [formData, setFormData] = useState({});

  // Funções de máscara
  const formatCPF = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return digits.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    } else if (digits.length <= 9) {
      return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else {
      return digits.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    }
  };

  const formatPhone = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 6) {
      return digits.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    } else if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return digits.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  useEffect(() => {
    if (item) {
      // Mapear valores de status para compatibilidade com os Selects
      const mappedItem = { ...item };
      
      // Para motoristas: mapear campos da API para o formato do formulário
      if (type === 'driver') {
        // Mapear campos de CNH
        if (mappedItem.licenseNumber) {
          mappedItem.cnh = mappedItem.licenseNumber;
        }
        if (mappedItem.licenseExpiry) {
          mappedItem.cnh_expiry = mappedItem.licenseExpiry;
        }
        if (mappedItem.licenseCategory) {
          mappedItem.cnh_category = mappedItem.licenseCategory;
        }
        
        // Formatar CPF para exibição se não estiver formatado
        if (mappedItem.cpf && !mappedItem.cpf.includes('.')) {
          mappedItem.cpf = formatCPF(mappedItem.cpf);
        }
        
        // Formatar telefone para exibição se não estiver formatado
        if (mappedItem.phone && !mappedItem.phone.includes('(')) {
          mappedItem.phone = formatPhone(mappedItem.phone);
        }
        
        // Mapear status: 'active' -> 'available', 'suspended' -> 'inactive'
        if (mappedItem.status === 'active') {
          mappedItem.status = 'available';
        } else if (mappedItem.status === 'suspended') {
          mappedItem.status = 'inactive';
        }
      }
      
      // Para veículos: mapear campos da API para o formato do formulário
      if (type === 'vehicle') {
        // Mapear plateNumber -> license_plate
        if (mappedItem.plateNumber) {
          mappedItem.license_plate = mappedItem.plateNumber;
        }
        
        // Mapear vehicleType -> type
        if (mappedItem.vehicleType) {
          mappedItem.type = mappedItem.vehicleType;
        }
        
        // Mapear odometer -> mileage
        if (mappedItem.odometer !== undefined) {
          mappedItem.mileage = mappedItem.odometer;
        }
        
        // Mapear status: mantem os valores originais pois backend aceita
        // 'available', 'busy', 'maintenance', 'inactive' são aceitos pelo backend
      }
      
      setFormData(mappedItem);
    } else {
      setFormData({});
    }
  }, [item, type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'driver') {
      const name = (formData.name || '').trim();
      const cnh = String(formData.cnh_number || formData.cnh || '').trim();
      const cnh_category = (formData.cnh_category || '').trim();
      const cnh_expiry = (formData.cnh_expiry || '').trim();
      const cpf = (formData.cpf || '').trim();
      const phone = (formData.phone || '').trim();
      
      if (!name) return alert('Nome é obrigatório');
      if (!cnh) return alert('Número da CNH é obrigatório');
      if (!/^\d{11}$/.test(cnh)) {
        return alert('CNH deve ter exatamente 11 dígitos numéricos');
      }
      if (!cnh_category) return alert('Categoria da CNH é obrigatória');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(cnh_expiry)) {
        return alert('Validade da CNH deve estar no formato YYYY-MM-DD');
      }
      // Validar CPF (aceita com ou sem formatação)
      const cpfNumbers = cpf ? cpf.replace(/\D/g, '') : '';
      if (cpf && cpfNumbers.length !== 11) {
        return alert('CPF deve ter exatamente 11 dígitos');
      }
      if (phone && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(phone)) {
        return alert('Telefone deve estar no formato (00) 00000-0000');
      }
    }
    onSave(formData);
  };

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    
    // Aplicar máscaras
    if (field === 'cpf') {
      value = formatCPF(value);
    } else if (field === 'phone') {
      value = formatPhone(value);
    } else if (field === 'cnh') {
      // Limitar CNH a 11 dígitos numéricos
      value = value.replace(/\D/g, '').slice(0, 11);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {isViewMode ? 'Visualizar' : (item ? 'Editar' : 'Adicionar')} {type === 'driver' ? 'Motorista' : 'Veículo'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {type === 'driver' ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nome Completo"
                  fullWidth
                  required
                  value={formData.name || ''}
                  onChange={handleChange('name')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="CPF"
                  fullWidth
                  value={formData.cpf || ''}
                  onChange={handleChange('cpf')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Número da CNH"
                  fullWidth
                  required
                  value={formData.cnh || ''}
                  onChange={handleChange('cnh')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Categoria da CNH</InputLabel>
                  <Select
                    value={formData.cnh_category || ''}
                    onChange={handleChange('cnh_category')}
                    label="Categoria da CNH"
                    disabled={isViewMode}
                  >
                    <MenuItem value="A">A - Motocicletas, motonetas e triciclos</MenuItem>
                    <MenuItem value="B">B - Automóveis e camionetas</MenuItem>
                    <MenuItem value="C">C - Veículos de carga</MenuItem>
                    <MenuItem value="D">D - Veículos de passageiros</MenuItem>
                    <MenuItem value="E">E - Combinação de veículos</MenuItem>
                    <MenuItem value="AB">AB - A + B</MenuItem>
                    <MenuItem value="AC">AC - A + C</MenuItem>
                    <MenuItem value="AD">AD - A + D</MenuItem>
                    <MenuItem value="AE">AE - A + E</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Validade da CNH"
                  type="date"
                  fullWidth
                  required
                  value={formData.cnh_expiry || ''}
                  onChange={handleChange('cnh_expiry')}
                  InputLabelProps={{ shrink: true }}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Telefone"
                  fullWidth
                  value={formData.phone || ''}
                  onChange={handleChange('phone')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email || ''}
                  onChange={handleChange('email')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status || 'available'}
                    onChange={handleChange('status')}
                    label="Status"
                    disabled={isViewMode}
                  >
                    <MenuItem value="available">Disponível</MenuItem>
                    <MenuItem value="busy">Ocupado</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Placa"
                  fullWidth
                  required
                  value={formData.license_plate || ''}
                  onChange={handleChange('license_plate')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.type || 'ambulance'}
                    onChange={handleChange('type')}
                    label="Tipo"
                    disabled={isViewMode}
                  >
                    <MenuItem value="ambulance">Ambulância</MenuItem>
                    <MenuItem value="transport">Transporte</MenuItem>
                    <MenuItem value="support">Apoio</MenuItem>
                    <MenuItem value="administrative">Administrativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Modelo"
                  fullWidth
                  required
                  value={formData.model || ''}
                  onChange={handleChange('model')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Marca"
                  fullWidth
                  required
                  value={formData.brand || ''}
                  onChange={handleChange('brand')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Ano"
                  type="number"
                  fullWidth
                  value={formData.year || ''}
                  onChange={handleChange('year')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Cor"
                  fullWidth
                  required
                  value={formData.color || ''}
                  onChange={handleChange('color')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Capacidade"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1, max: 20 }}
                  value={formData.capacity || ''}
                  onChange={handleChange('capacity')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Quilometragem"
                  type="number"
                  fullWidth
                  value={formData.mileage || ''}
                  onChange={handleChange('mileage')}
                  disabled={isViewMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status || 'available'}
                    onChange={handleChange('status')}
                    label="Status"
                    disabled={isViewMode}
                  >
                    <MenuItem value="available">Disponível</MenuItem>
                    <MenuItem value="busy">Ocupado</MenuItem>
                    <MenuItem value="maintenance">Manutenção</MenuItem>
                    <MenuItem value="inactive">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Observações"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.notes || ''}
                  onChange={handleChange('notes')}
                  disabled={isViewMode}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{isViewMode ? 'Fechar' : 'Cancelar'}</Button>
          {!isViewMode && (
            <Button type="submit" variant="contained">
              {item ? 'Salvar' : 'Adicionar'}
            </Button>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
});

export default DashboardAdminPage;