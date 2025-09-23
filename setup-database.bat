@echo off
echo Iniciando configuracao do banco de dados...

REM Definir caminho do XAMPP (ajuste se necessario)
set XAMPP_PATH=C:\xampp

REM Verificar se o MySQL está rodando
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo MySQL ja esta rodando
) else (
    echo Iniciando MySQL...
    start /B "%XAMPP_PATH%\mysql\bin\mysqld.exe"
    timeout /t 5 /nobreak > nul
)

echo.
echo Criando banco de dados e tabelas...
echo Por favor, execute os seguintes comandos manualmente no phpMyAdmin:
echo.
echo 1. Abra o phpMyAdmin (http://localhost/phpmyadmin)
echo 2. Crie um banco chamado: ambulance_system
echo 3. Importe o arquivo: init.sql
echo.
echo Ou execute este comando no prompt do MySQL:
echo mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ambulance_system;"
echo mysql -u root -p ambulance_system ^< init.sql
echo.

REM Aguardar entrada do usuário
echo Pressione qualquer tecla quando terminar a configuracao do banco...
pause > nul

echo.
echo Banco configurado! Agora iniciando os servidores...
echo.