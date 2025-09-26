const http = require('http');

console.log('🔧 Testando bind na porta 8082...');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Servidor de teste funcionando!\n');
});

server.listen(8082, '0.0.0.0', () => {
  console.log('✅ Servidor de teste rodando na porta 8082');
  console.log('🌍 Acessível em: http://localhost:8082');
  
  // Testar conexão local
  setTimeout(() => {
    const req = http.request({
      hostname: 'localhost',
      port: 8082,
      path: '/',
      method: 'GET'
    }, (res) => {
      console.log(`🎯 Teste de conexão: Status ${res.statusCode}`);
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log('📄 Resposta:', body.trim());
        server.close();
        process.exit(0);
      });
    });
    
    req.on('error', (e) => {
      console.error('❌ Erro na conexão de teste:', e.message);
      server.close();
      process.exit(1);
    });
    
    req.end();
  }, 1000);
});

server.on('error', (e) => {
  console.error('❌ Erro ao iniciar servidor de teste:', e.message);
  process.exit(1);
});