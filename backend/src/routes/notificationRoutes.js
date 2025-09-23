const express = require('express');
const { body, param } = require('express-validator');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  getNotificationById,
  cleanupExpiredNotifications,
  getNotificationStats
} = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Validações
const createNotificationValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Título deve ter entre 1 e 100 caracteres'),
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Mensagem deve ter entre 1 e 1000 caracteres'),
  body('type')
    .optional()
    .isIn(['info', 'warning', 'error', 'success', 'ride', 'system'])
    .withMessage('Tipo inválido'),
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Prioridade inválida'),
  body('userId')
    .optional()
    .isUUID()
    .withMessage('ID do usuário inválido'),
  body('userType')
    .optional()
    .isIn(['admin', 'operator', 'driver', 'supervisor'])
    .withMessage('Tipo de usuário inválido'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Data de expiração inválida')
];

const notificationIdValidation = [
  param('id')
    .isUUID()
    .withMessage('ID da notificação inválido')
];

// Aplicar autenticação em todas as rotas
router.use(authenticate);

// Rotas principais
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.get('/stats', getNotificationStats);
router.put('/mark-all-read', markAllAsRead);

// Rotas específicas por ID
router.get('/:id', notificationIdValidation, getNotificationById);
router.put('/:id/read', notificationIdValidation, markAsRead);
router.delete('/:id', notificationIdValidation, deleteNotification);

// Rotas administrativas
router.post('/', authorize('admin', 'supervisor'), createNotificationValidation, createNotification);
router.delete('/cleanup/expired', authorize('admin'), cleanupExpiredNotifications);

module.exports = router;