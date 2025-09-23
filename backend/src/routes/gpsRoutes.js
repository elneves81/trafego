const express = require('express');
const { body, param, query } = require('express-validator');
const {
  updateLocation,
  getLocationHistory,
  getCurrentLocations,
  getLocationsByRadius,
  getRideRoute,
  deleteOldLocations
} = require('../controllers/gpsController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validações
const updateLocationValidation = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude inválida'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude inválida'),
  body('altitude')
    .optional()
    .isFloat()
    .withMessage('Altitude inválida'),
  body('accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Precisão inválida'),
  body('speed')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Velocidade inválida'),
  body('heading')
    .optional()
    .isFloat({ min: 0, max: 360 })
    .withMessage('Direção deve estar entre 0 e 360 graus'),
  body('batteryLevel')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Nível da bateria deve estar entre 0 e 100'),
  body('rideId')
    .optional()
    .isUUID()
    .withMessage('ID da corrida inválido')
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

const rideIdValidation = [
  param('id')
    .isUUID()
    .withMessage('ID da corrida inválido')
];

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas de localização
router.post('/location', updateLocationValidation, updateLocation);
router.get('/locations', authorize('admin', 'supervisor', 'operator', 'driver'), getLocationHistory);
router.get('/current', authorize('admin', 'supervisor', 'operator'), getCurrentLocations);
router.get('/nearby', authorize('admin', 'supervisor', 'operator'), radiusQueryValidation, getLocationsByRadius);

// Rotas de rotas de corridas
router.get('/ride/:id/route', rideIdValidation, authorize('admin', 'supervisor', 'operator', 'driver'), getRideRoute);

// Rotas administrativas
router.delete('/cleanup', authorize('admin'), deleteOldLocations);

module.exports = router;