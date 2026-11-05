#!/usr/bin/env python3
"""Extrai células-chave do notebook: tabela de aulas, MVP, comportamento da IA, PLANO_AULAS (amostra)"""
import json

path = "/home/z/my-project/upload/local_ai_tcc.ipynb"
with open(path, encoding="utf-8") as f:
    nb = json.load(f)
cells = nb.get("cells", [])

def src(i):
    return "".join(cells[i].get("source", []))

print("### CELULA 1 (tabela aulas/nivel) ###")
print(src(1)[:1500])
print("\n### CELULA 2 (arquitetura) ###")
print(src(2)[:1200])
print("\n### CELULA 4 (MVP) ###")
print(src(4)[:1200])
print("\n### CELULA 5 (comportamento IA) ###")
print(src(5)[:1200])
print("\n### CELULA 11 (PLANO_AULAS - primeiras 80 linhas) ###")
print("\n".join(src(11).split("\n")[:80]))
print(f"\n(total de linhas na celula 11: {len(src(11).split(chr(10)))})")
print("\n### CELULA 3 (tabela tecnologias) ###")
print(src(3)[:800])
