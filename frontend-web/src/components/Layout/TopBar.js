import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Settings,
  ExitToApp,
  Circle
} from '@mui/icons-material';
import { useState } from 'react';

import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import NotificationCenter from '../NotificationCenter';

const TopBar = ({ onMenuClick }) => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleUserMenuOpen = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
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

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: theme.shadows[1]
        }}
      >
        <Toolbar>
          {/* Menu Button */}
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{
              mr: 2,
              display: { lg: 'none' },
              color: theme.palette.text.primary
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo e Título */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 'bold',
                color: theme.palette.primary.main,
                mr: 2
              }}
            >
              Central de Ambulâncias
            </Typography>

            {/* Status da Conexão */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Circle
                sx={{
                  fontSize: 12,
                  color: isConnected ? theme.palette.success.main : theme.palette.error.main,
                  mr: 1
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                {isConnected ? 'Online' : 'Desconectado'}
              </Typography>
            </Box>

            {/* Usuários Online */}
            {isConnected && (
              <Chip
                label={`${onlineUsers.length} usuários online`}
                size="small"
                color="success"
                variant="outlined"
                sx={{ ml: 2, display: { xs: 'none', md: 'flex' } }}
              />
            )}
          </Box>

          {/* Ações da direita */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notificações */}
            <NotificationCenter />

            {/* Perfil do Usuário */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Box sx={{ textAlign: 'right', mr: 1, display: { xs: 'none', sm: 'block' } }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 'medium',
                    lineHeight: 1.2
                  }}
                >
                  {user?.name}
                </Typography>
                <Chip
                  label={getRoleLabel(user?.userType)}
                  size="small"
                  color={getRoleColor(user?.userType)}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>

              <IconButton
                onClick={handleUserMenuOpen}
                sx={{ p: 0.5 }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: theme.palette.primary.main
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Menu do Usuário */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            boxShadow: theme.shadows[8]
          }
        }}
      >
        {/* Cabeçalho do menu */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" color="text.primary">
            {user?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>

        <MenuItem onClick={() => { handleUserMenuClose(); /* TODO: Navegar para perfil */ }}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          <ListItemText>Meu Perfil</ListItemText>
        </MenuItem>

        <MenuItem onClick={() => { handleUserMenuClose(); /* TODO: Navegar para configurações */ }}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Configurações</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToApp fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sair</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default TopBar;