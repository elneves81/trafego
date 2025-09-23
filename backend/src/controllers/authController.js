const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
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

    // Verificar se usuário já existe
    const existingUser = await User.findOne({
      where: {
        $or: [
          { email },
          { cpf }
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
      cpf,
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
        token: generateToken(user.id)
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { email, password, fcmToken } = req.body;

    // Buscar usuário
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Conta inativa. Contate o administrador.'
      });
    }

    // Verificar senha
    const isMatch = await user.validatePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Atualizar último login e token FCM
    await user.update({
      lastLogin: new Date(),
      isOnline: true,
      ...(fcmToken && { fcmToken })
    });

    logger.info(`Login realizado: ${user.email}`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: user.toSafeObject(),
        token: generateToken(user.id)
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
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: user.toSafeObject()
    });
  } catch (error) {
    logger.error('Get profile error:', error);
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

    const newToken = generateToken(user.id);

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