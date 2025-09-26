// Servidor de teste mínimo para debugar
const express = require('express');
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Servidor básico funcionando!' });
});

app.listen(PORT, () => {
  console.log(`Servidor básico rodando na porta ${PORT}`);
});