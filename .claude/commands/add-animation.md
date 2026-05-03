# Add Animation

Gera um overlay Hyperframes contextual (title card, lower-third, bug de canal) para um trecho específico do vídeo, baseado no transcript.

## Como usar

```
/add-animation <tipo> "<texto>" [--at <timecode>] [--duration <segundos>]
```

**Exemplos:**
- `/add-animation lower-third "Dr. João Silva | Especialista Tributário" --at 00:01:23`
- `/add-animation title "Capítulo 2: Holding Familiar" --at 00:05:00 --duration 3`
- `/add-animation bug "AO VIVO" --at 00:00:00`

## Tipos disponíveis

| Tipo | Descrição |
|------|-----------|
| `lower-third` | Nome e cargo, entra pela esquerda |
| `title` | Título centralizado com fundo semi-transparente |
| `bug` | Ícone/texto no canto superior direito |
| `cta` | Call-to-action na parte inferior |

## O que faz

1. Gera a composição Hyperframes (HTML/CSS animado) via `editor/animation_gen.py`
2. Renderiza o overlay como vídeo transparente (WebM com alpha)
3. Posiciona no timecode indicado via FFmpeg overlay filter
4. Salva o resultado em `output/with-animations/`

## Pré-requisitos

- Hyperframes CLI instalado (`bun run --cwd hyperframes cli`)
- FFmpeg com suporte a libvpx (para WebM com alpha)

## Execução

!cd /home/user/kohladvogados && python editor/animation_gen.py "$ARGUMENTS"
