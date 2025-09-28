const fetch = require('node-fetch');

async function testPendingAPI() {
  try {
    console.log('🧪 TESTANDO API DE ATENDIMENTOS PENDENTES...\n');
    
    // Primeiro, fazer login para obter token
    const loginResponse = await fetch('http://localhost:8082/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@sistema.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Erro no login:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso');
    
    // Testar API de atendimentos pendentes
    const pendingResponse = await fetch('http://localhost:8082/api/attendances/pending', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      console.log('✅ API Respondeu com sucesso!');
      console.log('📊 Total de atendimentos pendentes:', Array.isArray(pendingData) ? pendingData.length : 0);
      
      if (Array.isArray(pendingData) && pendingData.length > 0) {
        console.log('\n📋 ATENDIMENTOS ENCONTRADOS:');
        pendingData.forEach((att, i) => {
          console.log(`${i+1}. [${att.id}] ${att.attendanceNumber}`);
          console.log(`   👤 ${att.patientName}`);
          console.log(`   📱 ${att.callerPhone}`);
          console.log(`   📍 ${att.address || att.originAddress || 'Endereço não informado'}`);
          console.log(`   🏥 ${att.medicalCondition}`);
          console.log(`   🚨 ${att.priority} | 📋 ${att.category}`);
          console.log('   ────────────────────────────────');
        });
        
        console.log('\n🎯 SUCESSO! API funcionando perfeitamente!');
        console.log('👉 Agora o frontend vai carregar estes dados reais.');
      } else {
        console.log('⚠️ API retornou array vazio - verificar se há atendimentos com status "Recebida"');
      }
    } else {
      console.error('❌ Erro na API pendentes:', pendingResponse.status);
      const errorText = await pendingResponse.text();
      console.error('Erro:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testPendingAPI();