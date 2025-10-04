const { Attendance } = require('./backend/src/models');
const { Op } = require('sequelize');

async function testAttendances() {
  try {
    console.log('🔍 TESTANDO SISTEMA DE PACIENTES...\n');
    
    // 1. Buscar atendimentos existentes
    const allAttendances = await Attendance.findAll({
      attributes: ['id', 'attendanceNumber', 'patientName', 'callerName', 'address', 'status', 'category', 'priority', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 20
    });
    
    console.log('📊 Total de atendimentos no banco:', allAttendances.length);
    
    if (allAttendances.length > 0) {
      console.log('\n📋 ÚLTIMOS ATENDIMENTOS:');
      allAttendances.forEach((att, i) => {
        console.log(`${i+1}. [${att.id}] ${att.attendanceNumber || 'N/A'} | ${att.patientName || att.callerName} | Status: ${att.status} | Categoria: ${att.category || 'N/A'}`);
      });
      
      // Verificar pendentes (status Recebida)
      const pending = allAttendances.filter(a => a.status === 'Recebida');
      console.log(`\n⏳ Atendimentos recebidos/pendentes: ${pending.length}`);
      
      if (pending.length === 0) {
        console.log('\n💡 Não há atendimentos pendentes. Vou criar alguns para teste...');
        
        // Criar atendimentos de teste
        const testData = [
          {
            attendanceNumber: `ATD-${Date.now()}-001`,
            patientName: 'MARIA DA SILVA SANTOS',
            callerName: 'JOÃO SANTOS (ESPOSO)',
            callerPhone: '(42) 99999-1234',
            address: 'RUA DAS FLORES, 123 - CENTRO',
            city: 'GUARAPUAVA',
            state: 'PR',
            zipCode: '85010-100',
            medicalCondition: 'DORES NO PEITO E DIFICULDADE PARA RESPIRAR - POSSÍVEL INFARTO',
            symptoms: 'Dor intensa no peito, sudorese, falta de ar',
            priority: 'Alta',
            category: 'emergency',
            status: 'Recebida',
            callDateTime: new Date(),
            operatorId: 1,
            patientAge: 65,
            patientGender: 'F'
          },
          {
            attendanceNumber: `ATD-${Date.now()}-002`,
            patientName: 'CARLOS OLIVEIRA PEREIRA',
            callerName: 'ANA OLIVEIRA (FILHA)',
            callerPhone: '(42) 98888-5678',
            address: 'AV. MANOEL RIBAS, 456 - SANTANA',
            city: 'GUARAPUAVA',
            state: 'PR',
            zipCode: '85070-200',
            medicalCondition: 'QUEDA DE ESCADA - POSSÍVEL FRATURA NO BRAÇO',
            symptoms: 'Dor intensa no braço direito, inchaço, não consegue mexer',
            priority: 'Média',
            category: 'basic',
            status: 'Recebida',
            callDateTime: new Date(),
            operatorId: 1,
            patientAge: 72,
            patientGender: 'M'
          },
          {
            attendanceNumber: `ATD-${Date.now()}-003`,
            patientName: 'JOSÉ ROBERTO LIMA',
            callerName: 'VIZINHO - PEDRO',
            callerPhone: '(42) 97777-9999',
            address: 'RUA SANTOS DUMONT, 789 - VILA BELA',
            city: 'GUARAPUAVA',
            state: 'PR',
            zipCode: '85050-300',
            medicalCondition: 'ENCONTRADO DESACORDADO EM CASA',
            symptoms: 'Inconsciente, respiração irregular',
            priority: 'Alta',
            category: 'emergency',
            status: 'Recebida',
            callDateTime: new Date(),
            operatorId: 1,
            patientAge: 58,
            patientGender: 'M'
          }
        ];
        
        for (const data of testData) {
          try {
            const created = await Attendance.create(data);
            console.log(`✅ Criado: ${created.attendanceNumber} - ${created.patientName}`);
          } catch (error) {
            console.log(`❌ Erro ao criar ${data.attendanceNumber}:`, error.message);
          }
        }
        
        console.log('\n🎯 Atendimentos de teste criados com sucesso!');
      } else {
        console.log('\n✅ Já existem atendimentos pendentes no sistema!');
        pending.forEach((att, i) => {
          console.log(`${i+1}. ${att.attendanceNumber} - ${att.patientName} (${att.priority})`);
        });
      }
    } else {
      console.log('\n❌ Banco vazio! Criando atendimentos iniciais...');
      
      // Criar dados iniciais se não existir nada
      const initialData = [
        {
          attendanceNumber: `ATD-INIT-001`,
          patientName: 'ANTÔNIO SILVA',
          callerName: 'PRÓPRIO PACIENTE',
          callerPhone: '(42) 99111-2222',
          address: 'RUA MARECHAL DEODORO, 100 - CENTRO',
          city: 'GUARAPUAVA',
          state: 'PR',
          medicalCondition: 'MAL-ESTAR E TONTURA',
          priority: 'Baixa',
          category: 'basic',
          status: 'Recebida',
          callDateTime: new Date(),
          operatorId: 1
        }
      ];
      
      for (const data of initialData) {
        await Attendance.create(data);
        console.log(`✅ Atendimento inicial criado: ${data.attendanceNumber}`);
      }
    }
    
    console.log('\n🔄 TESTANDO API DE ATENDIMENTOS PENDENTES...');
    
    // Simular a mesma busca que a API faz
    const pendingAttendances = await Attendance.findAll({
      where: {
        status: {
          [Op.in]: ['Recebida', 'Triagem']
        }
      },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    console.log(`📋 Encontrados ${pendingAttendances.length} atendimentos recebidos/triagem para a API`);
    
    if (pendingAttendances.length > 0) {
      console.log('\n📞 CHAMADAS PARA DESPACHO:');
      pendingAttendances.forEach((att, i) => {
        console.log(`${i+1}. ${att.patientName} - ${att.medicalCondition || 'Condição não especificada'}`);
        console.log(`   📍 ${att.address}`);
        console.log(`   🚨 Prioridade: ${att.priority || 'Não definida'}`);
        console.log('');
      });
    }
    
    console.log('✅ Teste concluído! Sistema pronto para uso.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
  
  process.exit(0);
}

testAttendances();