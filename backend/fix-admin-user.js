const bcrypt = require('bcryptjs');
const { User, sequelize } = require('./src/models');

async function createAdminUser() {
  try {
    // Primeiro, vamos verificar se o usuário existe
    const existingUser = await User.findOne({ where: { email: 'admin@admin.com' } });
    
    if (existingUser) {
      console.log('Usuário admin já existe. Testando senha atual...');
      const isValid = await existingUser.validatePassword('admin123');
      console.log('Senha atual é válida:', isValid);
      
      if (!isValid) {
        console.log('Atualizando senha...');
        // Usar SQL direto para não trigger o hook
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await sequelize.query(
          'UPDATE users SET password = ? WHERE email = ?',
          { replacements: [hashedPassword, 'admin@admin.com'] }
        );
        console.log('✅ Senha atualizada com SQL direto!');
        
        // Testar novamente
        const updatedUser = await User.findOne({ where: { email: 'admin@admin.com' } });
        const isValidNow = await updatedUser.validatePassword('admin123');
        console.log('Senha depois da atualização:', isValidNow ? 'VÁLIDA' : 'INVÁLIDA');
      }
    } else {
      // Criar novo usuário
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await sequelize.query(`
        INSERT INTO users (name, email, password, userType, status, phone, cpf, createdAt, updatedAt)
        VALUES (?, ?, ?, 'admin', 'active', ?, ?, NOW(), NOW())
      `, {
        replacements: [
          'Administrador Sistema',
          'admin@admin.com',
          hashedPassword,
          '(11) 99999-0000',
          '00000000000'
        ]
      });
      
      console.log('✅ Usuário admin criado com sucesso!');
    }

    // Verificação final
    const finalUser = await User.findOne({ where: { email: 'admin@admin.com' } });
    console.log('\n=== VERIFICAÇÃO FINAL ===');
    console.log('ID:', finalUser.id);
    console.log('Name:', finalUser.name);
    console.log('Email:', finalUser.email);
    console.log('UserType:', finalUser.userType);
    console.log('Status:', finalUser.status);
    
    const finalTest = await finalUser.validatePassword('admin123');
    console.log('✅ Teste final de senha:', finalTest ? 'PASSOU' : 'FALHOU');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

createAdminUser();