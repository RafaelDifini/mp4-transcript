@echo off
:: ============================================================
:: start.bat — Sobe FastAPI (Whisper) + Next.js juntos
:: ============================================================
:: Pré-requisitos:
::   - .venv criado com: python -m venv .venv
::   - dependências instaladas: .venv\Scripts\pip install -r requirements.txt
::   - Node modules instalados: npm install
:: ============================================================

setlocal

:: Detecta o Python do venv (ou usa o do sistema se não tiver venv)
if exist ".venv\Scripts\python.exe" (
    set PYTHON=.venv\Scripts\python.exe
) else (
    set PYTHON=python
    echo [AVISO] .venv nao encontrado. Usando Python do sistema.
)

:: Modelo e porta (pode ser sobrescrito por .env.local)
if "%WHISPER_MODEL%"=="" set WHISPER_MODEL=base
if "%WHISPER_PORT%"=="" set WHISPER_PORT=8000

echo.
echo  Iniciando Whisper Server (modelo: %WHISPER_MODEL%, porta: %WHISPER_PORT%)...
echo  Iniciando Next.js em http://localhost:3000
echo.
echo  Para encerrar: feche esta janela ou pressione Ctrl+C duas vezes.
echo.

:: Abre o servidor Whisper em uma janela separada
start "Whisper Server" cmd /k "%PYTHON% whisper_server.py --model %WHISPER_MODEL% --port %WHISPER_PORT%"

:: Aguarda 3 segundos para o servidor começar a carregar o modelo
timeout /t 3 /nobreak > nul

:: Sobe o Next.js no terminal atual
call npm run dev

endlocal
