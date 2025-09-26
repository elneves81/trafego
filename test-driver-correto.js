const http = require('http');

console.log('🔥 Testando API de drivers com dados corretos...\n');

const postData = JSON.stringify({
  name: 'João Silva Teste',  // Mudado de 'nome' para 'name'
  cpf: '111.222.333-44',
  phone: '(11) 98888-7777',
  email: 'joao.teste@email.com',
  cnh: '12345678901',      // CNH obrigatória de 11 dígitos
  cnh_category: 'D',       // Categoria para ambulância
  cnh_expiry: '2025-12-31', // Data de validade da CNH
  status: 'available'
});

console.log('📤 Enviando dados:', JSON.parse(postData));

const req = http.request({
  hostname: 'localhost',
  port: 8082,
  path: '/api/drivers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    // Adicionando um token de autenticação fictício
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
  }
}, (res) => {
  console.log(`\n📊 Status HTTP: ${res.statusCode}`);
  
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    try {
      const result = JSON.parse(body);
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('✅ Driver criado com sucesso:', result);
      } else {
        console.log('❌ Erro ao criar driver:', result);
      }
    } catch (e) {
      console.log('📄 Resposta (texto):', body);
    }
  });
});

req.on('error', (e) => {
  console.error('\n❌ Erro de conexão:', e.message);
  process.exit(1);
});

console.log('⏳ Enviando requisição para http://localhost:8082/api/drivers...\n');
req.write(postData);
req.end();