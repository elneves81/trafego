// Sistema de Server-Sent Events (SSE) para comunicação em tempo real
const EventEmitter = require('events');

class SSEManager extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // Armazenar conexões ativas
  }

  // Adicionar cliente SSE
  addClient(clientId, response) {
    const client = {
      id: clientId,
      response: response,
      connected: true,
      connectedAt: new Date(),
      userId: null,
      userRole: null
    };

    this.clients.set(clientId, client);
    
    console.log(`Cliente SSE conectado: ${clientId}. Total: ${this.clients.size}`);

    // Configurar limpeza quando cliente desconectar
    response.on('close', () => {
      this.removeClient(clientId);
    });

    return client;
  }

  // Remover cliente
  removeClient(clientId) {
    if (this.clients.has(clientId)) {
      const client = this.clients.get(clientId);
      client.connected = false;
      this.clients.delete(clientId);
      console.log(`Cliente SSE desconectado: ${clientId}. Total: ${this.clients.size}`);
    }
  }

  // Associar cliente a usuário autenticado
  associateUser(clientId, userId, userRole) {
    if (this.clients.has(clientId)) {
      const client = this.clients.get(clientId);
      client.userId = userId;
      client.userRole = userRole;
      console.log(`Cliente ${clientId} associado ao usuário ${userId} (${userRole})`);
    }
  }

  // Enviar evento para um cliente específico
  sendToClient(clientId, event, data) {
    const client = this.clients.get(clientId);
    if (client && client.connected && client.response) {
      try {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        client.response.write(message);
        return true;
      } catch (error) {
        console.error(`Erro ao enviar para cliente ${clientId}:`, error);
        this.removeClient(clientId);
        return false;
      }
    }
    return false;
  }

  // Broadcast para todos os clientes
  broadcast(event, data) {
    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      if (this.sendToClient(clientId, event, data)) {
        sentCount++;
      }
    });
    console.log(`Broadcast ${event} enviado para ${sentCount} clientes`);
    return sentCount;
  }

  // Enviar para usuários específicos por role
  sendToRole(userRole, event, data) {
    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      if (client.userRole === userRole) {
        if (this.sendToClient(clientId, event, data)) {
          sentCount++;
        }
      }
    });
    console.log(`Evento ${event} enviado para ${sentCount} usuários com role ${userRole}`);
    return sentCount;
  }

  // Enviar para usuário específico
  sendToUser(userId, event, data) {
    let sentCount = 0;
    this.clients.forEach((client, clientId) => {
      if (client.userId === userId) {
        if (this.sendToClient(clientId, event, data)) {
          sentCount++;
        }
      }
    });
    console.log(`Evento ${event} enviado para usuário ${userId} em ${sentCount} conexões`);
    return sentCount;
  }

  // Obter estatísticas das conexões
  getStats() {
    const stats = {
      totalClients: this.clients.size,
      connectedClients: 0,
      usersByRole: {}
    };

    this.clients.forEach(client => {
      if (client.connected) {
        stats.connectedClients++;
        if (client.userRole) {
          stats.usersByRole[client.userRole] = (stats.usersByRole[client.userRole] || 0) + 1;
        }
      }
    });

    return stats;
  }

  // Enviar heartbeat para manter conexões vivas
  sendHeartbeat() {
    const heartbeatData = {
      timestamp: new Date().toISOString(),
      server: 'ambulance-transport-system'
    };
    
    return this.broadcast('heartbeat', heartbeatData);
  }

  // Limpeza de conexões mortas
  cleanup() {
    const deadClients = [];
    this.clients.forEach((client, clientId) => {
      if (!client.connected || client.response.destroyed) {
        deadClients.push(clientId);
      }
    });

    deadClients.forEach(clientId => {
      this.removeClient(clientId);
    });

    if (deadClients.length > 0) {
      console.log(`Limpeza: ${deadClients.length} conexões mortas removidas`);
    }
  }
}

// Criar instância global
const sseManager = new SSEManager();

// Configurar heartbeat e limpeza automática
setInterval(() => {
  sseManager.sendHeartbeat();
  sseManager.cleanup();
}, 30000); // A cada 30 segundos

module.exports = sseManager;