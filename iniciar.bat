@echo off
title Calculadora de Mesones

echo.
echo  ==========================================
echo   Iniciando Calculadora de Mesones...
echo  ==========================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python no esta instalado.
    pause
    exit
)

cd /d "%~dp0"

if not exist "backend\servidor.py" (
    echo  ERROR: No se encontro backend\servidor.py
    pause
    exit
)

echo  Arrancando servidor...
echo  Esperando que el servidor este listo...

:: Abrir Edge despues de 4 segundos en segundo plano
start /B cmd /c "timeout /t 4 /nobreak >nul && start msedge "%~dp0frontend\index.html""

echo.
echo  ==========================================
echo   Calculadora de Mesones esta corriendo
echo   Cierra esta ventana para detener todo
echo  ==========================================
echo.
echo  Presiona Ctrl+C para detener el servidor
echo.

:: Correr el servidor en esta misma ventana
python backend\servidor.py