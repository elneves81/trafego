module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define('Location', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },
    altitude: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Altitude em metros'
    },
    accuracy: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Precisão do GPS em metros'
    },
    speed: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: 'Velocidade em km/h'
    },
    heading: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0,
        max: 360
      },
      comment: 'Direção em graus (0-360)'
    },
    userId: {
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
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    batteryLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Nível da bateria do dispositivo'
    },
    isMoving: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Endereço aproximado da localização'
    },
    locationType: {
      type: DataTypes.ENUM,
      values: ['gps', 'network', 'manual'],
      defaultValue: 'gps',
      comment: 'Tipo de localização obtida'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'locations',
    timestamps: true,
    indexes: [
      {
        fields: ['userId', 'timestamp']
      },
      {
        fields: ['rideId', 'timestamp']
      },
      {
        fields: ['latitude', 'longitude']
      },
      {
        fields: ['timestamp']
      }
    ]
  });

  // Scopes
  Location.addScope('recent', {
    where: {
      timestamp: {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 60 * 1000) // Últimos 30 minutos
      }
    },
    order: [['timestamp', 'DESC']]
  });

  Location.addScope('today', {
    where: {
      timestamp: {
        [sequelize.Sequelize.Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  // Métodos estáticos
  Location.findByRadius = function(latitude, longitude, radiusKm = 5) {
    // Busca localizações dentro de um raio específico
    const latRange = radiusKm / 111; // 1 grau ≈ 111 km
    const lonRange = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));

    return this.findAll({
      where: {
        latitude: {
          [sequelize.Sequelize.Op.between]: [latitude - latRange, latitude + latRange]
        },
        longitude: {
          [sequelize.Sequelize.Op.between]: [longitude - lonRange, longitude + lonRange]
        }
      }
    });
  };

  Location.getLastLocationForUser = function(userId) {
    return this.findOne({
      where: { userId },
      order: [['timestamp', 'DESC']]
    });
  };

  Location.getLocationHistory = function(userId, startDate, endDate) {
    const where = { userId };
    
    if (startDate && endDate) {
      where.timestamp = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    return this.findAll({
      where,
      order: [['timestamp', 'ASC']]
    });
  };

  // Métodos de instância
  Location.prototype.calculateDistanceFrom = function(otherLocation) {
    const R = 6371; // Raio da Terra em km
    const dLat = (otherLocation.latitude - this.latitude) * Math.PI / 180;
    const dLon = (otherLocation.longitude - this.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.latitude * Math.PI / 180) * Math.cos(otherLocation.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  };

  Location.prototype.isNearby = function(latitude, longitude, radiusKm = 0.1) {
    const distance = this.calculateDistanceFrom({ latitude, longitude });
    return distance <= radiusKm;
  };

  return Location;
};