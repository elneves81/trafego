const { Attendance, User, Ride, Vehicle } = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Função para normalizar campos de texto para maiúsculas
const normalizeTextFields = (data) => {
  const textFields = [
    'callerName', 'patientName', 'address', 'city', 'state', 
    'originAddress', 'originReference', 'originContact',
    'destinationAddress', 'destinationContact', 'medicalCondition',
    'observations', 'preferredHospital', 'relationship', 'patientDocument'
  ];

  const normalizedData = { ...data };
  
  textFields.forEach(field => {
    if (normalizedData[field] && typeof normalizedData[field] === 'string') {
      normalizedData[field] = normalizedData[field].toUpperCase().trim();
    }
  });

  return normalizedData;
};

// Função para gerar número único de atendimento
const generateAttendanceNumber = async () => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Buscar o último atendimento do dia
  const lastAttendance = await Attendance.findOne({
    where: {
      attendanceNumber: {
        [Op.like]: `ATD-${dateStr}-%`
      }
    },
    order: [['attendanceNumber', 'DESC']]
  });

  let sequence = 1;
  if (lastAttendance) {
    const lastNumber = lastAttendance.attendanceNumber.split('-')[2];
    sequence = parseInt(lastNumber) + 1;
  }

  return `ATD-${dateStr}-${sequence.toString().padStart(3, '0')}`;
};

// Criar novo atendimento
const createAttendance = async (req, res) => {
  try {
    console.log('🔍 ATTENDANCE - Dados recebidos:', req.body);
    console.log('👤 ATTENDANCE - Usuário:', req.user);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ ATTENDANCE - Erros de validação:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const attendanceNumber = await generateAttendanceNumber();
    
    // Normalizar campos de texto para maiúsculas
    const normalizedData = normalizeTextFields(req.body);
    
    const attendanceData = {
      ...normalizedData,
      attendanceNumber,
      operatorId: req.user.id,
      callDateTime: new Date()
    };

    const attendance = await Attendance.create(attendanceData);

    // Buscar o atendimento criado com as associações
    const newAttendance = await Attendance.findByPk(attendance.id, {
      include: [
        { 
          model: User, 
          as: 'operator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    logger.info(`Novo atendimento criado: ${attendanceNumber} por ${req.user.name}`);

    res.status(201).json({
      success: true,
      message: 'Atendimento registrado com sucesso',
      data: newAttendance
    });

  } catch (error) {
    logger.error('Erro ao criar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Listar atendimentos
const getAttendances = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      priority, 
      startDate, 
      endDate,
      search,
      category
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filtros
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    
    if (startDate && endDate) {
      where.callDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    if (search) {
      where[Op.or] = [
        { attendanceNumber: { [Op.like]: `%${search}%` } },
        { patientName: { [Op.like]: `%${search}%` } },
        { callerName: { [Op.like]: `%${search}%` } },
        { callerPhone: { [Op.like]: `%${search}%` } },
        { patientDocument: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Ride,
          attributes: ['id', 'rideNumber', 'status']
        }
      ],
      order: [['callDateTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        attendances: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar atendimentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar atendimento por ID
const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findByPk(id, {
      include: [
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Ride,
          include: [
            {
              model: User,
              as: 'driver',
              attributes: ['id', 'name', 'phone']
            },
            {
              model: Vehicle,
              attributes: ['id', 'plateNumber', 'model', 'vehicleType']
            }
          ]
        }
      ]
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Atendimento não encontrado'
      });
    }

    res.json({
      success: true,
      data: attendance
    });

  } catch (error) {
    logger.error('Erro ao buscar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar atendimento
const updateAttendance = async (req, res) => {
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
    const attendance = await Attendance.findByPk(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Atendimento não encontrado'
      });
    }

    // Verificar se o usuário pode atualizar
    if (attendance.operatorId !== req.user.id && !['admin', 'supervisor'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para atualizar este atendimento'
      });
    }

    // Normalizar campos de texto para maiúsculas
    const normalizedData = normalizeTextFields(req.body);
    
    await attendance.update(normalizedData);

    // Buscar atendimento atualizado
    const updatedAttendance = await Attendance.findByPk(id, {
      include: [
        {
          model: User,
          as: 'operator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'supervisor',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    logger.info(`Atendimento ${attendance.attendanceNumber} atualizado por ${req.user.name}`);

    res.json({
      success: true,
      message: 'Atendimento atualizado com sucesso',
      data: updatedAttendance
    });

  } catch (error) {
    logger.error('Erro ao atualizar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Aprovar atendimento (criar corrida)
const approveAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleId, driverId, scheduledDateTime, observations } = req.body;

    const attendance = await Attendance.findByPk(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Atendimento não encontrado'
      });
    }

    if (attendance.status !== 'Recebida' && attendance.status !== 'Triagem') {
      return res.status(400).json({
        success: false,
        message: 'Atendimento não pode ser aprovado neste status'
      });
    }

    // Verificar permissão (apenas admin e supervisor podem aprovar)
    if (!['admin', 'supervisor'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para aprovar atendimentos'
      });
    }

    // Criar corrida
    const rideData = {
      patientName: attendance.patientName,
      patientDocument: attendance.patientDocument,
      patientAge: attendance.patientAge,
      patientCondition: attendance.medicalCondition,
      priority: attendance.priority,
      rideType: 'Emergência',
      originAddress: attendance.originAddress,
      originLatitude: attendance.originLatitude,
      originLongitude: attendance.originLongitude,
      destinationAddress: attendance.destinationAddress,
      destinationLatitude: attendance.destinationLatitude,
      destinationLongitude: attendance.destinationLongitude,
      scheduledDateTime: scheduledDateTime || new Date(),
      requestedBy: attendance.callerName,
      contactPhone: attendance.callerPhone,
      specialRequirements: attendance.specialEquipmentNotes,
      notes: observations,
      driverId,
      vehicleId,
      operatorId: attendance.operatorId,
      status: 'Pending'
    };

    const ride = await Ride.create(rideData);

    // Atualizar atendimento
    await attendance.update({
      status: 'Aprovada',
      rideId: ride.id,
      supervisorId: req.user.id,
      dispatchTime: new Date()
    });

    logger.info(`Atendimento ${attendance.attendanceNumber} aprovado e corrida ${ride.rideNumber} criada por ${req.user.name}`);

    res.json({
      success: true,
      message: 'Atendimento aprovado e corrida criada com sucesso',
      data: {
        attendance,
        ride
      }
    });

  } catch (error) {
    logger.error('Erro ao aprovar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Cancelar atendimento
const cancelAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancelReason } = req.body;

    const attendance = await Attendance.findByPk(id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Atendimento não encontrado'
      });
    }

    if (['Finalizada', 'Cancelada'].includes(attendance.status)) {
      return res.status(400).json({
        success: false,
        message: 'Atendimento não pode ser cancelado neste status'
      });
    }

    await attendance.update({
      status: 'Cancelada',
      cancelReason: cancelReason || 'Cancelado pelo operador',
      completedAt: new Date()
    });

    logger.info(`Atendimento ${attendance.attendanceNumber} cancelado por ${req.user.name}`);

    res.json({
      success: true,
      message: 'Atendimento cancelado com sucesso',
      data: attendance
    });

  } catch (error) {
    logger.error('Erro ao cancelar atendimento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Estatísticas de atendimentos
const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.callDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const stats = await Attendance.findAll({
      attributes: [
        'status',
        'priority',
        'urgencyCode',
        [Attendance.sequelize.fn('COUNT', '*'), 'count']
      ],
      where,
      group: ['status', 'priority', 'urgencyCode'],
      raw: true
    });

    // Organizar estatísticas
    const organized = {
      byStatus: {},
      byPriority: {},
      byUrgencyCode: {},
      total: 0
    };

    stats.forEach(stat => {
      organized.byStatus[stat.status] = (organized.byStatus[stat.status] || 0) + parseInt(stat.count);
      organized.byPriority[stat.priority] = (organized.byPriority[stat.priority] || 0) + parseInt(stat.count);
      if (stat.urgencyCode) {
        organized.byUrgencyCode[stat.urgencyCode] = (organized.byUrgencyCode[stat.urgencyCode] || 0) + parseInt(stat.count);
      }
      organized.total += parseInt(stat.count);
    });

    res.json({
      success: true,
      data: organized
    });

  } catch (error) {
    logger.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  createAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  approveAttendance,
  cancelAttendance,
  getAttendanceStats
};