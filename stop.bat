@echo off
echo Parando Sistema de Ambulancias...
taskkill /F /IM node.exe >nul 2>&1
echo Sistema parado!
pause