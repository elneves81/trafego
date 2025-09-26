const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { User, Ride } = require('../models');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

const router = express.Router();

// Log para debug
router.use((req, res, next) => {
  console.log(`=== DRIVER ROUTES: ${req.method} ${req.path} ===`);
  next();
});

// Validações para criação de motorista (como usuário do tipo driver)
const createDriverValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('phone')
    .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (00) 00000-0000'),
  body('cnh')
    .trim()
    .isLength({ min: 11, max: 11 })
    .isNumeric()
    .withMessage('CNH deve ter exatamente 11 dígitos numéricos'),
  body('cnh_category')
    .optional()
    .isIn(['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'])
    .withMessage('Categoria da CNH inválida'),
  body('cnh_expiry')
    .isISO8601()
    .withMessage('Data de validade da CNH inválida'),
  body('cpf')
    .optional()
    .isLength({ min: 11, max: 11 })
    .isNumeric()
    .withMessage('CPF deve ter exatamente 11 dígitos numéricos'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status deve ser: active, inactive ou suspended')
];

const updateDriverValidation = [
  param('id').isUUID().withMessage('ID do motorista inválido'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('phone')
    .optional()
    .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/)
    .withMessage('Telefone deve estar no formato (00) 00000-0000'),
  body('cnh')
    .optional()
    .trim()
    .isLength({ min: 11, max: 11 })
    .isNumeric()
    .withMessage('CNH deve ter exatamente 11 dígitos numéricos'),
  body('cnh_category')
    .optional()
    .isIn(['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'])
    .withMessage('Categoria da CNH inválida'),
  body('cnh_expiry')
    .optional()
    .isISO8601()
    .withMessage('Data de validade da CNH inválida'),
  body('cpf')
    .optional()
    .isLength({ min: 11, max: 11 })
    .isNumeric()
    .withMessage('CPF deve ter exatamente 11 dígitos numéricos'),
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'suspended'])
    .withMessage('Status deve ser: active, inactive ou suspended')
];

// Rotas

// GET /api/drivers - Listar todos os motoristas
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, cnh_expiring } = req.query;
    let whereClause = { 
      userType: 'driver' 
    };

    // Filtrar por status
    if (status) {
      whereClause.status = status;
    }

    const drivers = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    // Filtrar CNH vencendo (próximos 30 dias) - implementar se necessário
    let filteredDrivers = drivers;
    if (cnh_expiring === 'true') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      filteredDrivers = drivers.filter(driver => {
        if (!driver.licenseExpiry) return false;
        const expiryDate = new Date(driver.licenseExpiry);
        const today = new Date();
        return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
      });
    }

    res.json(filteredDrivers);
  } catch (error) {
    console.error('Erro ao buscar motoristas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// GET /api/drivers/available - Buscar motoristas disponíveis (deve vir antes de /:id)
router.get('/available', authenticate, async (req, res) => {
  try {
    console.log('=== BUSCANDO MOTORISTAS DISPONÍVEIS ===');
    console.log('🔍 User model disponível:', !!User);
    console.log('🔍 Req.user:', req.user);
    
    // Buscar motoristas ativos (query simplificada para teste)
    const drivers = await User.findAll({
      where: {
        userType: 'driver',
        status: 'active'
      },
      attributes: ['id', 'name', 'phone', 'email', 'status'],
      order: [['name', 'ASC']]
    });
    
    console.log(`✅ Encontrados ${drivers.length} motoristas disponíveis`);
    console.log('📋 Motoristas formatados:', drivers.map(d => ({ id: d.id, name: d.name })));
    res.json(drivers);
  } catch (error) {
    console.error('❌ Erro ao buscar motoristas disponíveis:', error);
    console.error('❌ Stack:', error.stack);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
});

// GET /api/drivers/:id - Buscar motorista por ID
router.get('/:id', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await User.findOne({
      where: { 
        id: req.params.id, 
        userType: 'driver' 
      },
      attributes: { exclude: ['password'] }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Motorista não encontrado' });
    }

    res.json(driver);
  } catch (error) {
    console.error('Erro ao buscar motorista:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// POST /api/drivers - Criar novo motorista
router.post('/', createDriverValidation, async (req, res) => {
  try {
    console.log('=== CHEGOU NO DRIVER ROUTES POST ===');
    console.log('Body recebido:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Erro de validação no POST /api/drivers:', errors.array());
      console.error('Dados recebidos:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, cnh, cnh_category, cnh_expiry, cpf, status = 'available' } = req.body;

    // Verificar se email já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    // Verificar se CNH já existe
    const existingCnh = await User.findOne({ where: { licenseNumber: cnh } });
    if (existingCnh) {
      return res.status(400).json({ message: 'CNH já cadastrada' });
    }

    // Gerar senha padrão (poderá ser alterada depois)
    const defaultPassword = 'motorista123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Converter CPF para apenas números (para salvar no banco)
    const cpfOnly = cpf ? cpf.replace(/\D/g, '') : null;

    const newDriver = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      cpf: cpfOnly,
      userType: 'driver',
      status,
      licenseNumber: cnh,
      licenseCategory: cnh_category,
      licenseExpiry: cnh_expiry
    });

    // Remover senha da resposta
    const driverResponse = { ...newDriver.toJSON() };
    delete driverResponse.password;

    res.status(201).json(driverResponse);
  } catch (error) {
    console.error('Erro ao criar motorista:', error);
    
    // Tratar erro de CPF duplicado
    if (error.name === 'SequelizeUniqueConstraintError' && error.fields && error.fields.cpf) {
      return res.status(400).json({ message: 'CPF já cadastrado no sistema' });
    }
    
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PUT /api/drivers/:id - Atualizar motorista
router.put('/:id', authenticate, updateDriverValidation, async (req, res) => {
  try {
    console.log('=== DEBUG PUT /api/drivers/:id ===');
    console.log('Body recebido:', JSON.stringify(req.body, null, 2));
    console.log('Params recebidos:', JSON.stringify(req.params, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Erro de validação no PUT /api/drivers/:id:', JSON.stringify(errors.array(), null, 2));
      console.error('Dados recebidos:', JSON.stringify(req.body, null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, cnh, cnh_category, cnh_expiry, cpf, status } = req.body;

    const driver = await User.findOne({
      where: { 
        id: req.params.id, 
        userType: 'driver' 
      }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Motorista não encontrado' });
    }

    // Verificar duplicatas (excluindo o próprio motorista)
    if (email && email !== driver.email) {
      const existingEmail = await User.findOne({ 
        where: { 
          email, 
          id: { [Op.ne]: req.params.id } 
        } 
      });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email já cadastrado' });
      }
    }

    if (cnh && cnh !== driver.licenseNumber) {
      const existingCnh = await User.findOne({ 
        where: { 
          licenseNumber: cnh,
          id: { [Op.ne]: req.params.id }
        } 
      });
      if (existingCnh) {
        return res.status(400).json({ message: 'CNH já cadastrada' });
      }
    }

    // Converter CPF para apenas números (para salvar no banco)
    const cpfOnly = cpf ? cpf.replace(/\D/g, '') : null;

    // Verificar CPF duplicado (excluindo o próprio motorista)
    if (cpfOnly && cpfOnly !== driver.cpf) {
      const existingCpf = await User.findOne({ 
        where: { 
          cpf: cpfOnly,
          id: { [Op.ne]: req.params.id }
        } 
      });
      if (existingCpf) {
        return res.status(400).json({ message: 'CPF já cadastrado no sistema' });
      }
    }

    // Atualizar dados
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (cpf) updateData.cpf = cpfOnly;
    if (status) updateData.status = status;
    if (cnh) updateData.licenseNumber = cnh;
    if (cnh_category) updateData.licenseCategory = cnh_category;
    if (cnh_expiry) updateData.licenseExpiry = cnh_expiry;

    await driver.update(updateData);

    // Remover senha da resposta
    const driverResponse = { ...driver.toJSON() };
    delete driverResponse.password;

    res.json(driverResponse);
  } catch (error) {
    console.error('Erro ao atualizar motorista:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// DELETE /api/drivers/:id - Excluir motorista
router.delete('/:id', authenticate, param('id').isUUID(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await User.findOne({
      where: { 
        id: req.params.id, 
        userType: 'driver' 
      }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Motorista não encontrado' });
    }

    await driver.destroy();

    res.json({ message: 'Motorista excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir motorista:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// PATCH /api/drivers/:id/status - Atualizar status do motorista
router.patch('/:id/status', authenticate, [
  param('id').isUUID(),
  body('status').isIn(['active', 'inactive', 'suspended'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const driver = await User.findOne({
      where: { 
        id: req.params.id, 
        userType: 'driver' 
      }
    });

    if (!driver) {
      return res.status(404).json({ message: 'Motorista não encontrado' });
    }

    await driver.update({ status: req.body.status });

    res.json({ message: 'Status atualizado com sucesso', status: req.body.status });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;