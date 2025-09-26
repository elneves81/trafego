const { Sequelize } = require('sequelize');

async function addAttendanceTypeColumn() {
  try {
    console.log('🔧 Adicionando coluna attendanceType à tabela attendances...');
    
    const sequelize = new Sequelize('trafego', 'root', '', {
      host: 'localhost',
      dialect: 'mysql',
      logging: false
    });

    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna já existe
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'trafego' 
        AND TABLE_NAME = 'attendances' 
        AND COLUMN_NAME = 'attendanceType'
    `);

    if (results.length > 0) {
      console.log('⚠️ Coluna attendanceType já existe na tabela attendances');
    } else {
      // Adicionar a coluna
      await sequelize.query(`
        ALTER TABLE attendances 
        ADD COLUMN attendanceType ENUM('emergency', 'consultation', 'transport', 'exam', 'other') 
        DEFAULT 'other' 
        COMMENT 'Tipo de atendimento solicitado'
        AFTER priority
      `);
      
      console.log('✅ Coluna attendanceType adicionada com sucesso!');
    }

    // Atualizar registros básicos existentes
    const [updateResult] = await sequelize.query(`
      UPDATE attendances 
      SET attendanceType = 'consultation' 
      WHERE category = 'basic' AND attendanceType IS NULL
    `);
    
    console.log(`✅ Atendimentos básicos atualizados para 'consultation'`);

    await sequelize.close();
    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

addAttendanceTypeColumn();