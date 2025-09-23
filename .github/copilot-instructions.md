# Sistema de Transporte de Ambulâncias - Secretaria de Saúde

## Visão Geral do Projeto
Sistema completo de gestão de transporte de ambulâncias para a Secretaria de Saúde, com foco em comunicação em tempo real entre central/telefonistas e motoristas. O sistema é modular e expansível para outros tipos de veículos da frota.

## Tecnologias Utilizadas
- **Backend**: Node.js com Express.js
- **Frontend Web**: React.js (painel para telefonistas/central)
- **Mobile**: React Native (app para motoristas)
- **Banco de Dados**: MariaDB (XAMPP)
- **Comunicação**: WebSocket para tempo real
- **Autenticação**: JWT (JSON Web Tokens)
- **GPS/Mapas**: Integração com APIs de mapas
- **Notificações**: Push notifications para mobile

## Arquitetura do Sistema

### Módulos Principais
1. **Backend API** - Servidor central com APIs REST
2. **Frontend Web** - Interface para central/telefonistas
3. **Mobile App** - Aplicativo para motoristas
4. **Sistema GPS** - Tracking em tempo real
5. **Banco de Dados** - MariaDB com estrutura otimizada

### Funcionalidades Principais
- Criação e distribuição de corridas
- Tracking GPS em tempo real
- Comunicação bidirecional central-motorista
- Sistema de notificações
- Relatórios e dashboard
- Gestão de frota e usuários

## Desenvolvimento
Este é um sistema profissional e robusto com APIs que se comunicam sem erros, preparado para ambiente de produção na área da saúde.