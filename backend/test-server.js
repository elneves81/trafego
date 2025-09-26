console.log('Teste básico do Node.js');
console.log('Diretório atual:', __dirname);
console.log('Arquivo atual:', __filename);

const express = require('express');
const app = express();
const PORT = 8082;

app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor teste na porta 8082',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Servidor teste rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});