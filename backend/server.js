require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Importar configurações e middlewares
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const SocketManager = require('./src/socket/socketManager');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const vehicleRoutes = require('./src/routes/vehicleRoutes');
const rideRoutes = require('./src/routes/rideRoutes');
const gpsRoutes = require('./src/routes/gpsRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://10.0.50.79:3001',
      'http://10.0.50.79:3002',
      process.env.FRONTEND_URL || "http://localhost:3001"
    ].filter(Boolean),
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configurações básicas
const PORT = process.env.PORT || 8089;

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

// CORS configurado para múltiplas origens
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:3002',
  'http://10.0.50.79:3001',
  'http://10.0.50.79:3002',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sem origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
app.use('/api/gps', gpsRoutes);
app.use('/api/notifications', notificationRoutes);

// Rota de status da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sistema de Transporte de Ambulâncias - API Online',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// WebSocket para comunicação em tempo real
let socketManager;

// Inicializar SocketManager após a criação do servidor
socketManager = new SocketManager(io);

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
    server.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
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
module.exports = { app, server, io, socketManager };

// Iniciar servidor se não estiver sendo importado
if (require.main === module) {
  startServer();
}