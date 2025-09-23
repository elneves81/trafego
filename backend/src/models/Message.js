module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 1000]
      }
    },
    messageType: {
      type: DataTypes.ENUM,
      values: ['text', 'location', 'image', 'audio', 'system'],
      defaultValue: 'text'
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recipientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    rideId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'rides',
        key: 'id'
      },
      comment: 'Corrida relacionada à mensagem'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Metadados da mensagem (localização, arquivo, etc.)'
    },
    replyToId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'messages',
        key: 'id'
      },
      comment: 'ID da mensagem sendo respondida'
    },
    editedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    priority: {
      type: DataTypes.ENUM,
      values: ['low', 'normal', 'high', 'urgent'],
      defaultValue: 'normal'
    },
    attachmentUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'URL do arquivo anexado'
    },
    attachmentType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tipo do arquivo anexado'
    },
    attachmentSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Tamanho do arquivo em bytes'
    }
  }, {
    tableName: 'messages',
    timestamps: true,
    paranoid: true, // Para soft delete
    indexes: [
      {
        fields: ['senderId', 'recipientId', 'createdAt']
      },
      {
        fields: ['rideId', 'createdAt']
      },
      {
        fields: ['isRead']
      },
      {
        fields: ['messageType']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  // Hooks
  Message.afterCreate(async (message, options) => {
    // Marcar como entregue imediatamente após criação
    message.deliveredAt = new Date();
    await message.save();
  });

  // Associações
  Message.associate = function(models) {
    Message.belongsTo(models.Message, { 
      as: 'replyTo', 
      foreignKey: 'replyToId' 
    });
    Message.hasMany(models.Message, { 
      as: 'replies', 
      foreignKey: 'replyToId' 
    });
  };

  // Scopes
  Message.addScope('unread', {
    where: {
      isRead: false
    }
  });

  Message.addScope('conversation', (userId1, userId2) => ({
    where: {
      [sequelize.Sequelize.Op.or]: [
        {
          senderId: userId1,
          recipientId: userId2
        },
        {
          senderId: userId2,
          recipientId: userId1
        }
      ]
    },
    order: [['createdAt', 'ASC']]
  }));

  Message.addScope('rideMessages', (rideId) => ({
    where: {
      rideId: rideId
    },
    order: [['createdAt', 'ASC']]
  }));

  Message.addScope('recent', {
    where: {
      createdAt: {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
      }
    },
    order: [['createdAt', 'DESC']]
  });

  // Métodos estáticos
  Message.getConversation = async function(userId1, userId2, rideId = null, limit = 50) {
    const where = {
      [sequelize.Sequelize.Op.or]: [
        {
          senderId: userId1,
          recipientId: userId2
        },
        {
          senderId: userId2,
          recipientId: userId1
        }
      ]
    };

    if (rideId) {
      where.rideId = rideId;
    }

    return await this.findAll({
      where,
      include: [
        {
          model: sequelize.models.User,
          as: 'sender',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: sequelize.models.User,
          as: 'recipient',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit
    });
  };

  Message.getUnreadCount = async function(userId) {
    return await this.count({
      where: {
        recipientId: userId,
        isRead: false
      }
    });
  };

  Message.markConversationAsRead = async function(senderId, recipientId) {
    return await this.update(
      {
        isRead: true,
        readAt: new Date()
      },
      {
        where: {
          senderId: senderId,
          recipientId: recipientId,
          isRead: false
        }
      }
    );
  };

  Message.getLastMessages = async function(userId) {
    // Busca as últimas mensagens de cada conversa
    const messages = await this.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { senderId: userId },
          { recipientId: userId }
        ]
      },
      include: [
        {
          model: sequelize.models.User,
          as: 'sender',
          attributes: ['id', 'name', 'avatar']
        },
        {
          model: sequelize.models.User,
          as: 'recipient',
          attributes: ['id', 'name', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    // Agrupar por conversa e pegar a mais recente
    const conversations = new Map();
    messages.forEach(message => {
      const otherUserId = message.senderId === userId ? 
        message.recipientId : message.senderId;
      
      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, message);
      }
    });

    return Array.from(conversations.values());
  };

  // Métodos de instância
  Message.prototype.markAsRead = async function() {
    if (!this.isRead) {
      this.isRead = true;
      this.readAt = new Date();
      await this.save();
    }
    return this;
  };

  Message.prototype.isFromUser = function(userId) {
    return this.senderId === userId;
  };

  Message.prototype.isToUser = function(userId) {
    return this.recipientId === userId;
  };

  Message.prototype.hasAttachment = function() {
    return !!this.attachmentUrl;
  };

  Message.prototype.getTimeSinceCreated = function() {
    const now = new Date();
    const diffInMs = now - this.createdAt;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d`;
    }
  };

  return Message;
};