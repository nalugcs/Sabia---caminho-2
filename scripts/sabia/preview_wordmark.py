#!/usr/bin/env python3
"""Gera preview HTML do wordmark (3 linhas) a partir de wordmark.json."""
import json

d = json.load(open('/home/z/my-project/scripts/sabia/wordmark.json'))
rows = ""
for key, bg, label in [("primary", "#F6F1E6", "primário"),
                       ("dark", "#243D2C", "negativo"),
                       ("lower", "#F6F1E6", "minúsculo")]:
    v = d[key]
    vb = " ".join(str(x) for x in v["viewBox"])
    inner = ""
    for p in v["paths"]:
        m = " ".join(str(x) for x in p["m"])
        fill = v["letters_fill"] if p["kind"] == "letter" else v["accent_fill"]
        inner += f'<path transform="matrix({m})" d="{p["d"]}" fill="{fill}"/>'
    rows += (f'<div class="row" style="background:{bg}">'
             f'<svg viewBox="{vb}" preserveAspectRatio="xMidYMid meet">{inner}</svg>'
             f'<span class="lbl">{label}</span></div>')
html = f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body {{ margin:0; padding:30px; background:#DDD8CC; display:flex; flex-direction:column; gap:22px; }}
.row {{ width:900px; padding:34px 40px; border-radius:8px; position:relative; }}
.row svg {{ width:820px; height:auto; display:block; }}
.lbl {{ position:absolute; top:8px; left:12px; font:11px sans-serif; color:#999; letter-spacing:2px; text-transform:uppercase; }}
</style></head><body>{rows}</body></html>'''
open('/home/z/my-project/scripts/sabia/wordmark_preview.html', 'w').write(html)
print("preview ok")
