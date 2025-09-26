// Teste para cadastro de motorista
const axios = require('axios');

const API_BASE_URL = 'http://10.0.50.79:8082';

async function testDriverCreation() {
    try {
        // Primeiro fazer login para obter token
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
            email: 'admin@admin.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login realizado com sucesso');

        // Agora tentar criar um motorista
        const driverData = {
            name: 'João da Silva',
            email: 'joao.silva@test.com',
            phone: '(11) 99999-9999',
            cnh: '123456789',
            cnh_category: 'D',
            cnh_expiry: '2025-12-31',
            status: 'available'
        };

        const driverResponse = await axios.post(`${API_BASE_URL}/api/drivers`, driverData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Motorista criado com sucesso:', driverResponse.data);

    } catch (error) {
        console.error('❌ Erro:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
        }
    }
}

testDriverCreation();