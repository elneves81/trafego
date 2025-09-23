import React from 'react';
import {
  Menu,
  MenuList,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Badge,
  Divider,
  Button
} from '@mui/material';
import {
  Circle,
  NotificationsNone,
  CheckCircle,
  Info,
  Warning,
  Error
} from '@mui/icons-material';

const NotificationPanel = ({ anchorEl, open, onClose }) => {
  // TODO: Implementar com dados reais
  const notifications = [
    {
      id: 1,
      title: 'Nova corrida disponível',
      message: 'Corrida #1234 precisa de motorista',
      type: 'info',
      time: '2 min atrás',
      read: false
    },
    {
      id: 2,
      title: 'Veículo em manutenção',
      message: 'AMB-001 foi marcado para manutenção',
      type: 'warning',
      time: '15 min atrás',
      read: false
    },
    {
      id: 3,
      title: 'Corrida finalizada',
      message: 'Corrida #1233 foi finalizada com sucesso',
      type: 'success',
      time: '1h atrás',
      read: true
    }
  ];

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'error':
        return <Error color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          mt: 1,
          width: 350,
          maxHeight: 400,
          boxShadow: 8
        }
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notificações
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error" sx={{ ml: 1 }}>
                <Box />
              </Badge>
            )}
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={() => {/* TODO: Marcar todas como lidas */}}>
              Marcar como lidas
            </Button>
          )}
        </Box>
      </Box>

      {/* Lista de notificações */}
      <MenuList sx={{ p: 0, maxHeight: 300, overflow: 'auto' }}>
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <ListItemIcon>
              <NotificationsNone />
            </ListItemIcon>
            <ListItemText primary="Nenhuma notificação" />
          </MenuItem>
        ) : (
          notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <MenuItem
                onClick={() => {
                  // TODO: Marcar como lida e navegar se necessário
                  onClose();
                }}
                sx={{
                  py: 1.5,
                  bgcolor: notification.read ? 'transparent' : 'action.hover'
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {notification.title}
                      </Typography>
                      {!notification.read && (
                        <Circle sx={{ fontSize: 8, color: 'primary.main' }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.time}
                      </Typography>
                    </Box>
                  }
                />
              </MenuItem>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </MenuList>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Divider />
          <Box sx={{ p: 1 }}>
            <Button
              fullWidth
              size="small"
              onClick={() => {
                // TODO: Navegar para página de notificações
                onClose();
              }}
            >
              Ver todas as notificações
            </Button>
          </Box>
        </>
      )}
    </Menu>
  );
};

export default NotificationPanel;