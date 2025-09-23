const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');

async function migrate() {
  try {
    logger.info('Starting database migration...');

    // Verificar conexão
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    // Sincronizar modelos (criar tabelas)
    await sequelize.sync({ force: false, alter: false });
    logger.info('Database models synchronized successfully.');

    logger.info('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  migrate();
}

module.exports = migrate;