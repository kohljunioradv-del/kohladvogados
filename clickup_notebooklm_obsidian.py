#!/usr/bin/env python3
"""
Pipeline: ClickUp → NotebookLM → Claude → Obsidian

Fluxo:
  1. Busca tarefas do ClickUp (via REST API)
  2. Formata e envia ao NotebookLM como fonte de texto
  3. Pede ao NotebookLM um resumo + atos de execução identificados
  4. Para cada ato de execução, solicita ao Claude que execute
  5. Salva o resultado final como nota no Obsidian

Variáveis de ambiente necessárias:
  CLICKUP_API_KEY        - Token da API do ClickUp
  CLICKUP_LIST_ID        - ID da lista (ou CLICKUP_SPACE_ID / CLICKUP_FOLDER_ID)
  NOTEBOOKLM_NOTEBOOK_ID - ID do notebook (ex: ccaae8d7-bc1d-4e6d-9630-e5c6260882d0)
  ANTHROPIC_API_KEY      - Chave da API da Anthropic
  OBSIDIAN_VAULT_PATH    - Caminho absoluto para o vault do Obsidian
  NOTEBOOKLM_AUTH_JSON   - JSON de cookies (opcional se storage_state.json existir)
"""

import asyncio
import json
import os
import sys
from datetime import datetime
from pathlib import Path

import anthropic
import httpx
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────

CLICKUP_API_KEY = os.environ.get("CLICKUP_API_KEY", "")
CLICKUP_LIST_ID = os.environ.get("CLICKUP_LIST_ID", "")
NOTEBOOK_ID = os.environ.get("NOTEBOOKLM_NOTEBOOK_ID", "ccaae8d7-bc1d-4e6d-9630-e5c6260882d0")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OBSIDIAN_VAULT = Path(os.environ.get("OBSIDIAN_VAULT_PATH", str(Path.home() / "obsidian")))
CLAUDE_MODEL = "claude-sonnet-4-6"

CLICKUP_HEADERS = {"Authorization": CLICKUP_API_KEY, "Content-Type": "application/json"}


# ──────────────────────────────────────────────
# 1. ClickUp: buscar tarefas
# ──────────────────────────────────────────────

async def fetch_clickup_tasks() -> list[dict]:
    """Busca tarefas abertas da lista configurada."""
    if not CLICKUP_API_KEY:
        raise ValueError("CLICKUP_API_KEY não definida.")
    if not CLICKUP_LIST_ID:
        raise ValueError("CLICKUP_LIST_ID não definida.")

    url = f"https://api.clickup.com/api/v2/list/{CLICKUP_LIST_ID}/task"
    params = {"include_closed": "false", "subtasks": "true", "page": 0}
    tasks = []

    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            r = await client.get(url, headers=CLICKUP_HEADERS, params=params)
            r.raise_for_status()
            data = r.json()
            batch = data.get("tasks", [])
            tasks.extend(batch)
            if not data.get("last_page", True):
                params["page"] += 1
            else:
                break

    return tasks


def format_tasks_as_markdown(tasks: list[dict]) -> str:
    """Converte lista de tarefas em markdown estruturado."""
    lines = [f"# Tarefas ClickUp — {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"]
    for t in tasks:
        status = t.get("status", {}).get("status", "sem status")
        due = t.get("due_date")
        due_str = datetime.fromtimestamp(int(due) / 1000).strftime("%Y-%m-%d") if due else "sem prazo"
        assignees = ", ".join(a.get("username", "") for a in t.get("assignees", [])) or "não atribuído"
        desc = (t.get("description") or "").strip()

        lines.append(f"## {t['name']}")
        lines.append(f"- **Status:** {status}")
        lines.append(f"- **Prazo:** {due_str}")
        lines.append(f"- **Responsável:** {assignees}")
        if desc:
            lines.append(f"- **Descrição:** {desc[:500]}")
        lines.append("")

    return "\n".join(lines)


# ──────────────────────────────────────────────
# 2. NotebookLM: adicionar fonte e obter resumo
# ──────────────────────────────────────────────

async def push_to_notebooklm(content: str, title: str) -> str:
    """Adiciona o conteúdo como fonte e retorna o resumo gerado pelo NotebookLM."""
    auth = await AuthTokens.from_storage()
    async with NotebookLMClient(auth) as client:
        print(f"  → Adicionando fonte '{title}' ao NotebookLM...")
        await client.sources.add_text(
            notebook_id=NOTEBOOK_ID,
            title=title,
            content=content,
            wait=True,
        )

        print("  → Solicitando resumo + atos de execução ao NotebookLM...")
        prompt = (
            "Com base nas tarefas adicionadas, forneça:\n"
            "1. Um resumo executivo das tarefas em andamento.\n"
            "2. Uma lista de ATOS DE EXECUÇÃO pendentes — tarefas que requerem "
            "ação concreta (aprovação, criação de subtarefa, atualização de prazo, "
            "envio de comunicação, etc.).\n"
            "Formato da lista de atos:\n"
            "ATO: <descrição curta e objetiva da ação necessária>\n"
            "TAREFA: <nome da tarefa relacionada>\n"
        )
        response = await client.chat.ask(notebook_id=NOTEBOOK_ID, query=prompt)
        return response.text if hasattr(response, "text") else str(response)


# ──────────────────────────────────────────────
# 3. Claude: executar atos de execução
# ──────────────────────────────────────────────

def parse_action_items(notebooklm_response: str) -> list[dict]:
    """Extrai atos de execução da resposta do NotebookLM."""
    items = []
    lines = notebooklm_response.splitlines()
    current: dict = {}
    for line in lines:
        if line.startswith("ATO:"):
            if current:
                items.append(current)
            current = {"ato": line[4:].strip(), "tarefa": ""}
        elif line.startswith("TAREFA:") and current:
            current["tarefa"] = line[7:].strip()
    if current:
        items.append(current)
    return items


def execute_with_claude(action_items: list[dict], tasks_md: str) -> list[dict]:
    """Envia cada ato ao Claude para execução/análise."""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY não definida.")
    if not action_items:
        return []

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    results = []

    for item in action_items:
        print(f"  → Claude executando: {item['ato'][:60]}...")
        prompt = (
            f"Contexto das tarefas do ClickUp:\n\n{tasks_md}\n\n"
            f"Ato de execução identificado:\n"
            f"ATO: {item['ato']}\n"
            f"TAREFA RELACIONADA: {item['tarefa']}\n\n"
            "Execute ou analise este ato. Se for uma ação que requer interação "
            "externa (envio de e-mail, publicação, etc.), descreva exatamente "
            "o que deve ser feito. Se for uma análise ou decisão, forneça a "
            "recomendação objetiva. Seja conciso."
        )
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        results.append({
            "ato": item["ato"],
            "tarefa": item["tarefa"],
            "resultado": message.content[0].text,
        })

    return results


# ──────────────────────────────────────────────
# 4. Obsidian: salvar resumo
# ──────────────────────────────────────────────

def save_to_obsidian(
    tasks_md: str,
    notebooklm_summary: str,
    claude_results: list[dict],
    title: str,
) -> Path:
    """Salva o resultado final como nota markdown no Obsidian."""
    notes_dir = OBSIDIAN_VAULT / "ClickUp Sync"
    notes_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    safe_title = title.replace("/", "-").replace(":", "")
    filename = f"{datetime.now().strftime('%Y-%m-%d')} {safe_title}.md"
    note_path = notes_dir / filename

    sections = [
        f"# {title}",
        f"*Gerado em: {timestamp}*\n",
        "---",
        "## Resumo NotebookLM",
        notebooklm_summary,
    ]

    if claude_results:
        sections += ["", "---", "## Atos de Execução — Resultados Claude", ""]
        for r in claude_results:
            sections.append(f"### {r['ato']}")
            if r["tarefa"]:
                sections.append(f"**Tarefa:** {r['tarefa']}\n")
            sections.append(r["resultado"])
            sections.append("")

    sections += ["", "---", "## Tarefas ClickUp (raw)", tasks_md]

    note_path.write_text("\n".join(sections), encoding="utf-8")
    return note_path


# ──────────────────────────────────────────────
# Orquestrador principal
# ──────────────────────────────────────────────

async def run(label: str = "Sync ClickUp") -> None:
    title = f"{label} — {datetime.now().strftime('%Y-%m-%d')}"

    print("▶ 1/4 Buscando tarefas do ClickUp...")
    tasks = await fetch_clickup_tasks()
    print(f"   {len(tasks)} tarefa(s) encontrada(s).")
    tasks_md = format_tasks_as_markdown(tasks)

    print("▶ 2/4 Enviando ao NotebookLM...")
    notebooklm_summary = await push_to_notebooklm(tasks_md, title)
    print("   Resumo recebido.")

    print("▶ 3/4 Identificando e executando atos com Claude...")
    action_items = parse_action_items(notebooklm_summary)
    print(f"   {len(action_items)} ato(s) de execução identificado(s).")
    claude_results = execute_with_claude(action_items, tasks_md)

    print("▶ 4/4 Salvando no Obsidian...")
    note_path = save_to_obsidian(tasks_md, notebooklm_summary, claude_results, title)
    print(f"   ✓ Nota salva: {note_path}")

    print(f"\n✅ Pipeline concluído — {len(tasks)} tarefas · {len(action_items)} atos executados")


def main() -> None:
    label = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Sync ClickUp"
    asyncio.run(run(label))


if __name__ == "__main__":
    main()
