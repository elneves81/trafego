const { User } = require('./backend/src/models');

(async () => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'userType', 'status', 'createdAt']
    });
    
    console.log('👥 TODOS OS USUÁRIOS CADASTRADOS:');
    console.log('Total:', users.length);
    
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Nome: ${user.name}, Email: ${user.email}, Tipo: ${user.userType}, Status: ${user.status}`);
    });
    
    const drivers = users.filter(u => u.userType === 'driver');
    console.log(`\n🚗 MOTORISTAS ENCONTRADOS: ${drivers.length}`);
    
    if (drivers.length > 0) {
      drivers.forEach(driver => {
        console.log(`🚗 Driver: ${driver.name} (${driver.email})`);
      });
    } else {
      console.log('❌ Nenhum motorista cadastrado no sistema');
      console.log('\n💡 Para criar um motorista de teste, você pode usar:');
      console.log('- Email: motorista@transporte.com');
      console.log('- Senha: 123456');
      console.log('- Tipo: driver');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
})();