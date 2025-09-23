# Frontend Web - Sistema de Transporte de Ambulâncias

Interface web para operadores e administradores do sistema de transporte de ambulâncias da Secretaria de Saúde.

## 🚀 Tecnologias Utilizadas

- **React 18** - Framework principal
- **Material-UI (MUI)** - Biblioteca de componentes UI
- **React Router Dom** - Roteamento
- **Socket.io Client** - Comunicação em tempo real
- **Axios** - Cliente HTTP
- **React Query** - Gerenciamento de estado do servidor
- **Leaflet** - Mapas interativos (planejado)

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── Common/         # Componentes comuns (LoadingSpinner, etc.)
│   ├── Layout/         # Layout principal (Sidebar, TopBar, etc.)
│   └── Notifications/  # Sistema de notificações
├── contexts/           # Contextos React (Auth, Socket)
├── pages/             # Páginas da aplicação
│   ├── DashboardPage.js      # Dashboard principal
│   ├── LoginPage.js          # Página de login
│   ├── RidesPage.js          # Gestão de corridas
│   ├── VehiclesPage.js       # Gestão de veículos
│   ├── DriversPage.js        # Gestão de motoristas
│   ├── MapPage.js            # Mapa ao vivo
│   ├── ReportsPage.js        # Relatórios
│   ├── SettingsPage.js       # Configurações
│   └── ProfilePage.js        # Perfil do usuário
├── services/          # Serviços de API
├── theme.js          # Tema Material-UI customizado
├── App.js            # Componente principal
└── index.js          # Ponto de entrada
```

## 🎨 Funcionalidades

### Dashboard
- Visão geral do sistema em tempo real
- Estatísticas de veículos, corridas e motoristas
- Atividades recentes
- Status do sistema

### Gestão de Corridas
- Criação e edição de corridas
- Atribuição de veículos e motoristas
- Acompanhamento em tempo real
- Histórico completo

### Gestão de Veículos
- Cadastro e edição de veículos
- Monitoramento de status e localização
- Controle de combustível e manutenção
- Tracking GPS em tempo real

### Gestão de Motoristas
- Cadastro e edição de motoristas
- Status online/offline
- Histórico de corridas
- Avaliações e estatísticas

### Mapa ao Vivo
- Visualização de todos os veículos em tempo real
- Filtros por status
- Detalhes de corridas ativas
- Controles de mapa avançados

### Sistema de Relatórios
- Relatórios de corridas, veículos e motoristas
- Gráficos e estatísticas
- Exportação em múltiplos formatos
- Filtros customizáveis

### Configurações (Admin)
- Configurações gerais do sistema
- Gestão de usuários
- Configurações de segurança
- Configurações de notificações

## 🔐 Sistema de Autenticação

### Níveis de Acesso
- **Admin**: Acesso total ao sistema
- **Supervisor**: Gestão de operações e relatórios
- **Operador**: Gestão de corridas e visualização

### Funcionalidades de Segurança
- JWT (JSON Web Tokens)
- Sessões com timeout configurável
- Controle de permissões granular
- Auditoria de ações

## 🌐 Comunicação em Tempo Real

### WebSocket (Socket.io)
- Atualizações de localização em tempo real
- Notificações instantâneas
- Status de usuários online
- Sincronização de dados

### APIs REST
- Operações CRUD completas
- Validação de dados
- Tratamento de erros
- Interceptadores HTTP

## 📱 Design Responsivo

- Interface adaptável para desktop e tablet
- Componentes otimizados para diferentes tamanhos de tela
- Layout flexível e moderno
- Tema Material Design customizado

## 🎨 Tema Personalizado

### Cores Principais
- **Primary**: Azul (#1976d2) - Ações principais
- **Secondary**: Cinza (#424242) - Elementos secundários
- **Success**: Verde (#2e7d32) - Estados positivos
- **Warning**: Laranja (#ed6c02) - Alertas
- **Error**: Vermelho (#d32f2f) - Erros

### Tipografia
- Fonte: Roboto
- Hierarquia clara de títulos
- Tamanhos otimizados para leitura

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WEBSOCKET_URL=http://localhost:3001
REACT_APP_MAP_API_KEY=sua_chave_aqui
```

### Scripts Disponíveis

```bash
# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm start

# Compilar para produção
npm run build

# Executar testes
npm test

# Analisar bundle
npm run analyze
```

## 🚦 Estados da Aplicação

### Status de Corridas
- **Pendente**: Aguardando atribuição
- **Atribuída**: Motorista designado
- **Em Andamento**: Corrida ativa
- **Concluída**: Finalizada com sucesso
- **Cancelada**: Cancelada por algum motivo

### Status de Veículos
- **Disponível**: Pronto para uso
- **Em Uso**: Em corrida ativa
- **Manutenção**: Fora de operação
- **Indisponível**: Temporariamente fora

### Status de Motoristas
- **Ativo**: Disponível para corridas
- **Inativo**: Fora de serviço
- **Suspenso**: Temporariamente bloqueado

## 📊 Monitoramento

### Métricas Importantes
- Taxa de conclusão de corridas
- Tempo médio de resposta
- Utilização da frota
- Performance dos motoristas

### Alertas do Sistema
- Veículos com baixo combustível
- Manutenções vencidas
- CNH próximas do vencimento
- Falhas de comunicação

## 🔄 Integração com Backend

### Endpoints Principais
- `/api/auth/*` - Autenticação
- `/api/rides/*` - Gestão de corridas
- `/api/vehicles/*` - Gestão de veículos
- `/api/users/*` - Gestão de usuários
- `/api/locations/*` - Tracking GPS
- `/api/messages/*` - Sistema de mensagens
- `/api/reports/*` - Relatórios

### WebSocket Events
- `ride_updated` - Atualização de corrida
- `location_update` - Atualização de localização
- `new_message` - Nova mensagem
- `new_notification` - Nova notificação
- `user_joined/left` - Status de usuários

## 🎯 Próximas Implementações

- [ ] Integração completa com mapas (Google Maps/Leaflet)
- [ ] Push notifications para browsers
- [ ] Modo offline com sincronização
- [ ] Temas claro/escuro
- [ ] Internacionalização (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Testes automatizados
- [ ] Otimizações de performance

## 📖 Como Usar

### Login
1. Acesse a aplicação
2. Digite suas credenciais
3. Será redirecionado para o dashboard

### Criar Nova Corrida
1. Vá para "Corridas"
2. Clique em "Nova Corrida"
3. Preencha os dados
4. Atribua veículo e motorista
5. Confirme a criação

### Monitorar Frota
1. Acesse "Mapa ao Vivo"
2. Visualize todos os veículos
3. Use filtros para status específicos
4. Clique nos veículos para detalhes

## 🛠️ Desenvolvimento

### Padrões de Código
- Componentes funcionais com hooks
- Estados locais com useState
- Efeitos com useEffect
- Contextos para estado global
- Custom hooks para lógica reutilizável

### Estrutura de Componentes
```javascript
const ComponenteName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Efeitos colaterais
  }, [dependencies]);
  
  const handleAction = () => {
    // Lógica de ação
  };
  
  return (
    <Box>
      {/* JSX */}
    </Box>
  );
};
```

## 🔍 Troubleshooting

### Problemas Comuns
1. **Erro de conexão WebSocket**: Verificar se o backend está rodando
2. **Token expirado**: Fazer login novamente
3. **Dados não carregam**: Verificar conexão com API
4. **Mapa não aparece**: Configurar chave da API de mapas

### Logs
- Console do browser para erros JavaScript
- Network tab para requisições HTTP
- WebSocket logs para tempo real

---

**Sistema de Transporte de Ambulâncias**  
*Secretaria de Saúde - Versão 1.0*