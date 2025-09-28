import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    let socketInstance = null;

    if (user && localStorage.getItem('token')) {
      // Conectar ao servidor WebSocket
      socketInstance = io('http://localhost:8082', {
        auth: {
          token: localStorage.getItem('token'),
          userId: user.id,
          userType: user.userType,
          userName: user.name
        },
        transports: ['polling', 'websocket'], // Polling primeiro para evitar erros
        reconnection: true,
        reconnectionAttempts: 3,
        reconnectionDelay: 2000,
        timeout: 10000
      });

      // Eventos de conexão
      socketInstance.on('connect', () => {
        console.log('Conectado ao servidor WebSocket');
        setIsConnected(true);
        
        // Autenticar automaticamente
        socketInstance.emit('authenticate', {
          token: localStorage.getItem('token'),
          userId: user.id,
          userType: user.userType,
          userName: user.name
        });
      });

      socketInstance.on('authenticated', (data) => {
        if (data.success) {
          console.log('Autenticado com sucesso no WebSocket');
        }
      });

      socketInstance.on('auth_error', (error) => {
        console.error('Erro de autenticação WebSocket:', error);
        // Pode redirecionar para login se token inválido
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Desconectado do servidor WebSocket:', reason);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Erro de conexão WebSocket:', error);
        setIsConnected(false);
      });

      // Eventos de usuários online
      socketInstance.on('users_online', (users) => {
        setOnlineUsers(users);
      });

      socketInstance.on('user_joined', (userData) => {
        console.log('Usuário entrou:', userData);
        setOnlineUsers(prev => [...prev.filter(u => u.id !== userData.id), userData]);
      });

      socketInstance.on('user_left', (userData) => {
        console.log('Usuário saiu:', userData);
        setOnlineUsers(prev => prev.filter(u => u.id !== userData.id));
      });

      // Eventos de notificações
      socketInstance.on('notification', (notification) => {
        console.log('Nova notificação:', notification);
        setNotifications(prev => [notification, ...prev]);
        
        // Notificação no browser se permitido
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      });

      // Eventos de corridas
      socketInstance.on('ride_assigned', (ride) => {
        console.log('Corrida atribuída:', ride);
        if (user.userType === 'driver') {
          const notification = {
            id: Date.now(),
            title: '🚨 Nova Corrida Atribuída',
            message: `Corrida para ${ride.patient} - ${ride.origin}`,
            type: 'ride',
            priority: ride.priority,
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev]);
        }
      });

      socketInstance.on('ride_accepted', (data) => {
        console.log('Corrida aceita:', data);
        if (user.userType === 'operator' || user.userType === 'admin') {
          const notification = {
            id: Date.now(),
            title: '✅ Corrida Aceita',
            message: `Motorista aceitou a corrida #${data.rideId}`,
            type: 'ride_update',
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev]);
        }
      });

      socketInstance.on('ride_rejected', (data) => {
        console.log('Corrida rejeitada:', data);
        if (user.userType === 'operator' || user.userType === 'admin') {
          const notification = {
            id: Date.now(),
            title: '❌ Corrida Rejeitada',
            message: `Motorista rejeitou a corrida #${data.rideId}`,
            type: 'ride_update',
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev]);
        }
      });

      socketInstance.on('ride_status_update', (ride) => {
        console.log('Status da corrida atualizado:', ride);
        const statusMessages = {
          iniciada: 'Corrida iniciada',
          chegou_origem: 'Motorista chegou ao local',
          paciente_embarcado: 'Paciente embarcado',
          chegou_destino: 'Chegou ao destino',
          concluida: 'Corrida concluída'
        };
        
        if (user.userType === 'operator' || user.userType === 'admin') {
          const notification = {
            id: Date.now(),
            title: '📍 Atualização de Status',
            message: `${statusMessages[ride.status]} - ${ride.patient}`,
            type: 'ride_update',
            timestamp: new Date()
          };
          setNotifications(prev => [notification, ...prev]);
        }
      });

      // Eventos de localização
      socketInstance.on('location_update', (data) => {
        console.log('Localização atualizada:', data);
        // Pode ser processado por componentes específicos
      });

      // Eventos de chat
      socketInstance.on('chat_message', (message) => {
        console.log('Nova mensagem de chat:', message);
        // Será processado pelos componentes de chat
      });

      // Eventos de emergência
      socketInstance.on('emergency_alert', (alert) => {
        console.log('Alerta de emergência:', alert);
        const notification = {
          id: Date.now(),
          title: '🚨 EMERGÊNCIA',
          message: alert.message,
          type: 'emergency',
          priority: 'emergency',
          timestamp: new Date()
        };
        setNotifications(prev => [notification, ...prev]);

        // Notificação urgente no browser
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 EMERGÊNCIA', {
            body: alert.message,
            icon: '/favicon.ico',
            requireInteraction: true,
            tag: 'emergency'
          });
        }
      });

      setSocket(socketInstance);

      // Cleanup
      return () => {
        console.log('Desconectando socket...');
        if (socketInstance) {
          socketInstance.disconnect();
        }
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      };
    }

    // Cleanup se não há usuário
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers([]);
      }
    };
  }, [user?.id]);

  // Solicitar permissão para notificações
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Permissão de notificação:', permission);
      });
    }
  }, []);

  // Funções auxiliares
  const sendMessage = (recipientId, message) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        recipientId,
        message,
        timestamp: new Date()
      });
    }
  };

  const sendLocationUpdate = (location) => {
    if (socket && isConnected) {
      socket.emit('location_update', {
        userId: user?.id,
        location,
        timestamp: new Date()
      });
    }
  };

  const emitRideUpdate = (rideData) => {
    if (socket && isConnected) {
      socket.emit('ride_update', rideData);
    }
  };

  const joinRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('join_room', roomId);
    }
  };

  const leaveRoom = (roomId) => {
    if (socket && isConnected) {
      socket.emit('leave_room', roomId);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    notifications,
    sendMessage,
    sendLocationUpdate,
    emitRideUpdate,
    joinRoom,
    leaveRoom,
    clearNotifications,
    removeNotification
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};