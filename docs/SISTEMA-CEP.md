# Sistema Robusto de Busca de CEP

## 📋 Visão Geral

Sistema completo de busca de endereços por CEP integrado ao sistema de transporte de ambulâncias, com múltiplas APIs de fallback, cache inteligente e componentes React prontos para uso.

## 🚀 Funcionalidades

### Backend (API)
- ✅ **Múltiplas APIs**: ViaCEP, BrasilAPI, PostMon com fallback automático
- ✅ **Cache inteligente**: Cache em memória com TTL de 1 hora
- ✅ **Validação robusta**: Normalização e validação de CEP
- ✅ **Busca múltipla**: Até 10 CEPs simultâneos
- ✅ **Rate limiting**: Controle de requisições
- ✅ **Logs detalhados**: Monitoramento completo
- ✅ **Estatísticas**: Métricas do cache e APIs

### Frontend (React)
- ✅ **Componente CepSearch**: Campo de CEP com busca automática
- ✅ **Hook useCep**: Lógica reutilizável para busca de CEP
- ✅ **Formatação automática**: CEP formatado automaticamente
- ✅ **Preenchimento automático**: Preenche formulários automaticamente
- ✅ **Interface intuitiva**: Material-UI com feedback visual

## 📡 Endpoints da API

### Buscar CEP único
```http
GET /api/cep/{cep}
```

**Exemplo:**
```bash
GET /api/cep/85010260
```

**Resposta:**
```json
{
  "cep": "85010-260",
  "logradouro": "Rua Vicente Machado",
  "bairro": "Centro",
  "cidade": "Guarapuava",
  "estado": "PR",
  "ddd": "42",
  "fonte": "ViaCEP",
  "sucesso": true
}
```

### Buscar múltiplos CEPs
```http
POST /api/cep/buscar-multiplos
Content-Type: application/json

{
  "ceps": ["85010260", "01310100", "20040020"]
}
```

### Validar CEP
```http
GET /api/cep/validar/{cep}
```

### Estatísticas (Requer autenticação)
```http
GET /api/cep/admin/stats
Authorization: Bearer {token}
```

### Limpar cache (Requer autenticação Admin)
```http
DELETE /api/cep/admin/cache
Authorization: Bearer {token}
```

## 🛠️ Como Usar no Frontend

### 1. Componente CepSearch

```jsx
import CepSearch from '../components/Common/CepSearch';

function MeuFormulario() {
  const handleAddressFound = (addressData) => {
    console.log('Endereço encontrado:', addressData);
    // Preencher outros campos do formulário
    setFieldValue('endereco', addressData.logradouro);
    setFieldValue('bairro', addressData.bairro);
    setFieldValue('cidade', addressData.cidade);
    setFieldValue('estado', addressData.estado);
  };

  return (
    <CepSearch
      onAddressFound={handleAddressFound}
      label="CEP"
      placeholder="Digite o CEP"
      showFullAddress={true}
    />
  );
}
```

### 2. Hook useCep

```jsx
import { useCep } from '../hooks/useCep';

function MeuComponente() {
  const { 
    buscarCep, 
    loading, 
    error, 
    formatarCep, 
    isValidCep,
    preencherEndereco 
  } = useCep();

  const handleBuscarCep = async (cep) => {
    try {
      const endereco = await buscarCep(cep);
      preencherEndereco(endereco, setFieldValue);
    } catch (err) {
      console.error('Erro:', err.message);
    }
  };

  return (
    <TextField
      label="CEP"
      value={formatarCep(cep)}
      onChange={(e) => setCep(e.target.value)}
      error={cep && !isValidCep(cep)}
      helperText={error}
      onBlur={() => isValidCep(cep) && handleBuscarCep(cep)}
    />
  );
}
```

## 🔧 Integração com Formulários Existentes

### Atendimentos de Emergência
O sistema já está pronto para ser integrado nos formulários de atendimento:

```jsx
// Em EmergencyAttendance.js
import CepSearch from '../Common/CepSearch';

// No formulário de origem
<CepSearch
  label="CEP de Origem"
  onAddressFound={(address) => {
    setFormData(prev => ({
      ...prev,
      originAddress: address.logradouro,
      originNeighborhood: address.bairro,
      originCity: address.cidade,
      originState: address.estado
    }));
  }}
/>
```

### Agendamentos
```jsx
// Em AppointmentScheduling.js
import CepSearch from '../Common/CepSearch';

// CEP do paciente
<CepSearch
  label="CEP do Paciente"
  onAddressFound={(address) => {
    setFieldValue('patientAddress', address.logradouro);
    setFieldValue('patientCity', address.cidade);
    setFieldValue('patientState', address.estado);
  }}
/>

// CEP do destino
<CepSearch
  label="CEP do Destino"
  onAddressFound={(address) => {
    setFieldValue('destinationAddress', address.logradouro);
    setFieldValue('destinationCity', address.cidade);
    setFieldValue('destinationState', address.estado);
  }}
/>
```

## 🎯 APIs Utilizadas

### 1. ViaCEP (Prioridade 1)
- **URL**: https://viacep.com.br/
- **Gratuita**: Sim
- **Rate Limit**: Não especificado
- **Confiabilidade**: ⭐⭐⭐⭐⭐

### 2. BrasilAPI (Prioridade 2)
- **URL**: https://brasilapi.com.br/
- **Gratuita**: Sim
- **Rate Limit**: Não especificado
- **Confiabilidade**: ⭐⭐⭐⭐⭐

### 3. PostMon (Prioridade 3)
- **URL**: https://postmon.com.br/
- **Gratuita**: Sim
- **Rate Limit**: Não especificado
- **Confiabilidade**: ⭐⭐⭐⭐

## 📊 Sistema de Cache

- **Tipo**: Cache em memória (Map)
- **TTL**: 1 hora (3600 segundos)
- **Limpeza**: Automática a cada 15 minutos
- **Chave**: CEP normalizado (apenas números)
- **Valor**: Dados completos do endereço + timestamp

## 🔒 Segurança e Rate Limiting

- **Rate Limit**: 100 requisições por IP por 15 minutos
- **Timeout**: 5 segundos por API
- **Validação**: CEP deve ter exatamente 8 dígitos
- **Sanitização**: Remove caracteres não numéricos
- **CORS**: Configurado para o sistema

## 📈 Monitoramento

### Logs Disponíveis
- Requisições de busca de CEP
- Tentativas de API (sucesso/falha)
- Cache hits/misses
- Erros de validação
- Estatísticas de uso

### Métricas
- Tamanho do cache
- APIs ativas/inativas
- Tempo de resposta
- Taxa de sucesso por API

## 🚧 Próximas Melhorias

1. **Coordenadas GPS**: Integrar com APIs de geolocalização
2. **Cache persistente**: Redis para cache distribuído
3. **Histórico**: Salvar CEPs mais buscados
4. **Analytics**: Dashboard de estatísticas
5. **Webhook**: Notificar sobre falhas de API
6. **Bulk import**: Importação em massa de CEPs

## 🧪 Testando o Sistema

### Teste Manual
1. Acesse o sistema: `http://10.0.134.79:3006`
2. Vá para "Atendimento de Emergência" ou "Agendamentos"
3. Digite um CEP válido (ex: 85010-260)
4. Veja o preenchimento automático

### Teste via API
```bash
# Testar via navegador
http://10.0.134.79:8082/api/cep/85010260

# Ou via JavaScript no console do navegador
fetch('/api/cep/85010260')
  .then(r => r.json())
  .then(console.log);
```

## 📝 Formato de CEPs Aceitos

- `85010260` (apenas números)
- `85010-260` (com hífen)
- `85010 260` (com espaço)

O sistema normaliza automaticamente para o formato correto.

---

## 🎉 Sistema Completo e Funcional!

O sistema de busca de CEP está totalmente implementado e pronto para uso em produção. Ele fornece uma experiência robusta e confiável para busca de endereços, com fallback automático entre múltiplas APIs e cache inteligente para melhor performance.