"""
transcribe.py — Transcrição local com faster-whisper

Uso:
    python transcribe.py <caminho_audio.wav> [modelo]

Argumentos:
    caminho_audio.wav  Arquivo de áudio WAV (16kHz, mono, PCM s16le)
    modelo             Opcional. Sobrescreve a variável WHISPER_MODEL.
                       Opções: tiny, base, small, medium, large-v3 (padrão: base)

Saída:
    Texto transcrito no stdout, sem timestamps.
    Erros no stderr.

Códigos de saída:
    0  Sucesso
    1  Erro (arquivo não encontrado, falha no modelo, etc.)
"""

import sys
import os


def main() -> None:
    if len(sys.argv) < 2:
        print(
            "Uso: python transcribe.py <caminho_audio.wav> [modelo]",
            file=sys.stderr,
        )
        sys.exit(1)

    audio_path = sys.argv[1]

    if not os.path.isfile(audio_path):
        print(f"Erro: arquivo não encontrado: {audio_path}", file=sys.stderr)
        sys.exit(1)

    # Modelo: argumento CLI > variável de ambiente > padrão "base"
    model_name = (
        sys.argv[2]
        if len(sys.argv) > 2
        else os.environ.get("WHISPER_MODEL", "base")
    )

    try:
        from faster_whisper import WhisperModel  # type: ignore
    except ImportError:
        print(
            "Erro: faster-whisper não instalado. Execute: pip install -r requirements.txt",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        # int8 é significativamente mais rápido na CPU sem perda relevante de qualidade
        model = WhisperModel(model_name, device="cpu", compute_type="int8")
    except Exception as e:
        print(f"Erro ao carregar modelo '{model_name}': {e}", file=sys.stderr)
        sys.exit(1)

    try:
        segments, info = model.transcribe(audio_path, beam_size=5)

        # Concatena segmentos filtrando entradas vazias
        partes = [seg.text.strip() for seg in segments if seg.text.strip()]
        texto = " ".join(partes)

        print(texto)

    except Exception as e:
        print(f"Erro durante a transcrição: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
