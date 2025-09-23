import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as SystemIcon,
  People as UsersIcon,
  Save as SaveIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const SettingsPage = () => {
  const { user, hasPermission } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [openUserDialog, setOpenUserDialog] = useState(false);

  // Estados para as configurações
  const [generalSettings, setGeneralSettings] = useState({
    systemName: 'Sistema de Transporte de Ambulâncias',
    organizationName: 'Secretaria de Saúde',
    maxRideDistance: 50,
    defaultResponseTime: 15,
    enableGeofencing: true,
    enableRealTimeTracking: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    soundAlerts: true,
    notifyNewRides: true,
    notifyRideUpdates: true,
    notifyMaintenanceAlerts: true,
    notifySystemAlerts: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 60,
    passwordExpiry: 90,
    maxLoginAttempts: 3,
    twoFactorAuth: false,
    ipWhitelist: '',
    auditLog: true
  });

  const [systemUsers, setSystemUsers] = useState([
    {
      id: 1,
      name: 'Admin Sistema',
      email: 'admin@saude.gov.br',
      role: 'admin',
      active: true,
      lastLogin: '2024-01-20 10:30:00'
    },
    {
      id: 2,
      name: 'Supervisor Central',
      email: 'supervisor@saude.gov.br',
      role: 'supervisor',
      active: true,
      lastLogin: '2024-01-20 08:15:00'
    },
    {
      id: 3,
      name: 'Operador Turno A',
      email: 'operador1@saude.gov.br',
      role: 'operator',
      active: true,
      lastLogin: '2024-01-19 22:45:00'
    }
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaveSettings = async (settingsType) => {
    setLoading(true);
    
    try {
      // TODO: Implementar salvamento real das configurações
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowSuccessAlert(true);
      setTimeout(() => setShowSuccessAlert(false), 3000);
      
      console.log(`Salvando configurações: ${settingsType}`, {
        general: generalSettings,
        notifications: notificationSettings,
        security: securitySettings
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = (action, userId = null) => {
    if (action === 'create') {
      setOpenUserDialog(true);
    } else if (action === 'edit') {
      // TODO: Abrir dialog de edição
      console.log('Editando usuário:', userId);
    } else if (action === 'delete') {
      // TODO: Confirmar e deletar usuário
      console.log('Deletando usuário:', userId);
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      operator: 'Operador',
      driver: 'Motorista'
    };
    return roles[role] || role;
  };

  const formatLastLogin = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (!hasPermission('admin_access')) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" gutterBottom>
          Acesso Negado
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Você não tem permissão para acessar as configurações do sistema.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Configurações do Sistema
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure as opções gerais, segurança e notificações do sistema
        </Typography>
      </Box>

      {showSuccessAlert && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Configurações salvas com sucesso!
        </Alert>
      )}

      <Card>
        {/* Tabs de Navegação */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<SettingsIcon />} label="Geral" />
            <Tab icon={<NotificationsIcon />} label="Notificações" />
            <Tab icon={<SecurityIcon />} label="Segurança" />
            <Tab icon={<UsersIcon />} label="Usuários" />
            <Tab icon={<SystemIcon />} label="Sistema" />
          </Tabs>
        </Box>

        {/* Configurações Gerais */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configurações Gerais
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Sistema"
                  value={generalSettings.systemName}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev, systemName: e.target.value
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome da Organização"
                  value={generalSettings.organizationName}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev, organizationName: e.target.value
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Distância Máxima das Corridas (km)"
                  value={generalSettings.maxRideDistance}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev, maxRideDistance: parseInt(e.target.value)
                  }))}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Tempo de Resposta Padrão (min)"
                  value={generalSettings.defaultResponseTime}
                  onChange={(e) => setGeneralSettings(prev => ({
                    ...prev, defaultResponseTime: parseInt(e.target.value)
                  }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={generalSettings.enableGeofencing}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev, enableGeofencing: e.target.checked
                      }))}
                    />
                  }
                  label="Habilitar Geofencing"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={generalSettings.enableRealTimeTracking}
                      onChange={(e) => setGeneralSettings(prev => ({
                        ...prev, enableRealTimeTracking: e.target.checked
                      }))}
                    />
                  }
                  label="Habilitar Rastreamento em Tempo Real"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={loading ? <LoadingSpinner size={20} /> : <SaveIcon />}
                onClick={() => handleSaveSettings('general')}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Configurações de Notificações */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configurações de Notificações
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Tipos de Notificação
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev, emailNotifications: e.target.checked
                    }))}
                  />
                }
                label="Notificações por Email"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev, smsNotifications: e.target.checked
                    }))}
                  />
                }
                label="Notificações por SMS"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev, pushNotifications: e.target.checked
                    }))}
                  />
                }
                label="Push Notifications"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.soundAlerts}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev, soundAlerts: e.target.checked
                    }))}
                  />
                }
                label="Alertas Sonoros"
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Eventos para Notificar
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.notifyNewRides}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev, notifyNewRides: e.target.checked
                    }))}
                  />
                }
                label="Novas Corridas"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.notifyRideUpdates}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev, notifyRideUpdates: e.target.checked
                    }))}
                  />
                }
                label="Atualizações de Corridas"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.notifyMaintenanceAlerts}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev, notifyMaintenanceAlerts: e.target.checked
                    }))}
                  />
                }
                label="Alertas de Manutenção"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.notifySystemAlerts}
                    onChange={(e) => setNotificationSettings(prev => ({
                      ...prev, notifySystemAlerts: e.target.checked
                    }))}
                  />
                }
                label="Alertas do Sistema"
              />
            </Box>
            
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={loading ? <LoadingSpinner size={20} /> : <SaveIcon />}
                onClick={() => handleSaveSettings('notifications')}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Configurações de Segurança */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configurações de Segurança
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timeout da Sessão (minutos)</InputLabel>
                  <Select
                    value={securitySettings.sessionTimeout}
                    label="Timeout da Sessão (minutos)"
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev, sessionTimeout: e.target.value
                    }))}
                  >
                    <MenuItem value={30}>30 minutos</MenuItem>
                    <MenuItem value={60}>1 hora</MenuItem>
                    <MenuItem value={120}>2 horas</MenuItem>
                    <MenuItem value={240}>4 horas</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Expiração de Senha (dias)</InputLabel>
                  <Select
                    value={securitySettings.passwordExpiry}
                    label="Expiração de Senha (dias)"
                    onChange={(e) => setSecuritySettings(prev => ({
                      ...prev, passwordExpiry: e.target.value
                    }))}
                  >
                    <MenuItem value={30}>30 dias</MenuItem>
                    <MenuItem value={60}>60 dias</MenuItem>
                    <MenuItem value={90}>90 dias</MenuItem>
                    <MenuItem value={180}>180 dias</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Máximo de Tentativas de Login"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings(prev => ({
                    ...prev, maxLoginAttempts: parseInt(e.target.value)
                  }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Lista de IPs Permitidos (um por linha)"
                  value={securitySettings.ipWhitelist}
                  onChange={(e) => setSecuritySettings(prev => ({
                    ...prev, ipWhitelist: e.target.value
                  }))}
                  placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev, twoFactorAuth: e.target.checked
                      }))}
                    />
                  }
                  label="Habilitar Autenticação de Dois Fatores"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.auditLog}
                      onChange={(e) => setSecuritySettings(prev => ({
                        ...prev, auditLog: e.target.checked
                      }))}
                    />
                  }
                  label="Habilitar Log de Auditoria"
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={loading ? <LoadingSpinner size={20} /> : <SaveIcon />}
                onClick={() => handleSaveSettings('security')}
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Gestão de Usuários */}
        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Usuários do Sistema
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleUserAction('create')}
              >
                Novo Usuário
              </Button>
            </Box>
            
            <List>
              {systemUsers.map((user) => (
                <ListItem
                  key={user.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 1
                  }}
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        onClick={() => handleUserAction('edit', user.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleUserAction('delete', user.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1" fontWeight="bold">
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {getRoleLabel(user.role)}
                        </Typography>
                        {user.active && (
                          <Typography variant="caption" color="success.main">
                            Ativo
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Último login: {formatLastLogin(user.lastLogin)}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </TabPanel>

        {/* Configurações do Sistema */}
        <TabPanel value={tabValue} index={4}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Configurações do Sistema
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Backup e Restauração
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Faça backup dos dados do sistema ou restaure de um backup anterior.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="outlined" startIcon={<SaveIcon />}>
                        Fazer Backup
                      </Button>
                      <Button variant="outlined" startIcon={<RestoreIcon />}>
                        Restaurar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                      Limpeza de Dados
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Remova dados antigos para otimizar o desempenho do sistema.
                    </Typography>
                    <Button variant="outlined" color="warning">
                      Executar Limpeza
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Versão do Sistema:</strong> 1.0.0<br />
                    <strong>Última Atualização:</strong> 20/01/2024<br />
                    <strong>Banco de Dados:</strong> MariaDB 10.6<br />
                    <strong>Servidor:</strong> Node.js 18.x
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Dialog para Criar/Editar Usuário */}
      <Dialog
        open={openUserDialog}
        onClose={() => setOpenUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Novo Usuário</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nome Completo" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Email" type="email" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Senha" type="password" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Função</InputLabel>
                <Select label="Função">
                  <MenuItem value="operator">Operador</MenuItem>
                  <MenuItem value="supervisor">Supervisor</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancelar</Button>
          <Button variant="contained">Criar Usuário</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;