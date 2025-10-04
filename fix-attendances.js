const { Attendance } = require('./backend/src/models');
const { Op } = require('sequelize');

async function fixAttendances() {
  try {
    console.log('🔧 CORRIGINDO ATENDIMENTOS...\n');
    
    // 1. Corrigir status nulos
    const nullStatusAttendances = await Attendance.findAll({
      where: {
        [Op.or]: [
          { status: null },
          { status: '' },
          { status: 'Recebida' }
        ]
      }
    });
    
    console.log(`📝 Encontrados ${nullStatusAttendances.length} atendimentos com status a corrigir`);
    
    // Atualizar para Recebida (status inicial)
    for (const att of nullStatusAttendances) {
      await att.update({ 
        status: 'Recebida',
        priority: att.priority || 'Média',
        category: att.category || 'basic'
      });
      console.log(`✅ Corrigido: ${att.attendanceNumber || att.id} -> status: Recebida`);
    }
    
    // 2. Criar alguns atendimentos novos com dados completos
    const newAttendances = [
      {
        attendanceNumber: `ATD-NOVO-001`,
        patientName: 'LURDES APARECIDA SILVA',
        callerName: 'PRÓPRIA PACIENTE',
        callerPhone: '(42) 99111-2222',
        address: 'RUA XV DE NOVEMBRO, 234 - CENTRO',
        city: 'GUARAPUAVA',
        state: 'PR',
        zipCode: '85010-200',
        medicalCondition: 'CRISE HIPERTENSIVA - PRESSÃO MUITO ALTA',
        symptoms: 'Dor de cabeça intensa, visão embaçada',
        priority: 'Alta',
        urgencyLevel: 'urgent',
        category: 'emergency',
        status: 'Recebida',
        callDateTime: new Date(),
        operatorId: 1,
        patientAge: 68,
        patientGender: 'F'
      },
      {
        attendanceNumber: `ATD-NOVO-002`,
        patientName: 'PEDRO HENRIQUE COSTA',
        callerName: 'MARIA COSTA (MÃE)',
        callerPhone: '(42) 98765-4321',
        address: 'RUA CORONEL PIRES, 567 - TRIANON',
        city: 'GUARAPUAVA',
        state: 'PR',
        zipCode: '85020-100',
        medicalCondition: 'CRIANÇA COM FEBRE ALTA E CONVULSÃO',
        symptoms: 'Febre de 40°C, convulsão, irritabilidade',
        priority: 'Alta',
        urgencyLevel: 'critical',
        category: 'emergency',
        status: 'Recebida',
        callDateTime: new Date(),
        operatorId: 1,
        patientAge: 5,
        patientGender: 'M'
      },
      {
        attendanceNumber: `ATD-NOVO-003`,
        patientName: 'SEBASTIÃO OLIVEIRA',
        callerName: 'ESPOSA - CONCEIÇÃO',
        callerPhone: '(42) 97654-3210',
        address: 'AV. GETÚLIO VARGAS, 890 - SANTANA',
        city: 'GUARAPUAVA',
        state: 'PR',
        zipCode: '85070-300',
        medicalCondition: 'DIFICULDADE RESPIRATÓRIA - FALTA DE AR',
        symptoms: 'Respiração ofegante, lábios azulados',
        priority: 'Média',
        urgencyLevel: 'moderate',
        category: 'basic',
        status: 'Recebida',
        callDateTime: new Date(),
        operatorId: 1,
        patientAge: 75,
        patientGender: 'M'
      }
    ];
    
    console.log('\n➕ CRIANDO NOVOS ATENDIMENTOS...');
    
    for (const data of newAttendances) {
      try {
        const created = await Attendance.create(data);
        console.log(`✅ Criado: ${created.attendanceNumber} - ${created.patientName}`);
      } catch (error) {
        console.log(`❌ Erro ao criar ${data.attendanceNumber}:`, error.message);
      }
    }
    
    // 3. Verificar resultado final
    console.log('\n📊 VERIFICAÇÃO FINAL...');
    
    const pendingCount = await Attendance.count({
      where: { status: 'Recebida' }
    });
    
    const allPending = await Attendance.findAll({
      where: { status: 'Recebida' },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`\n✅ Total de atendimentos recebidos: ${pendingCount}`);
    
    if (allPending.length > 0) {
      console.log('\n📞 CHAMADAS PRONTAS PARA DESPACHO:');
      allPending.forEach((att, i) => {
        console.log(`${i+1}. 🆔 ${att.attendanceNumber}`);
        console.log(`   👤 ${att.patientName}`);
        console.log(`   📞 ${att.callerName} - ${att.callerPhone}`);
        console.log(`   📍 ${att.address}`);
        console.log(`   🏥 ${att.medicalCondition}`);
        console.log(`   🚨 Prioridade: ${att.priority}`);
        console.log(`   📋 Categoria: ${att.category}`);
        console.log('   ────────────────────────────────');
      });
    }
    
    console.log('\n🎉 SISTEMA PRONTO! Atendimentos corrigidos e novos criados.');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
  
  process.exit(0);
}

fixAttendances();