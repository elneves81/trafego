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

module.exports = router;