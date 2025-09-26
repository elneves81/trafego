const { Sequelize, DataTypes } = require('sequelize');
const config = require('./src/models/index.js');

async function addCategoryColumn() {
  try {
    console.log('🔧 Adicionando coluna category à tabela attendances...');
    
    // Configuração do banco
    const sequelize = new Sequelize('trafego', 'root', '', {
      host: 'localhost',
      dialect: 'mysql',
      logging: false
    });

    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a coluna já existe
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'trafego' 
        AND TABLE_NAME = 'attendances' 
        AND COLUMN_NAME = 'category'
    `);

    if (results.length > 0) {
      console.log('⚠️ Coluna category já existe na tabela attendances');
    } else {
      // Adicionar a coluna
      await sequelize.query(`
        ALTER TABLE attendances 
        ADD COLUMN category ENUM('emergency', 'basic', 'scheduled') 
        DEFAULT 'emergency' 
        COMMENT 'Categoria do atendimento (emergência, básico, agendado)'
      `);
      
      console.log('✅ Coluna category adicionada com sucesso!');
    }

    // Atualizar registros existentes para ter categoria 'emergency'
    const [updateResult] = await sequelize.query(`
      UPDATE attendances 
      SET category = 'emergency' 
      WHERE category IS NULL
    `);
    
    console.log(`✅ ${updateResult.affectedRows || 0} registros atualizados com categoria 'emergency'`);

    await sequelize.close();
    console.log('🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

addCategoryColumn();