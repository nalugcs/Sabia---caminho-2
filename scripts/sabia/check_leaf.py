#!/usr/bin/env python3
"""Verificação visual da folha-acento: wordmark grande + zoom do 'á'."""
import json

d = json.load(open('/home/z/my-project/scripts/sabia/wordmark.json'))
v = d['primary']
S = 0.5  # 1000/upem
PAD = 60

def paths_of(v, lf=None, af=None):
    inner = ""
    for p in v["paths"]:
        m = " ".join(str(x) for x in p["m"])
        fill = (lf or v["letters_fill"]) if p["kind"] == "letter" else (af or v["accent_fill"])
        inner += f'<path transform="matrix({m})" d="{p["d"]}" fill="{fill}"/>'
    return inner

# linha 1: wordmark completo grande
full = f'<svg viewBox="{" ".join(map(str, v["viewBox"]))}" width="820" height="auto">{paths_of(v)}</svg>'

# linha 2: zoom do 'á' final (letra + folha), crop calculado da leaf_zone
z = v["leaf_zone"]
last_x = v["paths"][4]["x"] if "x" in v["paths"][4] else (z[0] - 413.9)
x0f, x1f = last_x + 5, last_x + 955          # 'a' inteiro em unidades de fonte
y0f, y1f = 380, z[3] + 120                    # do meio do 'a' até acima da folha
BASE = 1448 * S + PAD
vb = (f"{x0f * S + PAD:.0f} {BASE - y1f * S:.0f} "
      f"{(x1f - x0f) * S:.0f} {(y1f - y0f) * S:.0f}")
zoom = f'<svg viewBox="{vb}" width="600">{paths_of(v)}</svg>'

# linha 3: zoom MAIS fechado só na folha
zx0, zx1 = z[0] - 90, z[2] + 70
zy0, zy1 = 700, z[3] + 90
vb2 = (f"{zx0 * S + PAD:.0f} {BASE - zy1 * S:.0f} "
       f"{(zx1 - zx0) * S:.0f} {(zy1 - zy0) * S:.0f}")
zoom2 = f'<svg viewBox="{vb2}" width="600">{paths_of(v)}</svg>'

html = f'''<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body {{ margin:0; padding:28px; background:#DDD8CC; display:flex; flex-direction:column; gap:24px; }}
.row {{ background:#F6F1E6; padding:30px 36px; border-radius:8px; position:relative;
       display:flex; justify-content:center; }}
.lbl {{ position:absolute; top:8px; left:12px; font:11px sans-serif; color:#999;
       letter-spacing:2px; text-transform:uppercase; }}
</style></head><body>
<div class="row"><span class="lbl">wordmark completo</span>{full}</div>
<div class="row"><span class="lbl">zoom · á inteiro</span>{zoom}</div>
<div class="row"><span class="lbl">zoom · só a folha</span>{zoom2}</div>
</body></html>'''
open('/home/z/my-project/scripts/sabia/check_leaf.html', 'w').write(html)
print("check_leaf.html ok  (leaf_zone abs:", [round(x,1) for x in z], ")")
