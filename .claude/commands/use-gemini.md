# Use Gemini API

Acessa a API do Google Gemini para tarefas de visão computacional e análise de vídeo: descrição de cenas, extração de contexto visual, geração de thumbnails alternativos.

## Como usar

```
/use-gemini <tarefa>
```

**Exemplos:**
- `/use-gemini descreve as cenas deste vídeo para gerar overlays contextuais: <caminho-video>`
- `/use-gemini extrai os momentos mais expressivos do apresentador em: <caminho-video>`
- `/use-gemini gera 5 opções de título para este vídeo baseado nas cenas`
- `/use-gemini transcreve e traduz o áudio deste vídeo para inglês`

## Modelos disponíveis

| Modelo | Uso recomendado |
|--------|----------------|
| `gemini-2.5-pro` | Análise profunda de vídeo, raciocínio complexo |
| `gemini-2.5-flash` | Análise rápida, tarefas gerais (padrão) |
| `gemini-2.0-flash-lite` | Tarefas simples, baixo custo |

## Pré-requisito

```bash
export GEMINI_API_KEY="sua-chave"
# ou via Google AI Studio: https://aistudio.google.com/apikey
```

## Exemplo de código (análise de vídeo)

```python
import google.generativeai as genai
import os

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-2.5-flash")

# Upload do vídeo
video_file = genai.upload_file("meu-video.mp4")

response = model.generate_content([
    video_file,
    "Descreva as cenas principais e sugira títulos para overlays"
])
print(response.text)
```

## Instalação do SDK

```bash
pip install google-generativeai
```

## Integração com os projetos

- **editor**: Gemini analisa cenas → `animation_gen.py` cria overlays contextuais
- **video-use**: Gemini identifica momentos de alto impacto para preservar nos cortes
- **my-kohlvideos**: Gemini descreve frames → Remotion recria como animação
