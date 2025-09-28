const { sequelize } = require('./backend/src/models');

async function fixStatusEnum() {
  try {
    console.log('🔧 CORRIGINDO STATUS COM ENUM CORRETO...');
    
    // Atualizar registros vazios para 'Recebida' (equivalente a pending)
    const result = await sequelize.query("UPDATE attendances SET status = 'Recebida' WHERE status = ''");
    console.log('✅ Atualização:', result[0].info);
    
    // Verificar resultado
    const recebidas = await sequelize.query("SELECT id, attendanceNumber, patientName, status, priority, category FROM attendances WHERE status = 'Recebida' ORDER BY id DESC", { type: sequelize.QueryTypes.SELECT });
    
    console.log(`📋 ATENDIMENTOS RECEBIDOS (equivalente a pending): ${recebidas.length}`);
    
    if (recebidas.length > 0) {
      console.log('\n📞 CHAMADAS PRONTAS PARA DESPACHO:');
      recebidas.forEach((att, i) => {
        console.log(`${i+1}. [${att.id}] ${att.attendanceNumber}`);
        console.log(`   👤 ${att.patientName}`);
        console.log(`   🚨 ${att.priority} | 📋 ${att.category}`);
        console.log(`   📊 Status: ${att.status}`);
        console.log('   ────────────────────────────────');
      });
      
      console.log('\n🎯 PERFEITO! Sistema pronto para testar.');
      console.log('📝 NOTA: Vou ajustar o frontend para buscar status "Recebida" ao invés de "pending"');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

fixStatusEnum();