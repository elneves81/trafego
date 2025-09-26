const axios = require('axios');
const logger = require('../utils/logger');

class CepService {
  constructor() {
    // Lista de APIs de CEP em ordem de prioridade
    this.cepApis = [
      {
        name: 'ViaCEP',
        url: (cep) => `https://viacep.com.br/ws/${cep}/json/`,
        formatter: (data) => ({
          cep: data.cep,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
          ibge: data.ibge,
          gia: data.gia,
          ddd: data.ddd,
          siafi: data.siafi
        }),
        isValid: (data) => !data.erro
      },
      {
        name: 'BrasilAPI',
        url: (cep) => `https://brasilapi.com.br/api/cep/v1/${cep}`,
        formatter: (data) => ({
          cep: data.cep,
          logradouro: data.street,
          bairro: data.neighborhood,
          cidade: data.city,
          estado: data.state,
          ibge: data.city_ibge,
          ddd: data.ddd,
          service: data.service
        }),
        isValid: (data) => !data.error && data.cep
      },
      {
        name: 'PostMon',
        url: (cep) => `https://api.postmon.com.br/v1/cep/${cep}`,
        formatter: (data) => ({
          cep: data.cep,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          ibge: data.cidade_info?.codigo_ibge,
          area_km2: data.cidade_info?.area_km2
        }),
        isValid: (data) => !data.error && data.cep
      }
    ];
  }

  /**
   * Normaliza o CEP removendo caracteres especiais
   */
  normalizeCep(cep) {
    if (!cep) return null;
    
    // Remove todos os caracteres não numéricos
    const cleanCep = cep.replace(/\D/g, '');
    
    // Verifica se tem 8 dígitos
    if (cleanCep.length !== 8) {
      throw new Error('CEP deve conter exatamente 8 dígitos');
    }
    
    return cleanCep;
  }

  /**
   * Formata CEP para exibição (xxxxx-xxx)
   */
  formatCep(cep) {
    const cleanCep = this.normalizeCep(cep);
    if (!cleanCep) return null;
    
    return `${cleanCep.substr(0, 5)}-${cleanCep.substr(5, 3)}`;
  }

  /**
   * Valida se o CEP é válido
   */
  isValidCep(cep) {
    try {
      const normalizedCep = this.normalizeCep(cep);
      return normalizedCep && /^\d{8}$/.test(normalizedCep);
    } catch {
      return false;
    }
  }

  /**
   * Busca endereço por CEP usando múltiplas APIs com fallback
   */
  async buscarEnderecoPorCep(cep) {
    const normalizedCep = this.normalizeCep(cep);
    
    if (!normalizedCep) {
      throw new Error('CEP inválido');
    }

    logger.info(`Buscando endereço para CEP: ${normalizedCep}`);

    let lastError = null;

    // Tenta cada API em ordem de prioridade
    for (const api of this.cepApis) {
      try {
        logger.info(`Tentando API: ${api.name}`);
        
        const response = await axios.get(api.url(normalizedCep), {
          timeout: 5000, // 5 segundos timeout
          headers: {
            'User-Agent': 'Sistema-Transporte-Ambulancias/1.0.0'
          }
        });

        if (response.data && api.isValid(response.data)) {
          const formattedData = api.formatter(response.data);
          
          logger.info(`Endereço encontrado via ${api.name}:`, formattedData);
          
          return {
            ...formattedData,
            cep: this.formatCep(formattedData.cep),
            fonte: api.name,
            sucesso: true
          };
        } else {
          logger.warn(`API ${api.name} retornou dados inválidos:`, response.data);
        }
      } catch (error) {
        lastError = error;
        logger.warn(`Erro na API ${api.name}:`, error.message);
        
        // Se for timeout ou erro de rede, tenta próxima API
        if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
          continue;
        }
        
        // Se for 404, provavelmente CEP não existe
        if (error.response?.status === 404) {
          logger.warn(`CEP ${normalizedCep} não encontrado na API ${api.name}`);
          continue;
        }
      }
    }

    // Se chegou aqui, nenhuma API funcionou
    logger.error(`Falha ao buscar CEP ${normalizedCep} em todas as APIs`);
    
    throw new Error(`CEP não encontrado ou serviços indisponíveis. Último erro: ${lastError?.message || 'Desconhecido'}`);
  }

  /**
   * Busca múltiplos CEPs em paralelo (limitado para evitar sobrecarga)
   */
  async buscarMultiplosCeps(ceps) {
    const maxConcurrent = 3; // Máximo 3 requisições simultâneas
    const results = [];
    
    for (let i = 0; i < ceps.length; i += maxConcurrent) {
      const batch = ceps.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (cep) => {
        try {
          return await this.buscarEnderecoPorCep(cep);
        } catch (error) {
          return {
            cep: this.formatCep(cep),
            erro: error.message,
            sucesso: false
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Cache simples em memória para CEPs já consultados
   */
  setupCache() {
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hora

    // Limpa cache periodicamente
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.cacheTimeout) {
          this.cache.delete(key);
        }
      }
    }, 15 * 60 * 1000); // A cada 15 minutos
  }

  /**
   * Busca com cache
   */
  async buscarComCache(cep) {
    const normalizedCep = this.normalizeCep(cep);
    
    // Verifica cache
    if (this.cache && this.cache.has(normalizedCep)) {
      const cached = this.cache.get(normalizedCep);
      const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
      
      if (!isExpired) {
        logger.info(`CEP ${normalizedCep} encontrado no cache`);
        return cached.data;
      } else {
        this.cache.delete(normalizedCep);
      }
    }

    // Busca na API
    const result = await this.buscarEnderecoPorCep(cep);
    
    // Salva no cache
    if (this.cache && result.sucesso) {
      this.cache.set(normalizedCep, {
        data: result,
        timestamp: Date.now()
      });
    }
    
    return result;
  }
}

// Instância singleton
const cepService = new CepService();
cepService.setupCache();

module.exports = cepService;