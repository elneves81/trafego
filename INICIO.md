# 🚀 COMO INICIAR O SISTEMA

## 🎯 Métodos de Inicialização

### 1. 📱 MAIS FÁCIL - Duplo clique (Windows):
- **🔧 Primeira vez**: Duplo clique em `setup.bat`
- **▶️ Uso diário**: Duplo clique em `iniciar.bat`

### 2. 💻 Via NPM (Terminal):
```bash
# Iniciar tudo de uma vez
npm start

# Primeira configuração
npm run setup
```

### 3. ⚡ Manual (Desenvolvimento):
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend-web
npm start
```

---

## 🔑 ACESSO AO SISTEMA

### 🌐 URLs:
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000

### 👤 Usuários padrão:
| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | `admin@transporte.gov.br` | `admin123` |
| **Operador** | `operador@transporte.gov.br` | `operador123` |
| **Motorista** | `joao.silva@transporte.gov.br` | `motorista123` |

---

## ❗ PROBLEMAS COMUNS

### 🚫 "Port already in use"
```bash
# Matar processos Node.js
taskkill /F /IM node.exe
```

### 🗄️ "Database connection failed"  
1. Abrir XAMPP
2. Iniciar Apache + MySQL
3. Executar `setup.bat` novamente

### 🔄 Reset completo:
```bash
npm run db:reset
```

---

**📞 Sistema pronto para uso!** 🚑