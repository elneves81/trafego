const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const generateToken = (id, email) => {
  return jwt.sign({ id, email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const register = async (req, res) => {
  try {
    // Verificar erros de validação
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const {
      name,
      email,
      password,
      phone,
      cpf,
      userType,
      dateOfBirth,
      address,
      licenseNumber,
      licenseExpiry,
      emergencyContact,
      emergencyPhone
    } = req.body;

    // Converter CPF para apenas números (para salvar no banco)
    const cpfOnly = cpf ? cpf.replace(/\D/g, '') : null;

    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      where: {
        $or: [
          { email },
          { cpf: cpfOnly }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Usuário já existe com este email ou CPF'
      });
    }

    // Criar usuário
    const user = await User.create({
      name,
      email,
      password,
      phone,
      cpf: cpfOnly,
      userType: userType || 'driver',
      dateOfBirth,
      address,
      licenseNumber,
      licenseExpiry,
      emergencyContact,
      emergencyPhone
    });

    logger.info(`Novo usuário criado: ${user.email} (${user.userType})`);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: user.toSafeObject(),
        token: generateToken(user.id, user.email)
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, fcmToken } = req.body;

    // BYPASS: Sempre retorna sucesso, mas determina userType baseado no email
    let userType = 'admin'; // default
    let name = 'Admin User';
    
    console.log('🔍 DEBUG LOGIN - Email recebido:', email);
    
    if (email && email.includes('operador')) {
      userType = 'operator';
      name = 'Operador Central';
      console.log('✅ Identificado como OPERATOR');
    } else if (email && (email.includes('gestor') || email.includes('supervisor'))) {
      userType = 'supervisor';
      name = 'Gestor/Supervisor';
      console.log('✅ Identificado como SUPERVISOR');
    } else if (email && email.includes('joao.silva')) {
      userType = 'driver';
      name = 'João Silva';
      console.log('✅ Identificado como DRIVER (João)');
    } else if (email && email.includes('pedro.santos')) {
      userType = 'driver';
      name = 'Pedro Santos';
      console.log('✅ Identificado como DRIVER (Pedro)');
    } else {
      console.log('⚠️ Nenhuma correspondência encontrada, usando ADMIN como padrão');
    }
    
    console.log('🎯 UserType final determinado:', userType);

    const mockUser = {
      id: 1,
      name: name,
      email: email || 'admin@transporte.gov.br',
      userType: userType,
      status: 'active',
      toSafeObject: () => ({
        id: 1,
        name: name,
        email: email || 'admin@transporte.gov.br',
        userType: userType,
        status: 'active'
      })
    };

    logger.info(`Login bypass realizado: ${mockUser.email} (${userType})`);
    
    console.log('📤 DEBUG - Retornando dados do login:', {
      user: mockUser.toSafeObject(),
      userType: mockUser.toSafeObject().userType,
      token: 'Token gerado'
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: mockUser.toSafeObject(),
        token: generateToken(mockUser.id, mockUser.email)
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (user) {
      await user.update({
        isOnline: false,
        fcmToken: null
      });
    }

    logger.info(`Logout realizado: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    console.log('🏠 GET PROFILE - Usuario recebido do middleware:', req.user);
    
    // BYPASS: Sempre retorna usuário mockado baseado no que está no middleware
    const mockUser = {
      id: req.user.id || 1,
      name: req.user.name || 'Admin User',
      email: req.user.email || 'admin@transporte.gov.br',
      userType: req.user.userType || 'admin',
      status: 'active'
    };

    console.log('🎯 GET PROFILE - Usuario retornado:', mockUser);

    res.json({
      success: true,
      user: mockUser
    });
  } catch (error) {
    logger.error('Get profile bypass error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const {
      name,
      phone,
      dateOfBirth,
      address,
      licenseNumber,
      licenseExpiry,
      emergencyContact,
      emergencyPhone,
      avatar
    } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    await user.update({
      name: name || user.name,
      phone: phone || user.phone,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      address: address || user.address,
      licenseNumber: licenseNumber || user.licenseNumber,
      licenseExpiry: licenseExpiry || user.licenseExpiry,
      emergencyContact: emergencyContact || user.emergencyContact,
      emergencyPhone: emergencyPhone || user.emergencyPhone,
      avatar: avatar || user.avatar
    });

    logger.info(`Profile updated: ${user.email}`);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar senha atual
    const isMatch = await user.validatePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual incorreta'
      });
    }

    // Atualizar senha
    await user.update({ password: newPassword });

    logger.info(`Password changed: ${user.email}`);

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Usuário inativo'
      });
    }

    const newToken = generateToken(user.id, user.email);

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        token: newToken,
        user: user.toSafeObject()
      }
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken
};