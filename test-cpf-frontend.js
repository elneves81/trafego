// Teste da regex de CPF do frontend
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

console.log('=== TESTE DA REGEX CPF FRONTEND ===');

const testCpfs = [
  '008.587.859-60',
  '123.456.789-01',
  '000.000.000-00',
  '12345678901',
  '008.587.85960',
  '08.587.859-60'
];

testCpfs.forEach(cpf => {
  const isValid = cpfRegex.test(cpf);
  console.log(`${isValid ? '✅' : '❌'} "${cpf}" - ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
});

// Teste da função formatCPF do frontend
const formatCPF = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  } else if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  } else {
    return digits.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
  }
};

console.log('\n=== TESTE DA FUNÇÃO formatCPF ===');
console.log('00858785960 -> ' + formatCPF('00858785960'));
console.log('008587859-60 -> ' + formatCPF('008587859-60'));
console.log('008.587.859-60 -> ' + formatCPF('008.587.859-60'));