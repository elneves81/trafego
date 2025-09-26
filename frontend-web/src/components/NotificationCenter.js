import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  LocalHospital as EmergencyIcon,
  DirectionsCar as CarIcon,
  Message as MessageIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketCompatibility';

const NotificationCenter = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { notifications, removeNotification, clearNotifications } = useSocket();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRemoveNotification = (notificationId, event) => {
    event.stopPropagation();
    removeNotification(notificationId);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'emergency':
        return <EmergencyIcon color="error" />;
      case 'ride':
      case 'ride_update':
        return <CarIcon color="primary" />;
      case 'message':
        return <MessageIcon color="info" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'emergency' || type === 'emergency') return 'error';
    if (priority === 'high') return 'warning';
    if (type === 'ride') return 'primary';
    return 'default';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return 'Agora mesmo';
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return time.toLocaleDateString();
  };

  const unreadCount = Array.isArray(notifications) ? notifications.length : 0;

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-label="notificações"
        aria-controls={open ? 'notification-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxWidth: '90vw',
            maxHeight: 600,
            overflow: 'hidden'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Notificações {unreadCount > 0 && `(${unreadCount})`}
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={clearNotifications}
                color="primary"
              >
                Limpar Todas
              </Button>
            )}
          </Box>
        </Box>

        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {!Array.isArray(notifications) || notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Nenhuma notificação
              </Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <MenuItem
                  sx={{
                    whiteSpace: 'normal',
                    alignItems: 'flex-start',
                    py: 2,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Box sx={{ mr: 2, mt: 0.5 }}>
                    {getNotificationIcon(notification.type)}
                  </Box>
                  
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {notification.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleRemoveNotification(notification.id, e)}
                        sx={{ ml: 1 }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {notification.message}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(notification.timestamp)}
                      </Typography>
                      
                      {(notification.priority || notification.type) && (
                        <Chip
                          size="small"
                          label={notification.priority === 'emergency' ? 'EMERGÊNCIA' : 
                                notification.type === 'ride' ? 'Corrida' : 
                                notification.type === 'ride_update' ? 'Atualização' : 
                                'Info'}
                          color={getNotificationColor(notification.type, notification.priority)}
                          variant={notification.priority === 'emergency' ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  </Box>
                </MenuItem>
                
                {index < (Array.isArray(notifications) ? notifications.length : 0) - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationCenter;