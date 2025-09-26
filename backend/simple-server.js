const express = require('express');
const app = express();
const PORT = 8089;

app.use(express.json());

// Rota de teste básica
app.get('/', (req, res) => {
  res.json({ message: 'Servidor teste funcionando!', port: PORT });
});

// APIs simuladas
app.get('/api/vehicles', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, plateNumber: 'ABC-1234', model: 'Ambulância', status: 'available' },
      { id: 2, plateNumber: 'DEF-5678', model: 'Ambulância', status: 'in_use' }
    ]
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Admin', email: 'admin@admin.com', userType: 'admin' }
    ]
  });
});

app.get('/api/rides', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, origin: 'Hospital A', destination: 'Hospital B', status: 'active' }
    ]
  });
});

app.get('/api/drivers', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'João Silva', license: 'ABC123456', status: 'active' }
    ]
  });
});

app.get('/api/system/alerts', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, message: 'CNH vencendo em 30 dias', type: 'warning', priority: 'high' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Servidor teste rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});