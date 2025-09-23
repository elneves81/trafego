import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Avatar,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  AccessTime as TimeIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    position: user?.position || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState('');

  const handleProfileChange = (field) => (event) => {
    setProfileData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handlePasswordChange = (field) => (event) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    
    if (passwordError) {
      setPasswordError('');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    
    try {
      const result = await updateProfile(profileData);
      
      if (result.success) {
        setEditing(false);
        setShowSuccessAlert(true);
        setTimeout(() => setShowSuccessAlert(false), 3000);
      } else {
        console.error('Erro ao atualizar perfil:', result.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Todos os campos são obrigatórios');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('A confirmação da senha não confere');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    
    try {
      const result = await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (result.success) {
        setOpenPasswordDialog(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowSuccessAlert(true);
        setTimeout(() => setShowSuccessAlert(false), 3000);
      } else {
        setPasswordError(result.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      setPasswordError('Erro interno do servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      position: user?.position || ''
    });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
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

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      supervisor: 'warning',
      operator: 'info',
      driver: 'success'
    };
    return colors[role] || 'default';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Dados simulados de estatísticas do usuário
  const userStats = {
    totalSessions: 145,
    lastLogin: new Date().toISOString(),
    accountCreated: '2023-01-15T10:00:00.000Z',
    totalActions: 1847,
    permissions: [
      'view_dashboard',
      'manage_rides',
      'view_vehicles',
      'view_drivers',
      'view_map'
    ]
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Meu Perfil
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie suas informações pessoais e configurações da conta
        </Typography>
      </Box>

      {showSuccessAlert && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {editing ? 'Perfil atualizado com sucesso!' : 'Senha alterada com sucesso!'}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Informações do Perfil */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Informações Pessoais
                </Typography>
                <Box>
                  {editing ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="outlined"
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={loading ? <LoadingSpinner size={20} /> : <SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      onClick={() => setEditing(true)}
                    >
                      Editar
                    </Button>
                  )}
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome Completo"
                    value={profileData.name}
                    onChange={handleProfileChange('name')}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange('email')}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    value={profileData.phone}
                    onChange={handleProfileChange('phone')}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Cargo/Posição"
                    value={profileData.position}
                    onChange={handleProfileChange('position')}
                    disabled={!editing}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BadgeIcon color="action" />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Segurança
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    Senha
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Última alteração: {formatDate(user?.passwordChangedAt)}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<LockIcon />}
                  onClick={() => setOpenPasswordDialog(true)}
                >
                  Alterar Senha
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar com Avatar e Estatísticas */}
        <Grid item xs={12} lg={4}>
          {/* Avatar e Informações Básicas */}
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  fontSize: '3rem',
                  bgcolor: 'primary.main',
                  mx: 'auto',
                  mb: 2
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {user?.name}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user?.email}
              </Typography>
              
              <Chip
                label={getRoleLabel(user?.role)}
                color={getRoleColor(user?.role)}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary">
                Membro desde {formatDate(userStats.accountCreated)}
              </Typography>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Estatísticas da Conta
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <TimeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Último Login"
                    secondary={formatDate(userStats.lastLogin)}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <AssignmentIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total de Sessões"
                    secondary={userStats.totalSessions.toLocaleString()}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <PersonIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Ações Realizadas"
                    secondary={userStats.totalActions.toLocaleString()}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Permissões */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Permissões
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {userStats.permissions.map((permission, index) => (
                  <Chip
                    key={index}
                    label={permission.replace('_', ' ').toUpperCase()}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog para Alterar Senha */}
      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Alterar Senha</DialogTitle>
        
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Senha Atual"
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={handlePasswordChange('currentPassword')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('current')}
                        edge="end"
                      >
                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nova Senha"
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={handlePasswordChange('newPassword')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('new')}
                        edge="end"
                      >
                        {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirmar Nova Senha"
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange('confirmPassword')}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirm')}
                        edge="end"
                      >
                        {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => setOpenPasswordDialog(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={loading}
            startIcon={loading ? <LoadingSpinner size={20} /> : <LockIcon />}
          >
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;