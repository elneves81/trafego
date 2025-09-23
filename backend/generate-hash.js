const bcrypt = require('bcryptjs');

async function generateHash() {
  try {
    const password = 'admin123';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    // Testar se o hash funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash is valid:', isValid);
  } catch (error) {
    console.error('Error:', error);
  }
}

generateHash();