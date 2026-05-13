"""
whisper_server.py — Servidor FastAPI com WhisperModel persistente em memória

Endpoints:
    GET  /health          → { "status": "ok", "model": "<nome>" }
    POST /transcribe      → multipart: file=<wav_bytes> → { "text": "..." }

Uso:
    python whisper_server.py
    python whisper_server.py --model medium --port 8000

Variáveis de ambiente:
    WHISPER_MODEL   Modelo a carregar (padrão: base)
    WHISPER_PORT    Porta do servidor (padrão: 8000)
"""

import argparse
import os
import sys
import tempfile
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager

try:
    import uvicorn
    from fastapi import FastAPI, File, UploadFile, HTTPException
    from fastapi.responses import JSONResponse
except ImportError:
    print(
        "Erro: FastAPI/uvicorn não instalados. Execute: pip install -r requirements.txt",
        file=sys.stderr,
    )
    sys.exit(1)

try:
    from faster_whisper import WhisperModel  # type: ignore
except ImportError:
    print(
        "Erro: faster-whisper não instalado. Execute: pip install -r requirements.txt",
        file=sys.stderr,
    )
    sys.exit(1)


# ---------------------------------------------------------------------------
# Estado global — modelo carregado uma única vez no startup
# ---------------------------------------------------------------------------

_model: WhisperModel | None = None
_model_name: str = "base"
_lock = asyncio.Lock()  # garante que apenas uma transcrição rode por vez na CPU


def load_model(name: str) -> WhisperModel:
    print(f"[whisper_server] Carregando modelo '{name}'...", flush=True)
    m = WhisperModel(name, device="cpu", compute_type="int8")
    print(f"[whisper_server] Modelo '{name}' carregado.", flush=True)
    return m


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model, _model_name
    _model = load_model(_model_name)
    yield
    # cleanup (se necessário no futuro)


app = FastAPI(title="Whisper Transcription Server", lifespan=lifespan)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "model": _model_name}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    if _model is None:
        raise HTTPException(status_code=503, detail="Modelo ainda não carregado.")

    # Salva o arquivo recebido em temp para o faster-whisper ler do disco
    suffix = Path(file.filename or "audio.wav").suffix or ".wav"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp_path = tmp.name
        content = await file.read()
        tmp.write(content)

    try:
        # Lock garante processamento sequencial — evita thrashing de CPU com
        # múltiplas transcrições simultâneas num servidor single-core
        async with _lock:
            loop = asyncio.get_event_loop()
            # Roda a transcrição em thread separada para não bloquear o event loop
            texto = await loop.run_in_executor(None, _run_transcribe, tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass

    return JSONResponse({"text": texto})


def _run_transcribe(audio_path: str) -> str:
    """Executa a transcrição de forma síncrona (chamado via executor)."""
    assert _model is not None
    segments, _ = _model.transcribe(audio_path, beam_size=5)
    partes = [seg.text.strip() for seg in segments if seg.text.strip()]
    return " ".join(partes)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

def main():
    global _model_name

    parser = argparse.ArgumentParser(description="Servidor de transcrição Whisper")
    parser.add_argument(
        "--model",
        default=os.environ.get("WHISPER_MODEL", "base"),
        help="Modelo Whisper (tiny, base, small, medium, large-v3)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("WHISPER_PORT", "8000")),
        help="Porta do servidor (padrão: 8000)",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host do servidor (padrão: 127.0.0.1)",
    )
    args = parser.parse_args()

    _model_name = args.model

    uvicorn.run(
        "whisper_server:app",
        host=args.host,
        port=args.port,
        log_level="info",
        reload=False,
    )


if __name__ == "__main__":
    main()
