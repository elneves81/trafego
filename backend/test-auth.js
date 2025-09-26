// Teste simples para verificar autenticação
const axios = require('axios');

const testAuth = async () => {
  try {
    // Simular um token (pegar do localStorage do frontend)
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJnZXN0b3JAdHJhbnNwb3J0ZS5jb20iLCJpYXQiOjE3NTg3NzM0NTksImV4cCI6MTc1ODg1OTg1OX0.xIGKJdWb7mKGCPqKCdwPLh9hqN-Gy5aL3xFZ7r_UobU'; // Token exemplo
    
    const response = await axios.post('http://localhost:8082/api/appointments', {
      requesterName: 'Teste',
      requesterPhone: '11999999999',
      requesterEmail: 'teste@teste.com',
      requesterRelationship: 'Próprio paciente',
      patientName: 'João Teste',
      patientCpf: '12345678901',
      patientRg: '123456789',
      patientBirthDate: '1990-01-01',
      patientGender: 'Masculino',
      patientPhone: '11999999999',
      patientAddress: 'Rua Teste, 123',
      patientCity: 'São Paulo',
      patientState: 'SP',
      appointmentDate: '2025-09-26',
      appointmentTime: '09:00',
      appointmentType: 'Consulta médica',
      medicalSpecialty: 'Cardiologia',
      preferredHospital: 'Hospital Central',
      transportType: 'Ambulância comum',
      notes: 'Teste de agendamento'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Sucesso:', response.data);
  } catch (error) {
    console.log('❌ Erro:', error.response?.status, error.response?.data);
  }
};

testAuth();