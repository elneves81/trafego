import { useState, useCallback } from 'react';
import { api } from '../services/api';

export const useCep = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Buscar CEP único
  const buscarCep = useCallback(async (cep) => {
    setLoading(true);
    setError('');

    try {
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        throw new Error('CEP deve conter 8 dígitos');
      }

      const response = await api.get(`/cep/${cleanCep}`);
      
      if (response.data.sucesso) {
        return response.data;
      } else {
        throw new Error(response.data.erro || 'CEP não encontrado');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.erro || err.message || 'Erro ao buscar CEP';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar múltiplos CEPs
  const buscarMultiplosCeps = useCallback(async (ceps) => {
    setLoading(true);
    setError('');

    try {
      if (!Array.isArray(ceps) || ceps.length === 0) {
        throw new Error('Lista de CEPs é obrigatória');
      }

      if (ceps.length > 10) {
        throw new Error('Máximo de 10 CEPs por requisição');
      }

      const response = await api.post('/cep/buscar-multiplos', { ceps });
      
      if (response.data.sucesso) {
        return response.data.resultados;
      } else {
        throw new Error(response.data.erro || 'Erro ao buscar CEPs');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.erro || err.message || 'Erro ao buscar CEPs';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Validar CEP
  const validarCep = useCallback(async (cep) => {
    try {
      const response = await api.get(`/cep/validar/${cep}`);
      return response.data;
    } catch (err) {
      console.error('Erro ao validar CEP:', err);
      return {
        cep,
        valido: false,
        normalizado: null,
        formatado: null
      };
    }
  }, []);

  // Formatar CEP
  const formatarCep = useCallback((cep) => {
    if (!cep) return '';
    
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length <= 5) {
      return cleanCep;
    } else if (cleanCep.length <= 8) {
      return cleanCep.replace(/(\d{5})(\d{1,3})/, '$1-$2');
    }
    return cleanCep.substring(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
  }, []);

  // Normalizar CEP (apenas números)
  const normalizarCep = useCallback((cep) => {
    if (!cep) return '';
    return cep.replace(/\D/g, '');
  }, []);

  // Validar formato de CEP
  const isValidCep = useCallback((cep) => {
    const cleanCep = normalizarCep(cep);
    return cleanCep.length === 8 && /^\d{8}$/.test(cleanCep);
  }, [normalizarCep]);

  // Preencher formulário com dados do endereço
  const preencherEndereco = useCallback((addressData, setFieldValue) => {
    if (!addressData || !setFieldValue) return;

    // Mapear campos comuns
    const fieldMappings = {
      'cep': addressData.cep,
      'endereco': addressData.logradouro || '',
      'bairro': addressData.bairro || '',
      'cidade': addressData.cidade || '',
      'estado': addressData.estado || '',
      'uf': addressData.estado || '',
      // Variações de nomes de campos
      'address': addressData.logradouro || '',
      'neighborhood': addressData.bairro || '',
      'city': addressData.cidade || '',
      'state': addressData.estado || '',
      'zipCode': addressData.cep || '',
      'zipcode': addressData.cep || ''
    };

    // Aplicar valores aos campos
    Object.entries(fieldMappings).forEach(([field, value]) => {
      try {
        setFieldValue(field, value);
      } catch (err) {
        // Campo não existe no formulário, ignorar
      }
    });
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError('');
  }, []);

  return {
    loading,
    error,
    buscarCep,
    buscarMultiplosCeps,
    validarCep,
    formatarCep,
    normalizarCep,
    isValidCep,
    preencherEndereco,
    clearError
  };
};

export default useCep;