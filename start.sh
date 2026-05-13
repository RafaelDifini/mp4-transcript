#!/usr/bin/env bash
# ============================================================
# start.sh — Sobe FastAPI (Whisper) + Next.js juntos
# ============================================================

set -e

# Carrega variáveis do .env.local se existir
if [ -f ".env.local" ]; then
    # Exporta apenas linhas no formato CHAVE=VALOR (ignora comentários e linhas vazias)
    set -a
    # shellcheck disable=SC1091
    source <(grep -E '^[A-Z_]+=.*' .env.local)
    set +a
fi

# Detecta Python: .env.local > venv padrão > sistema
if [ -n "$PYTHON_EXECUTABLE" ] && [ -f "$PYTHON_EXECUTABLE" ]; then
    PYTHON="$PYTHON_EXECUTABLE"
elif [ -f ".venv/Scripts/python.exe" ]; then
    PYTHON=".venv/Scripts/python.exe"
elif [ -f ".venv/bin/python" ]; then
    PYTHON=".venv/bin/python"
else
    PYTHON="python3"
    echo "[AVISO] .venv nao encontrado e PYTHON_EXECUTABLE nao configurado."
    echo "        Crie o venv: py -3.12 -m venv .venv && source .venv/Scripts/activate && pip install -r requirements.txt"
    echo "        Depois configure .env.local: PYTHON_EXECUTABLE=.venv/Scripts/python.exe"
    echo ""
fi

WHISPER_MODEL="${WHISPER_MODEL:-base}"
WHISPER_PORT="${WHISPER_PORT:-8000}"

echo ""
echo " Python:  $PYTHON"
echo " Modelo:  $WHISPER_MODEL"
echo " Porta:   $WHISPER_PORT"
echo " Next.js: http://localhost:3000"
echo ""
echo " Para encerrar: Ctrl+C"
echo ""

cleanup() {
    echo ""
    echo "Encerrando processos..."
    kill "$WHISPER_PID" 2>/dev/null || true
    kill "$NEXT_PID" 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM

# Inicia o servidor Whisper em background
"$PYTHON" whisper_server.py --model "$WHISPER_MODEL" --port "$WHISPER_PORT" &
WHISPER_PID=$!

sleep 3

# Inicia o Next.js em background
npm run dev &
NEXT_PID=$!

wait "$WHISPER_PID" "$NEXT_PID"
