# Use Claude API

Acessa a API da Anthropic (Claude) para tarefas de IA nos projetos de vídeo: geração de scripts, análise de transcrições, sugestão de cortes, geração de legendas criativas.

## Como usar

```
/use-claude <tarefa>
```

**Exemplos:**
- `/use-claude gera um script de 60s sobre holding familiar a partir deste transcript: <texto>`
- `/use-claude sugere títulos para este vídeo: <resumo>`
- `/use-claude reescreve estas legendas em tom mais formal: <legendas>`
- `/use-claude analisa este transcript e indica os melhores trechos para corte`

## Modelos disponíveis

| Modelo | Uso recomendado |
|--------|----------------|
| `claude-opus-4-7` | Tarefas complexas, análise longa de transcript |
| `claude-sonnet-4-6` | Uso geral, geração de scripts (padrão) |
| `claude-haiku-4-5` | Tarefas rápidas, legendas, títulos |

## Pré-requisito

```bash
export ANTHROPIC_API_KEY="sua-chave"
```

## Exemplo de código

```python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Seu prompt aqui"}]
)
print(message.content[0].text)
```

## Integração com os projetos

- **video-use**: Claude analisa transcript e sugere pontos de corte
- **editor**: Claude gera descrições contextuais para `animation_gen.py`
- **my-kohlvideos**: Claude gera código de composições Remotion

Consulte a skill built-in `/claude-api` para ajuda com código SDK avançado (caching, tool use, batch).
