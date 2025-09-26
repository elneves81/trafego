const express = require('express');
const { param, body, validationResult } = require('express-validator');
const CepController = require('../controllers/cepController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Middleware para verificar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ CEP - Erros de validação:', errors.array());
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Dados inválidos',
      erros: errors.array()
    });
  }
  next();
};

// Validações
const cepValidation = [
  param('cep')
    .matches(/^\d{5}-?\d{3}$/)
    .withMessage('CEP deve estar no formato xxxxx-xxx ou xxxxxxxx')
];

const multipleCepsValidation = [
  body('ceps')
    .isArray({ min: 1, max: 10 })
    .withMessage('Deve ser um array com 1 a 10 CEPs'),
  body('ceps.*')
    .matches(/^\d{5}-?\d{3}$/)
    .withMessage('Cada CEP deve estar no formato xxxxx-xxx ou xxxxxxxx')
];

// ROTAS PÚBLICAS (não precisam de autenticação para facilitar integração)

/**
 * @route GET /api/cep/:cep
 * @desc Buscar endereço por CEP
 * @access Public
 */
router.get('/:cep', 
  cepValidation,
  handleValidationErrors,
  CepController.buscarCep
);

/**
 * @route GET /api/cep/validar/:cep
 * @desc Validar formato de CEP
 * @access Public
 */
router.get('/validar/:cep',
  CepController.validarCep
);

/**
 * @route POST /api/cep/buscar-multiplos
 * @desc Buscar múltiplos CEPs
 * @access Public
 */
router.post('/buscar-multiplos',
  multipleCepsValidation,
  handleValidationErrors,
  CepController.buscarMultiplosCeps
);

// ROTAS ADMINISTRATIVAS (requerem autenticação)

/**
 * @route GET /api/cep/stats
 * @desc Estatísticas do sistema de CEP
 * @access Private (Admin/Supervisor)
 */
router.get('/admin/stats',
  authenticate,
  authorize('admin', 'supervisor'),
  CepController.estatisticas
);

/**
 * @route DELETE /api/cep/cache
 * @desc Limpar cache de CEPs
 * @access Private (Admin only)
 */
router.delete('/admin/cache',
  authenticate,
  authorize('admin'),
  CepController.limparCache
);

module.exports = router;