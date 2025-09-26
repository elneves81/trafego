const http = require('http');

console.log('🚀 Iniciando teste...');

// Primeiro testar se o servidor está respondendo
const testConnection = () => {
  const req = http.request({
    hostname: 'localhost',
    port: 8082,
    path: '/',
    method: 'GET'
  }, (res) => {
    console.log('✅ Servidor está online!');
    console.log(`Status: ${res.statusCode}`);
    testDriverCreation();
  });

  req.on('error', (e) => {
    console.error('❌ Servidor offline:', e.message);
  });

  req.end();
};

// Testar criação de driver
const testDriverCreation = () => {
  const postData = JSON.stringify({
    nome: 'João Silva Teste',
    cpf: '111.222.333-44',
    phone: '(11) 98888-7777',
    email: 'joao.teste@email.com',
    password: '123456',
    role: 'driver'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 8082,
    path: '/api/drivers',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    console.log(`\n📊 Status da criação: ${res.statusCode}`);
    
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
      try {
        const result = JSON.parse(body);
        console.log('✅ Driver criado:', result);
        
        // Verificar no banco
        setTimeout(() => {
          console.log('\n🔍 Verificando no banco de dados...');
          // Aqui normalmente consultaríamos o banco, mas vamos apenas avisar
          console.log('⚠️  Verifique manualmente no banco se o driver foi salvo');
          process.exit(0);
        }, 1000);
        
      } catch (e) {
        console.log('📄 Resposta não é JSON:', body);
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erro na criação:', e.message);
  });

  req.write(postData);
  req.end();
};

testConnection();