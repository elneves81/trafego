const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const sseManager = require('../services/sseManager');

const router = express.Router();

// Endpoint SSE para estabelecer conexão em tempo real
router.get('/stream', authenticate, (req, res) => {
  // Configurar headers para SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Gerar ID único para o cliente
  const clientId = uuidv4();
  
  // Adicionar cliente ao gerenciador SSE
  const client = sseManager.addClient(clientId, res);
  
  // Associar cliente ao usuário autenticado
  if (req.user) {
    sseManager.associateUser(clientId, req.user.id, req.user.role);
  }

  // Enviar evento de conexão estabelecida
  sseManager.sendToClient(clientId, 'connected', {
    clientId: clientId,
    message: 'Conexão SSE estabelecida',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    }
  });

  // Manter conexão viva
  const keepAlive = setInterval(() => {
    if (client.connected) {
      sseManager.sendToClient(clientId, 'ping', { timestamp: new Date().toISOString() });
    } else {
      clearInterval(keepAlive);
    }
  }, 45000); // Ping a cada 45 segundos

  // Limpeza quando cliente desconectar
  req.on('close', () => {
    clearInterval(keepAlive);
    sseManager.removeClient(clientId);
  });
});

// Endpoint para enviar notificação para usuário específico
router.post('/notify/user/:userId', authenticate, (req, res) => {
  const { userId } = req.params;
  const { event, data } = req.body;

  if (!event || !data) {
    return res.status(400).json({ error: 'Event e data são obrigatórios' });
  }

  const sentCount = sseManager.sendToUser(parseInt(userId), event, data);
  
  res.json({
    message: 'Notificação enviada',
    userId: userId,
    event: event,
    sentTo: sentCount,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para broadcast
router.post('/broadcast', authenticate, (req, res) => {
  const { event, data } = req.body;

  if (!event || !data) {
    return res.status(400).json({ error: 'Event e data são obrigatórios' });
  }

  // Verificar se usuário tem permissão para broadcast (admin, supervisor, operator)
  if (!['admin', 'supervisor', 'operator'].includes(req.user.userType)) {
    console.log('🚫 BROADCAST - Usuário sem permissão:', req.user);
    return res.status(403).json({ error: 'Sem permissão para broadcast' });
  }
  
  console.log('✅ BROADCAST - Usuário autorizado:', req.user.userType);

  const sentCount = sseManager.broadcast(event, data);
  
  res.json({
    message: 'Broadcast enviado',
    event: event,
    sentTo: sentCount,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para enviar para role específico
router.post('/notify/role/:role', authenticate, (req, res) => {
  const { role } = req.params;
  const { event, data } = req.body;

  if (!event || !data) {
    return res.status(400).json({ error: 'Event e data são obrigatórios' });
  }

  // Verificar se usuário tem permissão (apenas admin e operator)
  if (!['admin', 'operator'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Sem permissão para enviar notificações' });
  }

  const sentCount = sseManager.sendToRole(role, event, data);
  
  res.json({
    message: 'Notificação enviada para role',
    role: role,
    event: event,
    sentTo: sentCount,
    timestamp: new Date().toISOString()
  });
});

// Endpoint para obter estatísticas das conexões
router.get('/stats', authenticate, (req, res) => {
  // Apenas admin pode ver estatísticas
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const stats = sseManager.getStats();
  
  res.json({
    ...stats,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;