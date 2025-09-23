@echo off
title Sistema de Ambulancias - Secretaria de Saude
color 0A

echo ========================================
echo    SISTEMA DE TRANSPORTE DE AMBULANCIAS
echo         Secretaria de Saude
echo ========================================
echo.

REM Verificar se estamos na pasta correta
if not exist "backend\" (
    echo ERRO: Execute este script na pasta raiz do projeto
    pause
    exit /b 1
)

echo [PASSO 1] Verificando dependencias...
echo.

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado. Instale o Node.js primeiro.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js: OK
echo.

echo [PASSO 2] Configurando banco de dados...
echo.
echo IMPORTANTE: Configure o banco de dados antes de continuar:
echo.
echo 1. Abra o XAMPP e inicie Apache + MySQL
echo 2. Abra phpMyAdmin (http://localhost/phpmyadmin)
echo 3. Crie um banco chamado: ambulance_system  
echo 4. Importe o arquivo: init.sql
echo.
echo Pressione qualquer tecla quando terminar...
pause > nul

echo.
echo [PASSO 3] Iniciando Backend...
echo.

REM Iniciar Backend em nova janela
start "Backend - API Server" cmd /c "cd backend && npm start"

REM Aguardar o backend inicializar
echo Aguardando backend inicializar...
timeout /t 5 /nobreak > nul

echo.
echo [PASSO 4] Iniciando Frontend...
echo.

REM Iniciar Frontend em nova janela  
start "Frontend - React App" cmd /c "cd frontend-web && npm start"

echo.
echo ========================================
echo           SISTEMA INICIADO!
echo ========================================
echo.
echo Backend API:     http://localhost:3001
echo Frontend Web:    http://localhost:3000
echo phpMyAdmin:      http://localhost/phpmyadmin
echo.
echo CREDENCIAIS DE LOGIN:
echo Email: admin@saude.gov.br
echo Senha: admin123
echo.
echo Pressione qualquer tecla para sair...
pause > nul