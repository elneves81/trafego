const { sequelize } = require('./backend/src/models');

async function debugTable() {
  try {
    console.log('🔍 DEBUGANDO TABELA...');
    
    // Ver estrutura
    const describe = await sequelize.query('DESCRIBE attendances', { type: sequelize.QueryTypes.SELECT });
    console.log('📋 COLUNAS DA TABELA:');
    describe.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (Default: ${col.Default}, Null: ${col.Null})`);
    });
    
    // Ver status únicos
    const statuses = await sequelize.query('SELECT DISTINCT status, COUNT(*) as count FROM attendances GROUP BY status', { type: sequelize.QueryTypes.SELECT });
    console.log('\n📊 STATUS ÚNICOS:');
    statuses.forEach(s => {
      console.log(`  - "${s.status}" (${typeof s.status}) | Qtd: ${s.count}`);
    });
    
    // Tentar update simples
    console.log('\n🔧 TENTANDO ATUALIZAÇÃO...');
    const result = await sequelize.query("UPDATE attendances SET status = 'pending' WHERE id = 19");
    console.log('Resultado:', result);
    
    // Verificar
    const check = await sequelize.query('SELECT id, status FROM attendances WHERE id = 19', { type: sequelize.QueryTypes.SELECT });
    console.log('Status atual ID 19:', check);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

debugTable();