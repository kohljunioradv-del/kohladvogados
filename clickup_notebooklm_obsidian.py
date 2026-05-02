#!/usr/bin/env python3
"""
Pipeline: ClickUp → NotebookLM → Claude → Obsidian

Fluxo:
  1. Percorre toda a hierarquia do workspace ClickUp (Team → Spaces → Folders → Lists)
  2. Coleta tarefas abertas de todas as listas
  3. Formata e envia ao NotebookLM como fonte de texto
  4. Pede ao NotebookLM um resumo + atos de execução identificados
  5. Para cada ato de execução, solicita ao Claude que execute
  6. Salva o resultado final como nota no Obsidian

Variáveis de ambiente necessárias:
  CLICKUP_API_KEY        - Token pessoal do ClickUp
  CLICKUP_TEAM_ID        - ID do workspace/team (número após pk_ na API key)
  NOTEBOOKLM_NOTEBOOK_ID - ID do notebook NotebookLM
  ANTHROPIC_API_KEY      - Chave da API da Anthropic
  OBSIDIAN_VAULT_PATH    - Caminho absoluto para o vault do Obsidian
  NOTEBOOKLM_AUTH_JSON   - JSON de cookies (opcional se storage_state.json existir)

Filtros opcionais:
  CLICKUP_SPACE_IDS      - IDs de spaces separados por vírgula (filtra spaces específicos)
  CLICKUP_INCLUDE_CLOSED - "true" para incluir tarefas fechadas (padrão: false)
"""

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# Carrega .env se existir (sem dependências externas)
_env_file = Path(__file__).parent / ".env"
if _env_file.exists():
    for _line in _env_file.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

import anthropic
import httpx
from notebooklm import NotebookLMClient
from notebooklm.auth import AuthTokens

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────

CLICKUP_API_KEY = os.environ.get("CLICKUP_API_KEY", "")
CLICKUP_TEAM_ID = os.environ.get("CLICKUP_TEAM_ID", "")
CLICKUP_SPACE_IDS = [s.strip() for s in os.environ.get("CLICKUP_SPACE_IDS", "").split(",") if s.strip()]
INCLUDE_CLOSED = os.environ.get("CLICKUP_INCLUDE_CLOSED", "false").lower() == "true"

NOTEBOOK_ID = os.environ.get("NOTEBOOKLM_NOTEBOOK_ID", "ccaae8d7-bc1d-4e6d-9630-e5c6260882d0")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OBSIDIAN_VAULT = Path(os.environ.get("OBSIDIAN_VAULT_PATH", str(Path.home() / "obsidian")))
CLAUDE_MODEL = "claude-sonnet-4-6"

HEADERS = {"Authorization": CLICKUP_API_KEY, "Content-Type": "application/json"}
BASE = "https://api.clickup.com/api/v2"


# ──────────────────────────────────────────────
# 1. ClickUp: percorrer hierarquia completa
# ──────────────────────────────────────────────

async def get(client: httpx.AsyncClient, path: str, params: dict = {}) -> dict:
    r = await client.get(f"{BASE}{path}", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()


async def fetch_spaces(client: httpx.AsyncClient) -> list[dict]:
    data = await get(client, f"/team/{CLICKUP_TEAM_ID}/space", {"archived": "false"})
    spaces = data.get("spaces", [])
    if CLICKUP_SPACE_IDS:
        spaces = [s for s in spaces if s["id"] in CLICKUP_SPACE_IDS]
    return spaces


async def fetch_lists_in_space(client: httpx.AsyncClient, space_id: str) -> list[dict]:
    """Retorna todas as listas do space: dentro de folders e folderless."""
    lists = []

    # Folders → Lists
    folders_data = await get(client, f"/space/{space_id}/folder", {"archived": "false"})
    for folder in folders_data.get("folders", []):
        folder_lists = await get(client, f"/folder/{folder['id']}/list", {"archived": "false"})
        for lst in folder_lists.get("lists", []):
            lst["_folder_name"] = folder["name"]
            lst["_space_id"] = space_id
            lists.append(lst)

    # Folderless lists
    folderless = await get(client, f"/space/{space_id}/list", {"archived": "false"})
    for lst in folderless.get("lists", []):
        lst["_folder_name"] = None
        lst["_space_id"] = space_id
        lists.append(lst)

    return lists


async def fetch_tasks_in_list(client: httpx.AsyncClient, list_id: str) -> list[dict]:
    tasks = []
    page = 0
    while True:
        data = await get(client, f"/list/{list_id}/task", {
            "include_closed": str(INCLUDE_CLOSED).lower(),
            "subtasks": "true",
            "page": page,
        })
        batch = data.get("tasks", [])
        tasks.extend(batch)
        if data.get("last_page", True):
            break
        page += 1
    return tasks


async def fetch_all_tasks() -> tuple[list[dict], dict]:
    """
    Retorna (tasks, estrutura) onde estrutura é:
    { space_name: { folder_name|None: { list_name: [tasks] } } }
    """
    if not CLICKUP_API_KEY:
        raise ValueError("CLICKUP_API_KEY não definida.")
    if not CLICKUP_TEAM_ID:
        raise ValueError("CLICKUP_TEAM_ID não definida.")

    all_tasks: list[dict] = []
    structure: dict = {}

    async with httpx.AsyncClient(timeout=30) as client:
        spaces = await fetch_spaces(client)
        print(f"   {len(spaces)} space(s) encontrado(s).")

        for space in spaces:
            space_name = space["name"]
            structure[space_name] = {}
            lists = await fetch_lists_in_space(client, space["id"])
            print(f"   [{space_name}] {len(lists)} lista(s).")

            # Busca tarefas de todas as listas em paralelo
            async def load_list(lst: dict) -> tuple[dict, list[dict]]:
                tasks = await fetch_tasks_in_list(client, lst["id"])
                return lst, tasks

            results = await asyncio.gather(*[load_list(lst) for lst in lists])

            for lst, tasks in results:
                folder_name = lst.get("_folder_name")
                list_name = lst["name"]
                if folder_name not in structure[space_name]:
                    structure[space_name][folder_name] = {}
                structure[space_name][folder_name][list_name] = tasks
                for t in tasks:
                    t["_space_name"] = space_name
                    t["_folder_name"] = folder_name
                    t["_list_name"] = list_name
                all_tasks.extend(tasks)

    return all_tasks, structure


def format_tasks_as_markdown(structure: dict) -> str:
    """Converte a estrutura hierárquica em markdown organizado por Space/Folder/List."""
    lines = [f"# Tarefas ClickUp — {datetime.now().strftime('%Y-%m-%d %H:%M')}\n"]

    for space_name, folders in structure.items():
        lines.append(f"# Space: {space_name}\n")
        for folder_name, lists in folders.items():
            if folder_name:
                lines.append(f"## Folder: {folder_name}\n")
            for list_name, tasks in lists.items():
                lines.append(f"{'###' if folder_name else '##'} Lista: {list_name} ({len(tasks)} tarefas)\n")
                if not tasks:
                    lines.append("*Sem tarefas abertas.*\n")
                    continue
                for t in tasks:
                    status = t.get("status", {}).get("status", "sem status")
                    due = t.get("due_date")
                    due_str = (
                        datetime.fromtimestamp(int(due) / 1000).strftime("%Y-%m-%d")
                        if due else "sem prazo"
                    )
                    assignees = (
                        ", ".join(a.get("username", "") for a in t.get("assignees", []))
                        or "não atribuído"
                    )
                    desc = (t.get("description") or "").strip()
                    priority = (t.get("priority") or {}).get("priority", "")

                    lines.append(f"#### {t['name']}")
                    lines.append(f"- **Status:** {status}")
                    if priority:
                        lines.append(f"- **Prioridade:** {priority}")
                    lines.append(f"- **Prazo:** {due_str}")
                    lines.append(f"- **Responsável:** {assignees}")
                    if desc:
                        lines.append(f"- **Descrição:** {desc[:400]}")
                    lines.append("")

    return "\n".join(lines)


# ──────────────────────────────────────────────
# 2. NotebookLM: adicionar fonte e obter resumo
# ──────────────────────────────────────────────

async def push_to_notebooklm(content: str, title: str) -> str:
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
            "Com base nas tarefas de todos os spaces e listas do ClickUp adicionadas, forneça:\n"
            "1. Um resumo executivo por space, destacando o que está em andamento, "
            "atrasado ou bloqueado.\n"
            "2. Uma lista de ATOS DE EXECUÇÃO pendentes — ações concretas necessárias "
            "(aprovação, criação de subtarefa, atualização de prazo, comunicação, etc.).\n\n"
            "Formato obrigatório para cada ato:\n"
            "ATO: <descrição curta e objetiva da ação>\n"
            "TAREFA: <nome da tarefa relacionada>\n"
            "LISTA: <nome da lista>\n"
        )
        response = await client.chat.ask(notebook_id=NOTEBOOK_ID, query=prompt)
        return response.text if hasattr(response, "text") else str(response)


# ──────────────────────────────────────────────
# 3. Claude: executar atos de execução
# ──────────────────────────────────────────────

def parse_action_items(notebooklm_response: str) -> list[dict]:
    items = []
    lines = notebooklm_response.splitlines()
    current: dict = {}
    for line in lines:
        if line.startswith("ATO:"):
            if current:
                items.append(current)
            current = {"ato": line[4:].strip(), "tarefa": "", "lista": ""}
        elif line.startswith("TAREFA:") and current:
            current["tarefa"] = line[7:].strip()
        elif line.startswith("LISTA:") and current:
            current["lista"] = line[6:].strip()
    if current:
        items.append(current)
    return items


def execute_with_claude(action_items: list[dict], tasks_md: str) -> list[dict]:
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY não definida.")
    if not action_items:
        return []

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    results = []

    for item in action_items:
        print(f"  → Claude: {item['ato'][:70]}...")
        prompt = (
            f"Contexto — tarefas do workspace ClickUp:\n\n{tasks_md[:6000]}\n\n"
            f"Ato de execução identificado:\n"
            f"ATO: {item['ato']}\n"
            f"TAREFA: {item['tarefa']}\n"
            f"LISTA: {item['lista']}\n\n"
            "Execute ou analise este ato de forma objetiva. Se requer ação externa "
            "(e-mail, publicação, etc.), descreva exatamente o que fazer. "
            "Se for análise ou decisão, dê a recomendação direta. Seja conciso."
        )
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        results.append({**item, "resultado": message.content[0].text})

    return results


# ──────────────────────────────────────────────
# 4. Obsidian: salvar resumo
# ──────────────────────────────────────────────

def save_to_obsidian(
    tasks_md: str,
    notebooklm_summary: str,
    claude_results: list[dict],
    title: str,
    total_tasks: int,
) -> Path:
    notes_dir = OBSIDIAN_VAULT / "ClickUp Sync"
    notes_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    safe_title = title.replace("/", "-").replace(":", "")
    note_path = notes_dir / f"{datetime.now().strftime('%Y-%m-%d')} {safe_title}.md"

    sections = [
        f"# {title}",
        f"*Gerado em: {timestamp} · {total_tasks} tarefas sincronizadas*\n",
        "---",
        "## Resumo NotebookLM",
        notebooklm_summary,
    ]

    if claude_results:
        sections += ["", "---", "## Atos de Execução — Resultados Claude", ""]
        for r in claude_results:
            sections.append(f"### {r['ato']}")
            if r["tarefa"]:
                sections.append(f"**Tarefa:** {r['tarefa']}  ")
            if r["lista"]:
                sections.append(f"**Lista:** {r['lista']}\n")
            sections.append(r["resultado"])
            sections.append("")

    sections += ["", "---", "## Tarefas ClickUp (completo)", tasks_md]
    note_path.write_text("\n".join(sections), encoding="utf-8")
    return note_path


# ──────────────────────────────────────────────
# Orquestrador
# ──────────────────────────────────────────────

async def run(label: str = "Sync ClickUp") -> None:
    title = f"{label} — {datetime.now().strftime('%Y-%m-%d')}"

    print("▶ 1/4 Percorrendo workspace ClickUp (todos os spaces e listas)...")
    all_tasks, structure = await fetch_all_tasks()
    print(f"   Total: {len(all_tasks)} tarefa(s) em {sum(len(f) for s in structure.values() for f in s.values())} lista(s).")
    tasks_md = format_tasks_as_markdown(structure)

    print("▶ 2/4 Enviando ao NotebookLM...")
    notebooklm_summary = await push_to_notebooklm(tasks_md, title)
    print("   Resumo recebido.")

    print("▶ 3/4 Processando atos de execução com Claude...")
    action_items = parse_action_items(notebooklm_summary)
    print(f"   {len(action_items)} ato(s) identificado(s).")
    claude_results = execute_with_claude(action_items, tasks_md)

    print("▶ 4/4 Salvando no Obsidian...")
    note_path = save_to_obsidian(tasks_md, notebooklm_summary, claude_results, title, len(all_tasks))
    print(f"   ✓ Nota salva: {note_path}")

    print(f"\n✅ Concluído — {len(all_tasks)} tarefas · {len(action_items)} atos executados")


def main() -> None:
    label = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "Sync ClickUp"
    asyncio.run(run(label))


if __name__ == "__main__":
    main()
