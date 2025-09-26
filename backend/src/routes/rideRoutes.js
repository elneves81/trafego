const express = require('express');
const { body, param, query } = require('express-validator');
const {
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
} = require('../controllers/rideController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validações
const createRideValidation = [
  body('patientName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do paciente deve ter entre 2 e 100 caracteres'),
  body('patientAge')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Idade inválida'),
  body('priority')
    .isIn(['low', 'normal', 'high', 'emergency'])
    .withMessage('Prioridade inválida'),
  body('rideType')
    .isIn(['emergency', 'scheduled', 'return', 'transfer'])
    .withMessage('Tipo de corrida inválido'),
  body('originAddress')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Endereço de origem deve ter entre 10 e 500 caracteres'),
  body('destinationAddress')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Endereço de destino deve ter entre 10 e 500 caracteres'),
  body('originLatitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude de origem inválida'),
  body('originLongitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude de origem inválida'),
  body('destinationLatitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude de destino inválida'),
  body('destinationLongitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude de destino inválida'),
  body('scheduledDateTime')
    .optional()
    .isISO8601()
    .withMessage('Data/hora agendada inválida'),
  body('requestedBy')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Solicitante deve ter entre 2 e 100 caracteres'),
  body('contactPhone')
    .optional()
    .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (00) 00000-0000'),
  body('vehicleId')
    .optional()
    .isUUID()
    .withMessage('ID do veículo inválido'),
  body('driverId')
    .optional()
    .isUUID()
    .withMessage('ID do motorista inválido')
];

const updateRideValidation = [
  body('patientName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do paciente inválido'),
  body('patientAge')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Idade inválida'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'emergency'])
    .withMessage('Prioridade inválida'),
  body('originAddress')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Endereço de origem inválido'),
  body('destinationAddress')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Endereço de destino inválido')
];

const assignRideValidation = [
  body('driverId')
    .isUUID()
    .withMessage('ID do motorista é obrigatório e deve ser válido'),
  body('vehicleId')
    .isUUID()
    .withMessage('ID do veículo é obrigatório e deve ser válido')
];

const updateStatusValidation = [
  body('status')
    .isIn([
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
    ])
    .withMessage('Status inválido'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notas não podem exceder 1000 caracteres')
];

const cancelRideValidation = [
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Motivo do cancelamento deve ter entre 5 e 500 caracteres')
];

const rideIdValidation = [
  param('id')
    .isUUID()
    .withMessage('ID da corrida inválido')
];

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas principais
router.get('/', authorize('admin', 'supervisor', 'operator'), getRides);
router.get('/active', authorize('admin', 'supervisor', 'operator', 'driver'), getActiveRides);
router.get('/history', authorize('admin', 'supervisor', 'operator', 'driver'), getRideHistory);
router.get('/stats', authorize('admin', 'supervisor'), getRideStats);

// Rotas específicas por ID
router.get('/:id', rideIdValidation, authorize('admin', 'supervisor', 'operator', 'driver'), getRideById);
router.post('/', authorize('admin', 'supervisor', 'operator'), createRideValidation, createRide);
router.put('/:id', rideIdValidation, authorize('admin', 'supervisor', 'operator'), updateRideValidation, updateRide);
router.delete('/:id', rideIdValidation, authorize('admin', 'supervisor'), cancelRide);

// Rotas de ações específicas
router.put('/:id/assign', rideIdValidation, authorize('admin', 'supervisor', 'operator'), assignRideValidation, assignRide);
router.put('/:id/status', rideIdValidation, authorize('admin', 'supervisor', 'operator', 'driver'), updateStatusValidation, updateRideStatus);
router.put('/:id/cancel', rideIdValidation, authorize('admin', 'supervisor', 'operator'), cancelRideValidation, cancelRide);

// POST /api/rides/assign - Nova rota para atribuir corridas (para compatibilidade com frontend)
router.post('/assign', 
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  [
    body('attendanceId').notEmpty().withMessage('ID do atendimento é obrigatório'),
    body('driverId').isUUID().withMessage('ID do motorista deve ser um UUID válido'),
    body('driverEmail').isEmail().withMessage('Email do motorista deve ser válido'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'emergency']).withMessage('Prioridade inválida')
  ],
  async (req, res) => {
    try {
      console.log('=== ATRIBUINDO CORRIDA ===');
      console.log('Dados recebidos:', req.body);
      
      const { attendanceId, driverId, driverEmail, priority } = req.body;
      
      // Buscar o atendimento
      const { Attendance } = require('../models');
      const attendance = await Attendance.findByPk(attendanceId);
      
      if (!attendance) {
        return res.status(404).json({ message: 'Atendimento não encontrado' });
      }
      
      if (attendance.status !== 'pending') {
        return res.status(400).json({ message: 'Atendimento não está pendente' });
      }
      
      // Criar corrida baseada no atendimento
      const { Ride } = require('../models');
      const ride = await Ride.create({
        patientName: attendance.patientName || attendance.callerName,
        patientDocument: attendance.patientDocument || attendance.patientCpf,
        patientAge: attendance.patientAge,
        patientCondition: attendance.medicalCondition,
        priority: priority || 'normal',
        rideType: attendance.attendanceType || 'emergency',
        originAddress: `${attendance.address || ''}, ${attendance.city || ''} - ${attendance.state || ''}`,
        destinationAddress: attendance.destinationAddress || 'Hospital Regional',
        requestedDateTime: new Date(),
        status: 'assigned',
        driverId: driverId,
        operatorId: req.user.id,
        contactPhone: attendance.callerPhone,
        notes: attendance.observations
      });
      
      // Atualizar status do atendimento
      await attendance.update({ 
        status: 'assigned',
        rideId: ride.id 
      });
      
      console.log('✅ Corrida atribuída com sucesso:', ride.id);
      
      res.json({ 
        success: true, 
        rideId: ride.id,
        message: 'Corrida atribuída com sucesso' 
      });
      
    } catch (error) {
      console.error('❌ Erro ao atribuir corrida:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

module.exports = router;