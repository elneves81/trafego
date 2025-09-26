const { Sequelize } = require('sequelize');

async function checkAttendances() {
  try {
    console.log('🔍 Verificando atendimentos no banco...');
    
    const sequelize = new Sequelize('trafego', 'root', '', {
      host: 'localhost',
      dialect: 'mysql',
      logging: false
    });

    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Buscar todos os atendimentos
    const [allResults] = await sequelize.query(`
      SELECT id, attendanceNumber, patientName, category, callDateTime 
      FROM attendances 
      ORDER BY callDateTime DESC
      LIMIT 10
    `);

    console.log('\n📋 TODOS OS ATENDIMENTOS:');
    console.table(allResults);

    // Buscar apenas atendimentos básicos
    const [basicResults] = await sequelize.query(`
      SELECT id, attendanceNumber, patientName, category, callDateTime 
      FROM attendances 
      WHERE category = 'basic'
      ORDER BY callDateTime DESC
    `);

    console.log('\n📋 ATENDIMENTOS BÁSICOS:');
    console.table(basicResults);

    // Contar por categoria
    const [countResults] = await sequelize.query(`
      SELECT category, COUNT(*) as total 
      FROM attendances 
      GROUP BY category
    `);

    console.log('\n📊 CONTAGEM POR CATEGORIA:');
    console.table(countResults);

    // Buscar dados completos do atendimento básico
    const [basicDetailResults] = await sequelize.query(`
      SELECT * FROM attendances WHERE category = 'basic' LIMIT 1
    `);

    console.log('\n🔍 DADOS COMPLETOS DO ATENDIMENTO BÁSICO:');
    if (basicDetailResults.length > 0) {
      console.log(JSON.stringify(basicDetailResults[0], null, 2));
    } else {
      console.log('Nenhum atendimento básico encontrado');
    }

    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkAttendances();