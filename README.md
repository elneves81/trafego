# Sistema de Transporte de Ambulâncias - Secretaria de Saúde

## � Inicialização Rápida

### 🎯 Para usuários Windows (Mais Fácil)
1. **Primeira vez**: Duplo clique em `setup.bat` (configuração inicial)
2. **Uso diário**: Duplo clique em `start.bat` (inicia tudo automaticamente)

### 💻 Via linha de comando
```bash
# Primeira vez - Setup completo
npm run setup

# Uso diário - Iniciar sistema completo
npm start

# Desenvolvimento com auto-reload
npm run dev
```

### 🔑 Credenciais de Acesso
| Perfil | Email | Senha |
|--------|-------|-------|
| **Admin** | `admin@transporte.gov.br` | `admin123` |
| **Operador** | `operador@transporte.gov.br` | `operador123` |

### 🌐 URLs
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000

---

## �🚑 Visão Geral
Sistema completo de gestão de transporte de ambulâncias com comunicação em tempo real entre central/telefonistas e motoristas. Desenvolvido especificamente para a Secretaria de Saúde com foco em robustez e confiabilidade.

Sistema modular e profissional que permite:
- Gestão de corridas em tempo real
- Tracking GPS dos veículos
- Comunicação central-motorista
- Dashboard para telefonistas
- App mobile para motoristas
- Sistema expansível para outros veículos

## 🏗️ Arquitetura

```
trafego/
├── backend/          # API Node.js + Express
├── frontend-web/     # Interface React (Central)
├── mobile-app/       # App React Native (Motoristas)
├── database/         # Scripts MariaDB
└── docs/            # Documentação
```

## 🚀 Tecnologias

- **Backend**: Node.js, Express.js, Socket.io, JWT
- **Frontend**: React.js, Material-UI, WebSocket
- **Mobile**: React Native, GPS Navigation
- **Database**: MariaDB (XAMPP)
- **Real-time**: WebSocket/Socket.io
- **Maps**: Integração com APIs de mapas

## ⚡ Início Rápido

### Pré-requisitos
- Node.js 18+
- XAMPP (MariaDB)
- React Native CLI (para mobile)

### Instalação
```bash
# Instalar todas as dependências
npm run install:all

# Configurar banco de dados
npm run db:migrate
npm run db:seed

# Executar em desenvolvimento
npm run dev
```

### Mobile Development
```bash
# Android
npm run mobile:android

# iOS
npm run mobile:ios
```

## 📱 Módulos

### Backend API
- APIs REST completas
- Autenticação JWT
- WebSocket real-time
- Integração GPS

### Frontend Web (Central)
- Dashboard em tempo real
- Gestão de corridas
- Controle de frota
- Relatórios

### Mobile App (Motoristas)
- Recebimento de corridas
- GPS navigation
- Status updates
- Chat com central

## 🔧 Configuração

Cada módulo possui sua própria configuração:
- `backend/.env` - Configurações do servidor
- `frontend-web/.env` - Configurações do frontend
- `mobile-app/.env` - Configurações do mobile

## 📊 Banco de Dados

MariaDB com estrutura otimizada:
- Usuários e perfis
- Veículos e frota
- Corridas e status
- Tracking GPS
- Notificações

## 🔐 Segurança

- Autenticação JWT
- Controle de acesso por perfis
- Validação de dados
- Logs de auditoria

## 📈 Expansibilidade

Sistema preparado para:
- Outros tipos de veículos
- Múltiplas secretarias
- Integração com sistemas externos
- Escalabilidade horizontal

## 🤝 Contribuição

Para contribuir com o projeto:
1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.