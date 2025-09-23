const jwt = require('jsonwebtoken');
require('dotenv').config();

function testJWT() {
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  
  // Simular a geração do token como no authController
  const testId = 1;
  const token = jwt.sign({ id: testId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
  
  console.log('Token gerado:', token);
  console.log('Token length:', token.length);
  
  // Testar se consegue decodificar
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado com sucesso:', decoded);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
  }
}

testJWT();