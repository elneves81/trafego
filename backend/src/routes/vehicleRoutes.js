const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles,
  updateVehicleLocation,
  getVehiclesByRadius,
  getVehicleStats
} = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validações
const createVehicleValidation = [
  body('plateNumber')
    .trim()
    .matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/)
    .withMessage('Formato de placa inválido (ex: ABC1234 ou ABC1D23)'),
  body('model')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Modelo é obrigatório'),
  body('brand')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Marca é obrigatória'),
  body('year')
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage('Ano inválido'),
  body('color')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Cor é obrigatória'),
  body('vehicleType')
    .isIn(['ambulance', 'transport', 'support', 'administrative'])
    .withMessage('Tipo de veículo inválido'),
  body('capacity')
    .isInt({ min: 1, max: 20 })
    .withMessage('Capacidade deve ser entre 1 e 20'),
  body('driverId')
    .optional()
    .isUUID()
    .withMessage('ID do motorista inválido')
];

const updateVehicleValidation = [
  body('plateNumber')
    .optional()
    .trim()
    .matches(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/)
    .withMessage('Formato de placa inválido'),
  body('model')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Modelo inválido'),
  body('brand')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Marca inválida'),
  body('year')
    .optional()
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage('Ano inválido'),
  body('vehicleType')
    .optional()
    .isIn(['ambulance', 'transport', 'support', 'administrative'])
    .withMessage('Tipo de veículo inválido'),
  body('status')
    .optional()
    .isIn(['available', 'busy', 'maintenance', 'inactive'])
    .withMessage('Status inválido'),
  body('capacity')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Capacidade deve ser entre 1 e 20'),
  body('driverId')
    .optional()
    .isUUID()
    .withMessage('ID do motorista inválido')
];

const vehicleIdValidation = [
  param('id')
    .isUUID()
    .withMessage('ID do veículo inválido')
];

const updateLocationValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude inválida'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude inválida')
];

const radiusQueryValidation = [
  query('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude inválida'),
  query('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude inválida'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Raio deve ser entre 0.1 e 100 km')
];

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas principais
router.get('/', authorize('admin', 'supervisor', 'operator'), getVehicles);
router.get('/available', authorize('admin', 'supervisor', 'operator'), getAvailableVehicles);
router.get('/nearby', authorize('admin', 'supervisor', 'operator'), radiusQueryValidation, getVehiclesByRadius);

// Rotas específicas por ID
router.get('/:id', vehicleIdValidation, authorize('admin', 'supervisor', 'operator'), getVehicleById);
router.post('/', authorize('admin', 'supervisor'), createVehicleValidation, createVehicle);
router.put('/:id', vehicleIdValidation, updateVehicleValidation, authorize('admin', 'supervisor'), updateVehicle);
router.delete('/:id', vehicleIdValidation, authorize('admin'), deleteVehicle);

// Rotas de localização
router.put('/:id/location', vehicleIdValidation, updateLocationValidation, authorize('admin', 'supervisor', 'operator', 'driver'), updateVehicleLocation);

// Rotas de estatísticas
router.get('/:id/stats', vehicleIdValidation, authorize('admin', 'supervisor'), getVehicleStats);

module.exports = router;