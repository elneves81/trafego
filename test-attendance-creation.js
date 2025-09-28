const axios = require('axios');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJnZXN0b3JAdHJhbnNwb3J0ZS5jb20iLCJ1c2VyVHlwZSI6InN1cGVydmlzb3IiLCJzdGF0dXMiOiJhY3RpdmUiLCJpYXQiOjE3NTkwMjM4ODEsImV4cCI6MTc1OTExMDI4MX0.uyRvjbfJWQC8BllOmj7yL1s16UpUa29dGgNbVd_VQdI';

async function testAttendanceCreation() {
    try {
        const attendanceData = {
            callerName: "João Silva",
            callerPhone: "(11) 98765-4321",
            patientName: "Maria Silva",
            priority: "Média",
            category: "basic"
        };

        console.log('📋 Dados do atendimento:', attendanceData);

        const response = await axios.post('http://localhost:8082/api/attendances', attendanceData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Sucesso:', response.data);
    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

testAttendanceCreation();