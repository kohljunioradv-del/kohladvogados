# Use GitHub

Acessa o repositório `kohljunioradv-del/kohladvogados` no GitHub para gerenciar issues, PRs, branches e releases dos projetos de vídeo.

## Como usar

```
/use-github <ação>
```

**Exemplos:**
- `/use-github abre uma issue: pipeline falha ao processar vídeos com acentos no nome`
- `/use-github lista os PRs abertos`
- `/use-github cria uma branch para nova feature: suporte a múltiplos idiomas no cut-video`
- `/use-github mostra o status do último commit`
- `/use-github fecha a issue #12 com comentário explicando a solução`

## Ações disponíveis

### Issues
- Criar, listar, fechar, comentar em issues
- Buscar issues por label ou status

### Pull Requests
- Listar PRs abertos/fechados
- Ver detalhes e comentários de um PR
- Criar PR com título e descrição

### Branches & Commits
- Criar branches a partir de `main`
- Ver histórico de commits
- Ver conteúdo de arquivos no repositório

### Releases
- Listar releases existentes
- Ver a última release

## Repositório

`kohljunioradv-del/kohladvogados`

Branch de desenvolvimento atual: `claude/setup-video-project-FiDq8`

## Projetos no repositório

| Pasta | Descrição |
|-------|-----------|
| `my-kohlvideos/` | Composições Remotion |
| `editor/` | Pipeline de produção (Python) |
| `video-use/` | Corte inteligente de vídeo |
| `hyperframes/` | Renderização HTML-to-video |
| `.claude/commands/` | Skills customizadas |

## Observação

As operações GitHub nesta sessão usam o servidor MCP GitHub já configurado. Não é necessário `gh` CLI nem token manual.
