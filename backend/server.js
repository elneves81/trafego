require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Importar configurações e middlewares
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const vehicleRoutes = require('./src/routes/vehicleRoutes');
const rideRoutes = require('./src/routes/rideRoutes');
const gpsRoutes = require('./src/routes/gpsRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const sseRoutes = require('./src/routes/sseRoutes');
const pollingRoutes = require('./src/routes/pollingRoutes');
const driverRoutes = require('./src/routes/driverRoutes');
const systemRoutes = require('./src/routes/systemRoutes');
const attendanceRoutes = require('./src/routes/attendanceRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const cepRoutes = require('./src/routes/cepRoutes');

const app = express();
const server = http.createServer(app);

// Configurações básicas
const PORT = process.env.PORT || 8082;

// Configurar trust proxy para express-rate-limit
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // Limite de 100 requests por IP por janela de tempo
});

// Middlewares globais
app.use(helmet());
app.use(compression());

// === CORS ROBUSTO ===
const rawAllowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:3006',           // FRONT local
  'http://10.0.50.79:3001',
  'http://10.0.50.79:3002',
  'http://10.0.50.79:3006',          // FRONT na rede
  'http://10.0.134.79:3001',
  'http://10.0.134.79:3002',
  'http://10.0.134.79:3006',         // FRONT no novo IP
  process.env.FRONTEND_URL
].filter(Boolean);

// normalizar removendo trailing slash e case
const normalize = (o) => (o ? String(o).replace(/\/$/, '').toLowerCase() : o);
const allowedSet = new Set(rawAllowedOrigins.map(normalize));

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sem origin (ex.: apps nativas ou curl)
    if (!origin) return callback(null, true);

    const norm = normalize(origin);
    if (allowedSet.has(norm)) {
      return callback(null, true);
    }

    // Ajuda no debug: logar a origem rejeitada
    logger.warn(`CORS bloqueado para origin: ${origin}`);
    return callback(new Error('Não permitido pelo CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 204
}));

// Responder preflight globalmente
app.options('*', (req, res) => {
  res.sendStatus(204);
});
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rota principal
app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Transporte de Ambulâncias - Secretaria de Saúde',
    version: '1.0.0',
    status: 'Online',
    api: {
      auth: '/api/auth',
      users: '/api/users',
      vehicles: '/api/vehicles',
      rides: '/api/rides',
      gps: '/api/gps',
      notifications: '/api/notifications',
      sse: '/api/sse',
      polling: '/api/polling',
      status: '/api/status'
    },
    timestamp: new Date().toISOString()
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/polling', pollingRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/cep', cepRoutes);

// Rota de status da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sistema de Transporte de Ambulâncias - API Online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros
app.use(notFound);
app.use(errorHandler);

// Inicialização do servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await sequelize.authenticate();
    logger.info('Conexão com banco de dados estabelecida com sucesso');

    // Sincronizar modelos (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ force: false });
      logger.info('Modelos sincronizados com o banco de dados');
    }

    // Iniciar servidor
    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Servidor acessível em:`);
      logger.info(`- Localhost: http://localhost:${PORT}`);
      logger.info(`- LAN (Elber): http://10.0.50.79:${PORT}`);
      logger.info(`- Novo IP: http://10.0.134.79:${PORT}`);
      logger.info(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM recebido, fechando servidor...');
  server.close(() => {
    sequelize.close();
    process.exit(0);
  });
});

// Exportar para testes
module.exports = { app, server };

// Iniciar servidor se não estiver sendo importado
if (require.main === module) {
  startServer();
}