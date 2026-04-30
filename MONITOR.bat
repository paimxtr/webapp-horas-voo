@echo off
chcp 65001 >nul
title Monitor Horas de Voo - Esquadra 271
color 0B

:: Configurações
set "APP_DIR=C:\Users\EFBadmin\projects\webapp-horas-voo"
set "LOG_DIR=%APP_DIR%\logs"
set "CHECK_INTERVAL=30"
set "MAX_RETRIES=3"

cd /d "%APP_DIR%"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ==========================================
echo  MONITOR AUTOMÁTICO - ESQUADRA 271 C-295
echo ==========================================
echo.
echo Este script verifica o sistema a cada %CHECK_INTERVAL% segundos
echo e reinicia automaticamente se algo falhar.
echo.
echo Pressione Ctrl+C para parar o monitor.
echo.
timeout /t 3 >nul

:MONITOR_LOOP
cls
echo ==========================================
echo  MONITOR - %date% %time%
echo ==========================================
echo.

set /a RETRY_COUNT=0

:CHECK_APP
echo [1/2] A verificar aplicação local...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '     [OK] Aplicação a correr' -ForegroundColor Green; exit 0 } else { exit 1 } } catch { exit 1 }"

if errorlevel 1 (
    echo     [AVISO] Aplicação não responde!
    echo     A reiniciar aplicação...
    taskkill /F /IM node.exe 2>nul
    timeout /t 2 >nul
    start "WebApp" /MIN cmd /c "npm run dev > \"%LOG_DIR%\app.log\" 2>&1"
    timeout /t 8 >nul
    set /a RETRY_COUNT+=1
    if %RETRY_COUNT% LSS %MAX_RETRIES% goto CHECK_APP
) else (
    echo     [OK] Aplicação funcional
)

set /a RETRY_COUNT=0

:CHECK_TUNNEL
echo [2/2] A verificar túnel público...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://e7ac064944e196.lhr.life' -UseBasicParsing -TimeoutSec 10; if ($r.StatusCode -eq 200) { Write-Host '     [OK] Túnel a correr' -ForegroundColor Green; exit 0 } else { exit 1 } } catch { exit 1 }"

if errorlevel 1 (
    echo     [AVISO] Túnel não responde!
    echo     A reiniciar túnel...
    taskkill /F /IM ssh.exe 2>nul
    timeout /t 2 >nul
    start "Túnel SSH" /MIN cmd /c "ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes -R 80:localhost:3000 localhost.run > \"%LOG_DIR%\tunnel.log\" 2>&1"
    timeout /t 10 >nul
    set /a RETRY_COUNT+=1
    if %RETRY_COUNT% LSS %MAX_RETRIES% goto CHECK_TUNNEL
) else (
    echo     [OK] Túnel funcional
)

echo.
echo ==========================================
echo  ✅ Sistema operacional!
echo  🌐 https://e7ac064944e196.lhr.life
echo ==========================================
echo.
echo Próxima verificação em %CHECK_INTERVAL% segundos...
echo (Pressione Ctrl+C para parar)

timeout /t %CHECK_INTERVAL% /nobreak >nul
goto MONITOR_LOOP
