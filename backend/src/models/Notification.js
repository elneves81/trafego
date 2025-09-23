module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    type: {
      type: DataTypes.ENUM,
      values: ['info', 'warning', 'error', 'success', 'ride', 'system'],
      defaultValue: 'info'
    },
    priority: {
      type: DataTypes.ENUM,
      values: ['low', 'normal', 'high', 'urgent'],
      defaultValue: 'normal'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Dados adicionais relacionados à notificação (IDs, URLs, etc.)'
    },
    actionUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL para ação relacionada à notificação'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Data de expiração da notificação'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Categoria da notificação para agrupamento'
    },
    sentAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Quando a notificação push foi entregue'
    },
    clickedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Quando o usuário clicou na notificação'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'createdAt']
      },
      {
        fields: ['isRead']
      },
      {
        fields: ['type']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['expiresAt']
      }
    ]
  });

  // Hooks
  Notification.beforeCreate(async (notification, options) => {
    // Se não há data de expiração definida, definir padrão baseado no tipo
    if (!notification.expiresAt) {
      const now = new Date();
      switch (notification.type) {
        case 'ride':
          notification.expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas
          break;
        case 'system':
          notification.expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias
          break;
        default:
          notification.expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 dias
      }
    }
  });

  // Scopes
  Notification.addScope('unread', {
    where: {
      isRead: false
    }
  });

  Notification.addScope('active', {
    where: {
      [sequelize.Sequelize.Op.or]: [
        { expiresAt: null },
        { expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() } }
      ]
    }
  });

  Notification.addScope('urgent', {
    where: {
      priority: 'urgent'
    }
  });

  Notification.addScope('recent', {
    where: {
      createdAt: {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
      }
    },
    order: [['createdAt', 'DESC']]
  });

  // Métodos estáticos
  Notification.markAsRead = async function(notificationId, userId) {
    const notification = await this.findOne({
      where: {
        id: notificationId,
        userId: userId
      }
    });

    if (notification && !notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  };

  Notification.markAllAsRead = async function(userId) {
    return await this.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          userId: userId,
          isRead: false
        }
      }
    );
  };

  Notification.getUnreadCount = async function(userId) {
    return await this.count({
      where: {
        userId: userId,
        isRead: false,
        [sequelize.Sequelize.Op.or]: [
          { expiresAt: null },
          { expiresAt: { [sequelize.Sequelize.Op.gt]: new Date() } }
        ]
      }
    });
  };

  Notification.cleanExpired = async function() {
    return await this.destroy({
      where: {
        expiresAt: {
          [sequelize.Sequelize.Op.lt]: new Date()
        }
      }
    });
  };

  // Métodos para diferentes tipos de notificação
  Notification.createRideNotification = async function(userId, rideData) {
    return await this.create({
      userId,
      title: 'Nova Corrida Disponível',
      message: `Corrida #${rideData.rideNumber} - ${rideData.originAddress}`,
      type: 'ride',
      priority: rideData.priority === 'emergency' ? 'urgent' : 'normal',
      data: {
        rideId: rideData.id,
        rideNumber: rideData.rideNumber
      },
      category: 'ride_assignment'
    });
  };

  Notification.createStatusNotification = async function(userId, title, message, priority = 'normal') {
    return await this.create({
      userId,
      title,
      message,
      type: 'info',
      priority,
      category: 'status_update'
    });
  };

  Notification.createSystemNotification = async function(userId, title, message, data = null) {
    return await this.create({
      userId,
      title,
      message,
      type: 'system',
      priority: 'normal',
      data,
      category: 'system_message'
    });
  };

  // Métodos de instância
  Notification.prototype.markAsRead = async function() {
    if (!this.isRead) {
      this.isRead = true;
      this.readAt = new Date();
      await this.save();
    }
    return this;
  };

  Notification.prototype.markAsClicked = async function() {
    if (!this.clickedAt) {
      this.clickedAt = new Date();
      await this.save();
    }
    return this;
  };

  Notification.prototype.isExpired = function() {
    return this.expiresAt && this.expiresAt < new Date();
  };

  return Notification;
};