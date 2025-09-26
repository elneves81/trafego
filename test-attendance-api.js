const axios = require('axios');

async function testAttendanceAPI() {
  try {
    console.log('🧪 Testando API de atendimentos...');
    
    // Primeiro fazer login para obter o token
    const loginResponse = await axios.post('http://localhost:8082/api/auth/login', {
      email: 'admin@admin.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');

    // Configurar headers com o token
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // Testar criação de atendimento
    const attendanceData = {
      callerName: 'Operador Teste',
      callerPhone: '42999887766',
      patientName: 'João Silva',
      patientPhone: '42999887766',
      patientAge: 45,
      priority: 'Média',
      medicalCondition: 'Consulta básica',
      originAddress: 'Rua das Flores, 123',
      category: 'basic'
    };

    console.log('📋 Enviando dados:', JSON.stringify(attendanceData, null, 2));

    const createResponse = await axios.post('http://localhost:8082/api/attendances', attendanceData, config);
    
    console.log('📋 Resposta da criação:');
    console.log(JSON.stringify(createResponse.data, null, 2));

    // Testar listagem de atendimentos
    const listResponse = await axios.get('http://localhost:8082/api/attendances', config);
    
    console.log('📋 Resposta da listagem:');
    console.log(JSON.stringify(listResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testAttendanceAPI();