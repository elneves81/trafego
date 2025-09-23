import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Circle as CircleIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon
} from '@mui/icons-material';
import { useSocket } from '../contexts/SocketContext';

const ConnectionStatus = ({ variant = 'chip', showUsers = true }) => {
  const theme = useTheme();
  const { isConnected, onlineUsers } = useSocket();

  const getStatusColor = () => {
    return isConnected ? theme.palette.success.main : theme.palette.error.main;
  };

  const getStatusText = () => {
    return isConnected ? 'Online' : 'Desconectado';
  };

  if (variant === 'indicator') {
    return (
      <Tooltip title={`Status: ${getStatusText()}`}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CircleIcon
            sx={{
              fontSize: 12,
              color: getStatusColor(),
              mr: 0.5
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {getStatusText()}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  if (variant === 'icon') {
    return (
      <Tooltip title={`Status: ${getStatusText()}`}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: getStatusColor() }}>
          {isConnected ? <WifiIcon /> : <WifiOffIcon />}
        </Box>
      </Tooltip>
    );
  }

  // variant === 'chip' (default)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        icon={<CircleIcon sx={{ fontSize: 12 }} />}
        label={getStatusText()}
        size="small"
        color={isConnected ? 'success' : 'error'}
        variant="outlined"
        sx={{ 
          height: 24,
          '& .MuiChip-icon': {
            color: getStatusColor()
          }
        }}
      />
      
      {showUsers && isConnected && onlineUsers.length > 0 && (
        <Chip
          label={`${onlineUsers.length} usuário${onlineUsers.length !== 1 ? 's' : ''} online`}
          size="small"
          color="info"
          variant="outlined"
          sx={{ height: 24 }}
        />
      )}
    </Box>
  );
};

export default ConnectionStatus;