import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext();

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket deve ser usado dentro de um WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && token) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user, token]);

  const connectSocket = () => {
    if (socketRef.current) {
      return; // Já conectado
    }

    const socketUrl = process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:3001';
    
    const socketConnection = io(socketUrl, {
      auth: {
        token: token,
        userId: user?.id,
        userType: user?.user_type
      },
      transports: ['websocket', 'polling']
    });

    socketConnection.on('connect', () => {
      console.log('WebSocket conectado:', socketConnection.id);
      setConnected(true);
      setSocket(socketConnection);
      socketRef.current = socketConnection;
    });

    socketConnection.on('disconnect', () => {
      console.log('WebSocket desconectado');
      setConnected(false);
      setSocket(null);
      socketRef.current = null;
    });

    socketConnection.on('connect_error', (error) => {
      console.error('Erro de conexão WebSocket:', error);
      setConnected(false);
    });

    // Eventos do sistema
    socketConnection.on('user_online', (users) => {
      setOnlineUsers(users);
    });

    socketConnection.on('user_offline', (users) => {
      setOnlineUsers(users);
    });

    socketConnection.on('new_ride', (ride) => {
      console.log('Nova corrida recebida:', ride);
      // Dispatch evento personalizado para componentes
      window.dispatchEvent(new CustomEvent('newRide', { detail: ride }));
    });

    socketConnection.on('ride_updated', (ride) => {
      console.log('Corrida atualizada:', ride);
      window.dispatchEvent(new CustomEvent('rideUpdated', { detail: ride }));
    });

    socketConnection.on('location_update', (location) => {
      console.log('Localização atualizada:', location);
      window.dispatchEvent(new CustomEvent('locationUpdate', { detail: location }));
    });

    socketConnection.on('new_message', (message) => {
      console.log('Nova mensagem:', message);
      window.dispatchEvent(new CustomEvent('newMessage', { detail: message }));
    });

    socketConnection.on('new_notification', (notification) => {
      console.log('Nova notificação:', notification);
      window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
    });

    socketConnection.on('vehicle_status_changed', (vehicle) => {
      console.log('Status do veículo alterado:', vehicle);
      window.dispatchEvent(new CustomEvent('vehicleStatusChanged', { detail: vehicle }));
    });

    socketConnection.on('driver_status_changed', (driver) => {
      console.log('Status do motorista alterado:', driver);
      window.dispatchEvent(new CustomEvent('driverStatusChanged', { detail: driver }));
    });
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }
  };

  // Métodos para emitir eventos
  const emitLocationUpdate = (locationData) => {
    if (socket && connected) {
      socket.emit('location_update', locationData);
    }
  };

  const emitRideStatusUpdate = (rideId, status) => {
    if (socket && connected) {
      socket.emit('ride_status_update', { rideId, status });
    }
  };

  const emitSendMessage = (messageData) => {
    if (socket && connected) {
      socket.emit('send_message', messageData);
    }
  };

  const emitJoinRideRoom = (rideId) => {
    if (socket && connected) {
      socket.emit('join_ride_room', rideId);
    }
  };

  const emitLeaveRideRoom = (rideId) => {
    if (socket && connected) {
      socket.emit('leave_ride_room', rideId);
    }
  };

  const emitVehicleStatusUpdate = (vehicleId, status) => {
    if (socket && connected) {
      socket.emit('vehicle_status_update', { vehicleId, status });
    }
  };

  const emitDriverStatusUpdate = (status) => {
    if (socket && connected) {
      socket.emit('driver_status_update', { status });
    }
  };

  // Subscribe/Unsubscribe para eventos customizados
  const subscribe = (eventName, callback) => {
    window.addEventListener(eventName, callback);
    return () => window.removeEventListener(eventName, callback);
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    // Métodos para emitir eventos
    emitLocationUpdate,
    emitRideStatusUpdate,
    emitSendMessage,
    emitJoinRideRoom,
    emitLeaveRideRoom,
    emitVehicleStatusUpdate,
    emitDriverStatusUpdate,
    // Método para subscrever eventos
    subscribe,
    // Controle de conexão
    connectSocket,
    disconnectSocket
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;