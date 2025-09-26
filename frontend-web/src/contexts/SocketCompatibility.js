// Hook para compatibilidade com código antigo
import { useSSE } from './SSEContext';
import { useState } from 'react';

export const useSocket = () => {
  const sse = useSSE();
  const [notifications, setNotifications] = useState([]);
  
  // Funções para gerenciar notificações
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Máximo 50 notificações
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };
  
  // Retorna interface compatível com o hook antigo
  return {
    isConnected: sse.isConnected,
    connected: sse.isConnected,
    connectionStatus: sse.connectionStatus,
    onlineUsers: sse.stats?.connectedClients || 0,
    socket: {
      ...sse.socket,
      off: sse.off
    },
    on: sse.on,
    off: sse.off,
    emit: sse.socket.emit,
    disconnect: sse.disconnect,
    connect: sse.connect,
    // Compatibilidade adicional
    stats: sse.stats,
    messages: sse.messages,
    notifications: notifications || [],
    addNotification,
    removeNotification,
    clearNotifications
  };
};