@echo off
echo ==========================================
echo   Setup Inicial - Sistema de Ambulancias
echo ==========================================
echo.
echo Este script ira configurar todo o sistema pela primeira vez
echo.

REM Navegar para o diretorio do projeto
cd /d %~dp0

echo 1. Instalando todas as dependencias...
echo    (Isso pode levar varios minutos)
npm run install:all
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao instalar dependencias!
    pause
    exit /b 1
)

echo.
echo 2. Configurando banco de dados...
npm run db:setup
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao configurar banco de dados!
    echo Certifique-se de que o XAMPP/MariaDB esta rodando
    pause
    exit /b 1
)

echo.
echo ==========================================
echo           SETUP CONCLUIDO!
echo ==========================================
echo.
echo O sistema foi configurado com sucesso!
echo.
echo Para iniciar o sistema, use:
echo   - Clique duplo em 'start.bat'
echo   - Ou execute: npm start
echo.
echo Credenciais de acesso:
echo   Admin: admin@transporte.gov.br / admin123
echo   Operador: operador@transporte.gov.br / operador123
echo.
echo URLs de acesso:
echo   Frontend: http://localhost:3001
echo   Backend API: http://localhost:5000
echo.
pause