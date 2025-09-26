const express = require('express');
const { authenticate } = require('../middleware/auth');
const sseManager = require('../services/sseManager');
const { Notification, Ride, Vehicle, User } = require('../models');

const router = express.Router();

// Polling endpoint para obter atualizações
router.get('/updates', authenticate, async (req, res) => {
  try {
    const { since, types } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 30000); // Últimos 30 segundos por padrão
    const updateTypes = types ? types.split(',') : ['notifications', 'rides', 'locations'];
    
    const updates = {
      timestamp: new Date().toISOString(),
      hasUpdates: false,
      data: {}
    };

    // Buscar notificações
    if (updateTypes.includes('notifications')) {
      const notifications = await Notification.findAll({
        where: {
          updatedAt: {
            [require('sequelize').Op.gte]: sinceDate
          },
          ...(userRole !== 'admin' && {
            [require('sequelize').Op.or]: [
              { userId: userId },
              { targetRole: userRole },
              { isGlobal: true }
            ]
          })
        },
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      if (notifications.length > 0) {
        updates.hasUpdates = true;
        updates.data.notifications = notifications;
      }
    }

    // Buscar atualizações de corridas
    if (updateTypes.includes('rides')) {
      const rideQuery = {
        updatedAt: {
          [require('sequelize').Op.gte]: sinceDate
        }
      };

      // Filtrar corridas baseado no role do usuário
      if (userRole === 'driver') {
        rideQuery.driverId = userId;
      } else if (userRole === 'operator') {
        rideQuery.operatorId = userId;
      }

      const rides = await Ride.findAll({
        where: rideQuery,
        include: [
          { model: User, as: 'driver', attributes: ['id', 'name'] },
          { model: User, as: 'operator', attributes: ['id', 'name'] },
          { model: Vehicle, attributes: ['id', 'plate', 'model'] }
        ],
        order: [['updatedAt', 'DESC']],
        limit: 20
      });

      if (rides.length > 0) {
        updates.hasUpdates = true;
        updates.data.rides = rides;
      }
    }

    // Buscar atualizações de localização (apenas para operadores e admin)
    if (updateTypes.includes('locations') && ['admin', 'operator'].includes(userRole)) {
      // Aqui você pode implementar busca de localizações recentes
      // Por exemplo, de uma tabela de GPS tracking
      updates.data.locations = [];
    }

    // Incluir estatísticas de conexões SSE se for admin
    if (userRole === 'admin') {
      updates.data.connectionStats = sseManager.getStats();
    }

    res.json(updates);
    
  } catch (error) {
    console.error('Erro no polling de updates:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Endpoint para marcar notificações como lidas
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: {
        id: id,
        userId: userId
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificação não encontrada' });
    }

    await notification.update({
      isRead: true,
      readAt: new Date()
    });

    res.json({
      message: 'Notificação marcada como lida',
      notification: notification
    });

  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Endpoint para criar notificação
router.post('/notifications', authenticate, async (req, res) => {
  try {
    const { title, message, type, targetUserId, targetRole, isGlobal } = req.body;
    const senderId = req.user.id;

    // Verificar permissões
    if (!['admin', 'operator'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão para criar notificações' });
    }

    const notification = await Notification.create({
      title,
      message,
      type: type || 'info',
      userId: targetUserId || null,
      targetRole: targetRole || null,
      isGlobal: isGlobal || false,
      senderId: senderId,
      isRead: false
    });

    // Enviar via SSE também
    const notificationData = {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      timestamp: notification.createdAt,
      sender: {
        id: req.user.id,
        name: req.user.name
      }
    };

    if (isGlobal) {
      sseManager.broadcast('notification', notificationData);
    } else if (targetRole) {
      sseManager.sendToRole(targetRole, 'notification', notificationData);
    } else if (targetUserId) {
      sseManager.sendToUser(targetUserId, 'notification', notificationData);
    }

    res.status(201).json({
      message: 'Notificação criada com sucesso',
      notification: notification
    });

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

// Endpoint para buscar histórico de mensagens
router.get('/messages', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const userRole = req.user.role;

    const whereClause = {};

    // Filtrar por tipo se especificado
    if (type) {
      whereClause.type = type;
    }

    // Filtrar mensagens baseado no role do usuário
    if (userRole !== 'admin') {
      whereClause[require('sequelize').Op.or] = [
        { userId: userId },
        { targetRole: userRole },
        { isGlobal: true }
      ];
    }

    const notifications = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'role'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      messages: notifications.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: notifications.count,
        pages: Math.ceil(notifications.count / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

module.exports = router;