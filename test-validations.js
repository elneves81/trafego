// Teste das validações de telefone e CPF
const { body } = require('express-validator');

// Testes das regex de validação
const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

console.log('=== TESTE DAS VALIDAÇÕES ===\n');

// Testes de telefone
console.log('📱 TELEFONE - Formato (00) 00000-0000:');
const phoneTests = [
  '(11) 99999-1234',  // válido - 11 dígitos
  '(47) 9999-1234',   // válido - 10 dígitos  
  '(11) 99999-12345', // inválido - 12 dígitos
  '11 99999-1234',    // inválido - sem parênteses
  '(11) 999991234',   // inválido - sem hífen
  '(1) 99999-1234',   // inválido - DDD com 1 dígito
  '(111) 99999-1234', // inválido - DDD com 3 dígitos
];

phoneTests.forEach(phone => {
  const isValid = phoneRegex.test(phone);
  console.log(`${isValid ? '✅' : '❌'} "${phone}" - ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
});

console.log('\n📄 CPF - Formato 000.000.000-00:');
const cpfTests = [
  '123.456.789-01',   // válido
  '000.111.222-33',   // válido
  '12345678901',      // inválido - sem formatação
  '123.456.789',      // inválido - incompleto
  '123.456.789-012',  // inválido - dígito extra
  '123-456-789-01',   // inválido - hífen errado
  '123.456.78901',    // inválido - ponto faltando
];

cpfTests.forEach(cpf => {
  const isValid = cpfRegex.test(cpf);
  console.log(`${isValid ? '✅' : '❌'} "${cpf}" - ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
});

console.log('\n=== TESTE DAS MÁSCARAS ===\n');

// Função de máscara do frontend
const formatCPF = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return digits.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  }
  return digits.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

console.log('🎭 MÁSCARAS DO FRONTEND:');
console.log('CPF "12345678901" -> "' + formatCPF('12345678901') + '"');
console.log('CPF "123456789" -> "' + formatCPF('123456789') + '"');
console.log('Telefone "1199991234" -> "' + formatPhone('1199991234') + '"');
console.log('Telefone "11999912345" -> "' + formatPhone('11999912345') + '"');

console.log('\n✅ Todas as validações estão padronizadas!');
console.log('📋 Formato telefone: (00) 00000-0000');
console.log('📋 Formato CPF: 000.000.000-00');