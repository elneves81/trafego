const bcrypt = require('bcryptjs');
const { User } = require('./src/models');

async function createAdminUser() {
  try {
    // Gerar hash da senha
    const password = 'admin123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Criar ou atualizar usuário admin
    const [user, created] = await User.findOrCreate({
      where: { email: 'admin@admin.com' },
      defaults: {
        name: 'Administrador Sistema',
        email: 'admin@admin.com',
        password: hashedPassword,
        userType: 'admin',
        status: 'active',
        phone: '(11) 99999-0000',
        cpf: '00000000000'
      }
    });

    if (created) {
      console.log('✅ Usuário admin criado com sucesso!');
    } else {
      // Se já existe, atualizar a senha
      await user.update({ password: hashedPassword });
      console.log('✅ Usuário admin atualizado com nova senha!');
    }

    console.log('Dados do usuário:');
    console.log('ID:', user.id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('UserType:', user.userType);
    console.log('Status:', user.status);

    // Testar login
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('✅ Teste de senha:', isPasswordValid ? 'PASSOU' : 'FALHOU');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    process.exit(1);
  }
}

createAdminUser();