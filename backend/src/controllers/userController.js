const { User, Vehicle, Ride } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userType,
      status,
      search,
      isOnline
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (userType) where.userType = userType;
    if (status) where.status = status;
    if (isOnline !== undefined) where.isOnline = isOnline === 'true';

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Vehicle,
          as: 'Vehicles',
          attributes: ['id', 'plateNumber', 'model', 'status']
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Vehicle,
          as: 'Vehicles'
        },
        {
          model: Ride,
          as: 'driverRides',
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const createUser = async (req, res) => {
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
      name,
      email,
      password,
      phone,
      cpf,
      userType,
      dateOfBirth,
      address,
      licenseNumber,
      licenseExpiry,
      emergencyContact,
      emergencyPhone
    } = req.body;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { cpf }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já existe com este email ou CPF'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      cpf,
      userType,
      dateOfBirth,
      address,
      licenseNumber,
      licenseExpiry,
      emergencyContact,
      emergencyPhone
    });

    logger.info(`User created by admin: ${user.email} (${user.userType})`);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const updateUser = async (req, res) => {
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

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Não permitir alterar senha por aqui
    delete updateData.password;

    await user.update(updateData);

    logger.info(`User updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se usuário tem corridas ativas
    const activeRides = await Ride.count({
      where: {
        driverId: id,
        status: {
          [Op.notIn]: ['completed', 'cancelled']
        }
      }
    });

    if (activeRides > 0) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível excluir usuário com corridas ativas'
      });
    }

    // Soft delete - apenas marcar como inativo
    await user.update({ status: 'inactive' });

    logger.info(`User deactivated: ${user.email}`);

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getDrivers = async (req, res) => {
  try {
    const { isOnline, isAvailable } = req.query;

    const where = { userType: 'driver', status: 'active' };

    if (isOnline !== undefined) {
      where.isOnline = isOnline === 'true';
    }

    const drivers = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Vehicle,
          as: 'Vehicles',
          where: isAvailable === 'true' ? { status: 'available' } : {},
          required: isAvailable === 'true'
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    logger.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getOperators = async (req, res) => {
  try {
    const { isOnline } = req.query;

    const where = { 
      userType: { [Op.in]: ['operator', 'supervisor', 'admin'] },
      status: 'active'
    };

    if (isOnline !== undefined) {
      where.isOnline = isOnline === 'true';
    }

    const operators = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: operators
    });
  } catch (error) {
    logger.error('Get operators error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    await user.update({ status });

    logger.info(`User status changed: ${user.email} -> ${status}`);

    res.json({
      success: true,
      message: `Status do usuário alterado para ${status}`,
      data: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
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

    const stats = {};

    if (user.userType === 'driver') {
      const rideStats = await Ride.findAll({
        where: {
          driverId: id,
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

      stats.rides = rideStats[0];
    }

    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
        stats
      }
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDrivers,
  getOperators,
  toggleUserStatus,
  getUserStats
};