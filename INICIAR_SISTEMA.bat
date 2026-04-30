@echo off
chcp 65001 >nul
title WebApp Horas de Voo - Gestor Automático
color 0A

:: Configurações
set "APP_DIR=C:\Users\EFBadmin\projects\webapp-horas-voo"
set "LOG_DIR=%APP_DIR%\logs"
set "NODE_PORT=3000"
set "TUNNEL_URL=localhost.run"

:: Criar pasta de logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ==========================================
echo  WEBAPP HORAS DE VOO - ESQUADRA 271 C-295
echo  Gestor Automático de Túnel e Aplicação
echo ==========================================
echo.

:: Verificar se o Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js não encontrado!
    echo Por favor, instale o Node.js primeiro.
    pause
    exit /b 1
)

:: Verificar se o SSH está disponível
ssh -V >nul 2>&1
if errorlevel 1 (
    echo [ERRO] SSH não encontrado!
    echo Por favor, instale o OpenSSH.
    pause
    exit /b 1
)

echo [OK] Node.js e SSH encontrados
echo.

:: Mudar para o diretório da aplicação
cd /d "%APP_DIR%"

:: Menu principal
:MENU
cls
echo ==========================================
echo  WEBAPP HORAS DE VOO - ESQUADRA 271 C-295
echo ==========================================
echo.
echo Escolha uma opção:
echo.
echo  [1] INICIAR TUDO (App + Túnel)
echo  [2] Iniciar apenas a Aplicação
echo  [3] Iniciar apenas o Túnel
echo  [4] VERIFICAR STATUS
echo  [5] PARAR TUDO
echo  [6] REINICIAR TUDO
echo  [7] VER LOGS
echo  [8] ABRIR NO BROWSER
echo  [9] SAIR
echo.
echo ==========================================
set /p opcao="Opção: "

if "%opcao%"=="1" goto INICIAR_TUDO
if "%opcao%"=="2" goto INICIAR_APP
if "%opcao%"=="3" goto INICIAR_TUNNEL
if "%opcao%"=="4" goto VERIFICAR_STATUS
if "%opcao%"=="5" goto PARAR_TUDO
if "%opcao%"=="6" goto REINICIAR_TUDO
if "%opcao%"=="7" goto VER_LOGS
if "%opcao%"=="8" goto ABRIR_BROWSER
if "%opcao%"=="9" goto SAIR

goto MENU

:INICIAR_TUDO
echo.
echo [1/2] A iniciar aplicação...
call :INICIAR_APP_SILENT
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar aplicação!
    pause
    goto MENU
)

echo.
echo [2/2] A iniciar túnel...
call :INICIAR_TUNNEL_SILENT
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar túnel!
    pause
    goto MENU
)

echo.
echo ==========================================
echo  ✅ TUDO INICIADO COM SUCESSO!
echo ==========================================
echo.
echo A aplicação está disponível em:
echo https://e7ac064944e196.lhr.life
echo.
echo Comandante: antonio / commander123
echo Tripulantes: carlos.mendes / crew123
echo              maria.santos / crew123
echo.
pause
goto MENU

:INICIAR_APP
call :INICIAR_APP_SILENT
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar aplicação!
) else (
    echo [OK] Aplicação iniciada!
    echo Aceda em: http://localhost:3000
)
pause
goto MENU

:INICIAR_TUNNEL
call :INICIAR_TUNNEL_SILENT
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar túnel!
) else (
    echo [OK] Túnel iniciado!
    echo Link público: https://e7ac064944e196.lhr.life
)
pause
goto MENU

:INICIAR_APP_SILENT
:: Verificar se já está a correr
tasklist /FI "IMAGENAME eq node.exe" /FI "WINDOWTITLE eq *npm*" 2>nul | find /I "node.exe" >nul
if not errorlevel 1 (
    echo [AVISO] Aplicação já está a correr!
    exit /b 0
)

:: Iniciar a aplicação
start "WebApp Horas de Voo" /MIN cmd /c "cd /d "%APP_DIR%" && npm run dev > "%LOG_DIR%\app.log" 2>&1"

:: Aguardar arranque
timeout /t 8 /nobreak >nul

:: Verificar se iniciou
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
    exit /b 1
)
exit /b 0

:INICIAR_TUNNEL_SILENT
:: Verificar se já está a correr
tasklist /FI "IMAGENAME eq ssh.exe" 2>nul | find /I "ssh.exe" >nul
if not errorlevel 1 (
    echo [AVISO] Túnel já está a correr!
    exit /b 0
)

:: Iniciar o túnel
start "Túnel SSH" /MIN cmd /c "ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=60 -o ExitOnForwardFailure=yes -R 80:localhost:3000 localhost.run > \"%LOG_DIR%\tunnel.log\" 2>&1"

:: Aguardar arranque
timeout /t 10 /nobreak >nul

:: Verificar se iniciou
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://e7ac064944e196.lhr.life' -UseBasicParsing -TimeoutSec 10; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
    exit /b 1
)
exit /b 0

:VERIFICAR_STATUS
cls
echo ==========================================
echo  VERIFICAÇÃO DE STATUS
echo ==========================================
echo.

:: Verificar aplicação
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { Write-Host '[OK] Aplicação local: A CORRER em http://localhost:3000' -ForegroundColor Green } else { Write-Host '[ERRO] Aplicação local: PROBLEMA' -ForegroundColor Red } } catch { Write-Host '[ERRO] Aplicação local: PARADA' -ForegroundColor Red }"

:: Verificar túnel
powershell -Command "try { $r = Invoke-WebRequest -Uri 'https://e7ac064944e196.lhr.life' -UseBasicParsing -TimeoutSec 10; if ($r.StatusCode -eq 200) { Write-Host '[OK] Túnel público: A CORRER em https://e7ac064944e196.lhr.life' -ForegroundColor Green } else { Write-Host '[ERRO] Túnel público: PROBLEMA' -ForegroundColor Red } } catch { Write-Host '[ERRO] Túnel público: PARADO' -ForegroundColor Red }"

echo.
echo Processos ativos:
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul && echo   - Node.js: A CORRIR || echo   - Node.js: PARADO
tasklist /FI "IMAGENAME eq ssh.exe" 2>nul | find /I "ssh.exe" >nul && echo   - SSH/Túnel: A CORRIR || echo   - SSH/Túnel: PARADO

echo.
pause
goto MENU

:PARAR_TUDO
echo.
echo A parar todos os processos...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM ssh.exe 2>nul
timeout /t 2 /nobreak >nul
echo [OK] Todos os processos parados!
pause
goto MENU

:REINICIAR_TUDO
echo.
echo A reiniciar tudo...
call :PARAR_TUDO_SILENT
timeout /t 3 /nobreak >nul
goto INICIAR_TUDO

:PARAR_TUDO_SILENT
taskkill /F /IM node.exe 2>nul
taskkill /F /IM ssh.exe 2>nul
timeout /t 2 /nobreak >nul
exit /b 0

:VER_LOGS
cls
echo ==========================================
echo  LOGS DO SISTEMA
echo ==========================================
echo.
if exist "%LOG_DIR%\app.log" (
    echo --- LOG DA APLICAÇÃO (últimas 20 linhas) ---
    powershell -Command "Get-Content '%LOG_DIR%\app.log' -Tail 20"
    echo.
) else (
    echo [Sem logs da aplicação]
)

if exist "%LOG_DIR%\tunnel.log" (
    echo --- LOG DO TÚNEL (últimas 20 linhas) ---
    powershell -Command "Get-Content '%LOG_DIR%\tunnel.log' -Tail 20"
) else (
    echo [Sem logs do túnel]
)

echo.
pause
goto MENU

:ABRIR_BROWSER
echo.
echo A abrir browser...
start https://e7ac064944e196.lhr.life
goto MENU

:SAIR
echo.
echo A sair...
echo.
echo Lembre-se: O sistema continua a correr em segundo plano!
echo Para parar, execute este script novamente e escolha opção [5].
timeout /t 3 >nul
exit
