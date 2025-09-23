const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    let token;

    // Verificar se o token está no header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token não fornecido.'
      });
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar o usuário no banco
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Usuário não encontrado.'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Conta inativa. Contate o administrador.'
      });
    }

    // Adicionar usuário à requisição
    req.user = user.toSafeObject();
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado. Faça login novamente.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor.'
    });
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

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes.'
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