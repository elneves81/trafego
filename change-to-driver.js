const { sequelize } = require('./backend/src/models');

async function changeUserToDriver() {
  try {
    console.log('🔧 ALTERANDO USUÁRIO PARA MOTORISTA...\n');
    
    // Alterar userType para driver
    const result = await sequelize.query(
      "UPDATE users SET userType = 'driver' WHERE email = 'admin@sistema.com'",
      { type: sequelize.QueryTypes.UPDATE }
    );
    
    console.log('✅ Usuário alterado para motorista:', result[1]);
    
    // Verificar resultado
    const check = await sequelize.query(
      "SELECT id, name, email, userType FROM users WHERE email = 'admin@sistema.com'",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 USUÁRIO ATUAL:');
    check.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`  - Nome: ${user.name}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Tipo: ${user.userType}`);
    });
    
    console.log('\n🎯 COMO TESTAR AGORA:');
    console.log('   1. Acesse: http://localhost:3007');
    console.log('   2. Login: admin@sistema.com / admin123');
    console.log('   3. Você será redirecionado para Dashboard do Motorista!');
    console.log('   4. Veja as corridas pendentes carregadas do banco');
    console.log('   5. Clique em "Ver Detalhes" para abrir modal');
    console.log('   6. Teste aceite/recusa e chat');
    
    console.log('\n💡 PARA VOLTAR PARA ADMIN:');
    console.log('   node -e "');
    console.log('   const { sequelize } = require(\'./backend/src/models\');');
    console.log('   (async () => {');
    console.log('     await sequelize.query(');
    console.log('       \\\"UPDATE users SET userType = \'admin\' WHERE email = \'admin@sistema.com\'\\\"');
    console.log('     );');
    console.log('     console.log(\'✅ Voltou para admin\');');
    console.log('     process.exit(0);');
    console.log('   })();');
    console.log('   "');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

changeUserToDriver();