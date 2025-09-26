const http = require('http');

console.log('🔥 Testando API de drivers...\n');

const postData = JSON.stringify({
  name: 'Maria Santos Teste',         // Nome diferente também
  cpf: '987.654.321-00',             // CPF diferente - não existe no banco
  phone: '(21) 99999-8888',          // Telefone diferente
  email: 'maria.santos@email.com',   // Email diferente
  cnh: '09876543210',                // CNH diferente - 11 dígitos
  cnh_category: 'D',                 // Categoria obrigatória para ambulância  
  cnh_expiry: '2026-06-30',          // Data de validade da CNH obrigatória
  status: 'available'                // Status válido
});

console.log('📤 Enviando dados:', JSON.parse(postData));

const req = http.request({
  hostname: '127.0.0.1',    // Mudança para 127.0.0.1
  port: 8082,
  path: '/api/drivers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  console.log(`\n📊 Status HTTP: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      console.log('✅ Resposta da API:', result);
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('\n🎉 SUCESSO! Driver criado com sucesso!');
        console.log('💾 Agora vamos verificar se foi salvo no banco...');
        process.exit(0);
      } else {
        console.log('\n⚠️ Status inesperado:', res.statusCode);
      }
    } catch (e) {
      console.log('\n📄 Resposta (não JSON):', body);
    }
  });
});

req.on('error', (e) => {
  console.error('\n❌ Erro de conexão:', e.message);
  console.log('💡 Verificar se o backend está rodando na porta 8082');
  process.exit(1);
});

console.log('⏳ Enviando requisição para http://127.0.0.1:8082/api/drivers...\n');
req.write(postData);
req.end();