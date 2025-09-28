const { User, Ride, Vehicle } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// 📊 DASHBOARD DE CARGA DE TRABALHO DOS MOTORISTAS
const getDriverWorkloadDashboard = async (req, res) => {
  try {
    logger.info('📊 Gerando dashboard de carga de trabalho dos motoristas');

    // Buscar todos os motoristas ativos
    const drivers = await User.findAll({
      where: {
        userType: 'driver',
        status: 'active'
      },
      include: [{
        model: Vehicle,
        where: { status: 'active' },
        required: false
      }],
      order: [['name', 'ASC']]
    });

    const workloadData = await Promise.all(
      drivers.map(async (driver) => {
        // Corridas pendentes (atribuídas mas não aceitas)
        const pendingRides = await Ride.count({
          where: {
            driverId: driver.id,
            status: 'pending'
          }
        });

        // Corridas ativas (aceitas/em andamento)
        const activeRides = await Ride.count({
          where: {
            driverId: driver.id,
            status: ['accepted', 'started', 'arrived_origin', 'departed_origin', 'arrived_destination']
          }
        });

        // Corridas completadas hoje
        const todayCompleted = await Ride.count({
          where: {
            driverId: driver.id,
            status: 'completed',
            completedAt: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        });

        // Corridas completadas esta semana
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const weekCompleted = await Ride.count({
          where: {
            driverId: driver.id,
            status: 'completed',
            completedAt: {
              [Op.gte]: weekStart
            }
          }
        });

        // Corridas canceladas (últimos 7 dias)
        const weekCancelled = await Ride.count({
          where: {
            driverId: driver.id,
            status: 'cancelled',
            cancelledAt: {
              [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        });

        // Calcular score de performance
        const totalRides = todayCompleted + weekCancelled;
        const performanceScore = totalRides > 0 ? 
          Math.round((todayCompleted / totalRides) * 100) : 100;

        // Status do motorista
        let status = 'Disponível';
        let statusColor = 'success';
        
        if (activeRides > 0) {
          status = 'Em Corrida';
          statusColor = 'warning';
        } else if (pendingRides > 3) {
          status = 'Sobrecarregado';
          statusColor = 'error';
        } else if (pendingRides > 0) {
          status = 'Com Pendências';
          statusColor = 'info';
        }

        return {
          driverId: driver.id,
          driverName: driver.name,
          email: driver.email,
          phone: driver.phone,
          vehicle: driver.Vehicle ? {
            plateNumber: driver.Vehicle.plateNumber,
            model: driver.Vehicle.model,
            vehicleType: driver.Vehicle.vehicleType
          } : null,
          workload: {
            pending: pendingRides,
            active: activeRides,
            todayCompleted,
            weekCompleted,
            weekCancelled,
            performanceScore
          },
          status,
          statusColor,
          isAvailable: pendingRides + activeRides < 3,
          lastActivity: driver.updatedAt
        };
      })
    );

    // Estatísticas gerais
    const totalDrivers = drivers.length;
    const availableDrivers = workloadData.filter(d => d.isAvailable).length;
    const busyDrivers = workloadData.filter(d => d.workload.active > 0).length;
    const overloadedDrivers = workloadData.filter(d => d.workload.pending > 3).length;

    // Ordenar por carga de trabalho (menor carga primeiro)
    workloadData.sort((a, b) => {
      const loadA = a.workload.pending + a.workload.active;
      const loadB = b.workload.pending + b.workload.active;
      return loadA - loadB;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalDrivers,
          availableDrivers,
          busyDrivers,
          overloadedDrivers,
          utilizationRate: Math.round((busyDrivers / totalDrivers) * 100)
        },
        drivers: workloadData
      }
    });

  } catch (error) {
    logger.error('❌ Erro ao gerar dashboard de carga de trabalho:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// 🎯 BALANCEAMENTO AUTOMÁTICO DE CARGA
const balanceWorkload = async (req, res) => {
  try {
    logger.info('🎯 Iniciando balanceamento automático de carga');

    // Verificar permissão
    if (!['admin', 'supervisor'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para balancear carga de trabalho'
      });
    }

    // Buscar corridas pendentes não atribuídas
    const unassignedRides = await Ride.findAll({
      where: {
        status: 'pending',
        driverId: null
      },
      order: [['priority', 'DESC'], ['createdAt', 'ASC']],
      limit: 50
    });

    if (unassignedRides.length === 0) {
      return res.json({
        success: true,
        message: 'Não há corridas não atribuídas para balancear',
        redistributed: 0
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

    let redistributed = 0;
    const assignments = [];

    for (const ride of unassignedRides) {
      // Encontrar motorista com menor carga
      let bestDriver = null;
      let minLoad = Infinity;

      for (const driver of availableDrivers) {
        const currentLoad = await Ride.count({
          where: {
            driverId: driver.id,
            status: ['pending', 'accepted', 'started']
          }
        });

        if (currentLoad < minLoad) {
          minLoad = currentLoad;
          bestDriver = driver;
        }
      }

      if (bestDriver && minLoad < 5) { // Limite de 5 corridas por motorista
        await ride.update({ driverId: bestDriver.id });
        
        assignments.push({
          rideNumber: ride.rideNumber,
          patientName: ride.patientName,
          driverName: bestDriver.name,
          priority: ride.priority
        });

        redistributed++;
        logger.info(`✅ Corrida ${ride.rideNumber} atribuída a ${bestDriver.name}`);
      }
    }

    res.json({
      success: true,
      message: `Balanceamento concluído: ${redistributed} corridas redistribuídas`,
      redistributed,
      assignments
    });

  } catch (error) {
    logger.error('❌ Erro no balanceamento de carga:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// � SISTEMA DE DETECÇÃO DE MOTORISTAS FUJÕES
const detectFujaoDrivers = async (req, res) => {
  try {
    logger.info('🕵️ Iniciando detecção de motoristas fujões');

    const drivers = await User.findAll({
      where: {
        userType: 'driver'
      },
      include: [{
        model: Vehicle,
        required: false
      }]
    });

    const fujaoDrivers = [];
    const suspiciousActivities = [];

    for (const driver of drivers) {
      const currentRides = await Ride.count({
        where: {
          driverId: driver.id,
          status: ['pending', 'accepted', 'started']
        }
      });

      const todayCompleted = await Ride.count({
        where: {
          driverId: driver.id,
          status: 'completed',
          completedAt: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      const weekCancelled = await Ride.count({
        where: {
          driverId: driver.id,
          status: 'cancelled',
          cancelledAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      const weekCompleted = await Ride.count({
        where: {
          driverId: driver.id,
          status: 'completed',
          completedAt: {
            [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      });

      const totalWeekRides = weekCompleted + weekCancelled;
      const cancellationRate = totalWeekRides > 0 ? (weekCancelled / totalWeekRides) * 100 : 0;

      // CRITÉRIOS PARA IDENTIFICAR FUJÕES
      const fujaoReasons = [];
      let fujaoScore = 0;

      // 1. Zero produtividade hoje
      if (todayCompleted === 0 && currentRides === 0 && driver.status === 'active') {
        fujaoReasons.push('🚫 Zero corridas hoje apesar de estar ativo');
        fujaoScore += 30;
      }

      // 2. Alta taxa de cancelamento
      if (cancellationRate > 20) {
        fujaoReasons.push(`❌ Taxa de cancelamento alta: ${cancellationRate.toFixed(1)}%`);
        fujaoScore += 25;
      }

      // 3. Baixa produtividade semanal
      if (weekCompleted < 3 && driver.status === 'active') {
        fujaoReasons.push(`📉 Baixa produtividade: apenas ${weekCompleted} corridas esta semana`);
        fujaoScore += 20;
      }

      // 4. Padrão de evitar corridas (disponível mas não pega)
      if (currentRides === 0 && driver.status === 'active' && todayCompleted === 0) {
        fujaoReasons.push('🙈 Disponível mas evitando corridas');
        fujaoScore += 15;
      }

      // 5. Histórico de picos de "indisponibilidade" suspeitos
      const recentInactivity = await checkRecentInactivityPattern(driver.id);
      if (recentInactivity.suspicious) {
        fujaoReasons.push('⏰ Padrão suspeito de indisponibilidade');
        fujaoScore += 10;
      }

      // Classificar como fujão se score >= 40
      if (fujaoScore >= 40) {
        fujaoDrivers.push({
          driverId: driver.id,
          driverName: driver.name,
          email: driver.email,
          phone: driver.phone,
          fujaoScore,
          reasons: fujaoReasons,
          stats: {
            currentRides,
            todayCompleted,
            weekCompleted,
            weekCancelled,
            cancellationRate: cancellationRate.toFixed(1)
          },
          recommendedAction: fujaoScore >= 70 ? 'AÇÃO DISCIPLINAR' : 
                            fujaoScore >= 50 ? 'CONVERSA URGENTE' : 'MONITORAMENTO'
        });
      }

      // Atividades suspeitas (não fujões mas merecem atenção)
      if (fujaoScore >= 20 && fujaoScore < 40) {
        suspiciousActivities.push({
          driverId: driver.id,
          driverName: driver.name,
          fujaoScore,
          reasons: fujaoReasons
        });
      }
    }

    // Ordenar por score (mais fujão primeiro)
    fujaoDrivers.sort((a, b) => b.fujaoScore - a.fujaoScore);

    logger.info(`🚨 Detecção concluída: ${fujaoDrivers.length} fujões detectados`);

    res.json({
      success: true,
      data: {
        summary: {
          totalDrivers: drivers.length,
          fujaoDrivers: fujaoDrivers.length,
          suspiciousDrivers: suspiciousActivities.length,
          severityDistribution: {
            critical: fujaoDrivers.filter(f => f.fujaoScore >= 70).length,
            high: fujaoDrivers.filter(f => f.fujaoScore >= 50 && f.fujaoScore < 70).length,
            medium: fujaoDrivers.filter(f => f.fujaoScore >= 40 && f.fujaoScore < 50).length
          }
        },
        fujaoDrivers,
        suspiciousActivities,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('❌ Erro na detecção de fujões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// Função auxiliar para detectar padrões suspeitos
const checkRecentInactivityPattern = async (driverId) => {
  // TODO: Implementar análise de padrões de indisponibilidade
  // Por exemplo: sempre "indisponível" nos mesmos horários, dias específicos, etc.
  return { suspicious: false };
};

// 🎯 AÇÃO DISCIPLINAR AUTOMÁTICA CONTRA FUJÕES
const takeActionAgainstFujao = async (req, res) => {
  try {
    const { driverId, actionType, reason } = req.body;

    // Verificar permissão
    if (!['admin', 'supervisor'].includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Sem permissão para aplicar ações disciplinares'
      });
    }

    const driver = await User.findByPk(driverId);
    if (!driver || driver.userType !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Motorista não encontrado'
      });
    }

    let actionResult = {};

    switch (actionType) {
      case 'WARNING':
        // Registrar advertência
        actionResult = {
          action: 'Advertência registrada',
          description: 'Advertência formal por baixa produtividade'
        };
        break;

      case 'TEMPORARY_SUSPENSION':
        // Suspensão temporária
        await driver.update({ 
          status: 'suspended',
          suspensionReason: reason,
          suspendedAt: new Date()
        });
        actionResult = {
          action: 'Suspensão temporária aplicada',
          description: 'Motorista suspenso temporariamente'
        };
        break;

      case 'WORKLOAD_RESTRICTION':
        // Restrição de carga de trabalho
        actionResult = {
          action: 'Restrição de carga aplicada',
          description: 'Motorista terá carga limitada até melhoria'
        };
        break;

      case 'MANDATORY_TRAINING':
        // Treinamento obrigatório
        actionResult = {
          action: 'Treinamento obrigatório agendado',
          description: 'Motorista deve participar de treinamento'
        };
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de ação inválido'
        });
    }

    // TODO: Registrar a ação no histórico disciplinar
    // TODO: Enviar notificação para o motorista
    // TODO: Notificar supervisores

    logger.info(`🎯 Ação disciplinar aplicada: ${actionType} para ${driver.name}`);

    res.json({
      success: true,
      message: 'Ação disciplinar aplicada com sucesso',
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email
      },
      actionResult
    });

  } catch (error) {
    logger.error('❌ Erro ao aplicar ação disciplinar:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

// �📈 RELATÓRIO DE PERFORMANCE DOS MOTORISTAS
const getDriverPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, driverId } = req.query;

    let whereClause = {
      userType: 'driver'
    };

    if (driverId) {
      whereClause.id = driverId;
    }

    const drivers = await User.findAll({
      where: whereClause,
      include: [{
        model: Vehicle,
        required: false
      }]
    });

    const performanceData = await Promise.all(
      drivers.map(async (driver) => {
        const rideWhere = {
          driverId: driver.id
        };

        if (startDate && endDate) {
          rideWhere.createdAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          };
        }

        const [completed, cancelled, total] = await Promise.all([
          Ride.count({ where: { ...rideWhere, status: 'completed' } }),
          Ride.count({ where: { ...rideWhere, status: 'cancelled' } }),
          Ride.count({ where: rideWhere })
        ]);

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

        return {
          driverId: driver.id,
          driverName: driver.name,
          email: driver.email,
          vehicle: driver.Vehicle ? `${driver.Vehicle.model} - ${driver.Vehicle.plateNumber}` : 'Sem veículo',
          metrics: {
            totalRides: total,
            completed,
            cancelled,
            completionRate,
            cancellationRate,
            efficiency: Math.max(0, completionRate - cancellationRate)
          }
        };
      })
    );

    // Ordenar por eficiência
    performanceData.sort((a, b) => b.metrics.efficiency - a.metrics.efficiency);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        drivers: performanceData
      }
    });

  } catch (error) {
    logger.error('❌ Erro ao gerar relatório de performance:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

module.exports = {
  getDriverWorkloadDashboard,
  balanceWorkload,
  getDriverPerformanceReport,
  detectFujaoDrivers,
  takeActionAgainstFujao
};