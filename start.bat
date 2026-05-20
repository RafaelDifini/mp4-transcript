@echo off
:: ============================================================
:: start.bat - Sobe FastAPI (Whisper) + Next.js juntos
:: e abre o navegador quando o portal local estiver pronto
:: ============================================================

setlocal EnableDelayedExpansion

if exist ".env.local" (
  for /f "usebackq tokens=1,* delims==" %%A in (`findstr /r "^[A-Z_][A-Z_]*=.*" ".env.local"`) do (
    set "%%A=%%B"
  )
)

if not "%PYTHON_EXECUTABLE%"=="" if exist "%PYTHON_EXECUTABLE%" (
  set "PYTHON=%PYTHON_EXECUTABLE%"
) else if exist ".venv\Scripts\python.exe" (
  set "PYTHON=.venv\Scripts\python.exe"
) else (
  set "PYTHON=python"
  echo [AVISO] .venv nao encontrado e PYTHON_EXECUTABLE nao configurado.
  echo         Usando Python do sistema.
)

if "%WHISPER_MODEL%"=="" set "WHISPER_MODEL=base"
if "%WHISPER_PORT%"=="" set "WHISPER_PORT=8000"

echo.
echo  Python:  %PYTHON%
echo  Modelo:  %WHISPER_MODEL%
echo  Porta:   %WHISPER_PORT%
echo  Next.js: http://127.0.0.1:3000
echo.
echo  Para encerrar: feche esta janela ou pressione Ctrl+C.
echo.

start "Whisper Server" cmd /k "%PYTHON% whisper_server.py --model %WHISPER_MODEL% --port %WHISPER_PORT%"

echo  Aguardando servidor Whisper ficar pronto...
set "WHISPER_READY=0"
for /L %%I in (1,1,120) do (
  curl -sf "http://127.0.0.1:%WHISPER_PORT%/health" >nul 2>nul
  if !errorlevel! equ 0 (
    set "WHISPER_READY=1"
    goto :whisper_ready
  )
  timeout /t 1 /nobreak >nul
)

:whisper_ready
if "%WHISPER_READY%"=="0" (
  echo.
  echo [ERRO] Servidor Whisper nao respondeu em 120s.
  exit /b 1
)

echo  Servidor Whisper pronto. Iniciando Next.js...
echo.

start "Next.js App" cmd /k "npm run dev"

echo  Aguardando portal local ficar pronto...
set "NEXT_READY=0"
for /L %%I in (1,1,120) do (
  curl -sf "http://127.0.0.1:3000" >nul 2>nul
  if !errorlevel! equ 0 (
    set "NEXT_READY=1"
    goto :next_ready
  )
  timeout /t 1 /nobreak >nul
)

:next_ready
if "%NEXT_READY%"=="1" (
  echo  Portal pronto. Abrindo navegador...
  start "" "http://127.0.0.1:3000"
) else (
  echo [AVISO] Next.js nao respondeu em 120s. Abra manualmente: http://127.0.0.1:3000
)

echo.
endlocal
