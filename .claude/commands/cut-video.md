# Cut Video

Corta filler words, silêncios e repetições de um vídeo usando o `video-use` com precisão de word-boundary via ElevenLabs Scribe.

## Como usar

```
/cut-video <caminho-do-video> [--output <nome-saida>]
```

**Exemplos:**
- `/cut-video raw/podcast.mp4`
- `/cut-video raw/tutorial.mp4 --output tutorial-cortado`

## O que faz

- Transcreve o áudio com timestamps por palavra (ElevenLabs Scribe)
- Detecta e remove: silêncios longos, "ãh", "né", "então", repetições
- Aplica fades de 30ms nas bordas de cada corte
- Gera legendas em chunks de 2 palavras em MAIÚSCULAS
- Produz `project.md` com memória da sessão para ajustes posteriores

## Pré-requisitos

- `ELEVENLABS_API_KEY` configurada no ambiente
- FFmpeg instalado
- Python 3.10+ com `librosa`, `requests`, `numpy`

## Execução

!cd /home/user/kohladvogados && python video-use/cut.py "$ARGUMENTS"
