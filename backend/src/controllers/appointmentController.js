const { Appointment, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Função para normalizar campos de texto para maiúsculas
const normalizeTextFields = (data) => {
  const textFields = [
    'requesterName', 'requesterEmail', 'requesterRelationship',
    'patientName', 'patientAddress', 'patientCity', 'patientState', 
    'patientNeighborhood', 'specialRequirements', 'observations',
    'destinationAddress', 'destinationContact', 'destinationCity',
    'destinationState', 'destinationNeighborhood'
  ];

  const normalizedData = { ...data };
  
  textFields.forEach(field => {
    if (normalizedData[field] && typeof normalizedData[field] === 'string') {
      normalizedData[field] = normalizedData[field].toUpperCase().trim();
    }
  });

  return normalizedData;
};

// Mapping functions for enum values
const mapAppointmentType = (type) => {
  const typeMap = {
    'consultation': 'Consulta',
    'exam': 'Exame',
    'treatment': 'Terapia',
    'surgery': 'Cirurgia',
    'therapy': 'Terapia',
    'vaccine': 'Outros',
    'emergency': 'Outros',
    'return': 'Retorno',
    'other': 'Outros'
  };
  return typeMap[type] || 'Outros';
};

const mapTransportType = (type) => {
  const typeMap = {
    'basic': 'Ida e volta',
    'advanced': 'Ida e volta',
    'uti_mobile': 'Ida e volta',
    'wheelchair': 'Ida e volta',
    'stretcher': 'Ida e volta',
    'one_way': 'Só ida',
    'round_trip': 'Ida e volta',
    'return_only': 'Só volta'
  };
  return typeMap[type] || 'Ida e volta';
};

class AppointmentController {
  // Gerar número único do agendamento
  static async generateAppointmentNumber() {
    const year = new Date().getFullYear();
    const prefix = `AGD${year}`;
    
    const lastAppointment = await Appointment.findOne({
      where: {
        appointmentNumber: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['appointmentNumber', 'DESC']]
    });

    let nextNumber = 1;
    if (lastAppointment && lastAppointment.appointmentNumber) {
      const lastNumber = parseInt(lastAppointment.appointmentNumber.replace(prefix, ''));
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }

  // Criar novo agendamento
  static async createAppointment(req, res) {
    const transaction = await sequelize.transaction();

    try {
      // Debug: Log dos dados recebidos
      console.log('🔍 APPOINTMENT - Dados recebidos:', req.body);
      console.log('👤 APPOINTMENT - Usuário:', req.user);

      const {
        // Dados do solicitante
        requesterName,
        requesterPhone,
        requesterEmail,
        requesterRelationship,
        
        // Dados do paciente
        patientName,
        patientCpf,
        patientRg,
        patientBirthDate,
        patientGender,
        patientPhone,
        patientAddress,
        patientCity,
        patientState,
        patientZipCode,
        patientNeighborhood,
        
        // Dados do agendamento
        appointmentType,
        transportType,
        scheduledDate,
        scheduledTime,
        estimatedDuration,
        destinationName,
        destinationAddress,
        destinationCity,
        destinationState,
        destinationZipCode,
        destinationNeighborhood,
        destinationContact,
        
        // Dados médicos
        medicalSpecialty,
        doctorName,
        examType,
        treatmentType,
        medicalObservations,
        specialNeeds,
        mobilityRestrictions,
        oxygenRequired,
        accompaniedByFamily,
        
        // Recorrência
        isRecurring,
        recurrencePattern,
        recurrenceInterval,
        recurrenceEndDate,
        maxOccurrences,
        
        // Outros
        observations,
        priority
      } = req.body;

      // Gerar número do agendamento
      const appointmentNumber = await AppointmentController.generateAppointmentNumber();

      // Criar agendamento principal
      const appointmentData = {
        appointmentNumber,
        
        // Dados do solicitante
        requesterName,
        requesterPhone,
        requesterEmail,
        requesterRelationship,
        
        // Dados do paciente
        patientName,
        patientCpf,
        patientRg,
        patientBirthDate,
        patientGender: patientGender === 'male' ? 'M' : patientGender === 'female' ? 'F' : 'Outro',
        patientPhone,
        
        // Localização origem (endereço do paciente)
        originAddress: patientAddress,
        patientCity,
        patientState,
        patientZipCode,
        patientNeighborhood,
        
        // Dados do agendamento
        appointmentType: mapAppointmentType(appointmentType),
        transportType: mapTransportType(transportType),
        scheduledDate,
        scheduledTime,
        estimatedDuration,
        destinationName,
        destinationAddress,
        destinationCity,
        destinationState,
        destinationZipCode,
        destinationNeighborhood,
        destinationContact,
        
        // Dados médicos
        medicalSpecialty,
        doctorName,
        examType,
        treatmentType,
        medicalObservations,
        specialNeeds,
        mobilityRestrictions,
        oxygenRequired,
        accompaniedByFamily,
        
        // Recorrência
        isRecurring,
        recurrencePattern,
        recurrenceInterval,
        recurrenceEndDate,
        maxOccurrences,
        
        // Outros
        observations,
        priority,
        status: 'pending',
        operatorId: req.user.id,
        createdBy: req.user.id
      };

      // Normalizar campos de texto para maiúsculas
      const normalizedData = normalizeTextFields(appointmentData);
      
      const appointment = await Appointment.create(normalizedData, { transaction });
      
      // Se for recorrente, criar as próximas ocorrências
      if (isRecurring && recurrencePattern) {
        await this.createRecurringAppointments(appointment, transaction);
      }

      await transaction.commit();

      logger.info(`Agendamento criado: ${appointmentNumber} por usuário ${req.user.id}`);

      // Buscar o agendamento criado com dados do usuário
      const createdAppointment = await Appointment.findByPk(appointment.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Agendamento criado com sucesso',
        appointment: createdAppointment
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('Erro ao criar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Criar agendamentos recorrentes
  static async createRecurringAppointments(parentAppointment, transaction) {
    try {
      const appointments = [];
      const startDate = new Date(parentAppointment.scheduledDate);
      let currentDate = new Date(startDate);
      let count = 1;

      // Determinar quantas ocorrências criar
      const maxCount = parentAppointment.maxOccurrences || 52; // Máximo 1 ano
      const endDate = parentAppointment.recurrenceEndDate ? new Date(parentAppointment.recurrenceEndDate) : null;

      while (count < maxCount) {
        // Calcular próxima data baseada no padrão
        switch (parentAppointment.recurrencePattern) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + (parentAppointment.recurrenceInterval || 1));
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + (7 * (parentAppointment.recurrenceInterval || 1)));
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + (parentAppointment.recurrenceInterval || 1));
            break;
          case 'yearly':
            currentDate.setFullYear(currentDate.getFullYear() + (parentAppointment.recurrenceInterval || 1));
            break;
          default:
            return;
        }

        // Verificar se passou da data limite
        if (endDate && currentDate > endDate) {
          break;
        }

        // Criar dados do próximo agendamento
        const nextAppointmentData = {
          ...parentAppointment.dataValues,
          id: undefined,
          appointmentNumber: await AppointmentController.generateAppointmentNumber(),
          scheduledDate: new Date(currentDate),
          parentAppointmentId: parentAppointment.id,
          createdAt: undefined,
          updatedAt: undefined
        };

        const nextAppointment = await Appointment.create(nextAppointmentData, { transaction });
        appointments.push(nextAppointment);
        count++;
      }

      return appointments;
    } catch (error) {
      logger.error('Erro ao criar agendamentos recorrentes:', error);
      throw error;
    }
  }

  // Listar agendamentos
  static async listAppointments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        appointmentType,
        transportType,
        patientName,
        scheduledDate,
        priority,
        createdBy
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filtros
      if (status) where.status = status;
      if (appointmentType) where.appointmentType = appointmentType;
      if (transportType) where.transportType = transportType;
      if (priority) where.priority = priority;
      if (createdBy) where.createdBy = createdBy;
      
      if (patientName) {
        where.patientName = {
          [Op.like]: `%${patientName}%`
        };
      }

      if (scheduledDate) {
        const date = new Date(scheduledDate);
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        
        where.scheduledDate = {
          [Op.gte]: date,
          [Op.lt]: nextDay
        };
      }

      const { count, rows } = await Appointment.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['scheduledDate', 'ASC']],
        limit: parseInt(limit),
        offset
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        appointments: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      logger.error('Erro ao listar agendamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Buscar agendamento por ID
  static async getAppointmentById(req, res) {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          },
          {
            model: Appointment,
            as: 'childAppointments',
            where: { parentAppointmentId: id },
            required: false
          }
        ]
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      res.json({
        success: true,
        appointment
      });

    } catch (error) {
      logger.error('Erro ao buscar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Atualizar agendamento
  static async updateAppointment(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const updateData = req.body;

      const appointment = await Appointment.findByPk(id);

      if (!appointment) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      // Verificar se pode editar (apenas se não foi confirmado)
      if (appointment.status === 'confirmed') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Não é possível editar agendamento já confirmado'
        });
      }

      // Normalizar campos de texto para maiúsculas
      const normalizedUpdateData = normalizeTextFields(updateData);
      
      await appointment.update({
        ...normalizedUpdateData,
        updatedBy: req.user.id
      }, { transaction });

      await transaction.commit();

      logger.info(`Agendamento ${appointment.appointmentNumber} atualizado por usuário ${req.user.id}`);

      // Buscar agendamento atualizado
      const updatedAppointment = await Appointment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Agendamento atualizado com sucesso',
        appointment: updatedAppointment
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('Erro ao atualizar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Confirmar agendamento
  static async confirmAppointment(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { vehicleId, driverId, observations } = req.body;

      const appointment = await Appointment.findByPk(id);

      if (!appointment) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      if (appointment.status !== 'pending') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Agendamento não está pendente'
        });
      }

      await appointment.update({
        status: 'confirmed',
        vehicleId,
        driverId,
        confirmedAt: new Date(),
        confirmedBy: req.user.id,
        observations: observations || appointment.observations
      }, { transaction });

      await transaction.commit();

      logger.info(`Agendamento ${appointment.appointmentNumber} confirmado por usuário ${req.user.id}`);

      // Buscar agendamento confirmado
      const confirmedAppointment = await Appointment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Agendamento confirmado com sucesso',
        appointment: confirmedAppointment
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('Erro ao confirmar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Cancelar agendamento
  static async cancelAppointment(req, res) {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { reason } = req.body;

      const appointment = await Appointment.findByPk(id);

      if (!appointment) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Agendamento não encontrado'
        });
      }

      if (appointment.status === 'cancelled') {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Agendamento já foi cancelado'
        });
      }

      await appointment.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: req.user.id,
        cancellationReason: reason
      }, { transaction });

      await transaction.commit();

      logger.info(`Agendamento ${appointment.appointmentNumber} cancelado por usuário ${req.user.id}`);

      res.json({
        success: true,
        message: 'Agendamento cancelado com sucesso',
        appointment
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('Erro ao cancelar agendamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Estatísticas de agendamentos
  static async getAppointmentStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const where = {};

      if (startDate && endDate) {
        where.scheduledDate = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const stats = await Appointment.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['status'],
        raw: true
      });

      const typeStats = await Appointment.findAll({
        attributes: [
          'appointmentType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['appointmentType'],
        raw: true
      });

      const priorityStats = await Appointment.findAll({
        attributes: [
          'priority',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['priority'],
        raw: true
      });

      res.json({
        success: true,
        stats: {
          byStatus: stats,
          byType: typeStats,
          byPriority: priorityStats
        }
      });

    } catch (error) {
      logger.error('Erro ao buscar estatísticas de agendamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = AppointmentController;