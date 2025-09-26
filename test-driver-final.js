const http = require('http');

const postData = JSON.stringify({
  nome: 'João Silva',
  cpf: '123.456.789-00',
  phone: '(11) 99999-9999',
  email: 'joao.silva@email.com',
  password: '123456',
  role: 'driver'
});

const options = {
  hostname: 'localhost',
  port: 8082,
  path: '/api/drivers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔥 Testando criação de driver...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    try {
      console.log('✅ Resposta:', JSON.parse(body));
    } catch (e) {
      console.log('📄 Resposta (texto):', body);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro:', e.message);
});

req.write(postData);
req.end();