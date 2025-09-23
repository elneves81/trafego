const { Notification, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const getNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isRead,
      type,
      priority
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { userId: req.user.id };

    // Filtros
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (type) where.type = type;
    if (priority) where.priority = priority;

    // Apenas notificações não expiradas
    where[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ];

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.markAsRead(id, req.user.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação marcada como lida',
      data: notification
    });
  } catch (error) {
    logger.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const [updatedCount] = await Notification.markAllAsRead(req.user.id);

    res.json({
      success: true,
      message: `${updatedCount} notificações marcadas como lidas`,
      data: { updatedCount }
    });
  } catch (error) {
    logger.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const createNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const {
      title,
      message,
      type,
      priority,
      userId,
      userType,
      data,
      actionUrl,
      expiresAt,
      category
    } = req.body;

    let targetUsers = [];

    if (userId) {
      // Notificação para usuário específico
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      targetUsers = [user];
    } else if (userType) {
      // Notificação para todos os usuários de um tipo
      targetUsers = await User.findAll({
        where: {
          userType,
          status: 'active'
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'É necessário especificar userId ou userType'
      });
    }

    const notifications = await Promise.all(
      targetUsers.map(user =>
        Notification.create({
          title,
          message,
          type,
          priority,
          userId: user.id,
          data,
          actionUrl,
          expiresAt,
          category
        })
      )
    );

    logger.info(`Created ${notifications.length} notifications: ${title}`);

    res.status(201).json({
      success: true,
      message: `${notifications.length} notificações criadas com sucesso`,
      data: {
        count: notifications.length,
        notifications: notifications.length <= 10 ? notifications : notifications.slice(0, 10)
      }
    });
  } catch (error) {
    logger.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notificação removida com sucesso'
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    // Marcar como clicada se ainda não foi
    if (!notification.clickedAt) {
      await notification.markAsClicked();
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Get notification by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const cleanupExpiredNotifications = async (req, res) => {
  try {
    const deletedCount = await Notification.cleanExpired();

    logger.info(`Cleaned up ${deletedCount} expired notifications`);

    res.json({
      success: true,
      message: `${deletedCount} notificações expiradas foram removidas`,
      data: { deletedCount }
    });
  } catch (error) {
    logger.error('Cleanup expired notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Notification.findAll({
      where: { userId },
      attributes: [
        [Op.literal('COUNT(*)'), 'total'],
        [Op.literal('COUNT(CASE WHEN isRead = true THEN 1 END)'), 'read'],
        [Op.literal('COUNT(CASE WHEN isRead = false THEN 1 END)'), 'unread'],
        [Op.literal('COUNT(CASE WHEN priority = "urgent" THEN 1 END)'), 'urgent'],
        [Op.literal('COUNT(CASE WHEN type = "ride" THEN 1 END)'), 'rides'],
        [Op.literal('COUNT(CASE WHEN type = "system" THEN 1 END)'), 'system']
      ],
      raw: true
    });

    const recentCount = await Notification.count({
      where: {
        userId,
        createdAt: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    });

    res.json({
      success: true,
      data: {
        ...stats[0],
        recent: recentCount
      }
    });
  } catch (error) {
    logger.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  getNotificationById,
  cleanupExpiredNotifications,
  getNotificationStats
};