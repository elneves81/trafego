#!/bin/bash

echo "🚀 Iniciando deploy do sistema de ambulâncias..."

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install --production

# Executar migrações do banco
echo "🗄️ Executando migrações do banco..."
npm run migrate 2>/dev/null || echo "Migrações não encontradas, continuando..."

# Voltar para raiz
cd ..

echo "✅ Deploy concluído!"
echo "🌐 Acesse seu sistema em: https://seu-app.railway.app"