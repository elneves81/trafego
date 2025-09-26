const { sequelize } = require('./src/models');

async function addLicenseCategoryColumn() {
  try {
    console.log('Conectando ao banco de dados...');
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');

    // Verificar se a coluna já existe
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'licenseCategory'
      AND TABLE_SCHEMA = 'trafego'
    `);

    if (results.length === 0) {
      console.log('Adicionando coluna licenseCategory...');
      await sequelize.query(`
        ALTER TABLE users 
        ADD COLUMN licenseCategory VARCHAR(10) NULL
      `);
      console.log('Coluna licenseCategory adicionada com sucesso!');
    } else {
      console.log('Coluna licenseCategory já existe.');
    }

    await sequelize.close();
    console.log('Script concluído.');
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

addLicenseCategoryColumn();