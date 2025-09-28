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

    // Normalizar campos de texto para maiúsculas
    const normalizedData = normalizeTextFields(req.body);
    
    // 🚫 VERIFICAR DUPLICAÇÃO - Evitar paciente duplicado nas últimas 2 horas
    const recentCutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 horas atrás
    const existingAttendance = await Attendance.findOne({
      where: {
        patientName: normalizedData.patientName,
        patientDocument: normalizedData.patientDocument,
        createdAt: {
          [Op.gte]: recentCutoff
        }
      }
    });

    if (existingAttendance) {
      console.log('⚠️ ATTENDANCE - Paciente já possui atendimento recente:', existingAttendance.attendanceNumber);
      return res.status(409).json({
        success: false,
        message: `Paciente ${normalizedData.patientName} já possui atendimento recente (${existingAttendance.attendanceNumber}). Aguarde 2 horas ou use o atendimento existente.`,
        existingAttendance: existingAttendance.attendanceNumber
      });
    }

    const attendanceNumber = await generateAttendanceNumber();
    
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

// Distribuição inteligente de corridas
const intelligentDispatch = async (req, res) => {
  try {
    logger.info('🚀 Iniciando distribuição inteligente de corridas');

    // Verificar permissão
    if (!['admin', 'supervisor'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para distribuir corridas'
      });
    }

    // Buscar atendimentos pendentes
    const pendingAttendances = await Attendance.findAll({
      where: { 
        status: 'Recebida',
        rideId: null 
      },
      order: [
        ['priority', 'DESC'], // Prioridade alta primeiro
        ['createdAt', 'ASC']  // Mais antigos primeiro
      ],
      limit: 20 // Processar até 20 por vez
    });

    if (pendingAttendances.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum atendimento pendente para distribuir',
        processed: 0
      });
    }

    // Buscar motoristas disponíveis
    const availableDrivers = await User.findAll({
      where: {
        userType: 'driver',
        status: 'active'
      },
      include: [{
        model: Vehicle,
        where: { status: 'active' },
        required: false
      }]
    });

    if (availableDrivers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum motorista disponível no momento'
      });
    }

    let processedCount = 0;
    const results = [];

    for (const attendance of pendingAttendances) {
      try {
        // Lógica de distribuição inteligente multi-critério
        const selectedDriver = await selectBestDriverIntelligent(availableDrivers, attendance);
        
        // Gerar número da corrida
        const today = new Date();
        const dateString = today.toISOString().slice(0, 10).replace(/-/g, '');
        
        // Buscar último número da corrida para gerar sequencial
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

        const rideNumber = `${dateString}${sequence.toString().padStart(4, '0')}`;

        // Criar corrida
        const rideData = {
          rideNumber,
          patientName: attendance.patientName,
          patientDocument: attendance.patientDocument,
          patientAge: attendance.patientAge,
          patientCondition: attendance.medicalCondition,
          priority: attendance.priority,
          rideType: attendance.category === 'emergency' ? 'Emergência' : 'Transporte',
          originAddress: attendance.originAddress,
          originLatitude: attendance.originLatitude,
          originLongitude: attendance.originLongitude,
          destinationAddress: attendance.destinationAddress,
          destinationLatitude: attendance.destinationLatitude,
          destinationLongitude: attendance.destinationLongitude,
          scheduledDateTime: new Date(),
          requestedBy: attendance.callerName,
          contactPhone: attendance.callerPhone,
          specialRequirements: attendance.specialEquipmentNotes,
          notes: `Atendimento: ${attendance.attendanceNumber}`,
          driverId: selectedDriver ? selectedDriver.id : null,
          vehicleId: selectedDriver && selectedDriver.Vehicles && selectedDriver.Vehicles[0] ? selectedDriver.Vehicles[0].id : null,
          operatorId: attendance.operatorId,
          status: selectedDriver ? 'pending' : 'pending'
        };

        const ride = await Ride.create(rideData);

        // Atualizar atendimento
        await attendance.update({
          status: 'Aprovada',
          rideId: ride.id,
          supervisorId: req.user.id,
          dispatchTime: new Date()
        });

        processedCount++;
        results.push({
          attendanceNumber: attendance.attendanceNumber,
          rideNumber: ride.rideNumber,
          assignedDriver: selectedDriver ? selectedDriver.name : 'Não atribuído',
          priority: attendance.priority
        });

        logger.info(`✅ Atendimento ${attendance.attendanceNumber} → Corrida ${ride.rideNumber} → Motorista: ${selectedDriver ? selectedDriver.name : 'Pool'}`);

      } catch (error) {
        logger.error(`❌ Erro ao processar atendimento ${attendance.attendanceNumber}:`, error);
        results.push({
          attendanceNumber: attendance.attendanceNumber,
          error: error.message
        });
      }
    }

    logger.info(`🎯 Distribuição concluída: ${processedCount}/${pendingAttendances.length} processados`);

    res.json({
      success: true,
      message: `Distribuição inteligente concluída: ${processedCount} corridas criadas`,
      processed: processedCount,
      total: pendingAttendances.length,
      results
    });

  } catch (error) {
    logger.error('❌ Erro na distribuição inteligente:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Função para selecionar o melhor motorista para uma corrida
const selectBestDriver = (drivers, attendance) => {
  if (drivers.length === 0) return null;

  // Filtrar motoristas com veículos
  const driversWithVehicles = drivers.filter(driver => driver.Vehicles && driver.Vehicles.length > 0);
  
  if (driversWithVehicles.length === 0) {
    // Se nenhum tem veículo, retorna o primeiro disponível
    return drivers[0];
  }

  // Lógica de seleção inteligente baseada em:
  // 1. Prioridade do atendimento
  // 2. Disponibilidade atual
  // 3. Rotação justa (round-robin simples)
  
  // Para emergências, priorizar qualquer motorista disponível
  if (attendance.priority === 'Alta' || attendance.category === 'emergency') {
    return driversWithVehicles[0];
  }

  // Para atendimentos normais, usar rotação simples
  const driverIndex = Math.floor(Math.random() * driversWithVehicles.length);
  return driversWithVehicles[driverIndex];
};

// 🧠 SISTEMA INTELIGENTE DE SELEÇÃO DE MOTORISTAS
const selectBestDriverIntelligent = async (drivers, attendance) => {
  try {
    logger.info(`🎯 Selecionando melhor motorista para atendimento: ${attendance.attendanceNumber}`);
    
    // Filtrar apenas motoristas ativos com veículos
    const availableDrivers = drivers.filter(driver => 
      driver.status === 'active' && (driver.Vehicle || (driver.Vehicles && driver.Vehicles.length > 0))
    );

    if (availableDrivers.length === 0) {
      logger.warn('⚠️ Nenhum motorista com veículo disponível');
      return drivers[0]; // Fallback
    }

    logger.info(`📊 Analisando ${availableDrivers.length} motoristas disponíveis`);

    // Calcular score para cada motorista
    const driverScores = await Promise.all(
      availableDrivers.map(async (driver) => {
        const score = await calculateDriverScore(driver, attendance);
        return { driver, score };
      })
    );

    // Ordenar por score (maior score = melhor opção)
    driverScores.sort((a, b) => b.score - a.score);

    // Log dos scores para debug
    logger.info('🏆 Ranking de motoristas:');
    driverScores.forEach((item, index) => {
      logger.info(`${index + 1}. ${item.driver.name}: ${item.score.toFixed(2)} pontos`);
    });

    const selectedDriver = driverScores[0].driver;
    logger.info(`✅ Motorista selecionado: ${selectedDriver.name} (Score: ${driverScores[0].score.toFixed(2)})`);
    
    return selectedDriver;

  } catch (error) {
    logger.error('❌ Erro na seleção inteligente de motorista:', error);
    // Fallback para seleção aleatória
    const driversWithVehicles = drivers.filter(d => d.status === 'active');
    return driversWithVehicles[Math.floor(Math.random() * driversWithVehicles.length)] || drivers[0];
  }
};

// 📊 CÁLCULO DE SCORE INTELIGENTE PARA MOTORISTAS
const calculateDriverScore = async (driver, attendance) => {
  let score = 100; // Score base

  try {
    // 1. CARGA DE TRABALHO ATUAL (peso: 30%)
    const currentRides = await Ride.count({
      where: {
        driverId: driver.id,
        status: ['pending', 'accepted', 'started']
      }
    });

    // Penalizar motoristas sobrecarregados
    const workloadPenalty = currentRides * 15;
    score -= workloadPenalty;
    
    // 2. HISTÓRICO DE PERFORMANCE (peso: 25%)
    const completedRides = await Ride.count({
      where: {
        driverId: driver.id,
        status: 'completed'
      }
    });

    const cancelledRides = await Ride.count({
      where: {
        driverId: driver.id,
        status: 'cancelled'
      }
    });

    // Bonificar experiência
    const experienceBonus = Math.min(completedRides * 2, 20);
    score += experienceBonus;

    // Penalizar cancelamentos excessivos
    if (completedRides > 0) {
      const cancellationRate = cancelledRides / (completedRides + cancelledRides);
      if (cancellationRate > 0.1) { // Mais de 10% de cancelamentos
        score -= cancellationRate * 30;
      }
    }

    // 3. PRIORIDADE POR TIPO DE EMERGÊNCIA (peso: 20%)
    if (attendance.priority === 'Alta') {
      // Para emergências, priorizar motoristas com menos carga
      const emergencyBonus = (5 - currentRides) * 5;
      score += Math.max(emergencyBonus, 0);
    }

    // 4. DISPONIBILIDADE TEMPORAL (peso: 15%)
    const now = new Date();
    const hour = now.getHours();
    
    // Bonificar disponibilidade em horários críticos
    if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) {
      score += 10; // Horários de pico
    }

    // 5. BALANCEAMENTO DE DISTRIBUIÇÃO (peso: 10%)
    const todayRides = await Ride.count({
      where: {
        driverId: driver.id,
        createdAt: {
          [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    // Incentivar distribuição equilibrada
    const distributionBonus = Math.max(10 - todayRides * 2, -10);
    score += distributionBonus;

    // Garantir score mínimo
    score = Math.max(score, 10);

    logger.info(`📈 Score calculado para ${driver.name}:`);
    logger.info(`   Base: 100, Carga: -${workloadPenalty}, Experiência: +${experienceBonus}`);
    logger.info(`   Hoje: ${todayRides} corridas, Score final: ${score.toFixed(2)}`);

    return score;

  } catch (error) {
    logger.error(`❌ Erro ao calcular score para ${driver.name}:`, error);
    return 50; // Score padrão em caso de erro
  }
};

// 🚀 DISTRIBUIÇÃO AVANÇADA PARA MÚLTIPLOS MOTORISTAS
const multiDriverDispatch = async (req, res) => {
  try {
    logger.info('🚀 Iniciando distribuição inteligente para múltiplos motoristas');

    // Verificar permissão
    if (!['admin', 'supervisor'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para distribuir corridas'
      });
    }

    // Buscar atendimentos pendentes
    const pendingAttendances = await Attendance.findAll({
      where: { 
        status: 'Recebida',
        rideId: null 
      },
      order: [
        ['priority', 'DESC'], // Prioridade alta primeiro
        ['createdAt', 'ASC']  // Mais antigos primeiro
      ]
    });

    if (pendingAttendances.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum atendimento pendente para distribuir',
        processed: 0,
        drivers: []
      });
    }

    // Buscar todos os motoristas disponíveis
    const availableDrivers = await User.findAll({
      where: {
        userType: 'driver',
        status: 'active'
      },
      include: [{
        model: Vehicle,
        where: { status: 'active' },
        required: false
      }]
    });

    if (availableDrivers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum motorista disponível no momento'
      });
    }

    logger.info(`📊 Distribuindo ${pendingAttendances.length} atendimentos entre ${availableDrivers.length} motoristas`);

    const driverAssignments = new Map(); // Track assignments per driver
    const results = [];
    let processedCount = 0;

    for (const attendance of pendingAttendances) {
      try {
        // Seleção inteligente baseada em múltiplos critérios
        const selectedDriver = await selectBestDriverIntelligent(availableDrivers, attendance);
        
        if (!selectedDriver) {
          logger.warn(`⚠️ Nenhum motorista selecionado para ${attendance.attendanceNumber}`);
          continue;
        }

        // Track assignments
        if (!driverAssignments.has(selectedDriver.id)) {
          driverAssignments.set(selectedDriver.id, {
            driver: selectedDriver,
            rides: [],
            count: 0
          });
        }

        // Gerar número da corrida
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

        const rideNumber = `${dateString}${sequence.toString().padStart(4, '0')}`;

        // Criar corrida
        const rideData = {
          rideNumber,
          patientName: attendance.patientName,
          patientDocument: attendance.patientDocument,
          patientAge: attendance.patientAge,
          patientCondition: attendance.medicalCondition,
          priority: attendance.priority || 'Média',
          rideType: attendance.category === 'emergency' ? 'Emergência' : 'Transporte',
          originAddress: attendance.originAddress,
          originLatitude: attendance.originLatitude,
          originLongitude: attendance.originLongitude,
          destinationAddress: attendance.destinationAddress,
          destinationLatitude: attendance.destinationLatitude,
          destinationLongitude: attendance.destinationLongitude,
          scheduledDateTime: new Date(),
          requestedBy: attendance.callerName,
          contactPhone: attendance.callerPhone,
          status: 'pending',
          driverId: selectedDriver.id,
          operatorId: req.user.id
        };

        const newRide = await Ride.create(rideData);
        
        // Atualizar o atendimento
        await attendance.update({
          status: 'Aprovada',
          rideId: newRide.id,
          approvedBy: req.user.id,
          approvedAt: new Date()
        });

        // Track assignment
        const assignment = driverAssignments.get(selectedDriver.id);
        assignment.rides.push({
          rideNumber,
          patientName: attendance.patientName,
          priority: attendance.priority
        });
        assignment.count++;

        results.push({
          attendanceNumber: attendance.attendanceNumber,
          rideNumber,
          driverName: selectedDriver.name,
          patientName: attendance.patientName,
          priority: attendance.priority
        });

        processedCount++;
        logger.info(`✅ Atendimento ${attendance.attendanceNumber} → Corrida ${rideNumber} → Motorista: ${selectedDriver.name}`);

      } catch (error) {
        logger.error(`❌ Erro ao processar atendimento ${attendance.attendanceNumber}:`, error);
        results.push({
          attendanceNumber: attendance.attendanceNumber,
          error: error.message
        });
      }
    }

    // Preparar resumo por motorista
    const driverSummary = Array.from(driverAssignments.values()).map(assignment => ({
      driverId: assignment.driver.id,
      driverName: assignment.driver.name,
      email: assignment.driver.email,
      ridesAssigned: assignment.count,
      rides: assignment.rides
    }));

    logger.info(`🎯 Distribuição concluída: ${processedCount}/${pendingAttendances.length} processados`);

    res.json({
      success: true,
      message: `Distribuição inteligente concluída: ${processedCount} corridas criadas`,
      processed: processedCount,
      total: pendingAttendances.length,
      driversUsed: driverSummary.length,
      driverSummary,
      results
    });

  } catch (error) {
    logger.error('❌ Erro na distribuição multi-motorista:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
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
  getAttendanceStats,
  intelligentDispatch,
  multiDriverDispatch
};