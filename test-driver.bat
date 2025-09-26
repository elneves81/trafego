@echo off
cd /d "C:\Users\Elber\Documents\GitHub\trafego"
echo ======================================
echo TESTANDO CRIACAO DE DRIVER (CORRIGIDO)
echo ======================================
timeout /t 2 /nobreak >nul
node test-driver-simple.js
echo ======================================
echo TESTE FINALIZADO
echo ======================================
pause