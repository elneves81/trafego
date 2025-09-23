@echo off
echo ===================================
echo   CONFIGURACAO DO BANCO DE DADOS
echo ===================================
echo.

echo OPCOES PARA CRIAR O BANCO:
echo.
echo OPCAO 1 - Via phpMyAdmin (Recomendado):
echo 1. Abra o XAMPP Control Panel
echo 2. Inicie Apache + MySQL 
echo 3. Clique em "Admin" do MySQL (abre phpMyAdmin)
echo 4. Clique em "Novo" para criar banco
echo 5. Nome do banco: ambulance_system
echo 6. Clique em "Criar"
echo 7. Clique na aba "SQL"
echo 8. Cole o conteudo do arquivo init.sql
echo 9. Clique em "Continuar"
echo.

echo OPCAO 2 - Via linha de comando:
echo.
echo Abra o cmd como Administrador e execute:
echo.
echo cd C:\xampp\mysql\bin
echo mysql -u root -e "CREATE DATABASE ambulance_system;"
echo mysql -u root ambulance_system ^< "C:\Users\Elber\Documents\GitHub\trafego\init.sql"
echo.

echo OPCAO 3 - Usando HeidiSQL ou outro cliente MySQL:
echo 1. Conecte no servidor MySQL (localhost:3306)
echo 2. Usuario: root, Senha: (vazia)
echo 3. Crie banco "ambulance_system"
echo 4. Importe o arquivo init.sql
echo.

echo ===================================
echo Apos criar o banco, execute:
echo ===================================
echo cd backend
echo npm start
echo.
echo Pressione qualquer tecla para sair...
pause > nul