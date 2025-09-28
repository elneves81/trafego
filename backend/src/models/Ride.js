const { Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Ride = sequelize.define('Ride', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    rideNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Número sequencial da corrida para identificação'
    },
    patientName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    patientDocument: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'CPF ou RG do paciente'
    },
    patientAge: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 150
      }
    },
    patientCondition: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Condição médica do paciente'
    },
    priority: {
      type: DataTypes.ENUM,
      values: ['low', 'normal', 'high', 'emergency'],
      defaultValue: 'normal'
    },
    rideType: {
      type: DataTypes.ENUM,
      values: ['emergency', 'scheduled', 'return', 'transfer'],
      allowNull: false
    },
    originAddress: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    originLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    originLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    destinationAddress: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    destinationLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    destinationLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    requestedDateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    scheduledDateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Para corridas agendadas'
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    arrivedOriginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    departedOriginAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    arrivedDestinationAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM,
      values: [
        'pending',
        'assigned',
        'accepted',
        'en_route_to_origin',
        'arrived_at_origin',
        'patient_onboard',
        'en_route_to_destination',
        'arrived_at_destination',
        'completed',
        'cancelled'
      ],
      defaultValue: 'pending'
    },
    driverId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    operatorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    vehicleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    requestedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Quem solicitou a corrida (hospital, UBS, etc.)'
    },
    contactPhone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Telefone de contato para a corrida'
    },
    specialRequirements: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Requisitos especiais (maca, oxigênio, etc.)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Observações gerais sobre a corrida'
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estimatedDistance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Distância estimada em km'
    },
    actualDistance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: 'Distância real percorrida em km'
    },
    estimatedDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duração estimada em minutos'
    },
    actualDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duração real em minutos'
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: 'Custo estimado da corrida'
    }
  }, {
    tableName: 'rides',
    timestamps: true,
    indexes: [
      {
        fields: ['rideNumber']
      },
      {
        fields: ['status']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['driverId']
      },
      {
        fields: ['operatorId']
      },
      {
        fields: ['vehicleId']
      },
      {
        fields: ['requestedDateTime']
      },
      {
        fields: ['scheduledDateTime']
      }
    ]
  });

  // Hooks
  Ride.beforeCreate(async (ride, options) => {
    // Gerar número sequencial da corrida
    const today = new Date();
    const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    const lastRide = await Ride.findOne({
      where: {
        rideNumber: {
          [Op.like]: `${dateString}%`
        }
      },
      order: [['rideNumber', 'DESC']]
    });

    let sequence = 1;
    if (lastRide) {
      const lastSequence = parseInt(lastRide.rideNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    ride.rideNumber = `${dateString}${sequence.toString().padStart(4, '0')}`;
  });

  // Scopes
  Ride.addScope('active', {
    where: {
      status: {
        [Op.notIn]: ['completed', 'cancelled']
      }
    }
  });

  Ride.addScope('pending', {
    where: {
      status: 'pending'
    }
  });

  Ride.addScope('emergency', {
    where: {
      priority: 'emergency'
    }
  });

  Ride.addScope('today', {
    where: {
      requestedDateTime: {
        [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  });

  // Métodos de instância
  Ride.prototype.canBeCancelled = function() {
    return ['pending', 'assigned', 'accepted'].includes(this.status);
  };

  Ride.prototype.isActive = function() {
    return !['completed', 'cancelled'].includes(this.status);
  };

  Ride.prototype.calculateDuration = function() {
    if (this.completedAt && this.startedAt) {
      return Math.round((this.completedAt - this.startedAt) / (1000 * 60)); // em minutos
    }
    return null;
  };

  return Ride;
};