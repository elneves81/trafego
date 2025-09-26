const http = require('http');

// Teste simples das APIs
const testAPI = (path) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8089,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
};

async function runTests() {
  const endpoints = [
    '/api/vehicles',
    '/api/rides', 
    '/api/users',
    '/api/drivers',
    '/api/system/alerts'
  ];

  console.log('Testando APIs do backend na porta 8089...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testando ${endpoint}...`);
      const result = await testAPI(endpoint);
      console.log(`Status: ${result.statusCode}`);
      
      if (result.statusCode === 200) {
        if (typeof result.data === 'object') {
          console.log(`Dados: ${JSON.stringify(result.data, null, 2).substring(0, 200)}...`);
        } else {
          console.log(`Dados: ${result.data.substring(0, 200)}...`);
        }
      } else {
        console.log(`Erro: ${result.data}`);
      }
      
      console.log('---\n');
    } catch (error) {
      console.log(`Erro ao conectar com ${endpoint}: ${error.message}\n`);
    }
  }
}

runTests();