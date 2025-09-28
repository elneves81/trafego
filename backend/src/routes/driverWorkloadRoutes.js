const express = require('express');
const {
  getDriverWorkloadDashboard,
  balanceWorkload,
  getDriverPerformanceReport,
  detectFujaoDrivers,
  takeActionAgainstFujao
} = require('../controllers/driverWorkloadController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// 📊 Dashboard de carga de trabalho dos motoristas
router.get('/workload-dashboard', 
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  getDriverWorkloadDashboard
);

// 🎯 Balanceamento automático de carga
router.post('/balance-workload', 
  authenticate,
  authorize('admin', 'supervisor'),
  balanceWorkload
);

// 📈 Relatório de performance dos motoristas
router.get('/performance-report', 
  authenticate,
  authorize('admin', 'supervisor', 'operator'),
  getDriverPerformanceReport
);

// 🚨 Sistema de detecção de motoristas fujões
router.get('/detect-fujao', 
  authenticate,
  authorize('admin', 'supervisor'),
  detectFujaoDrivers
);

// 🎯 Ação disciplinar contra fujões
router.post('/fujao-action', 
  authenticate,
  authorize('admin', 'supervisor'),
  takeActionAgainstFujao
);

module.exports = router;