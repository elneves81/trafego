const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    console.log('🚀 AUTH MIDDLEWARE - Iniciando autenticação');
    console.log('📋 AUTH MIDDLEWARE - Headers:', req.headers.authorization ? 'Token presente' : 'Sem token');
    
    // BYPASS: Determina usuário baseado no token se houver
    let userType = 'admin';
    let name = 'Admin User';
    let email = 'admin@transporte.gov.br';
    
    // Tentar extrair informações do token se fornecido
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔑 AUTH MIDDLEWARE - Token extraído:', token ? 'Presente' : 'Ausente');
      
      try {
        console.log('🔐 AUTH MIDDLEWARE - Token para verificar:', token.substring(0, 50) + '...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('📦 AUTH MIDDLEWARE - Token decodificado:', decoded);
        
        // NOVO: Determinar userType baseado no email do payload do token
        if (decoded.email) {
          email = decoded.email;
          console.log('🔍 AUTH MIDDLEWARE - Email do token:', email);
          
          if (email.includes('operador')) {
            userType = 'operator';
            name = 'Operador Central';
          } else if (email.includes('gestor') || email.includes('supervisor')) {
            userType = 'supervisor';
            name = 'Gestor/Supervisor';
            console.log('✅ AUTH MIDDLEWARE - Identificado como SUPERVISOR');
          } else if (email.includes('joao.silva')) {
            userType = 'driver';
            name = 'João Silva';
          } else if (email.includes('pedro.santos')) {
            userType = 'driver';  
            name = 'Pedro Santos';
          }
          console.log('🎯 AUTH MIDDLEWARE - UserType determinado:', userType);
        }
      } catch (err) {
        console.log('⚠️ AUTH MIDDLEWARE - Erro ao decodificar token:', err.message);
      }
    } else {
      console.log('❌ AUTH MIDDLEWARE - Nenhum token de autorização encontrado');
    }

    const mockUser = {
      id: 1,
      name: name,
      email: email,
      userType: userType,
      status: 'active'
    };

    console.log('👤 AUTH MIDDLEWARE - Usuario final:', mockUser);
    
    // Adicionar usuário mockado à requisição
    req.user = mockUser;
    next();
  } catch (error) {
    logger.error('Authentication bypass error:', error);
    next();
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Faça login primeiro.'
      });
    }

    console.log('🔒 AUTHORIZE - UserType do usuário:', req.user.userType);
    console.log('🔒 AUTHORIZE - Roles permitidos:', roles);
    console.log('🔒 AUTHORIZE - Incluído?', roles.includes(req.user.userType));

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes.',
        debug: {
          userType: req.user.userType,
          allowedRoles: roles
        }
      });
    }

    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);
        
        if (user && user.status === 'active') {
          req.user = user.toSafeObject();
        }
      }
    }

    next();
  } catch (error) {
    // Em caso de erro, continua sem autenticação
    logger.warn('Optional auth failed:', error.message);
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};