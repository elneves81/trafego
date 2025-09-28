const { Ride, User } = require('../models');

const connectedUsers = new Map(); // userId -> socket

const socketHandlers = (io, socket) => {
  const user = socket.user;
  
  // Adicionar usuário à lista de conectados
  connectedUsers.set(user.id, socket);
  
  // Notificar outros usuários que este usuário entrou
  socket.broadcast.emit('user_joined', {
    id: user.id,
    name: user.name,
    userType: user.userType
  });
  
  // Enviar lista de usuários online para o usuário que acabou de conectar
  const onlineUsers = Array.from(connectedUsers.values()).map(s => ({
    id: s.user.id,
    name: s.user.name,
    userType: s.user.userType
  }));
  socket.emit('users_online', onlineUsers);

  // === EVENTOS DE CORRIDAS ===
  
  // Criar nova corrida (operadores/admin)
  socket.on('create_ride', async (rideData) => {
    try {
      if (user.userType !== 'operator' && user.userType !== 'admin') {
        return socket.emit('error', { message: 'Sem permissão para criar corridas' });
      }

      // Criar corrida no banco de dados
      const newRide = await Ride.create({
        ...rideData,
        status: 'pendente',
        createdBy: user.id
      });

      // Notificar todos os motoristas disponíveis
      const drivers = Array.from(connectedUsers.values()).filter(s => 
        s.user.userType === 'driver' && s.user.isActive
      );

      drivers.forEach(driverSocket => {
        driverSocket.emit('ride_assigned', {
          id: newRide.id,
          patient: newRide.patientName,
          origin: newRide.originAddress,
          destination: newRide.destinationAddress,
          priority: newRide.priority,
          urgency: newRide.urgency,
          createdAt: newRide.createdAt
        });
      });

      // Confirmar criação para o criador
      socket.emit('ride_created', {
        success: true,
        ride: newRide
      });

      console.log(`Nova corrida criada por ${user.name}: ID ${newRide.id}`);
      
    } catch (error) {
      console.error('Erro ao criar corrida:', error);
      socket.emit('error', { message: 'Erro ao criar corrida' });
    }
  });

  // Aceitar corrida (motoristas)
  socket.on('accept_ride', async (rideId) => {
    try {
      if (user.userType !== 'driver') {
        return socket.emit('error', { message: 'Apenas motoristas podem aceitar corridas' });
      }

      const ride = await Ride.findByPk(rideId);
      if (!ride) {
        return socket.emit('error', { message: 'Corrida não encontrada' });
      }

      if (ride.status !== 'pendente') {
        return socket.emit('error', { message: 'Corrida não está mais disponível' });
      }

      // Atualizar corrida
      await ride.update({
        status: 'aceita',
        driverId: user.id,
        acceptedAt: new Date()
      });

      // Notificar operadores/admin
      const operators = Array.from(connectedUsers.values()).filter(s => 
        s.user.userType === 'operator' || s.user.userType === 'admin'
      );

      operators.forEach(operatorSocket => {
        operatorSocket.emit('ride_accepted', {
          rideId: ride.id,
          driverName: user.name,
          driverId: user.id
        });
      });

      // Confirmar aceitação para o motorista
      socket.emit('ride_acceptance_confirmed', {
        rideId: ride.id,
        message: 'Corrida aceita com sucesso!'
      });

      console.log(`Corrida ${rideId} aceita pelo motorista ${user.name}`);
      
    } catch (error) {
      console.error('Erro ao aceitar corrida:', error);
      socket.emit('error', { message: 'Erro ao aceitar corrida' });
    }
  });

  // Rejeitar corrida (motoristas)
  socket.on('reject_ride', async (rideId) => {
    try {
      if (user.userType !== 'driver') {
        return socket.emit('error', { message: 'Apenas motoristas podem rejeitar corridas' });
      }

      // Notificar operadores/admin
      const operators = Array.from(connectedUsers.values()).filter(s => 
        s.user.userType === 'operator' || s.user.userType === 'admin'
      );

      operators.forEach(operatorSocket => {
        operatorSocket.emit('ride_rejected', {
          rideId: rideId,
          driverName: user.name,
          driverId: user.id
        });
      });

      console.log(`Corrida ${rideId} rejeitada pelo motorista ${user.name}`);
      
    } catch (error) {
      console.error('Erro ao rejeitar corrida:', error);
      socket.emit('error', { message: 'Erro ao rejeitar corrida' });
    }
  });

  // Atualizar status da corrida
  socket.on('update_ride_status', async (data) => {
    try {
      const { rideId, status, location } = data;

      const ride = await Ride.findByPk(rideId);
      if (!ride) {
        return socket.emit('error', { message: 'Corrida não encontrada' });
      }

      // Atualizar status
      await ride.update({ status });

      // Notificar todos os usuários relevantes
      io.emit('ride_status_update', {
        rideId: ride.id,
        status,
        driverName: user.name,
        location,
        timestamp: new Date()
      });

      console.log(`Status da corrida ${rideId} atualizado para: ${status}`);

    } catch (error) {
      console.error('Erro ao atualizar status da corrida:', error);
      socket.emit('error', { message: 'Erro ao atualizar status' });
    }
  });

  // === EVENTOS DE LOCALIZAÇÃO ===
  
  socket.on('location_update', (locationData) => {
    // Retransmitir localização para operadores/admin
    const operators = Array.from(connectedUsers.values()).filter(s => 
      s.user.userType === 'operator' || s.user.userType === 'admin'
    );

    operators.forEach(operatorSocket => {
      operatorSocket.emit('driver_location_update', {
        driverId: user.id,
        driverName: user.name,
        ...locationData
      });
    });
  });

  // === EVENTOS DE MENSAGENS ===
  
  socket.on('send_message', (messageData) => {
    const { recipientId, message } = messageData;
    
    const recipientSocket = connectedUsers.get(recipientId);
    if (recipientSocket) {
      recipientSocket.emit('new_message', {
        senderId: user.id,
        senderName: user.name,
        message,
        timestamp: new Date()
      });
    }
  });

  // === LIMPEZA AO DESCONECTAR ===
  
  socket.on('disconnect', () => {
    connectedUsers.delete(user.id);
    
    // Notificar outros usuários que este usuário saiu
    socket.broadcast.emit('user_left', {
      id: user.id,
      name: user.name,
      userType: user.userType
    });
    
    console.log(`Usuário ${user.name} desconectou`);
  });
};

module.exports = socketHandlers;