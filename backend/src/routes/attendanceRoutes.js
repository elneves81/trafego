const express = require('express');
const { body, param, query } = require('express-validator');
const {
  createAttendance,
  getAttendances,
  getAttendanceById,
  updateAttendance,
  approveAttendance,
  cancelAttendance,
  getAttendanceStats,
  intelligentDispatch,
  multiDriverDispatch
} = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validações para criar atendimento
const createAttendanceValidation = [
  body('callerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do solicitante deve ter entre 2 e 100 caracteres'),
  body('callerPhone')
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('Telefone deve ter entre 10 e 20 caracteres'),
  body('patientName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do paciente deve ter entre 2 e 100 caracteres'),
  body('medicalCondition')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage('Condição médica deve ter entre 3 e 1000 caracteres'),
  body('priority')
    .isIn(['Baixa', 'Média', 'Alta', 'Crítica'])
    .withMessage('Prioridade deve ser: Baixa, Média, Alta ou Crítica'),
  body('originAddress')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Endereço de origem deve ter entre 5 e 500 caracteres'),
  body('patientAge')
    .optional({ values: 'falsy' })
    .isInt({ min: 0, max: 120 })
    .withMessage('Idade deve ser entre 0 e 120 anos'),
  body('patientDocument')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 11, max: 20 })
    .withMessage('Documento deve ter entre 11 e 20 caracteres'),
  body('originLatitude')
    .optional({ values: 'falsy' })
    .isDecimal()
    .withMessage('Latitude deve ser um número decimal'),
  body('originLongitude')
    .optional({ values: 'falsy' })
    .isDecimal()
    .withMessage('Longitude deve ser um número decimal')
];

// Validações para atualizar atendimento
const updateAttendanceValidation = [
  param('id')
    .isInt()
    .withMessage('ID deve ser um número inteiro'),
  body('status')
    .optional()
    .isIn(['Recebida', 'Triagem', 'Aprovada', 'Despachada', 'Em andamento', 'Finalizada', 'Cancelada', 'Negada'])
    .withMessage('Status inválido'),
  body('priority')
    .optional()
    .isIn(['Baixa', 'Média', 'Alta', 'Crítica'])
    .withMessage('Prioridade deve ser: Baixa, Média, Alta ou Crítica'),
  body('urgencyCode')
    .optional()
    .isIn(['Verde', 'Amarelo', 'Laranja', 'Vermelho'])
    .withMessage('Código de urgência deve ser: Verde, Amarelo, Laranja ou Vermelho')
];

// Validações para aprovar atendimento
const approveAttendanceValidation = [
  param('id')
    .isInt()
    .withMessage('ID deve ser um número inteiro'),
  body('vehicleId')
    .isInt()
    .withMessage('ID do veículo deve ser um número inteiro'),
  body('driverId')
    .optional()
    .isInt()
    .withMessage('ID do motorista deve ser um número inteiro'),
  body('scheduledDateTime')
    .optional()
    .isISO8601()
    .withMessage('Data deve estar no formato ISO 8601')
];

// Validações para cancelar atendimento
const cancelAttendanceValidation = [
  param('id')
    .isInt()
    .withMessage('ID deve ser um número inteiro'),
  body('cancelReason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Motivo do cancelamento deve ter entre 5 e 500 caracteres')
];

// Validações para buscar por ID
const getByIdValidation = [
  param('id')
    .isInt()
    .withMessage('ID deve ser um número inteiro')
];

// Validações para listagem com filtros
const getAttendancesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro maior que 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  query('status')
    .optional()
    .isIn(['Recebida', 'Triagem', 'Aprovada', 'Despachada', 'Em andamento', 'Finalizada', 'Cancelada', 'Negada'])
    .withMessage('Status inválido'),
  query('priority')
    .optional()
    .isIn(['Baixa', 'Média', 'Alta', 'Crítica'])
    .withMessage('Prioridade inválida'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Data inicial deve estar no formato ISO 8601'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Data final deve estar no formato ISO 8601')
];

// Rotas públicas (com autenticação)

// Criar novo atendimento
router.post('/', 
  authenticate, 
  authorize('admin', 'supervisor', 'operator'),
  createAttendanceValidation,
  createAttendance
);

// Listar atendimentos com filtros
router.get('/', 
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  getAttendancesValidation,
  getAttendances
);

// Buscar atendimentos pendentes (deve vir antes de /:id)
router.get('/pending', 
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  async (req, res) => {
    try {
      console.log('=== BUSCANDO ATENDIMENTOS PENDENTES ===');
      
      const { Attendance } = require('../models');
      
      const pendingAttendances = await Attendance.findAll({
        where: { 
          status: 'Recebida' // Usando status correto do ENUM
        },
        include: [
          {
            association: 'operator',
            attributes: ['id', 'name', 'email', 'phone']
          },
          {
            association: 'supervisor',
            attributes: ['id', 'name', 'email', 'phone']
          },
          {
            association: 'Ride',
            include: [
              {
                association: 'driver',
                attributes: ['id', 'name', 'phone']
              },
              {
                association: 'Vehicle',
                attributes: ['id', 'plateNumber', 'model', 'vehicleType']
              }
            ]
          }
        ],
        order: [['createdAt', 'ASC']]
      });

      console.log(`✅ Encontrados ${pendingAttendances.length} atendimentos pendentes`);
      res.json(pendingAttendances);
      
    } catch (error) {
      console.error('❌ Erro ao buscar atendimentos pendentes:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

// Buscar atendimento por ID
router.get('/:id', 
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  getByIdValidation,
  getAttendanceById
);

// Atualizar atendimento
router.put('/:id', 
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  updateAttendanceValidation,
  updateAttendance
);

// Aprovar atendimento (criar corrida) - Apenas admin e supervisor
router.post('/:id/approve', 
  authenticate,
  authorize('admin', 'supervisor'),
  approveAttendanceValidation,
  approveAttendance
);

// Cancelar atendimento
router.post('/:id/cancel', 
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  cancelAttendanceValidation,
  cancelAttendance
);

// Estatísticas de atendimentos
router.get('/stats/summary', 
  authenticate,
  authorize('admin', 'supervisor'),
  getAttendanceStats
);

// Distribuição inteligente de corridas - Aprova atendimentos e cria corridas automaticamente
router.post('/intelligent-dispatch', 
  authenticate,
  authorize('admin', 'supervisor'),
  intelligentDispatch
);

// 🚀 Distribuição avançada para múltiplos motoristas com análise detalhada
router.post('/multi-driver-dispatch', 
  authenticate,
  authorize('admin', 'supervisor'),
  multiDriverDispatch
);

module.exports = router;