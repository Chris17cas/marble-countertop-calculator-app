@echo off
title Instalador - Calculadora de Mesones
color 0A

echo.
echo  ==========================================
echo   Instalador - Calculadora de Mesones
echo  ==========================================
echo.
echo  Este proceso instala todo lo necesario
echo  para correr la aplicacion.
echo.
pause

:: ── Verificar Python ──────────────────────────
echo.
echo  [1/4] Verificando Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  Python no esta instalado.
    echo  Abriendo la pagina de descarga...
    start https://www.python.org/downloads/
    echo.
    echo  INSTRUCCIONES:
    echo  1. Descarga Python 3.x
    echo  2. Al instalar marca la casilla "Add Python to PATH"
    echo  3. Completa la instalacion
    echo  4. Vuelve a ejecutar este instalador
    echo.
    pause
    exit
)

for /f "tokens=*" %%i in ('python --version') do set PYVER=%%i
echo  OK - %PYVER% encontrado

:: ── Instalar librerias ────────────────────────
echo.
echo  [2/4] Instalando librerias de Python...
echo  Esto puede tardar un momento...
echo.

pip install flask --quiet
if errorlevel 1 goto error_pip

pip install flask-cors --quiet
if errorlevel 1 goto error_pip

pip install psycopg2-binary --quiet
if errorlevel 1 goto error_pip

pip install werkzeug --quiet
if errorlevel 1 goto error_pip

echo  OK - Librerias instaladas correctamente

:: ── Verificar estructura de carpetas ─────────
echo.
echo  [3/4] Verificando archivos del proyecto...

cd /d "%~dp0"

set ERRORES=0

if not exist "frontend\index.html" (
    echo  FALTA: frontend\index.html
    set ERRORES=1
)
if not exist "frontend\css\styles.css" (
    echo  FALTA: frontend\css\styles.css
    set ERRORES=1
)
if not exist "frontend\js\app.js" (
    echo  FALTA: frontend\js\app.js
    set ERRORES=1
)
if not exist "frontend\js\data.js" (
    echo  FALTA: frontend\js\data.js
    set ERRORES=1
)
if not exist "backend\servidor.py" (
    echo  FALTA: backend\servidor.py
    set ERRORES=1
)
if not exist "backend\database.py" (
    echo  FALTA: backend\database.py
    set ERRORES=1
)
if not exist "iniciar.bat" (
    echo  FALTA: iniciar.bat
    set ERRORES=1
)

if %ERRORES%==1 (
    echo.
    echo  ERROR: Faltan archivos del proyecto.
    echo  Asegurate de copiar toda la carpeta completa.
    pause
    exit
)

echo  OK - Todos los archivos encontrados

:: ── Crear carpeta uploads si no existe ───────
if not exist "backend\uploads" (
    mkdir "backend\uploads"
    echo  OK - Carpeta uploads creada
)

:: ── Verificar conexion a PostgreSQL ──────────
echo.
echo  [4/4] Verificando conexion a PostgreSQL...
echo.
echo  IMPORTANTE: Asegurate de que PostgreSQL este
echo  corriendo antes de continuar.
echo.
echo  Si es un computador nuevo, necesitas:
echo  - Tener acceso a la IP del servidor central
echo  - Editar backend\database.py con esa IP
echo.
pause

python -c "import psycopg2; print('OK')" >nul 2>&1
if errorlevel 1 (
    echo  ERROR: psycopg2 no se instalo correctamente.
    goto error_pip
)

echo  OK - Conector PostgreSQL listo

:: ── Fin ───────────────────────────────────────
echo.
echo  ==========================================
echo   Instalacion completada exitosamente
echo  ==========================================
echo.
echo  Para usar la aplicacion:
echo  - Haz doble clic en "iniciar.bat"
echo.
echo  RECUERDA: Si es un computador nuevo,
echo  edita backend\database.py con la IP
echo  y contrasena correcta de PostgreSQL.
echo.
pause
exit

:: ── Error pip ────────────────────────────────
:error_pip
echo.
echo  ERROR instalando librerias.
echo  Verifica tu conexion a internet e intenta de nuevo.
echo.
pause
exit