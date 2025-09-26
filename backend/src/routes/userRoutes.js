const express = require('express');
const { body, param, query } = require('express-validator');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDrivers,
  getOperators,
  toggleUserStatus,
  getUserStats
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validações
const createUserValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres'),
  body('phone')
    .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (00) 00000-0000'),
  body('cpf')
    .isLength({ min: 11, max: 11 })
    .isNumeric()
    .withMessage('CPF deve ter exatamente 11 dígitos numéricos'),
  body('userType')
    .isIn(['admin', 'operator', 'driver', 'supervisor'])
    .withMessage('Tipo de usuário inválido')
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('phone')
    .optional()
    .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (00) 00000-0000'),
  body('userType')
    .optional()
    .isIn(['admin', 'operator', 'driver', 'supervisor'])
    .withMessage('Tipo de usuário inválido'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status inválido')
];

const userIdValidation = [
  param('id')
    .isUUID()
    .withMessage('ID do usuário inválido')
];

const toggleStatusValidation = [
  body('status')
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status inválido')
];

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Log para debug
router.use((req, res, next) => {
  console.log(`=== USER ROUTES: ${req.method} ${req.path} ===`);
  next();
});

// Rotas para administradores e supervisores
router.get('/', authorize('admin', 'supervisor'), getUsers);
router.get('/drivers', authorize('admin', 'supervisor', 'operator'), getDrivers);
router.get('/operators', authorize('admin', 'supervisor'), getOperators);
router.post('/', authorize('admin'), createUserValidation, createUser);

// Rotas específicas por ID
router.get('/:id', userIdValidation, authorize('admin', 'supervisor'), getUserById);
router.put('/:id', userIdValidation, updateUserValidation, authorize('admin'), updateUser);
router.delete('/:id', userIdValidation, authorize('admin'), deleteUser);
router.put('/:id/status', userIdValidation, toggleStatusValidation, authorize('admin'), toggleUserStatus);
router.get('/:id/stats', userIdValidation, authorize('admin', 'supervisor'), getUserStats);

module.exports = router;