const { Ride, User, Vehicle, Location, Notification } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const getRides = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      rideType,
      driverId,
      operatorId,
      startDate,
      endDate,
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (rideType) where.rideType = rideType;
    if (driverId) where.driverId = driverId;
    if (operatorId) where.operatorId = operatorId;

    if (startDate && endDate) {
      where.requestedDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (search) {
      where[Op.or] = [
        { rideNumber: { [Op.like]: `%${search}%` } },
        { patientName: { [Op.like]: `%${search}%` } },
        { originAddress: { [Op.like]: `%${search}%` } },
        { destinationAddress: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: rides } = await Ride.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'phone']
        },
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          attributes: ['id', 'plateNumber', 'model', 'vehicleType']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['requestedDateTime', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        rides,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getRideById = async (req, res) => {
  try {
    const { id } = req.params;

    const ride = await Ride.findByPk(id, {
      include: [
        {
          model: User,
          as: 'driver',
          attributes: { exclude: ['password'] }
        },
        {
          model: User,
          as: 'operator',
          attributes: { exclude: ['password'] }
        },
        {
          model: Vehicle,
          include: [
            {
              model: User,
              as: 'driver',
              attributes: ['id', 'name', 'phone']
            }
          ]
        },
        {
          model: Location,
          as: 'Locations',
          order: [['timestamp', 'ASC']],
          limit: 50
        }
      ]
    });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    res.json({
      success: true,
      data: ride
    });
  } catch (error) {
    logger.error('Get ride by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const createRide = async (req, res) => {
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
      patientName,
      patientDocument,
      patientAge,
      patientCondition,
      priority,
      rideType,
      originAddress,
      originLatitude,
      originLongitude,
      destinationAddress,
      destinationLatitude,
      destinationLongitude,
      scheduledDateTime,
      requestedBy,
      contactPhone,
      specialRequirements,
      notes,
      vehicleId,
      driverId
    } = req.body;

    // Verificar se veículo existe e está disponível
    if (vehicleId) {
      const vehicle = await Vehicle.findByPk(vehicleId);
      if (!vehicle || vehicle.status !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Veículo não disponível'
        });
      }
    }

    // Verificar se motorista existe e está disponível
    if (driverId) {
      const driver = await User.findOne({
        where: {
          id: driverId,
          userType: 'driver',
          status: 'active',
          isOnline: true
        }
      });

      if (!driver) {
        return res.status(400).json({
          success: false,
          message: 'Motorista não disponível'
        });
      }
    }

    const ride = await Ride.create({
      patientName,
      patientDocument,
      patientAge,
      patientCondition,
      priority,
      rideType,
      originAddress,
      originLatitude,
      originLongitude,
      destinationAddress,
      destinationLatitude,
      destinationLongitude,
      scheduledDateTime,
      requestedBy,
      contactPhone,
      specialRequirements,
      notes,
      operatorId: req.user.id,
      vehicleId,
      driverId
    });

    // Atualizar status do veículo se foi atribuído
    if (vehicleId) {
      await Vehicle.update(
        { status: 'busy' },
        { where: { id: vehicleId } }
      );
    }

    // Criar notificação para o motorista se foi atribuído
    if (driverId) {
      await Notification.createRideNotification(driverId, ride);
      
      // Atualizar status da corrida
      ride.status = 'assigned';
      await ride.save();
    }

    logger.info(`New ride created: ${ride.rideNumber} by ${req.user.name}`);

    // Incluir dados relacionados na resposta
    const rideWithDetails = await Ride.findByPk(ride.id, {
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'phone']
        },
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          attributes: ['id', 'plateNumber', 'model']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Corrida criada com sucesso',
      data: rideWithDetails
    });
  } catch (error) {
    logger.error('Create ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const updateRide = async (req, res) => {
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

    const ride = await Ride.findByPk(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    // Verificar se a corrida pode ser editada
    if (!['pending', 'assigned'].includes(ride.status)) {
      return res.status(400).json({
        success: false,
        message: 'Corrida não pode mais ser editada'
      });
    }

    await ride.update(updateData);

    logger.info(`Ride updated: ${ride.rideNumber} by ${req.user.name}`);

    res.json({
      success: true,
      message: 'Corrida atualizada com sucesso',
      data: ride
    });
  } catch (error) {
    logger.error('Update ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const assignRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, vehicleId } = req.body;

    const ride = await Ride.findByPk(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    if (ride.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Corrida já foi atribuída ou não está mais disponível'
      });
    }

    // Verificar motorista
    const driver = await User.findOne({
      where: {
        id: driverId,
        userType: 'driver',
        status: 'active',
        isOnline: true
      }
    });

    if (!driver) {
      return res.status(400).json({
        success: false,
        message: 'Motorista não disponível'
      });
    }

    // Verificar veículo
    const vehicle = await Vehicle.findByPk(vehicleId);

    if (!vehicle || vehicle.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: 'Veículo não disponível'
      });
    }

    // Atualizar corrida
    await ride.update({
      driverId,
      vehicleId,
      status: 'assigned'
    });

    // Atualizar status do veículo
    await vehicle.update({ status: 'busy' });

    // Criar notificação para o motorista
    await Notification.createRideNotification(driverId, ride);

    logger.info(`Ride assigned: ${ride.rideNumber} to driver ${driver.name}`);

    res.json({
      success: true,
      message: 'Corrida atribuída com sucesso',
      data: ride
    });
  } catch (error) {
    logger.error('Assign ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const updateRideStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const ride = await Ride.findByPk(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    // Verificar se o usuário pode alterar o status
    const canUpdate = 
      req.user.userType === 'admin' ||
      req.user.userType === 'supervisor' ||
      req.user.userType === 'operator' ||
      (req.user.userType === 'driver' && ride.driverId === req.user.id);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para alterar o status desta corrida'
      });
    }

    const updateData = { status };
    
    // Definir timestamps baseado no status
    const now = new Date();
    switch (status) {
      case 'accepted':
        updateData.acceptedAt = now;
        break;
      case 'en_route_to_origin':
        updateData.startedAt = now;
        break;
      case 'arrived_at_origin':
        updateData.arrivedOriginAt = now;
        break;
      case 'patient_onboard':
        updateData.departedOriginAt = now;
        break;
      case 'arrived_at_destination':
        updateData.arrivedDestinationAt = now;
        break;
      case 'completed':
        updateData.completedAt = now;
        updateData.actualDuration = ride.calculateDuration();
        
        // Liberar veículo
        if (ride.vehicleId) {
          await Vehicle.update(
            { status: 'available' },
            { where: { id: ride.vehicleId } }
          );
        }
        break;
      case 'cancelled':
        updateData.cancelledAt = now;
        updateData.cancelReason = notes;
        
        // Liberar veículo
        if (ride.vehicleId) {
          await Vehicle.update(
            { status: 'available' },
            { where: { id: ride.vehicleId } }
          );
        }
        break;
    }

    if (notes && status !== 'cancelled') {
      updateData.notes = notes;
    }

    await ride.update(updateData);

    logger.info(`Ride status updated: ${ride.rideNumber} -> ${status} by ${req.user.name}`);

    res.json({
      success: true,
      message: 'Status da corrida atualizado com sucesso',
      data: ride
    });
  } catch (error) {
    logger.error('Update ride status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const cancelRide = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ride = await Ride.findByPk(id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Corrida não encontrada'
      });
    }

    if (!ride.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Corrida não pode ser cancelada neste status'
      });
    }

    await ride.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason
    });

    // Liberar veículo se estava atribuído
    if (ride.vehicleId) {
      await Vehicle.update(
        { status: 'available' },
        { where: { id: ride.vehicleId } }
      );
    }

    // Notificar motorista se estava atribuído
    if (ride.driverId) {
      await Notification.createStatusNotification(
        ride.driverId,
        'Corrida Cancelada',
        `A corrida #${ride.rideNumber} foi cancelada.`
      );
    }

    logger.info(`Ride cancelled: ${ride.rideNumber} by ${req.user.name} - Reason: ${reason}`);

    res.json({
      success: true,
      message: 'Corrida cancelada com sucesso',
      data: ride
    });
  } catch (error) {
    logger.error('Cancel ride error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getActiveRides = async (req, res) => {
  try {
    const { driverId } = req.query;
    
    const where = {
      status: {
        [Op.notIn]: ['completed', 'cancelled']
      }
    };

    if (driverId) {
      where.driverId = driverId;
    }

    const rides = await Ride.findAll({
      where,
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name', 'phone']
        },
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          attributes: ['id', 'plateNumber', 'model']
        }
      ],
      order: [['requestedDateTime', 'ASC']]
    });

    res.json({
      success: true,
      data: rides
    });
  } catch (error) {
    logger.error('Get active rides error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getRideHistory = async (req, res) => {
  try {
    const { driverId, startDate, endDate } = req.query;

    const where = {
      status: { [Op.in]: ['completed', 'cancelled'] }
    };

    if (driverId) {
      where.driverId = driverId;
    }

    if (startDate && endDate) {
      where.requestedDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const rides = await Ride.findAll({
      where,
      include: [
        {
          model: User,
          as: 'driver',
          attributes: ['id', 'name']
        },
        {
          model: Vehicle,
          attributes: ['id', 'plateNumber', 'model']
        }
      ],
      order: [['completedAt', 'DESC'], ['cancelledAt', 'DESC']]
    });

    res.json({
      success: true,
      data: rides
    });
  } catch (error) {
    logger.error('Get ride history error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getRideStats = async (req, res) => {
  try {
    const { startDate, endDate, driverId, vehicleId } = req.query;

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        requestedDateTime: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }

    const where = { ...dateFilter };
    if (driverId) where.driverId = driverId;
    if (vehicleId) where.vehicleId = vehicleId;

    const stats = await Ride.findAll({
      where,
      attributes: [
        [Op.literal('COUNT(*)'), 'totalRides'],
        [Op.literal('COUNT(CASE WHEN status = "completed" THEN 1 END)'), 'completedRides'],
        [Op.literal('COUNT(CASE WHEN status = "cancelled" THEN 1 END)'), 'cancelledRides'],
        [Op.literal('COUNT(CASE WHEN priority = "emergency" THEN 1 END)'), 'emergencyRides'],
        [Op.literal('AVG(rating)'), 'averageRating'],
        [Op.literal('SUM(actualDistance)'), 'totalDistance'],
        [Op.literal('AVG(actualDuration)'), 'averageDuration']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    logger.error('Get ride stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getRides,
  getRideById,
  createRide,
  updateRide,
  assignRide,
  updateRideStatus,
  cancelRide,
  getActiveRides,
  getRideHistory,
  getRideStats
};