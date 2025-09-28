const jwt = require('jsonwebtoken');
const { User } = require('../models');

const socketAuth = async (socket, next) => {
  try {
    console.log('🔌 SOCKET AUTH - Iniciando autenticação');
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('❌ SOCKET AUTH - Token não fornecido');
      return next(new Error('Token não fornecido'));
    }

    console.log('🔑 SOCKET AUTH - Token recebido:', token ? 'Presente' : 'Ausente');

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('📦 SOCKET AUTH - Token decodificado:', decoded);
    
    // Buscar usuário no banco
    const user = await User.findByPk(decoded.id);
    console.log('👤 SOCKET AUTH - Usuário encontrado:', user ? `${user.name} (${user.status})` : 'Não encontrado');
    
    if (!user || user.status !== 'active') {
      console.log('❌ SOCKET AUTH - Usuário inválido ou inativo');
      return next(new Error('Usuário não encontrado ou inativo'));
    }

    // Anexar dados do usuário ao socket
    socket.user = user;
    socket.userId = user.id;
    socket.userType = user.userType;
    
    console.log('✅ SOCKET AUTH - Autenticação bem-sucedida para:', user.name);
    next();
  } catch (error) {
    console.error('❌ SOCKET AUTH - Erro de autenticação:', error.message);
    next(new Error('Token inválido'));
  }
};

module.exports = socketAuth;