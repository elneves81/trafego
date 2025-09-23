@echo off
cls
echo ==========================================
echo    Sistema de Transporte de Ambulancias
echo    Inicializacao Automatica
echo ==========================================
echo.

REM Matar processos anteriores
echo Parando processos anteriores...
taskkill /F /IM node.exe >nul 2>&1

REM Aguardar um momento
timeout /t 2 /nobreak >nul

REM Navegar para o diretorio
cd /d "%~dp0"

echo Iniciando sistema...
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3001
echo.
echo Pressione Ctrl+C para parar
echo.

start "Backend API" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak >nul
start "Frontend Web" cmd /k "cd frontend-web && npm start"

echo.
echo Sistema iniciado em janelas separadas!
echo Feche este prompt quando quiser parar o sistema.
echo.
pause