# mp4-transcript-to-text

Transcrição local de vídeos e áudios para texto com [faster-whisper](https://github.com/SYSTRAN/faster-whisper). Interface web em Next.js com fila de múltiplos arquivos.

Zero custo. Sem API key. Nenhum dado sai da máquina.

---

## Dependências externas

Instale antes de qualquer coisa:

**Node.js 20+**
https://nodejs.org/en/download — versão LTS

**Python 3.12**
https://www.python.org/downloads/release/python-3128 — `Windows installer (64-bit)`
Durante a instalação: marque **"Add python.exe to PATH"**
> Não use Python 3.13 ou 3.14 — dependências sem wheel pré-compilada

**ffmpeg**
```bash
winget install Gyan.FFmpeg
```
Após instalar, abra um novo terminal para o PATH ser reconhecido.

---

## Instalação

```bash
# 1. Instalar dependências Node
npm install

# 2. Criar venv com Python 3.12 e instalar dependências Python
py -3.12 -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt

# 3. Configurar variáveis de ambiente
echo 'PYTHON_EXECUTABLE=.venv/Scripts/python.exe' > .env.local
echo 'WHISPER_MODEL=base' >> .env.local
```

---

## Rodar

```bash
./start.sh
```

Acesse **http://localhost:3000** quando o terminal mostrar `Ready`.

Na primeira execução o modelo (~150MB para `base`) é baixado automaticamente e cacheado em `~/.cache/huggingface/hub/`.

---

## Modelos disponíveis

Configure via `WHISPER_MODEL` no `.env.local`. Reinicie após trocar.

| Modelo | Tamanho | Qualidade |
|---|---|---|
| `tiny` | ~75 MB | baixa |
| `base` | ~150 MB | boa (padrão) |
| `small` | ~500 MB | muito boa |
| `medium` | ~1.5 GB | ótima (recomendado para PT-BR) |
| `large-v3` | ~3 GB | máxima |

---

## Troubleshooting

**Erro `av` no pip install** — Python 3.13/3.14. Use `py -3.12 -m venv .venv`.

**ffmpeg não encontrado** — Feche e reabra o terminal após `winget install Gyan.FFmpeg`.

**Servidor de transcrição não está rodando** — Verifique se `PYTHON_EXECUTABLE` no `.env.local` aponta para `.venv/Scripts/python.exe` e se o `pip install` foi concluído com sucesso.

**ModuleNotFoundError: requests** — Rode `pip install requests` com o venv ativo.
