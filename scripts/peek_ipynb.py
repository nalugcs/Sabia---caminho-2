#!/usr/bin/env python3
"""Peek resumido do notebook local_ai_tcc.ipynb"""
import json, sys

path = "/home/z/my-project/upload/local_ai_tcc.ipynb"
with open(path, encoding="utf-8") as f:
    nb = json.load(f)

cells = nb.get("cells", [])
print(f"Total de células: {len(cells)}")
print(f"Kernel: {nb.get('metadata', {}).get('kernelspec', {}).get('display_name', '?')}")
print("=" * 60)

for i, c in enumerate(cells):
    kind = c.get("cell_type")
    src = "".join(c.get("source", []))
    lines = [l for l in src.split("\n") if l.strip()]
    if kind == "markdown":
        print(f"\n[{i}] MD: {lines[0][:100] if lines else '(vazio)'}")
        if len(lines) > 1:
            print(f"     {lines[1][:100]}")
    else:
        first = lines[0][:90] if lines else "(vazio)"
        print(f"\n[{i}] CODE: {first}")
        if len(lines) > 1:
            print(f"     (+{len(lines)-1} linhas)")
        # resumo de outputs
        outs = c.get("outputs", [])
        kinds = [o.get("output_type") for o in outs]
        if kinds:
            print(f"     outputs: {kinds}")
