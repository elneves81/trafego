import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip,
  useTheme,
  Badge
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DirectionsCar as VehiclesIcon,
  DirectionsCar,
  Person as DriversIcon,
  Assignment as RidesIcon,
  Map as MapIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  LocalHospital,
  Notifications as NotificationsIcon,
  People,
  Build,
  Schedule,
  Security,
  Chat,
  Warning,
  AdminPanelSettings
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const Sidebar = ({ onItemClick }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  const { connected } = useSocket();

  const handleItemClick = (path) => {
    navigate(path);
    if (onItemClick) {
      onItemClick();
    }
  };

  const getMenuItemsForUserType = () => {
    const baseItems = [
      {
        title: 'Dashboard',
        icon: DashboardIcon,
        path: '/dashboard',
        permission: 'view_dashboard',
        badge: null
      }
    ];

    if (user.userType === 'admin') {
      return [
        ...baseItems,
        {
          title: 'Gestão de Usuários',
          icon: People,
          path: '/users',
          permission: 'admin_access',
          badge: 3 // CNH vencidas
        },
        {
          title: 'Gestão da Frota',
          icon: VehiclesIcon,
          path: '/vehicles',
          permission: 'admin_access',
          badge: 2 // Veículos com problema
        },
        {
          title: 'Corridas',
          icon: RidesIcon,
          path: '/rides',
          permission: 'manage_rides',
          badge: 5 // Pendentes
        },
        {
          title: 'Escalas/Plantões',
          icon: Schedule,
          path: '/schedules',
          permission: 'admin_access',
          badge: null
        },
        {
          title: 'Manutenção',
          icon: Build,
          path: '/maintenance',
          permission: 'admin_access',
          badge: 2
        },
        {
          title: 'Mapa ao Vivo',
          icon: MapIcon,
          path: '/map',
          permission: 'view_map',
          badge: null
        },
        {
          title: 'Relatórios',
          icon: ReportsIcon,
          path: '/reports',
          permission: 'admin_access',
          badge: null
        },
        {
          title: 'Configurações',
          icon: SettingsIcon,
          path: '/settings',
          permission: 'admin_access',
          badge: null
        }
      ];
    }

    if (user.userType === 'operator' || user.userType === 'supervisor') {
      return [
        ...baseItems,
        {
          title: 'Central de Corridas',
          icon: RidesIcon,
          path: '/rides',
          permission: 'manage_rides',
          badge: 5 // Pendentes
        },
        {
          title: 'Chat com Motoristas',
          icon: Chat,
          path: '/chat',
          permission: 'operator_access',
          badge: 2 // Mensagens não lidas
        },
        {
          title: 'Frota Ativa',
          icon: VehiclesIcon,
          path: '/vehicles',
          permission: 'view_vehicles',
          badge: null
        },
        {
          title: 'Motoristas',
          icon: DriversIcon,
          path: '/drivers',
          permission: 'view_drivers',
          badge: null
        },
        {
          title: 'Mapa ao Vivo',
          icon: MapIcon,
          path: '/map',
          permission: 'view_map',
          badge: null
        }
      ];
    }

    if (user.userType === 'driver') {
      return [
        ...baseItems,
        {
          title: 'Minhas Corridas',
          icon: RidesIcon,
          path: '/my-rides',
          permission: 'driver_access',
          badge: 1 // Corridas atribuídas
        },
        {
          title: 'Chat Central',
          icon: Chat,
          path: '/chat',
          permission: 'driver_access',
          badge: null
        },
        {
          title: 'Meu Veículo',
          icon: VehiclesIcon,
          path: '/my-vehicle',
          permission: 'driver_access',
          badge: null
        }
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItemsForUserType();

  const filteredMenuItems = menuItems.filter(item => 
    hasPermission(item.permission)
  );

  const isActive = (path) => location.pathname === path;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper
      }}
    >
      {/* Header do Sidebar */}
      <Box
        sx={{
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.primary.main
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {user.userType === 'admin' && <AdminPanelSettings sx={{ fontSize: 32, color: 'white', mr: 2 }} />}
          {(user.userType === 'operator' || user.userType === 'supervisor') && <LocalHospital sx={{ fontSize: 32, color: 'white', mr: 2 }} />}
          {user.userType === 'driver' && <DirectionsCar sx={{ fontSize: 32, color: 'white', mr: 2 }} />}
          <Box>
            <Typography
              variant="h6"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                lineHeight: 1.2
              }}
            >
              {user.userType === 'admin' && 'Administração'}
              {(user.userType === 'operator' || user.userType === 'supervisor') && 'Central'}
              {user.userType === 'driver' && 'Motorista'}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.85rem'
              }}
            >
              {user.userType === 'admin' && 'Sistema Ambulâncias'}
              {(user.userType === 'operator' || user.userType === 'supervisor') && 'Atendimento'}
              {user.userType === 'driver' && user.name}
            </Typography>
          </Box>
        </Box>

        {/* Status da conexão e usuário */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            icon={<NotificationsIcon />}
            label={connected ? 'Online' : 'Offline'}
            size="small"
            sx={{
              backgroundColor: connected 
                ? theme.palette.success.main 
                : theme.palette.error.main,
              color: 'white',
              '& .MuiChip-icon': {
                color: 'white'
              }
            }}
          />
          <Chip
            label={user.userType === 'admin' ? 'Admin' : user.userType === 'operator' ? 'Operador' : user.userType === 'supervisor' ? 'Gestor' : 'Motorista'}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white'
            }}
          />
        </Box>
      </Box>

      {/* Menu de Navegação */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List sx={{ p: 1 }}>
          {filteredMenuItems.map((item, index) => {
            const IconComponent = item.icon;
            const active = isActive(item.path);

            return (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  onClick={() => handleItemClick(item.path)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    mx: 1,
                    backgroundColor: active 
                      ? theme.palette.primary.main 
                      : 'transparent',
                    color: active 
                      ? 'white' 
                      : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: active 
                        ? theme.palette.primary.dark
                        : theme.palette.action.hover
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: active 
                        ? 'white' 
                        : theme.palette.text.secondary,
                      minWidth: 40
                    }}
                  >
                    {item.badge && item.badge > 0 ? (
                      <Badge 
                        badgeContent={item.badge} 
                        color="error"
                        sx={{
                          '& .MuiBadge-badge': {
                            right: -3,
                            top: -3,
                            fontSize: '0.75rem'
                          }
                        }}
                      >
                        <IconComponent />
                      </Badge>
                    ) : (
                      <IconComponent />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.title}
                    primaryTypographyProps={{
                      fontSize: '0.9rem',
                      fontWeight: active ? 600 : 400
                    }}
                  />
                  {/* Badge adicional no final da linha se necessário */}
                  {item.badge && item.badge > 0 && (
                    <Chip 
                      label={item.badge}
                      size="small"
                      color="error"
                      sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        backgroundColor: active 
                          ? 'rgba(255,255,255,0.2)' 
                          : theme.palette.error.main,
                        color: active ? 'white' : 'white'
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider />

      {/* Informações do Usuário */}
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: theme.palette.grey[100],
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'medium',
              color: theme.palette.text.primary,
              mb: 0.5
            }}
          >
            {user?.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              display: 'block',
              mb: 1
            }}
          >
            {user?.email}
          </Typography>
          <Chip
            label={user?.role === 'admin' ? 'Administrador' : 
                  user?.role === 'supervisor' ? 'Supervisor' :
                  user?.role === 'operator' ? 'Operador' : 'Usuário'}
            size="small"
            color={user?.role === 'admin' ? 'error' :
                   user?.role === 'supervisor' ? 'warning' :
                   user?.role === 'operator' ? 'info' : 'default'}
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;