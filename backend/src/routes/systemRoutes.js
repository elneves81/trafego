const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Dados simulados de alertas do sistema
let mockSystemAlerts = [
  {
    id: 1,
    type: 'system_alert',
    priority: 'urgent',
    title: 'Veículo AMB-001 em manutenção urgente',
    message: 'Ambulância AMB-001 reportou falha no sistema de oxigênio',
    description: 'O sistema de fornecimento de oxigênio da ambulância AMB-001 apresentou falha crítica durante transporte. Requer manutenção imediata.',
    location: 'Hospital Central - Garagem',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 horas atrás
    resolved: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    resolved_by: null
  },
  {
    id: 2,
    type: 'cnh_expiring',
    priority: 'high',
    title: 'CNH do motorista Pedro Santos vencendo',
    message: 'A CNH do motorista Pedro Santos vence em 12 dias',
    description: 'A Carteira Nacional de Habilitação do motorista Pedro Santos (CNH: 56789012345) vencerá em 12 dias. É necessário providenciar a renovação.',
    location: null,
    time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 dia atrás
    resolved: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    resolved_by: null
  },
  {
    id: 3,
    type: 'maintenance_due',
    priority: 'normal',
    title: 'Manutenção preventiva CAR-003',
    message: 'Veículo CAR-003 atingiu 10.000km - manutenção preventiva necessária',
    description: 'O veículo CAR-003 (Placa: DEF-5678) atingiu 10.000 quilômetros rodados. Está na hora da manutenção preventiva conforme cronograma.',
    location: 'Posto Sul',
    time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 horas atrás
    resolved: false,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    resolved_by: null
  },
  {
    id: 4,
    type: 'system_alert',
    priority: 'high',
    title: 'Falha na comunicação GPS',
    message: 'Perda de sinal GPS em 3 veículos',
    description: 'Os veículos AMB-002, CAR-001 e VAN-001 perderam sinal GPS simultaneamente. Possível falha no servidor de rastreamento.',
    location: 'Sistema Central',
    time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutos atrás
    resolved: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    resolved_at: null,
    resolved_by: null
  },
  {
    id: 5,
    type: 'cnh_expiring',
    priority: 'normal',
    title: 'CNH da motorista Maria Santos vencendo',
    message: 'A CNH da motorista Maria Santos vence em 28 dias',
    description: 'A Carteira Nacional de Habilitação da motorista Maria Santos (CNH: 10987654321) vencerá em 28 dias.',
    location: null,
    time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 horas atrás
    resolved: false,
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    resolved_at: null,
    resolved_by: null
  }
];

// Validações
const createAlertValidation = [
  body('type')
    .isIn(['system_alert', 'maintenance_due', 'cnh_expiring', 'vehicle_issue', 'driver_issue'])
    .withMessage('Tipo de alerta inválido'),
  body('priority')
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Prioridade deve ser: low, normal, high ou urgent'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Título deve ter entre 5 e 200 caracteres'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Mensagem deve ter entre 10 e 500 caracteres'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Descrição deve ter no máximo 1000 caracteres'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Localização deve ter no máximo 200 caracteres')
];

// Rotas

// GET /api/system/alerts - Listar todos os alertas
router.get('/alerts', authenticate, (req, res) => {
  try {
    const { priority, type, resolved, limit = 50 } = req.query;
    let alerts = [...mockSystemAlerts];

    // Filtros
    if (priority) {
      alerts = alerts.filter(alert => alert.priority === priority);
    }

    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }

    if (resolved !== undefined) {
      const isResolved = resolved === 'true';
      alerts = alerts.filter(alert => alert.resolved === isResolved);
    }

    // Ordenar por mais recente
    alerts.sort((a, b) => new Date(b.time) - new Date(a.time));

    // Limitar resultados
    alerts = alerts.slice(0, parseInt(limit));

    res.json(alerts);
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/system/alerts/:id - Buscar alerta por ID
router.get('/alerts/:id', authenticate, param('id').isInt({ min: 1 }), (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const alert = mockSystemAlerts.find(a => a.id === alertId);

    if (!alert) {
      return res.status(404).json({ message: 'Alerta não encontrado' });
    }

    res.json(alert);
  } catch (error) {
    console.error('Erro ao buscar alerta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/system/alerts - Criar novo alerta
router.post('/alerts', authenticate, createAlertValidation, (req, res) => {
  try {
    const { type, priority, title, message, description, location } = req.body;

    const newAlert = {
      id: Math.max(...mockSystemAlerts.map(a => a.id)) + 1,
      type,
      priority,
      title,
      message,
      description,
      location,
      time: new Date().toISOString(),
      resolved: false,
      created_at: new Date().toISOString(),
      resolved_at: null,
      resolved_by: null
    };

    mockSystemAlerts.push(newAlert);
    res.status(201).json(newAlert);
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/system/alerts/:id/resolve - Resolver alerta
router.post('/alerts/:id/resolve', authenticate, param('id').isInt({ min: 1 }), (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const alertIndex = mockSystemAlerts.findIndex(a => a.id === alertId);

    if (alertIndex === -1) {
      return res.status(404).json({ message: 'Alerta não encontrado' });
    }

    if (mockSystemAlerts[alertIndex].resolved) {
      return res.status(400).json({ message: 'Alerta já foi resolvido' });
    }

    mockSystemAlerts[alertIndex] = {
      ...mockSystemAlerts[alertIndex],
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: req.user?.id || 'sistema'
    };

    res.json(mockSystemAlerts[alertIndex]);
  } catch (error) {
    console.error('Erro ao resolver alerta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/system/alerts/:id - Excluir alerta
router.delete('/alerts/:id', authenticate, param('id').isInt({ min: 1 }), (req, res) => {
  try {
    const alertId = parseInt(req.params.id);
    const alertIndex = mockSystemAlerts.findIndex(a => a.id === alertId);

    if (alertIndex === -1) {
      return res.status(404).json({ message: 'Alerta não encontrado' });
    }

    mockSystemAlerts.splice(alertIndex, 1);
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao excluir alerta:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/system/alerts/stats - Estatísticas dos alertas
router.get('/alerts/stats', authenticate, (req, res) => {
  try {
    const total = mockSystemAlerts.length;
    const resolved = mockSystemAlerts.filter(a => a.resolved).length;
    const pending = total - resolved;
    
    const byPriority = {
      urgent: mockSystemAlerts.filter(a => a.priority === 'urgent' && !a.resolved).length,
      high: mockSystemAlerts.filter(a => a.priority === 'high' && !a.resolved).length,
      normal: mockSystemAlerts.filter(a => a.priority === 'normal' && !a.resolved).length,
      low: mockSystemAlerts.filter(a => a.priority === 'low' && !a.resolved).length
    };

    const byType = {
      system_alert: mockSystemAlerts.filter(a => a.type === 'system_alert' && !a.resolved).length,
      maintenance_due: mockSystemAlerts.filter(a => a.type === 'maintenance_due' && !a.resolved).length,
      cnh_expiring: mockSystemAlerts.filter(a => a.type === 'cnh_expiring' && !a.resolved).length,
      vehicle_issue: mockSystemAlerts.filter(a => a.type === 'vehicle_issue' && !a.resolved).length,
      driver_issue: mockSystemAlerts.filter(a => a.type === 'driver_issue' && !a.resolved).length
    };

    res.json({
      total,
      resolved,
      pending,
      byPriority,
      byType
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de alertas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;