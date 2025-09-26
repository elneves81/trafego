const mysql = require('mysql2/promise');

async function addAddressFields() {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'trafego'
        });

        console.log('Conectado ao banco de dados MySQL');

        // Verificar se as colunas já existem
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'trafego' 
            AND TABLE_NAME = 'attendances'
            AND COLUMN_NAME IN ('address', 'city', 'state', 'cep', 'patientPhone', 'callerCpf', 'patientCpf')
        `);
        
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        console.log('Colunas já existentes:', existingColumns);

        // Adicionar coluna address se não existir
        if (!existingColumns.includes('address')) {
            await connection.execute(`
                ALTER TABLE attendances 
                ADD COLUMN address TEXT COMMENT 'Endereço completo'
            `);
            console.log('✅ Coluna address adicionada');
        } else {
            console.log('ℹ️  Coluna address já existe');
        }

        // Adicionar coluna city se não existir
        if (!existingColumns.includes('city')) {
            await connection.execute(`
                ALTER TABLE attendances 
                ADD COLUMN city VARCHAR(100) COMMENT 'Cidade'
            `);
            console.log('✅ Coluna city adicionada');
        } else {
            console.log('ℹ️  Coluna city já existe');
        }

        // Adicionar coluna state se não existir
        if (!existingColumns.includes('state')) {
            await connection.execute(`
                ALTER TABLE attendances 
                ADD COLUMN state VARCHAR(10) COMMENT 'Estado (UF)'
            `);
            console.log('✅ Coluna state adicionada');
        } else {
            console.log('ℹ️  Coluna state já existe');
        }

        // Adicionar coluna cep se não existir
        if (!existingColumns.includes('cep')) {
            await connection.execute(`
                ALTER TABLE attendances 
                ADD COLUMN cep VARCHAR(20) COMMENT 'CEP'
            `);
            console.log('✅ Coluna cep adicionada');
        } else {
            console.log('ℹ️  Coluna cep já existe');
        }

        // Adicionar coluna patientPhone se não existir
        if (!existingColumns.includes('patientPhone')) {
            await connection.execute(`
                ALTER TABLE attendances 
                ADD COLUMN patientPhone VARCHAR(20) COMMENT 'Telefone do paciente'
            `);
            console.log('✅ Coluna patientPhone adicionada');
        } else {
            console.log('ℹ️  Coluna patientPhone já existe');
        }

        // Adicionar coluna callerCpf se não existir
        if (!existingColumns.includes('callerCpf')) {
            await connection.execute(`
                ALTER TABLE attendances 
                ADD COLUMN callerCpf VARCHAR(20) COMMENT 'CPF do solicitante'
            `);
            console.log('✅ Coluna callerCpf adicionada');
        } else {
            console.log('ℹ️  Coluna callerCpf já existe');
        }

        // Adicionar coluna patientCpf se não existir
        if (!existingColumns.includes('patientCpf')) {
            await connection.execute(`
                ALTER TABLE attendances 
                ADD COLUMN patientCpf VARCHAR(20) COMMENT 'CPF do paciente'
            `);
            console.log('✅ Coluna patientCpf adicionada');
        } else {
            console.log('ℹ️  Coluna patientCpf já existe');
        }

        await connection.end();
        console.log('✅ Processo concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

addAddressFields();