#!/usr/bin/env bash
# ============================================================
# start.sh — Sobe FastAPI (Whisper) + Next.js juntos
# ============================================================
# Pré-requisitos:
#   - .venv criado com: python3 -m venv .venv
#   - dependências instaladas: .venv/bin/pip install -r requirements.txt
#   - Node modules instalados: npm install
# ============================================================

set -e

# Detecta Python do venv ou sistema
if [ -f ".venv/bin/python" ]; then
    PYTHON=".venv/bin/python"
else
    PYTHON="python3"
    echo "[AVISO] .venv não encontrado. Usando Python do sistema."
fi

WHISPER_MODEL="${WHISPER_MODEL:-base}"
WHISPER_PORT="${WHISPER_PORT:-8000}"

echo ""
echo " Iniciando Whisper Server (modelo: $WHISPER_MODEL, porta: $WHISPER_PORT)..."
echo " Iniciando Next.js em http://localhost:3000"
echo ""
echo " Para encerrar: Ctrl+C"
echo ""

# Cleanup ao sair
cleanup() {
    echo ""
    echo "Encerrando processos..."
    kill "$WHISPER_PID" 2>/dev/null || true
    kill "$NEXT_PID" 2>/dev/null || true
    exit 0
}
trap cleanup INT TERM

# Inicia o servidor Whisper em background
$PYTHON whisper_server.py --model "$WHISPER_MODEL" --port "$WHISPER_PORT" &
WHISPER_PID=$!

# Aguarda 3 segundos para o servidor começar
sleep 3

# Inicia o Next.js em background
npm run dev &
NEXT_PID=$!

# Aguarda ambos
wait "$WHISPER_PID" "$NEXT_PID"
