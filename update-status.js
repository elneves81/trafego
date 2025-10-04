const { sequelize } = require('./backend/src/models');

async function updateStatus() {
  try {
    console.log('🔧 ATUALIZANDO STATUS DIRETAMENTE...');
    
    // Atualizar todos os registros com status vazio
    const result = await sequelize.query(
      "UPDATE attendances SET status = 'Recebida' WHERE status = '' OR status IS NULL",
      { type: sequelize.QueryTypes.UPDATE }
    );
    
    console.log('✅ Registros atualizados:', result[1]);
    
    // Verificar resultado
    const check = await sequelize.query(
      "SELECT id, attendanceNumber, patientName, status FROM attendances WHERE status = 'Recebida' ORDER BY id DESC",
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📋 ATENDIMENTOS RECEBIDOS AGORA:', check.length);
    check.forEach(c => console.log('  -', c.attendanceNumber, '|', c.patientName, '| Status:', c.status));
    
    if (check.length > 0) {
      console.log('\n🎯 SUCESSO! Sistema pronto para testar no frontend.');
      console.log('👉 Acesse: http://localhost:3007');
      console.log('👉 Faça login e vá para o Dashboard do Operador');
      console.log('👉 Os atendimentos reais aparecerão na lista!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

updateStatus();