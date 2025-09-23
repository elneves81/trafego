module.exports = (sequelize, DataTypes) => {
  const Vehicle = sequelize.define('Vehicle', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    plateNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [7, 8] // Placas brasileiras
      }
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1980,
        max: new Date().getFullYear() + 1
      }
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 30]
      }
    },
    vehicleType: {
      type: DataTypes.ENUM,
      values: ['ambulance', 'transport', 'support', 'administrative'],
      allowNull: false,
      defaultValue: 'ambulance'
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
      validate: {
        min: 1,
        max: 20
      }
    },
    status: {
      type: DataTypes.ENUM,
      values: ['available', 'busy', 'maintenance', 'inactive'],
      defaultValue: 'available'
    },
    driverId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    chassisNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    renavam: {
      type: DataTypes.STRING,
      allowNull: true
    },
    insuranceExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    licenseExpiry: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    lastMaintenance: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    nextMaintenance: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    odometer: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    fuelType: {
      type: DataTypes.ENUM,
      values: ['gasoline', 'ethanol', 'diesel', 'flex', 'electric', 'hybrid'],
      defaultValue: 'gasoline'
    },
    averageConsumption: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      validate: {
        min: 0
      }
    },
    equipment: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Lista de equipamentos médicos disponíveis no veículo'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    gpsDeviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID do dispositivo GPS instalado no veículo'
    },
    currentLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    currentLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    lastLocationUpdate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'vehicles',
    timestamps: true,
    indexes: [
      {
        fields: ['plateNumber']
      },
      {
        fields: ['driverId']
      },
      {
        fields: ['vehicleType']
      },
      {
        fields: ['status']
      }
    ]
  });

  // Scopes
  Vehicle.addScope('available', {
    where: {
      status: 'available',
      isActive: true
    }
  });

  Vehicle.addScope('ambulances', {
    where: {
      vehicleType: 'ambulance'
    }
  });

  Vehicle.addScope('withDriver', {
    where: {
      driverId: {
        [sequelize.Sequelize.Op.ne]: null
      }
    }
  });

  // Método para verificar se o veículo está disponível
  Vehicle.prototype.isAvailable = function() {
    return this.status === 'available' && this.isActive && this.driverId;
  };

  // Método para calcular distância aproximada de um ponto
  Vehicle.prototype.calculateDistance = function(latitude, longitude) {
    if (!this.currentLatitude || !this.currentLongitude) {
      return null;
    }

    const R = 6371; // Raio da Terra em km
    const dLat = (latitude - this.currentLatitude) * Math.PI / 180;
    const dLon = (longitude - this.currentLongitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.currentLatitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distância em km
  };

  return Vehicle;
};