@echo off
echo ========================================
echo  Sistema de Transporte de Ambulancias
echo ========================================
echo.

echo Parando processos Node.js existentes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo Iniciando Backend (Porta 8089)...
cd /d "c:\Users\Elber\Documents\GitHub\trafego\backend"
start "Backend-API" cmd /k "node server.js"

echo.
echo Aguardando 3 segundos para o backend iniciar...
timeout /t 3 /nobreak >nul

echo.
echo Iniciando Frontend (Porta 3001)...
cd /d "c:\Users\Elber\Documents\GitHub\trafego\frontend-web"
start "Frontend-Web" cmd /k "npm start"

echo.
echo ========================================
echo  SISTEMA INICIADO!
echo ========================================
echo.
echo Backend: http://10.0.50.79:8089
echo Frontend: http://10.0.50.79:3001
echo.
echo Login:
echo Email: admin@admin.com
echo Senha: admin123
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

echo.
echo Abrindo navegador...
start http://10.0.50.79:3001

echo.
echo Sistema rodando! Feche esta janela quando terminar.
pause
netstat -an | find "3306" >nul
if %ERRORLEVEL% NEQ 0 (
    echo AVISO: MariaDB nao parece estar rodando na porta 3306
    echo Por favor, certifique-se de que o XAMPP esta iniciado
    echo.
    choice /C SN /M "Deseja continuar mesmo assim? (S/N)"
    if errorlevel 2 exit /b 1
)

REM Navegar para o diretorio do projeto
cd /d %~dp0

REM Verificar se as dependencias estao instaladas
if not exist "node_modules\" (
    echo Instalando dependencias pela primeira vez...
    echo Isso pode levar alguns minutos...
    npm run install:all
    if %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

REM Verificar se o banco de dados esta configurado
echo Verificando configuracao do banco de dados...
if not exist "backend\logs\" mkdir "backend\logs"

REM Iniciar o sistema
echo.
echo Iniciando Backend (porta 5000) e Frontend (porta 3001)...
echo.
echo Pressione Ctrl+C para parar o sistema
echo.
npm start

echo.
echo Sistema finalizado.
pause