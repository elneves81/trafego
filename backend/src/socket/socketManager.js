const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.activeConnections = new Map();
    this.onlineUsers = new Map();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`Cliente conectado: ${socket.id}`);

      // Autenticação automática baseada no token
      socket.on('authenticate', async (data) => {
        try {
          const { token, userId, userType, userName } = data;
          
          // Validar token JWT
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          if (decoded.id !== parseInt(userId)) {
            socket.emit('auth_error', { message: 'Token inválido' });
            return;
          }

          // Armazenar conexão
          const userConnection = {
            userId: parseInt(userId),
            userType,
            userName,
            socket,
            connectedAt: new Date()
          };

          this.activeConnections.set(socket.id, userConnection);
          this.onlineUsers.set(parseInt(userId), userConnection);

          // Entrar em salas baseadas no tipo de usuário
          socket.join(`user_${userId}`);
          socket.join(userType);
          
          if (userType === 'driver') {
            socket.join('drivers');
          } else if (userType === 'operator') {
            socket.join('operators');
          } else if (userType === 'admin') {
            socket.join('admins');
          }

          socket.emit('authenticated', { success: true });
          
          // Broadcast para outros usuários que este usuário entrou
          socket.broadcast.emit('user_joined', {
            id: parseInt(userId),
            name: userName,
            type: userType,
            timestamp: new Date()
          });

          // Enviar lista de usuários online para o novo usuário
          const onlineUsersList = Array.from(this.onlineUsers.values()).map(conn => ({
            id: conn.userId,
            name: conn.userName,
            type: conn.userType,
            connectedAt: conn.connectedAt
          }));
          
          socket.emit('users_online', onlineUsersList);

          logger.info(`Usuário ${userId} (${userType}) autenticado com sucesso`);
        } catch (error) {
          logger.error('Erro na autenticação do socket:', error);
          socket.emit('auth_error', { message: 'Falha na autenticação' });
        }
      });

      // Atualização de localização GPS
      socket.on('location_update', (data) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection && connection.userType === 'driver') {
          const locationData = {
            driverId: connection.userId,
            driverName: connection.userName,
            location: data.location,
            timestamp: data.timestamp || new Date()
          };

          // Enviar para operadores e admins
          this.io.to('operators').to('admins').emit('driver_location', locationData);
          logger.info(`Localização atualizada para motorista ${connection.userId}`);
        }
      });

      // Corrida atribuída a motorista
      socket.on('assign_ride', (rideData) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection && (connection.userType === 'operator' || connection.userType === 'admin')) {
          // Enviar para o motorista específico
          this.io.to(`user_${rideData.driverId}`).emit('ride_assigned', {
            ...rideData,
            assignedBy: connection.userName,
            assignedAt: new Date()
          });
          logger.info(`Corrida ${rideData.id} atribuída ao motorista ${rideData.driverId}`);
        }
      });

      // Motorista aceita corrida
      socket.on('accept_ride', (data) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection && connection.userType === 'driver') {
          const acceptData = {
            rideId: data.rideId,
            driverId: connection.userId,
            driverName: connection.userName,
            acceptedAt: new Date()
          };

          // Notificar operadores e admins
          this.io.to('operators').to('admins').emit('ride_accepted', acceptData);
          logger.info(`Corrida ${data.rideId} aceita pelo motorista ${connection.userId}`);
        }
      });

      // Motorista rejeita corrida
      socket.on('reject_ride', (data) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection && connection.userType === 'driver') {
          const rejectData = {
            rideId: data.rideId,
            driverId: connection.userId,
            driverName: connection.userName,
            reason: data.reason,
            rejectedAt: new Date()
          };

          // Notificar operadores e admins
          this.io.to('operators').to('admins').emit('ride_rejected', rejectData);
          logger.info(`Corrida ${data.rideId} rejeitada pelo motorista ${connection.userId}`);
        }
      });

      // Status da corrida atualizado
      socket.on('ride_update', (rideData) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          const updateData = {
            ...rideData,
            updatedBy: connection.userId,
            updatedByName: connection.userName,
            updatedAt: new Date()
          };

          // Broadcast para todos os usuários relevantes
          this.io.to('operators').to('admins').emit('ride_status_update', updateData);
          
          // Se for uma atualização de motorista, enviar para o motorista específico também
          if (rideData.driverId) {
            this.io.to(`user_${rideData.driverId}`).emit('ride_status_update', updateData);
          }
          
          logger.info(`Status da corrida ${rideData.id} atualizado para: ${rideData.status}`);
        }
      });

      // Envio de mensagens
      socket.on('send_message', (data) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          const messageData = {
            senderId: connection.userId,
            senderName: connection.userName,
            senderType: connection.userType,
            recipientId: data.recipientId,
            message: data.message,
            rideId: data.rideId,
            timestamp: data.timestamp || new Date()
          };

          // Enviar para o destinatário específico
          if (data.recipientId) {
            this.io.to(`user_${data.recipientId}`).emit('chat_message', messageData);
          } else {
            // Se não há destinatário específico, enviar para operadores
            this.io.to('operators').to('admins').emit('chat_message', messageData);
          }

          // Enviar confirmação para o remetente
          socket.emit('message_sent', { success: true, timestamp: messageData.timestamp });
          
          logger.info(`Mensagem enviada de ${connection.userId} para ${data.recipientId || 'operadores'}`);
        }
      });

      // Entrar em sala de corrida
      socket.on('join_ride', (rideId) => {
        socket.join(`ride_${rideId}`);
        logger.info(`Socket ${socket.id} entrou na sala da corrida ${rideId}`);
      });

      // Sair de sala de corrida
      socket.on('leave_ride', (rideId) => {
        socket.leave(`ride_${rideId}`);
        logger.info(`Socket ${socket.id} saiu da sala da corrida ${rideId}`);
      });

      // Alerta de emergência
      socket.on('emergency_alert', (alertData) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          const emergencyData = {
            ...alertData,
            userId: connection.userId,
            userName: connection.userName,
            userType: connection.userType,
            timestamp: new Date()
          };

          // Broadcast para todos os usuários
          this.io.emit('emergency_alert', emergencyData);
          logger.warn(`Alerta de emergência de ${connection.userName}: ${alertData.message}`);
        }
      });

      // Ping/Pong para manter conexão viva
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Desconexão
      socket.on('disconnect', (reason) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          logger.info(`Cliente desconectado: ${connection.userName} (${connection.userId}) - Razão: ${reason}`);
          
          // Remover das coleções
          this.activeConnections.delete(socket.id);
          this.onlineUsers.delete(connection.userId);

          // Notificar outros usuários
          socket.broadcast.emit('user_left', {
            id: connection.userId,
            name: connection.userName,
            type: connection.userType,
            timestamp: new Date()
          });
        } else {
          logger.info(`Cliente desconectado: ${socket.id} - Razão: ${reason}`);
        }
      });

      // Tratamento de erros do socket
      socket.on('error', (error) => {
        logger.error(`Erro no socket ${socket.id}:`, error);
      });
    });
  }

  // Métodos utilitários
  getOnlineUsers() {
    return Array.from(this.onlineUsers.values()).map(conn => ({
      id: conn.userId,
      name: conn.userName,
      type: conn.userType,
      connectedAt: conn.connectedAt
    }));
  }

  getConnectionByUserId(userId) {
    return this.onlineUsers.get(parseInt(userId));
  }

  isUserOnline(userId) {
    return this.onlineUsers.has(parseInt(userId));
  }

  sendToUser(userId, event, data) {
    const connection = this.getConnectionByUserId(userId);
    if (connection) {
      connection.socket.emit(event, data);
      return true;
    }
    return false;
  }

  sendToUserType(userType, event, data) {
    this.io.to(userType).emit(event, data);
  }

  sendToAll(event, data) {
    this.io.emit(event, data);
  }

  broadcastNotification(notification) {
    this.io.emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  }
}

module.exports = SocketManager;