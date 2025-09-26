const cepService = require('../services/cepService');
const logger = require('../utils/logger');

class CepController {
  /**
   * Buscar endereço por CEP
   * GET /api/cep/:cep
   */
  static async buscarCep(req, res) {
    try {
      const { cep } = req.params;
      
      logger.info(`Requisição de busca de CEP: ${cep}`);
      
      if (!cep) {
        return res.status(400).json({
          sucesso: false,
          erro: 'CEP é obrigatório'
        });
      }

      // Validar formato do CEP
      if (!cepService.isValidCep(cep)) {
        return res.status(400).json({
          sucesso: false,
          erro: 'CEP deve conter exatamente 8 dígitos numéricos'
        });
      }

      // Buscar endereço (com cache)
      const endereco = await cepService.buscarComCache(cep);

      res.json(endereco);

    } catch (error) {
      logger.error('Erro ao buscar CEP:', error);
      
      res.status(500).json({
        sucesso: false,
        erro: error.message || 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar múltiplos CEPs
   * POST /api/cep/buscar-multiplos
   */
  static async buscarMultiplosCeps(req, res) {
    try {
      const { ceps } = req.body;
      
      if (!Array.isArray(ceps) || ceps.length === 0) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Lista de CEPs é obrigatória'
        });
      }

      // Limitar quantidade de CEPs por requisição
      if (ceps.length > 10) {
        return res.status(400).json({
          sucesso: false,
          erro: 'Máximo de 10 CEPs por requisição'
        });
      }

      logger.info(`Requisição de busca de múltiplos CEPs: ${ceps.length} CEPs`);

      const resultados = await cepService.buscarMultiplosCeps(ceps);

      res.json({
        sucesso: true,
        total: resultados.length,
        resultados
      });

    } catch (error) {
      logger.error('Erro ao buscar múltiplos CEPs:', error);
      
      res.status(500).json({
        sucesso: false,
        erro: error.message || 'Erro interno do servidor'
      });
    }
  }

  /**
   * Validar CEP
   * GET /api/cep/validar/:cep
   */
  static async validarCep(req, res) {
    try {
      const { cep } = req.params;
      
      const isValid = cepService.isValidCep(cep);
      const normalizedCep = isValid ? cepService.normalizeCep(cep) : null;
      const formattedCep = isValid ? cepService.formatCep(cep) : null;

      res.json({
        cep: cep,
        valido: isValid,
        normalizado: normalizedCep,
        formatado: formattedCep
      });

    } catch (error) {
      logger.error('Erro ao validar CEP:', error);
      
      res.status(500).json({
        sucesso: false,
        erro: error.message || 'Erro interno do servidor'
      });
    }
  }

  /**
   * Estatísticas do cache de CEPs
   * GET /api/cep/stats
   */
  static async estatisticas(req, res) {
    try {
      const cacheSize = cepService.cache ? cepService.cache.size : 0;
      
      res.json({
        sucesso: true,
        cache: {
          tamanho: cacheSize,
          timeout: cepService.cacheTimeout / 1000 / 60, // em minutos
        },
        apis: cepService.cepApis.map(api => ({
          nome: api.name,
          ativa: true
        }))
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas:', error);
      
      res.status(500).json({
        sucesso: false,
        erro: error.message || 'Erro interno do servidor'
      });
    }
  }

  /**
   * Limpar cache de CEPs
   * DELETE /api/cep/cache
   */
  static async limparCache(req, res) {
    try {
      if (cepService.cache) {
        const tamanhoAnterior = cepService.cache.size;
        cepService.cache.clear();
        
        logger.info(`Cache de CEPs limpo. ${tamanhoAnterior} entradas removidas.`);
        
        res.json({
          sucesso: true,
          mensagem: `Cache limpo com sucesso. ${tamanhoAnterior} entradas removidas.`
        });
      } else {
        res.json({
          sucesso: true,
          mensagem: 'Cache não estava ativo.'
        });
      }

    } catch (error) {
      logger.error('Erro ao limpar cache:', error);
      
      res.status(500).json({
        sucesso: false,
        erro: error.message || 'Erro interno do servidor'
      });
    }
  }
}

module.exports = CepController;