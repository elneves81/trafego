const express = require('express');
const app = express();
const PORT = 8089;

app.use(express.json());

// Rota de teste simples
app.get('/', (req, res) => {
  res.json({ message: 'Servidor teste funcionando!', port: PORT });
});

// API de teste para veículos
app.get('/api/vehicles', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, placa: 'ABC-1234', modelo: 'Ambulância Tipo A' },
      { id: 2, placa: 'DEF-5678', modelo: 'Ambulância Tipo B' }
    ]
  });
});

// API de teste para corridas
app.get('/api/rides', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, origem: 'Hospital A', destino: 'Hospital B', status: 'em_andamento' },
      { id: 2, origem: 'UPA Central', destino: 'Hospital Regional', status: 'concluida' }
    ]
  });
});

// API de teste para usuários
app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, nome: 'João Silva', tipo: 'motorista' },
      { id: 2, nome: 'Maria Santos', tipo: 'operador' }
    ]
  });
});

// API de teste para motoristas
app.get('/api/drivers', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, nome: 'Carlos Oliveira', cnh: '12345678901', validade_cnh: '2025-12-31' },
      { id: 2, nome: 'Ana Costa', cnh: '98765432109', validade_cnh: '2026-06-15' }
    ]
  });
});

// API de teste para alertas do sistema
app.get('/api/system/alerts', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, tipo: 'cnh_expiring', mensagem: 'CNH de João vence em 30 dias', prioridade: 'high' },
      { id: 2, tipo: 'maintenance_due', mensagem: 'Ambulância ABC-1234 precisa de revisão', prioridade: 'medium' }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor teste rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://localhost:${PORT}`);
  console.log(`📋 APIs disponíveis:`);
  console.log(`   - GET /api/vehicles`);
  console.log(`   - GET /api/rides`);
  console.log(`   - GET /api/users`);
  console.log(`   - GET /api/drivers`);
  console.log(`   - GET /api/system/alerts`);
});