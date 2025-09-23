const { User, Vehicle, Ride, Notification } = require('../src/models');
const logger = require('../src/utils/logger');

async function seed() {
  try {
    logger.info('Starting database seeding...');

    // Criar usuário administrador padrão
    const adminExists = await User.findOne({ where: { email: 'admin@transporte.gov.br' } });
    
    if (!adminExists) {
      await User.create({
        name: 'Administrador Sistema',
        email: 'admin@transporte.gov.br',
        password: 'admin123',
        phone: '(11) 99999-9999',
        cpf: '12345678901',
        userType: 'admin',
        status: 'active'
      });
      logger.info('Admin user created');
    }

    // Criar operador padrão
    const operatorExists = await User.findOne({ where: { email: 'operador@transporte.gov.br' } });
    
    if (!operatorExists) {
      await User.create({
        name: 'Operador Central',
        email: 'operador@transporte.gov.br',
        password: 'operador123',
        phone: '(11) 88888-8888',
        cpf: '98765432101',
        userType: 'operator',
        status: 'active'
      });
      logger.info('Operator user created');
    }

    // Criar motoristas de exemplo
    const driversData = [
      {
        name: 'João Silva',
        email: 'joao.silva@transporte.gov.br',
        password: 'motorista123',
        phone: '(11) 77777-7777',
        cpf: '11122233344',
        userType: 'driver',
        licenseNumber: 'SP123456789',
        licenseExpiry: new Date('2025-12-31'),
        emergencyContact: 'Maria Silva',
        emergencyPhone: '(11) 66666-6666'
      },
      {
        name: 'Pedro Santos',
        email: 'pedro.santos@transporte.gov.br',
        password: 'motorista123',
        phone: '(11) 55555-5555',
        cpf: '44455566677',
        userType: 'driver',
        licenseNumber: 'SP987654321',
        licenseExpiry: new Date('2026-06-30'),
        emergencyContact: 'Ana Santos',
        emergencyPhone: '(11) 44444-4444'
      }
    ];

    for (const driverData of driversData) {
      const exists = await User.findOne({ where: { email: driverData.email } });
      if (!exists) {
        await User.create(driverData);
        logger.info(`Driver ${driverData.name} created`);
      }
    }

    // Criar veículos de exemplo
    const vehiclesData = [
      {
        plateNumber: 'ABC1234',
        model: 'Sprinter Ambulância',
        brand: 'Mercedes-Benz',
        year: 2022,
        color: 'Branco',
        vehicleType: 'ambulance',
        capacity: 2,
        status: 'available',
        fuelType: 'diesel',
        averageConsumption: 12.5,
        equipment: [
          'Desfibrilador',
          'Oxigênio',
          'Maca',
          'Kit de primeiros socorros'
        ]
      },
      {
        plateNumber: 'DEF5678',
        model: 'Master Ambulância',
        brand: 'Renault',
        year: 2021,
        color: 'Branco',
        vehicleType: 'ambulance',
        capacity: 2,
        status: 'available',
        fuelType: 'diesel',
        averageConsumption: 14.0,
        equipment: [
          'Desfibrilador',
          'Oxigênio',
          'Maca',
          'Monitor cardíaco'
        ]
      },
      {
        plateNumber: 'GHI9012',
        model: 'Hilux',
        brand: 'Toyota',
        year: 2023,
        color: 'Branco',
        vehicleType: 'transport',
        capacity: 4,
        status: 'available',
        fuelType: 'diesel',
        averageConsumption: 11.0
      }
    ];

    for (const vehicleData of vehiclesData) {
      const exists = await Vehicle.findOne({ where: { plateNumber: vehicleData.plateNumber } });
      if (!exists) {
        await Vehicle.create(vehicleData);
        logger.info(`Vehicle ${vehicleData.plateNumber} created`);
      }
    }

    // Atribuir veículos aos motoristas
    const drivers = await User.findAll({ where: { userType: 'driver' } });
    const vehicles = await Vehicle.findAll({ where: { driverId: null }, limit: 2 });

    if (drivers.length >= 2 && vehicles.length >= 2) {
      await vehicles[0].update({ driverId: drivers[0].id });
      await vehicles[1].update({ driverId: drivers[1].id });
      logger.info('Vehicles assigned to drivers');
    }

    // Criar notificação de boas-vindas para todos os usuários
    const allUsers = await User.findAll();
    for (const user of allUsers) {
      const notificationExists = await Notification.findOne({ 
        where: { 
          userId: user.id, 
          title: 'Bem-vindo ao Sistema de Transporte' 
        } 
      });
      
      if (!notificationExists) {
        await Notification.createSystemNotification(
          user.id,
          'Bem-vindo ao Sistema de Transporte',
          'Você agora tem acesso ao sistema de gestão de transporte de ambulâncias. Explore as funcionalidades disponíveis para seu perfil.',
          { isWelcomeMessage: true }
        );
      }
    }

    logger.info('Welcome notifications created');
    logger.info('Database seeding completed successfully!');

    // Log de resumo
    const userCount = await User.count();
    const vehicleCount = await Vehicle.count();
    const rideCount = await Ride.count();
    
    logger.info(`Database summary: ${userCount} users, ${vehicleCount} vehicles, ${rideCount} rides`);

  } catch (error) {
    logger.error('Seeding failed:', error);
    throw error;
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = seed;