const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const AppointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

// Middleware para verificar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ APPOINTMENT - Erros de validação:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// Validações para criar agendamento
const createAppointmentValidation = [
  // Dados do solicitante
  body('requesterName')
    .notEmpty()
    .withMessage('Nome do solicitante é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do solicitante deve ter entre 2 e 100 caracteres'),
  
  body('requesterPhone')
    .notEmpty()
    .withMessage('Telefone do solicitante é obrigatório')
    .isLength({ min: 8, max: 20 })
    .withMessage('Telefone deve ter entre 8 e 20 caracteres'),
  
  body('requesterEmail')
    .optional()
    .isEmail()
    .withMessage('E-mail inválido'),
  
  body('requesterRelationship')
    .notEmpty()
    .withMessage('Parentesco/relação é obrigatório')
    .isIn(['self', 'parent', 'child', 'spouse', 'sibling', 'relative', 'friend', 'caregiver', 'other'])
    .withMessage('Parentesco inválido'),

  // Dados do paciente
  body('patientName')
    .notEmpty()
    .withMessage('Nome do paciente é obrigatório')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do paciente deve ter entre 2 e 100 caracteres'),
  
  body('patientCpf')
    .notEmpty()
    .withMessage('CPF do paciente é obrigatório')
    .isLength({ min: 11, max: 14 })
    .withMessage('CPF deve ter entre 11 e 14 caracteres'),
  
  body('patientBirthDate')
    .notEmpty()
    .withMessage('Data de nascimento é obrigatória')
    .isISO8601()
    .withMessage('Data de nascimento inválida'),
  
  body('patientGender')
    .notEmpty()
    .withMessage('Sexo do paciente é obrigatório')
    .isIn(['male', 'female', 'other'])
    .withMessage('Sexo inválido'),
  
  body('patientPhone')
    .optional()
    .isLength({ min: 8, max: 20 })
    .withMessage('Telefone deve ter entre 8 e 20 caracteres'),
  
  body('patientAddress')
    .notEmpty()
    .withMessage('Endereço do paciente é obrigatório')
    .isLength({ max: 200 })
    .withMessage('Endereço deve ter no máximo 200 caracteres'),
  
  body('patientCity')
    .notEmpty()
    .withMessage('Cidade do paciente é obrigatória')
    .isLength({ max: 100 })
    .withMessage('Cidade deve ter no máximo 100 caracteres'),
  
  body('patientState')
    .notEmpty()
    .withMessage('Estado do paciente é obrigatório')
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado deve ter 2 caracteres (UF)'),
  
  body('patientZipCode')
    .notEmpty()
    .withMessage('CEP do paciente é obrigatório')
    .matches(/^\d{5}-\d{3}$/)
    .withMessage('Formato de CEP inválido. Use: xxxxx-xxx'),

  // Dados do agendamento
  body('appointmentType')
    .notEmpty()
    .withMessage('Tipo de agendamento é obrigatório')
    .isIn(['consultation', 'exam', 'treatment', 'surgery', 'therapy', 'vaccine', 'emergency', 'return', 'other'])
    .withMessage('Tipo de agendamento inválido'),
  
  body('transportType')
    .notEmpty()
    .withMessage('Tipo de transporte é obrigatório')
    .isIn(['basic', 'advanced', 'uti_mobile', 'wheelchair', 'stretcher'])
    .withMessage('Tipo de transporte inválido'),
  
  body('scheduledDate')
    .notEmpty()
    .withMessage('Data do agendamento é obrigatória')
    .isISO8601()
    .withMessage('Data do agendamento inválida')
    .custom((value) => {
      // Normalizar datas para comparação apenas de data (sem horário)
      const scheduledDateString = value.split('T')[0]; // Pega apenas YYYY-MM-DD
      const todayString = new Date().toISOString().split('T')[0]; // Data de hoje YYYY-MM-DD
      
      if (scheduledDateString < todayString) {
        throw new Error('Data do agendamento não pode ser no passado');
      }
      return true;
    }),
  
  body('scheduledTime')
    .notEmpty()
    .withMessage('Horário do agendamento é obrigatório')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de horário inválido. Use: HH:mm'),
  
  body('destinationName')
    .notEmpty()
    .withMessage('Nome do destino é obrigatório')
    .isLength({ max: 150 })
    .withMessage('Nome do destino deve ter no máximo 150 caracteres'),
  
  body('destinationAddress')
    .notEmpty()
    .withMessage('Endereço do destino é obrigatório')
    .isLength({ max: 200 })
    .withMessage('Endereço do destino deve ter no máximo 200 caracteres'),
  
  body('destinationCity')
    .notEmpty()
    .withMessage('Cidade do destino é obrigatória')
    .isLength({ max: 100 })
    .withMessage('Cidade do destino deve ter no máximo 100 caracteres'),
  
  body('destinationState')
    .notEmpty()
    .withMessage('Estado do destino é obrigatório')
    .isLength({ min: 2, max: 2 })
    .withMessage('Estado do destino deve ter 2 caracteres (UF)'),

  // Dados opcionais
  body('estimatedDuration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duração estimada deve estar entre 15 e 480 minutos'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Prioridade inválida'),
  
  body('oxygenRequired')
    .optional()
    .isBoolean()
    .withMessage('Campo oxigênio deve ser verdadeiro ou falso'),
  
  body('accompaniedByFamily')
    .optional()
    .isBoolean()
    .withMessage('Campo acompanhado pela família deve ser verdadeiro ou falso'),

  // Recorrência
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('Campo recorrente deve ser verdadeiro ou falso'),
  
  body('recurrencePattern')
    .if(body('isRecurring').equals('true'))
    .notEmpty()
    .withMessage('Padrão de recorrência é obrigatório quando recorrente')
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Padrão de recorrência inválido'),
  
  body('recurrenceInterval')
    .if(body('isRecurring').equals('true'))
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Intervalo de recorrência deve estar entre 1 e 12'),
  
  body('maxOccurrences')
    .if(body('isRecurring').equals('true'))
    .optional()
    .isInt({ min: 2, max: 52 })
    .withMessage('Máximo de ocorrências deve estar entre 2 e 52'),

  // Observações
  body('observations')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Observações devem ter no máximo 1000 caracteres'),
  
  body('medicalObservations')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações médicas devem ter no máximo 500 caracteres'),
  
  body('specialNeeds')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Necessidades especiais devem ter no máximo 500 caracteres')
];

// Validações para atualizar agendamento
const updateAppointmentValidation = [
  param('id')
    .isInt()
    .withMessage('ID do agendamento deve ser um número inteiro'),
  
  // Todos os campos são opcionais na atualização, mas devem ser válidos se fornecidos
  body('requesterName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do solicitante deve ter entre 2 e 100 caracteres'),
  
  body('requesterPhone')
    .optional()
    .matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/)
    .withMessage('Formato de telefone inválido'),
  
  body('patientName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome do paciente deve ter entre 2 e 100 caracteres'),
  
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Data do agendamento inválida')
    .custom((value) => {
      // Normalizar datas para comparação apenas de data (sem horário)
      const scheduledDateString = value.split('T')[0]; // Pega apenas YYYY-MM-DD
      const todayString = new Date().toISOString().split('T')[0]; // Data de hoje YYYY-MM-DD
      
      if (scheduledDateString < todayString) {
        throw new Error('Data do agendamento não pode ser no passado');
      }
      return true;
    }),
  
  body('scheduledTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Formato de horário inválido'),
  
  body('appointmentType')
    .optional()
    .isIn(['consultation', 'exam', 'treatment', 'surgery', 'therapy', 'vaccine', 'emergency', 'return', 'other'])
    .withMessage('Tipo de agendamento inválido'),
  
  body('transportType')
    .optional()
    .isIn(['basic', 'advanced', 'uti_mobile', 'wheelchair', 'stretcher'])
    .withMessage('Tipo de transporte inválido'),
  
  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Prioridade inválida')
];

// Validações para confirmar agendamento
const confirmAppointmentValidation = [
  param('id')
    .isInt()
    .withMessage('ID do agendamento deve ser um número inteiro'),
  
  body('vehicleId')
    .notEmpty()
    .withMessage('ID do veículo é obrigatório')
    .isInt()
    .withMessage('ID do veículo deve ser um número inteiro'),
  
  body('driverId')
    .notEmpty()
    .withMessage('ID do motorista é obrigatório')
    .isInt()
    .withMessage('ID do motorista deve ser um número inteiro'),
  
  body('observations')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Observações devem ter no máximo 500 caracteres')
];

// Validações para cancelar agendamento
const cancelAppointmentValidation = [
  param('id')
    .isInt()
    .withMessage('ID do agendamento deve ser um número inteiro'),
  
  body('reason')
    .notEmpty()
    .withMessage('Motivo do cancelamento é obrigatório')
    .isLength({ min: 10, max: 500 })
    .withMessage('Motivo deve ter entre 10 e 500 caracteres')
];

// Validações para listar agendamentos
const listAppointmentsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro maior que 0'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número inteiro entre 1 e 100'),
  
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Status inválido'),
  
  query('appointmentType')
    .optional()
    .isIn(['consultation', 'exam', 'treatment', 'surgery', 'therapy', 'vaccine', 'emergency', 'return', 'other'])
    .withMessage('Tipo de agendamento inválido'),
  
  query('transportType')
    .optional()
    .isIn(['basic', 'advanced', 'uti_mobile', 'wheelchair', 'stretcher'])
    .withMessage('Tipo de transporte inválido'),
  
  query('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Prioridade inválida'),
  
  query('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Data do agendamento inválida'),
  
  query('createdBy')
    .optional()
    .isInt()
    .withMessage('ID do criador deve ser um número inteiro')
];

// ROTAS

// Criar novo agendamento
router.post(
  '/',
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  createAppointmentValidation,
  handleValidationErrors,
  AppointmentController.createAppointment
);

// Listar agendamentos
router.get(
  '/',
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  listAppointmentsValidation,
  handleValidationErrors,
  AppointmentController.listAppointments
);

// Buscar agendamento por ID
router.get(
  '/:id',
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  param('id').isInt().withMessage('ID deve ser um número inteiro'),
  handleValidationErrors,
  AppointmentController.getAppointmentById
);

// Atualizar agendamento
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  updateAppointmentValidation,
  handleValidationErrors,
  AppointmentController.updateAppointment
);

// Confirmar agendamento
router.patch(
  '/:id/confirm',
  authenticate,
  authorize('admin', 'supervisor'),
  confirmAppointmentValidation,
  handleValidationErrors,
  AppointmentController.confirmAppointment
);

// Cancelar agendamento
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  cancelAppointmentValidation,
  handleValidationErrors,
  AppointmentController.cancelAppointment
);

// Estatísticas de agendamentos
router.get(
  '/stats/overview',
  authenticate,
  authorize('admin', 'supervisor'),
  query('startDate').optional().isISO8601().withMessage('Data inicial inválida'),
  query('endDate').optional().isISO8601().withMessage('Data final inválida'),
  handleValidationErrors,
  AppointmentController.getAppointmentStats
);

module.exports = router;