const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validações
const registerValidation = [
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
    .isMobilePhone('pt-BR')
    .withMessage('Telefone inválido'),
  body('cpf')
    .isLength({ min: 11, max: 11 })
    .isNumeric()
    .withMessage('CPF deve ter 11 dígitos numéricos'),
  body('userType')
    .isIn(['admin', 'operator', 'driver', 'supervisor'])
    .withMessage('Tipo de usuário inválido')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone inválido'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Data de nascimento inválida'),
  body('licenseExpiry')
    .optional()
    .isISO8601()
    .withMessage('Data de validade da habilitação inválida')
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter no mínimo 6 caracteres')
];

// Rotas públicas
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Rotas protegidas
router.post('/logout', authenticate, logout);
router.get('/profile', authenticate, getProfile);
router.get('/me', authenticate, getProfile); // Alias para /profile
router.put('/profile', authenticate, updateProfileValidation, updateProfile);
router.put('/change-password', authenticate, changePasswordValidation, changePassword);
router.post('/refresh-token', authenticate, refreshToken);

module.exports = router;