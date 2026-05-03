# Render Video

Executa o pipeline completo de produção de vídeo: transcrição → EDL automático → animações → render final MP4.

## Como usar

```
/render-video <caminho-do-video> [--output <nome-saida>]
```

**Exemplos:**
- `/render-video raw/entrevista.mp4`
- `/render-video raw/aula.mp4 --output aula-final`

## O que faz

1. **Transcreve** o áudio via ElevenLabs Scribe (`video-use`)
2. **Empacota** o transcript em markdown por frases
3. **Gera EDL automático** — corta silêncios e repetições (`editor/auto_edl.py`)
4. **Cria animações contextuais** — title cards e lower-thirds via Hyperframes (`editor/animation_gen.py`)
5. **Renderiza o MP4 final** com color grading, loudnorm e legendas

## Pré-requisitos

- `ELEVENLABS_API_KEY` configurada no ambiente
- FFmpeg instalado (`ffmpeg --version`)
- Python 3.10+ com deps do `editor/` instaladas
- Hyperframes CLI disponível (`bun run --cwd hyperframes cli`)

## Execução

!cd /home/user/kohladvogados && python editor/pipeline.py "$ARGUMENTS"
