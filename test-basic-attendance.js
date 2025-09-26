const axios = require('axios');

async function testBasicAttendance() {
    try {
        // Login do admin
        console.log('1. Fazendo login...');
        const loginResponse = await axios.post('http://10.0.134.79:8082/api/auth/login', {
            email: 'admin@sistema.com',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ Login realizado com sucesso');
        
        // Criar atendimento básico
        console.log('\n2. Criando atendimento básico...');
        const attendanceData = {
            callerName: 'João Silva',
            callerPhone: '11987654321',
            callerCpf: '123.456.789-10',
            patientName: 'Maria Silva',
            patientCpf: '987.654.321-00',
            patientAge: 35,
            patientGender: 'feminino',
            address: 'Rua das Flores, 123',
            city: 'São Paulo',
            state: 'SP',
            cep: '01234-567',
            medicalCondition: 'Dor de cabeça intensa',
            observations: 'Paciente relatou início há 2 horas',
            priority: 'baixa',
            attendanceType: 'consultation',
            category: 'basic'
        };
        
        const createResponse = await axios.post('http://10.0.134.79:8082/api/attendances', attendanceData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Atendimento criado:', createResponse.data);
        const attendanceId = createResponse.data.id;
        
        // Buscar atendimentos básicos
        console.log('\n3. Buscando atendimentos básicos...');
        const listResponse = await axios.get('http://10.0.134.79:8082/api/attendances', {
            params: {
                category: 'basic'
            },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Atendimentos básicos encontrados:', listResponse.data.length);
        
        // Buscar atendimento específico
        console.log('\n4. Buscando detalhes do atendimento criado...');
        const detailResponse = await axios.get(`http://10.0.134.79:8082/api/attendances/${attendanceId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('✅ Detalhes do atendimento:');
        console.log('ID:', detailResponse.data.id);
        console.log('Nome do Solicitante:', detailResponse.data.callerName);
        console.log('Telefone:', detailResponse.data.callerPhone);
        console.log('Paciente:', detailResponse.data.patientName);
        console.log('Endereço:', detailResponse.data.address);
        console.log('Condição Médica:', detailResponse.data.medicalCondition);
        console.log('Observações:', detailResponse.data.observations);
        console.log('Prioridade:', detailResponse.data.priority);
        console.log('Tipo de Atendimento:', detailResponse.data.attendanceType);
        console.log('Categoria:', detailResponse.data.category);
        console.log('Data de Criação:', detailResponse.data.createdAt);
        
        console.log('\n✅ Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    }
}

testBasicAttendance();