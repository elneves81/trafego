const { Location, User, Ride } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const updateLocation = async (req, res) => {
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
      latitude,
      longitude,
      altitude,
      accuracy,
      speed,
      heading,
      batteryLevel,
      rideId
    } = req.body;

    // Criar novo registro de localização
    const location = await Location.create({
      latitude,
      longitude,
      altitude,
      accuracy,
      speed,
      heading,
      batteryLevel,
      userId: req.user.id,
      rideId,
      timestamp: new Date(),
      isMoving: speed > 0,
      locationType: 'gps'
    });

    // Atualizar localização atual do veículo se o usuário for motorista
    if (req.user.userType === 'driver') {
      const { Vehicle } = require('../models');
      await Vehicle.update(
        {
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastLocationUpdate: new Date()
        },
        {
          where: { driverId: req.user.id }
        }
      );
    }

    logger.info(`Location updated for user ${req.user.id}: ${latitude}, ${longitude}`);

    res.json({
      success: true,
      message: 'Localização atualizada com sucesso',
      data: {
        id: location.id,
        latitude,
        longitude,
        timestamp: location.timestamp
      }
    });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getLocationHistory = async (req, res) => {
  try {
    const { userId, rideId, startDate, endDate, limit = 100 } = req.query;

    const where = {};
    
    if (userId) {
      where.userId = userId;
    } else if (req.user.userType === 'driver') {
      // Motorista só pode ver suas próprias localizações
      where.userId = req.user.id;
    }

    if (rideId) where.rideId = rideId;

    if (startDate && endDate) {
      where.timestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const locations = await Location.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name']
        },
        {
          model: Ride,
          attributes: ['id', 'rideNumber']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    logger.error('Get location history error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getCurrentLocations = async (req, res) => {
  try {
    const { userType = 'driver' } = req.query;

    // Buscar usuários online do tipo especificado
    const users = await User.findAll({
      where: {
        userType,
        isOnline: true,
        status: 'active'
      },
      attributes: ['id', 'name', 'phone']
    });

    const userIds = users.map(user => user.id);

    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Buscar última localização de cada usuário
    const locations = await Location.findAll({
      attributes: [
        'userId',
        'latitude',
        'longitude',
        'speed',
        'heading',
        'batteryLevel',
        'timestamp',
        [Location.sequelize.fn('MAX', Location.sequelize.col('timestamp')), 'maxTimestamp']
      ],
      where: {
        userId: { [Op.in]: userIds },
        timestamp: {
          [Op.gte]: new Date(Date.now() - 30 * 60 * 1000) // Últimos 30 minutos
        }
      },
      group: ['userId'],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'phone', 'userType']
        }
      ]
    });

    res.json({
      success: true,
      data: locations
    });
  } catch (error) {
    logger.error('Get current locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getLocationsByRadius = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5, userType } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude e longitude são obrigatórias'
      });
    }

    const locations = await Location.findByRadius(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radius)
    );

    // Filtrar por tipo de usuário se especificado
    let filteredLocations = locations;
    if (userType) {
      const userIds = await User.findAll({
        where: { userType },
        attributes: ['id']
      }).then(users => users.map(user => user.id));

      filteredLocations = locations.filter(loc => userIds.includes(loc.userId));
    }

    // Incluir dados do usuário
    const locationsWithUsers = await Promise.all(
      filteredLocations.map(async (location) => {
        const user = await User.findByPk(location.userId, {
          attributes: ['id', 'name', 'phone', 'userType']
        });
        return {
          ...location.toJSON(),
          User: user
        };
      })
    );

    res.json({
      success: true,
      data: locationsWithUsers
    });
  } catch (error) {
    logger.error('Get locations by radius error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getRideRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const ride = await Ride.findByPk(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    // Buscar todas as localizações da corrida
    const locations = await Location.findAll({
      where: { rideId: id },
      order: [['timestamp', 'ASC']]
    });

    // Calcular estatísticas da rota
    let totalDistance = 0;
    let maxSpeed = 0;
    let averageSpeed = 0;

    if (locations.length > 1) {
      let speedSum = 0;
      let speedCount = 0;

      for (let i = 1; i < locations.length; i++) {
        const prevLocation = locations[i - 1];
        const currentLocation = locations[i];
        
        // Calcular distância entre pontos
        const distance = prevLocation.calculateDistanceFrom(currentLocation);
        totalDistance += distance;

        // Estatísticas de velocidade
        if (currentLocation.speed) {
          maxSpeed = Math.max(maxSpeed, currentLocation.speed);
          speedSum += currentLocation.speed;
          speedCount++;
        }
      }

      if (speedCount > 0) {
        averageSpeed = speedSum / speedCount;
      }
    }

    res.json({
      success: true,
      data: {
        ride: {
          id: ride.id,
          rideNumber: ride.rideNumber,
          status: ride.status,
          originAddress: ride.originAddress,
          destinationAddress: ride.destinationAddress
        },
        route: {
          locations,
          stats: {
            totalDistance: parseFloat(totalDistance.toFixed(2)),
            maxSpeed: parseFloat(maxSpeed.toFixed(1)),
            averageSpeed: parseFloat(averageSpeed.toFixed(1)),
            totalPoints: locations.length,
            duration: locations.length > 0 ? 
              (locations[locations.length - 1].timestamp - locations[0].timestamp) / 1000 / 60 : 0 // em minutos
          }
        }
      }
    });
  } catch (error) {
    logger.error('Get ride route error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const deleteOldLocations = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const deletedCount = await Location.destroy({
      where: {
        timestamp: {
          [Op.lt]: cutoffDate
        },
        rideId: null // Não deletar localizações de corridas
      }
    });

    logger.info(`Deleted ${deletedCount} old location records older than ${days} days`);

    res.json({
      success: true,
      message: `${deletedCount} registros de localização antigos foram removidos`,
      data: {
        deletedCount,
        cutoffDate
      }
    });
  } catch (error) {
    logger.error('Delete old locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  updateLocation,
  getLocationHistory,
  getCurrentLocations,
  getLocationsByRadius,
  getRideRoute,
  deleteOldLocations
};