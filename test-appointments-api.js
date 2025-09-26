const axios = require('axios');

async function testAppointmentAPI() {
  try {
    console.log('🧪 Testando API de agendamentos...');
    
    // Primeiro fazer login para obter o token
    const loginResponse = await axios.post('http://10.0.134.79:8082/api/auth/login', {
      email: 'admin@admin.com',
      password: 'admin123'
    });

    console.log('📋 Resposta do login:', JSON.stringify(loginResponse.data, null, 2));
    const token = loginResponse.data.data.token;
    console.log('✅ Login realizado com sucesso');

    // Configurar headers com o token
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    // Testar listagem de agendamentos
    const appointmentsResponse = await axios.get('http://10.0.134.79:8082/api/appointments', config);
    
    console.log('📋 Resposta da API de agendamentos:');
    console.log(JSON.stringify(appointmentsResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
  }
}

testAppointmentAPI();