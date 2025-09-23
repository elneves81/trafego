const { Vehicle, User, Ride } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const getVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      vehicleType,
      status,
      search,
      withDriver
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (vehicleType) where.vehicleType = vehicleType;
    if (status) where.status = status;
    if (withDriver === 'true') where.driverId = { [Op.ne]: null };
    if (withDriver === 'false') where.driverId = { [Op.is]: null };

    if (search) {
      where[Op.or] = [
        { plateNumber: { [Op.like]: `%${search}%` } },
        { model: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: vehicles } = await Vehicle.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'phone', 'isOnline']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['plateNumber', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        vehicles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByPk(id, {
      include: [
        {
          model: User,
          as: 'driver',
          attributes: { exclude: ['password'] }
        },
        {
          model: Ride,
          as: 'Rides',
          limit: 10,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'driver',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    logger.error('Get vehicle by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const createVehicle = async (req, res) => {
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
      plateNumber,
      model,
      brand,
      year,
      color,
      vehicleType,
      capacity,
      driverId,
      chassisNumber,
      renavam,
      insuranceExpiry,
      licenseExpiry,
      fuelType,
      averageConsumption,
      equipment,
      notes,
      gpsDeviceId
    } = req.body;

    // Verificar se placa já existe
    const existingVehicle = await Vehicle.findOne({
      where: { plateNumber }
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Já existe um veículo com esta placa'
      });
    }

    // Se foi especificado um motorista, verificar se existe
    if (driverId) {
      const driver = await User.findOne({
        where: {
          id: driverId,
          userType: 'driver',
          status: 'active'
        }
      });

      if (!driver) {
        return res.status(400).json({
          success: false,
          message: 'Motorista não encontrado ou inativo'
        });
      }
    }

    const vehicle = await Vehicle.create({
      plateNumber,
      model,
      brand,
      year,
      color,
      vehicleType,
      capacity,
      driverId,
      chassisNumber,
      renavam,
      insuranceExpiry,
      licenseExpiry,
      fuelType,
      averageConsumption,
      equipment,
      notes,
      gpsDeviceId
    });

    logger.info(`Vehicle created: ${vehicle.plateNumber}`);

    res.status(201).json({
      success: true,
      message: 'Veículo criado com sucesso',
      data: vehicle
    });
  } catch (error) {
    logger.error('Create vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    // Se está tentando alterar o motorista
    if (updateData.driverId && updateData.driverId !== vehicle.driverId) {
      const driver = await User.findOne({
        where: {
          id: updateData.driverId,
          userType: 'driver',
          status: 'active'
        }
      });

      if (!driver) {
        return res.status(400).json({
          success: false,
          message: 'Motorista não encontrado ou inativo'
        });
      }
    }

    await vehicle.update(updateData);

    logger.info(`Vehicle updated: ${vehicle.plateNumber}`);

    res.json({
      success: true,
      message: 'Veículo atualizado com sucesso',
      data: vehicle
    });
  } catch (error) {
    logger.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    // Verificar se veículo tem corridas ativas
    const activeRides = await Ride.count({
      where: {
        vehicleId: id,
        status: {
          [Op.notIn]: ['completed', 'cancelled']
        }
      }
    });

    if (activeRides > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir veículo com corridas ativas'
      });
    }

    // Soft delete - apenas marcar como inativo
    await vehicle.update({ isActive: false, status: 'inactive' });

    logger.info(`Vehicle deactivated: ${vehicle.plateNumber}`);

    res.json({
      success: true,
      message: 'Veículo desativado com sucesso'
    });
  } catch (error) {
    logger.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getAvailableVehicles = async (req, res) => {
  try {
    const { vehicleType } = req.query;

    const where = {
      status: 'available',
      isActive: true,
      driverId: { [Op.ne]: null }
    };

    if (vehicleType) {
      where.vehicleType = vehicleType;
    }

    const vehicles = await Vehicle.findAll({
      where,
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'phone', 'isOnline'],
          where: {
            status: 'active',
            isOnline: true
          }
        }
      ],
      order: [['plateNumber', 'ASC']]
    });

    res.json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    logger.error('Get available vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const updateVehicleLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;

    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    await vehicle.update({
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastLocationUpdate: new Date()
    });

    res.json({
      success: true,
      message: 'Localização do veículo atualizada',
      data: {
        latitude,
        longitude,
        timestamp: vehicle.lastLocationUpdate
      }
    });
  } catch (error) {
    logger.error('Update vehicle location error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getVehiclesByRadius = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude e longitude são obrigatórias'
      });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Cálculo aproximado dos limites do raio
    const latRange = radiusKm / 111; // 1 grau ≈ 111 km
    const lonRange = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const vehicles = await Vehicle.findAll({
      where: {
        status: 'available',
        isActive: true,
        currentLatitude: {
          [Op.between]: [lat - latRange, lat + latRange]
        },
        currentLongitude: {
          [Op.between]: [lon - lonRange, lon + lonRange]
        },
        lastLocationUpdate: {
          [Op.gte]: new Date(Date.now() - 30 * 60 * 1000) // Últimos 30 minutos
        }
      },
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'phone', 'isOnline']
        }
      ]
    });

    // Calcular distância exata e adicionar ao resultado
    const vehiclesWithDistance = vehicles.map(vehicle => {
      const distance = vehicle.calculateDistance(lat, lon);
      return {
        ...vehicle.toJSON(),
        distance: distance ? parseFloat(distance.toFixed(2)) : null
      };
    }).filter(vehicle => vehicle.distance && vehicle.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: vehiclesWithDistance
    });
  } catch (error) {
    logger.error('Get vehicles by radius error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getVehicleStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const vehicle = await Vehicle.findByPk(id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Veículo não encontrado'
      });
    }

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }

    const rideStats = await Ride.findAll({
      where: {
        vehicleId: id,
        ...dateFilter
      },
      attributes: [
        [Op.literal('COUNT(*)'), 'totalRides'],
        [Op.literal('COUNT(CASE WHEN status = "completed" THEN 1 END)'), 'completedRides'],
        [Op.literal('COUNT(CASE WHEN status = "cancelled" THEN 1 END)'), 'cancelledRides'],
        [Op.literal('AVG(rating)'), 'averageRating'],
        [Op.literal('SUM(actualDistance)'), 'totalDistance'],
        [Op.literal('SUM(actualDuration)'), 'totalDuration']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        vehicle,
        stats: rideStats[0]
      }
    });
  } catch (error) {
    logger.error('Get vehicle stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles,
  updateVehicleLocation,
  getVehiclesByRadius,
  getVehicleStats
};