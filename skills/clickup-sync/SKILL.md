---
name: clickup-sync
description: Sincroniza tarefas do ClickUp com o NotebookLM, executa atos de ação via Claude e salva o resumo no Obsidian. Use quando o usuário pedir para sincronizar tarefas, gerar resumos de projetos, ou executar ações pendentes do ClickUp.
---

# ClickUp → NotebookLM → Claude → Obsidian

## O que este skill faz

1. **Busca tarefas** abertas de uma lista/espaço do ClickUp
2. **Envia ao NotebookLM** como fonte de texto no notebook configurado
3. **Pede ao NotebookLM** um resumo executivo + lista de atos de execução pendentes
4. **Para cada ato**, solicita ao Claude que analise e execute ou descreva a ação concreta
5. **Salva tudo** como nota markdown no Obsidian (`ClickUp Sync/YYYY-MM-DD <label>.md`)

## Configuração (variáveis de ambiente)

```bash
export CLICKUP_API_KEY="pk_..."          # Token pessoal do ClickUp
export CLICKUP_LIST_ID="..."             # ID da lista (Settings → List → Copy ID)
export NOTEBOOKLM_NOTEBOOK_ID="ccaae8d7-bc1d-4e6d-9630-e5c6260882d0"
export ANTHROPIC_API_KEY="sk-ant-..."
export OBSIDIAN_VAULT_PATH="/caminho/para/vault"
```

Autenticação do NotebookLM: cookies em `~/.notebooklm/storage_state.json`
ou via `NOTEBOOKLM_AUTH_JSON` (ver `import_cookies.py`).

## Como invocar

```
/clickup-sync
/clickup-sync Revisão Semanal
/clickup-sync Sprint 42
```

O argumento opcional vira o título da nota no Obsidian.

## Processo

Ao ser invocado, o skill deve:

1. Verificar variáveis de ambiente obrigatórias (`CLICKUP_API_KEY`, `CLICKUP_LIST_ID`,
   `ANTHROPIC_API_KEY`, `OBSIDIAN_VAULT_PATH`). Se alguma faltar, informar o usuário
   e parar.

2. Verificar autenticação do NotebookLM (`~/.notebooklm/storage_state.json` ou
   `NOTEBOOKLM_AUTH_JSON`). Se ausente, orientar o usuário a rodar `import_cookies.py`.

3. Executar o pipeline principal:
   ```bash
   python clickup_notebooklm_obsidian.py "<label>"
   ```
   onde `<label>` é o argumento passado ao skill (padrão: "Sync ClickUp").

4. Reportar ao usuário:
   - Quantas tarefas foram encontradas
   - Quantos atos de execução foram identificados e processados
   - Caminho completo da nota salva no Obsidian

## Atos de execução

O NotebookLM identifica atos no formato:
```
ATO: <descrição da ação>
TAREFA: <tarefa relacionada>
```

Claude recebe o contexto completo das tarefas e executa ou descreve cada ato.
Exemplos de atos que Claude pode executar diretamente:
- Redigir comunicação / e-mail sobre a tarefa
- Sugerir próximos passos concretos
- Identificar bloqueios e propor solução
- Priorizar lista de tarefas com justificativa

Atos que requerem ação externa (criar subtarefa no ClickUp, enviar mensagem,
atualizar prazo) são descritos em detalhes para o usuário executar.

## Nota gerada no Obsidian

```markdown
# Sync ClickUp — 2025-01-15
*Gerado em: 2025-01-15 14:32*

---
## Resumo NotebookLM
<resumo executivo das tarefas>

---
## Atos de Execução — Resultados Claude

### <ato 1>
**Tarefa:** <tarefa relacionada>
<resultado/recomendação do Claude>

---
## Tarefas ClickUp (raw)
<markdown completo das tarefas>
```

## Script principal

O pipeline está em `clickup_notebooklm_obsidian.py` na raiz do repositório.
O script de importação de cookies está em `import_cookies.py`.

## Erros comuns

| Erro | Causa | Solução |
|------|-------|---------|
| `CLICKUP_API_KEY não definida` | Variável ausente | `export CLICKUP_API_KEY="pk_..."` |
| `FileNotFoundError: storage_state.json` | Sem auth NotebookLM | Rodar `import_cookies.py` |
| `401 Unauthorized` no ClickUp | Token inválido ou expirado | Gerar novo token em ClickUp → Settings → Apps |
| `ValueError: Required cookies missing` | Cookies Google expirados | Re-exportar cookies e rodar `import_cookies.py` |
| `OBSIDIAN_VAULT_PATH` não encontrado | Caminho incorreto | Verificar caminho com `ls $OBSIDIAN_VAULT_PATH` |
