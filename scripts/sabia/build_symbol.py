#!/usr/bin/env python3
"""Símbolo S4 — o sabiá cantor (v3). SVG paramétrico.
v3: bico maior e em tinta no mono, olho mais distante da borda, arcos mais
    baixos (separados da linha do topo da cabeça), asa com mais contraste.
"""
import json, os

DATA = "/home/z/my-project/scripts/sabia"
OUT = "/home/z/my-project/download/sabia-logo"
os.makedirs(OUT, exist_ok=True)

# ---------- geometria (viewBox 0 0 512 512, pássaro olhando à direita) ----------
# silhueta contínua: ponta da cauda -> dorso -> cabeça -> peito -> barriga -> cauda
BODY = (
    "M 62 196 "
    "C 104 190 142 206 174 230 "
    "C 214 184 266 152 318 150 "
    "C 356 150 384 174 386 206 "
    "C 387 228 380 246 368 258 "
    "C 386 274 394 298 392 324 "
    "C 386 368 348 394 296 396 "
    "C 246 398 204 382 184 348 "
    "C 156 318 118 262 62 196 Z"
)
WING = (
    "M 208 240 "
    "C 246 226 288 234 314 260 "
    "C 300 294 264 312 228 306 "
    "C 204 300 194 266 208 240 Z"
)
# peito ruivo, contido dentro da silhueta
BREAST = (
    "M 372 252 "
    "C 388 268 392 292 386 320 "
    "C 378 360 344 386 300 388 "
    "C 270 388 244 379 230 367 "
    "C 274 363 310 344 330 310 "
    "C 344 286 360 262 372 252 Z"
)
BILL = (
    "M 380 184 "
    "C 398 177 420 183 440 200 "
    "C 428 213 404 219 382 214 "
    "Z"
)
# arcos concêntricos de canto, centrados na ponta do bico (442,201)
SONG1 = "M 477.7 196 A 36 36 0 0 0 464.2 172.7"
SONG2 = "M 495.5 193.5 A 54 54 0 0 0 475.3 158.5"

def symbol_svg(body, wing, breast, bill, eye, pupil, song,
               include_song=True, include_wing=True):
    s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
    s += f'<path d="{BODY}" fill="{body}"/>'
    if include_wing:
        s += f'<path d="{WING}" fill="{wing}"/>'
    s += f'<path d="{BREAST}" fill="{breast}"/>'
    s += f'<path d="{BILL}" fill="{bill}"/>'
    s += f'<circle cx="338" cy="188" r="11" fill="{eye}"/>'
    if pupil:
        s += f'<circle cx="341" cy="190" r="4.5" fill="{pupil}"/>'
    if include_song:
        s += (f'<path d="{SONG1}" fill="none" stroke="{song}" stroke-width="10" '
              f'stroke-linecap="round"/>')
        s += (f'<path d="{SONG2}" fill="none" stroke="{song}" stroke-width="10" '
              f'stroke-linecap="round"/>')
    s += "</svg>"
    return s

CREME, TINTA, VERDE, VERDE_D, RUIVO, AMARELO = (
    "#F6F1E6", "#28221C", "#243D2C", "#152619", "#C1502E", "#E9A83B")

variants = {
    "color":    symbol_svg(VERDE, VERDE_D, RUIVO, AMARELO, CREME, TINTA, RUIVO),
    "negative": symbol_svg(CREME, CREME, RUIVO, AMARELO, VERDE, VERDE, AMARELO, include_wing=False),
    "mono":     symbol_svg(TINTA, TINTA, TINTA, TINTA, CREME, TINTA, TINTA, include_wing=False),
    "no-song":  symbol_svg(VERDE, VERDE_D, RUIVO, AMARELO, CREME, TINTA, RUIVO, include_song=False),
}
for name, svg in variants.items():
    fn = f"{OUT}/sabia-simbolo-{name.replace('no-song','sem-canto')}.svg"
    with open(fn, "w") as f:
        f.write(svg)
with open(f"{DATA}/symbol.json", "w") as f:
    json.dump(variants, f)

cells = ""
for name, svg in variants.items():
    bg = "#F6F1E6" if name != "negative" else "#243D2C"
    cells += f'<div class="cell" style="background:{bg}">{svg}</div>'
html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body {{ margin:0; padding:24px; background:#DDD8CC; display:grid;
         grid-template-columns:repeat(2, 300px); gap:24px; }}
  .cell {{ width:300px; height:300px; display:flex; align-items:center;
          justify-content:center; border-radius:8px; }}
  .cell svg {{ width:270px; height:270px; }}
</style></head><body>{cells}</body></html>"""
with open(f"{DATA}/symbol_preview.html", "w") as f:
    f.write(html)
print("v3 ok")
