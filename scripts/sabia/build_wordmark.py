#!/usr/bin/env python3
"""Gera o wordmark W2 'Sabiá' como paths SVG a partir da Fraunces instanciada.
Saída: SVGs em download/sabia-logo/ + JSON com dados para o livro de marca.
"""
import json, os
from fontTools import ttLib
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen

ASSETS = "/home/z/my-project/scripts/sabia/assets"
OUT = "/home/z/my-project/download/sabia-logo"
DATA = "/home/z/my-project/scripts/sabia"
os.makedirs(OUT, exist_ok=True)

# ---- 1. Instanciar Fraunces: display, peso 600, terminais suaves ----
font = ttLib.TTFont(f"{ASSETS}/Fraunces-var.ttf")
AXES = {"opsz": 144, "wght": 600, "SOFT": 50, "WONK": 0}
instantiateVariableFont(font, AXES, inplace=True)

upem = font["head"].unitsPerEm
cmap = font.getBestCmap()
glyphset = font.getGlyphSet()
hmtx = font["hmtx"]

# ---- 1.5 Métrica REAL do acento agudo em 'á' (composto 'a' + 'acutecomb') ----
# A folha-assinatura ocupa exatamente a zona onde a própria Fraunces põe o
# acento — ancoragem tipográfica garantida, sem "flutuação".
def _accent_zone():
    comps = font["glyf"][cmap[0xE1]].components
    base = cmap[0x61]
    for c in comps:
        if c.glyphName == base:
            continue
        bp = BoundsPen(glyphset)
        glyphset[c.glyphName].draw(bp)
        x0, y0, x1, y1 = bp.bounds
        return (x0 + c.x, y0 + c.y, x1 + c.x, y1 + c.y)
    raise RuntimeError("componente de acento não encontrado em 'á'")

ACC = _accent_zone()  # p. ex. (425.9, 961.3, 737.5, 1318.3) p/ upem 2000

def glyph_path(ch):
    gname = cmap[ord(ch)]
    pen = SVGPathPen(glyphset)
    glyphset[gname].draw(pen)
    d = pen.getCommands()
    adv = hmtx[gname][0]
    bp = BoundsPen(glyphset)
    glyphset[gname].draw(bp)
    return d, adv, bp.bounds  # bounds (xMin,yMin,xMax,yMax) em unidades de fonte

TRACK = 0.012 * upem  # entreletra levemente positivo
S = 1000.0 / upem     # escala: 1em = 1000 unidades SVG

def layout_word(text):
    """Devolve lista de {d, x} com cursor em unidades de fonte e largura total."""
    items, x = [], 0.0
    for ch in text:
        if ch == " ":
            x += 0.30 * upem
            continue
        d, adv, b = glyph_path(ch)
        items.append({"d": d, "x": x, "bounds": b, "ch": ch})
        x += adv + TRACK
    return items, x - TRACK

def build_variant(text, letters_fill, accent_fill, out_name, accent_leaf=True):
    items, total_w = layout_word(text)
    # métricas verticais (aproximadas, para viewBox)
    asc = desc = 0
    for it in items:
        b = it["bounds"]
        asc = max(asc, b[3]); desc = min(desc, b[1])
    # folha/acento sobre a última vogal — ancorada na métrica real do 'á' da fonte
    leaf = None
    if accent_leaf:
        last = items[-1]
        gx0, gy0, gx1, gy1 = ACC
        # pontas da folha: levemente além da zona nativa (presença de marca)
        ax = last["x"] + gx0 - 0.006 * upem
        ay = gy0 - 0.010 * upem           # quase encostando a vogal (gap ~2% em)
        bx = last["x"] + gx1 + 0.007 * upem
        by = gy1 + 0.021 * upem           # um pouco mais alta que o acento nativo
        # lente-folha: face inferior quase reta, face superior arqueada
        dx, dy = bx - ax, by - ay
        L = (dx * dx + dy * dy) ** 0.5
        px, py = dy / L, -dx / L          # perpendicular ao eixo (lado inferior)
        w_lo, w_up = 0.032 * upem, 0.050 * upem   # barriga de cada face
        c1x = ax + 0.35 * dx + px * w_lo; c1y = ay + 0.35 * dy + py * w_lo
        c2x = bx - 0.35 * dx + px * w_lo; c2y = by - 0.35 * dy + py * w_lo
        c3x = bx - 0.30 * dx - px * w_up; c3y = by - 0.30 * dy - py * w_up
        c4x = ax + 0.30 * dx - px * w_up; c4y = ay + 0.30 * dy - py * w_up
        leaf = (
            f"M {ax:.0f} {ay:.0f} "
            f"C {c1x:.0f} {c1y:.0f} {c2x:.0f} {c2y:.0f} {bx:.0f} {by:.0f} "
            f"C {c3x:.0f} {c3y:.0f} {c4x:.0f} {c4y:.0f} {ax:.0f} {ay:.0f} Z"
        )
        leaf_zone = [ax, ay, bx, by]     # unidades de fonte, absolutas
        asc = max(asc, by)
    # viewBox em unidades SVG (y invertido): topo = asc + PAD, base = baseline
    PAD = 60
    W = total_w * S + 2 * PAD
    H = (asc - desc) * S + 2 * PAD
    BASELINE = round(asc * S + PAD, 2)  # ty: font y=0 mapeia para a baseline
    paths = []
    for it in items:
        paths.append({
            "d": it["d"],
            "m": [round(S, 6), 0, 0, round(-S, 6), round(it["x"] * S + PAD, 2), BASELINE],
            "kind": "letter",
        })
    if leaf:
        paths.append({"d": leaf, "m": [round(S, 6), 0, 0, round(-S, 6), PAD, BASELINE], "kind": "accent"})
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W:.0f} {H:.0f}">'
    for p in paths:
        fill = letters_fill if p["kind"] == "letter" else accent_fill
        m = " ".join(str(v) for v in p["m"])
        svg += f'<path transform="matrix({m})" d="{p["d"]}" fill="{fill}"/>'
    svg += "</svg>"
    with open(f"{OUT}/{out_name}", "w") as f:
        f.write(svg)
    return {
        "name": out_name, "viewBox": [0, 0, round(W), round(H)],
        "paths": paths, "letters_fill": letters_fill, "accent_fill": accent_fill,
        "leaf_zone": leaf_zone if leaf else None,
        "accent_zone_font": [round(v, 1) for v in ACC],
        "last_x": items[-1]["x"] if items else 0,
    }

data = {}
# W2 primário: "Sabia" (acento desenhado como folha ruiva acima do 'a' final)
data["primary"] = build_variant("Sabia", "#28221C", "#C1502E", "sabia-wordmark.svg")
# Variante para fundos escuros: letras creme + folha amarelo-bico
data["dark"] = build_variant("Sabia", "#F6F1E6", "#E9A83B", "sabia-wordmark-creme.svg")
# Variante minúscula para UI:
data["lower"] = build_variant("sabia", "#28221C", "#C1502E", "sabia-wordmark-lower.svg")

with open(f"{DATA}/wordmark.json", "w") as f:
    json.dump(data, f)

for k, v in data.items():
    print(f"{k}: {v['name']}  viewBox={v['viewBox']}  paths={len(v['paths'])}")
print("zona do acento (fonte):", [round(x, 1) for x in ACC])
print("zona da folha (abs):", [round(x, 1) for x in data['primary']['leaf_zone']])
