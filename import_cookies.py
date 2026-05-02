#!/usr/bin/env python3
"""
Converte cookies exportados do navegador para o formato storage_state.json
do notebooklm-py.

Uso:
    python import_cookies.py cookies.json

O arquivo cookies.json deve ser exportado pela extensão Cookie-Editor ou
EditThisCookie no formato JSON padrão.
"""

import json
import sys
from pathlib import Path

REQUIRED_COOKIES = {"SID"}
IMPORTANT_COOKIES = {
    "SID", "HSID", "SSID", "APISID", "SAPISID",
    "__Secure-1PSID", "__Secure-3PSID",
    "__Secure-1PAPISID", "__Secure-3PAPISID",
    "NID", "SIDCC",
}
GOOGLE_DOMAINS = {".google.com", "google.com", ".notebooklm.google.com"}

OUTPUT_PATH = Path.home() / ".notebooklm" / "storage_state.json"


def load_input(path: str) -> list[dict]:
    with open(path) as f:
        data = json.load(f)
    # Cookie-Editor exporta lista; EditThisCookie também
    if isinstance(data, list):
        return data
    # Formato Playwright já pronto — passa direto
    if isinstance(data, dict) and "cookies" in data:
        return data["cookies"]
    raise ValueError("Formato de cookie não reconhecido.")


def convert(raw_cookies: list[dict]) -> dict:
    cookies = []
    for c in raw_cookies:
        name = c.get("name", "")
        domain = c.get("domain", "")
        # Filtra só cookies do Google relevantes
        if not any(d in domain for d in GOOGLE_DOMAINS):
            continue
        cookies.append({
            "name": name,
            "value": c.get("value", ""),
            "domain": domain if domain.startswith(".") else f".{domain}",
            "path": c.get("path", "/"),
            "secure": c.get("secure", True),
            "httpOnly": c.get("httpOnly", False),
            "sameSite": c.get("sameSite", "None"),
        })
    return {"cookies": cookies, "origins": []}


def validate(storage: dict) -> None:
    names = {c["name"] for c in storage["cookies"]}
    missing = REQUIRED_COOKIES - names
    if missing:
        raise ValueError(f"Cookies obrigatórios ausentes: {missing}")
    found = names & IMPORTANT_COOKIES
    print(f"  Cookies encontrados: {sorted(found)}")
    absent = IMPORTANT_COOKIES - names
    if absent:
        print(f"  Aviso — cookies opcionais ausentes: {sorted(absent)}")


def main() -> None:
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)

    input_path = sys.argv[1]
    print(f"Lendo: {input_path}")
    raw = load_input(input_path)
    storage = convert(raw)
    validate(storage)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(storage, indent=2))
    print(f"Salvo em: {OUTPUT_PATH}")
    print("\nPróximos passos:")
    print(f"  notebooklm use ccaae8d7-bc1d-4e6d-9630-e5c6260882d0")
    print(f"  notebooklm list")


if __name__ == "__main__":
    main()
