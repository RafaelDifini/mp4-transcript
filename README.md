# mp4-transcript-to-text

Transcrição local de vídeos e áudios para texto usando [`faster-whisper`](https://github.com/SYSTRAN/faster-whisper). Interface web em Next.js 14 com suporte a múltiplos arquivos em fila sequencial.

**Zero custo. Sem API key. Nenhum dado sai da máquina.**

---

## Arquitetura

```
Browser (Next.js UI)
    → POST /api/transcribe  (Next.js route handler)
        → ffmpeg converte entrada → WAV 16kHz mono
        → POST http://localhost:8000/transcribe  (FastAPI)
            → WhisperModel (carregado 1x em memória)
            → retorna { text: "..." }
        → repassa resposta ao browser
```

O servidor FastAPI mantém o modelo em memória entre as requisições — elimina o overhead de ~2s de carregamento por arquivo da versão anterior.

---

## Pré-requisitos

| Dependência | Versão mínima | Como instalar |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Python | 3.11+ | [python.org](https://python.org) |
| ffmpeg | qualquer recente | ver abaixo |

### Instalar ffmpeg

```bash
# Windows
winget install Gyan.FFmpeg

# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg
```

---

## Setup

### 1. Instalar dependências Node

```bash
npm install
```

### 2. Criar venv Python e instalar dependências

```bash
python -m venv .venv

# Ativar — Windows
.venv\Scripts\activate

# Ativar — macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Configurar variáveis de ambiente (opcional)

```bash
cp .env.example .env.local
```

Variáveis disponíveis em `.env.local`:

```env
# Modelo Whisper (padrão: base)
WHISPER_MODEL=base

# URL do servidor FastAPI (padrão: http://127.0.0.1:8000)
WHISPER_SERVER_URL=http://127.0.0.1:8000

# Porta do servidor Whisper (padrão: 8000)
WHISPER_PORT=8000
```

---

## Rodar

```bash
# Windows
start.bat

# macOS / Linux
chmod +x start.sh
./start.sh
```

O script sobe os dois processos automaticamente:
- **Whisper Server** em `http://localhost:8000` (janela separada no Windows)
- **Next.js** em `http://localhost:3000`

Na primeira execução, o modelo é baixado automaticamente (~150MB para `base`) e cacheado em `~/.cache/huggingface/hub/`.

---

## Usar

1. Acesse [http://localhost:3000](http://localhost:3000)
2. Arraste um ou mais arquivos para a área de upload
3. Clique em **Transcrever N arquivos**
4. Os arquivos são processados um por vez — cada um mostra status individual
5. Ao concluir: visualize, copie ou baixe como `.txt`

---

## Modelos disponíveis

| Modelo | Tamanho | Velocidade | Qualidade |
|---|---|---|---|
| `tiny` | ~75 MB | muito rápido | baixa |
| `base` | ~150 MB | rápido | boa (padrão) |
| `small` | ~500 MB | moderado | muito boa |
| `medium` | ~1.5 GB | lento | ótima (recomendado para PT-BR) |
| `large-v3` | ~3 GB | muito lento | máxima |

Para trocar o modelo, edite `WHISPER_MODEL` no `.env.local` e reinicie o `start.bat` / `start.sh`.

---

## Formatos suportados

Qualquer formato aceito pelo ffmpeg: MP4, MOV, AVI, MKV, WebM, MP3, M4A, WAV, OGG, FLAC, etc.

---

## Arquivos do projeto

```
mp4-transcript-to-text/
├── start.bat                 ← startup Windows
├── start.sh                  ← startup macOS/Linux
├── whisper_server.py         ← servidor FastAPI com modelo persistente
├── transcribe.py             ← script standalone (uso direto, sem servidor)
├── requirements.txt          ← faster-whisper, fastapi, uvicorn
├── package.json
├── next.config.js
└── src/app/
    ├── page.tsx              ← UI com fila de múltiplos arquivos
    └── api/transcribe/
        └── route.ts          ← API handler: ffmpeg → FastAPI → texto
```
