#!/usr/bin/env python3
"""Helpers de ativos para o livro Sabiá: SVGs inline, zoom do wordmark,
cortes do símbolo, contraste WCAG e mockups de telefone."""
import json

DATA = "/home/z/my-project/scripts/sabia"

SYMBOL = json.load(open(f"{DATA}/symbol.json"))
WORDMARK = json.load(open(f"{DATA}/wordmark.json"))

C = {"creme": "#F6F1E6", "areia": "#EDE5D3", "tinta": "#28221C",
     "verde": "#243D2C", "verde_d": "#152619", "verde_folha": "#4E7A62",
     "ruivo": "#C1502E", "amarelo": "#E9A83B"}


# ---------------- símbolo ----------------
def symbol(kind="color", w=None, cls=""):
    svg = SYMBOL[kind]
    if w:
        svg = svg.replace('viewBox="0 0 512 512"',
                          f'viewBox="0 0 512 512" width="{w}" height="{w}"')
    if cls:
        svg = svg.replace("<svg ", f'<svg class="{cls}" ')
    return svg


def symbol_crop(kind, vb, w):
    """Corta o símbolo para um viewBox específico (ex.: avatar da cabeça)."""
    svg = SYMBOL[kind].replace('viewBox="0 0 512 512"', f'viewBox="{vb}"')
    return svg.replace("<svg ", f'<svg width="{w}" height="{w}" ', 1)


HEAD_VB = "262 116 200 200"  # cabeça + bico + olho + início dos arcos


# ---------------- wordmark ----------------
def wordmark(key="primary", width=None, letters=None, accent=None):
    v = WORDMARK[key]
    lf = letters or v["letters_fill"]
    af = accent or v["accent_fill"]
    vb = " ".join(str(x) for x in v["viewBox"])
    inner = ""
    for p in v["paths"]:
        m = " ".join(str(x) for x in p["m"])
        fill = lf if p["kind"] == "letter" else af
        inner += f'<path transform="matrix({m})" d="{p["d"]}" fill="{fill}"/>'
    dim = f' width="{width}"' if width else ""
    h = f' height="{round(width * v["viewBox"][3] / v["viewBox"][2], 1)}"' if width else ""
    return f'<svg viewBox="{vb}"{dim}{h}>{inner}</svg>'


def wordmark_zoom(width):
    """Zoom no 'á' final (última letra + folha) para a página do wordmark.
    Corte derivado da leaf_zone gravada pelo build — sem números mágicos."""
    v = WORDMARK["primary"]
    last_a = v["paths"][4]   # letra 'a' final
    leaf = v["paths"][5]     # folha
    S = last_a["m"][0]
    PAD = leaf["m"][4]       # folha posicionada sem offset de glifo
    BASE = leaf["m"][5]      # baseline em unidades SVG
    last_x = v["last_x"]
    x0f = last_x + 5        # 'a' inteiro (xMin local ~46)
    x1f = last_x + 955      # além da folha (xMax local ~912)
    y0f = 380               # meio do 'a'
    y1f = v["leaf_zone"][3] + 120   # acima do topo da folha
    vb = (f"{x0f * S + PAD:.0f} {BASE - y1f * S:.0f} "
          f"{(x1f - x0f) * S:.0f} {(y1f - y0f) * S:.0f}")
    inner = ""
    for p in (last_a, leaf):
        m = " ".join(str(x) for x in p["m"])
        fill = v["letters_fill"] if p["kind"] == "letter" else v["accent_fill"]
        inner += f'<path transform="matrix({m})" d="{p["d"]}" fill="{fill}"/>'
    h = round(width * (y1f - y0f) / (x1f - x0f), 1)
    return f'<svg viewBox="{vb}" width="{width}" height="{h}">{inner}</svg>'


# ---------------- contraste WCAG ----------------
def _lum(hex_color):
    h = hex_color.lstrip("#")
    rgb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb]
    return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]


def contrast(fg, bg):
    l1, l2 = _lum(fg), _lum(bg)
    if l1 < l2:
        l1, l2 = l2, l1
    return (l1 + 0.05) / (l2 + 0.05)


def contrast_table():
    pairs = [
        ("Tinta", "creme", "texto principal sobre fundo claro"),
        ("Tinta", "areia", "texto sobre cartões"),
        ("Verde", "creme", "títulos alternativos / botões"),
        ("Creme", "verde", "texto sobre fundo escuro / botões"),
        ("Ruivo", "creme", "acentos, kickers e números grandes"),
        ("Amarelo", "verde", "detalhes mínimos sobre escuro"),
    ]
    rows = ""
    for nome, bgc, uso in pairs:
        r = contrast(C[nome.lower()], C[bgc])
        tag = "AAA" if r >= 7 else ("AA" if r >= 4.5 else ("AA-lg" if r >= 3 else "—"))
        rows += (f'<tr><td class="mono" style="font-size:12px">{nome} sobre {bgc}</td>'
                 f'<td style="font-size:12px">{uso}</td>'
                 f'<td class="mono" style="font-size:12px;text-align:right">{r:.1f}:1</td>'
                 f'<td style="font-size:11px;font-weight:600;color:var(--ruivo);text-align:right">{tag}</td></tr>')
    return rows


# ---------------- mockups de telefone ----------------
def phone(inner, dark_screen=False):
    screen_bg = "var(--verde)" if dark_screen else "var(--creme)"
    return f'''<div class="phone"><div class="screen" style="background:{screen_bg}">
{inner}</div></div>'''


def statusbar(dark=False):
    col = "var(--creme)" if dark else "var(--tinta)"
    return (f'<div class="statusbar" style="color:{col}"><span>9:41</span>'
            f'</div>')


def screen_register():
    chips_nivel = ""
    for n, sel in [("Nenhum", 0), ("Básico", 1), ("Intermediário", 0),
                   ("Avançado", 0), ("Fluente", 0)]:
        st = ("background:var(--verde);color:var(--creme);border-color:var(--verde)"
              if sel else "background:#fff")
        chips_nivel += (f'<span class="chip" style="{st};padding:3px 9px;'
                        f'font-size:10.5px">{n}</span>')
    chips_idioma = ""
    for n, sel in [("Inglês", 1), ("Espanhol", 0), ("Francês", 0)]:
        st = ("background:var(--ruivo);color:var(--creme);border-color:var(--ruivo)"
              if sel else "background:#fff")
        chips_idioma += (f'<span class="chip" style="{st};padding:3px 10px;'
                         f'font-size:10.5px">{n}</span>')
    mini = wordmark("lower", width=64)
    sym = symbol("color", w=26)
    return f'''
<div class="statusbar" style="color:var(--tinta)"><span>9:41</span><span style="display:inline-flex;align-items:center;gap:2px"><span style="width:14px;height:7px;border:1px solid currentColor;border-radius:2px;display:inline-block;position:relative"><span style="position:absolute;left:1px;top:1px;width:8px;height:3px;background:currentColor"></span></span></span></div>
<div style="padding:6px 16px 0 16px;flex:1;display:flex;flex-direction:column;min-height:0">
  <div style="display:flex;align-items:center;gap:8px;margin:4px 0 10px 0">{sym}{mini}</div>
  <div class="fraunces" style="font-size:19px;font-weight:600">Criar conta</div>
  <div style="font-size:10.5px;color:var(--muted);margin:2px 0 10px 0">Prática de conversa personalizada com IA</div>
  <div class="field" style="margin-bottom:7px"><div class="lbl">Nome</div><div style="margin-top:2px">Ana Luiza</div></div>
  <div class="row" style="gap:7px;margin-bottom:7px;flex-wrap:nowrap">
    <div class="field grow"><div class="lbl">Sobrenome</div><div style="margin-top:2px">Gonçalves César</div></div>
    <div class="field" style="width:64px"><div class="lbl">Idade</div><div style="margin-top:2px">28</div></div>
  </div>
  <div class="lbl" style="font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:600;margin:4px 0 5px 0">Nível do idioma</div>
  <div class="row" style="gap:5px;margin-bottom:8px">{chips_nivel}</div>
  <div class="lbl" style="font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);font-weight:600;margin:4px 0 5px 0">Idioma</div>
  <div class="row" style="gap:5px;margin-bottom:10px">{chips_idioma}</div>
  <div style="display:flex;gap:7px;align-items:flex-start;margin-bottom:10px">
    <div style="width:13px;height:13px;border-radius:4px;background:var(--verde);margin-top:1px;flex-shrink:0"></div>
    <div style="font-size:9.5px;line-height:1.4;color:var(--muted)">Li e aceito o Termo de Consentimento Livre e Esclarecido (TCLE) desta pesquisa.</div>
  </div>
  <div class="cta">Começar</div>
  <div style="text-align:center;font-size:8.5px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-top:auto;padding-bottom:8px">Projeto de pesquisa · MBA USP/Esalq</div>
</div>'''


def screen_lesson():
    sym_badge = symbol_crop("color", HEAD_VB, 30)
    avatar = (f'<div style="width:26px;height:26px;border-radius:50%;'
              f'background:var(--verde);display:flex;align-items:center;'
              f'justify-content:center;flex-shrink:0">'
              f'{symbol_crop("negative", HEAD_VB, 18)}</div>')
    return f'''
<div class="statusbar" style="color:var(--tinta)"><span>9:41</span><span style="display:inline-flex;align-items:center;gap:2px"><span style="width:14px;height:7px;border:1px solid currentColor;border-radius:2px;display:inline-block;position:relative"><span style="position:absolute;left:1px;top:1px;width:8px;height:3px;background:currentColor"></span></span></span></div>
<div style="padding:4px 14px 0 14px;border-bottom:1px solid var(--borda)">
  <div style="display:flex;align-items:center;gap:8px">
    <span class="fraunces" style="font-size:12.5px;color:var(--verde)">&#8249;</span>
    <div class="fraunces" style="font-size:12.5px;font-weight:600;flex:1;line-height:1.25">Aula 1 · Apresentação pessoal</div>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
    <div style="font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase">Inglês · lição 1 de 20</div>
    <span class="chip" style="background:var(--ruivo);color:var(--creme);border-color:var(--ruivo);padding:1px 8px;font-size:9px">Básico</span>
  </div>
  <div style="height:4px;background:var(--areia);border-radius:2px;margin:7px 0 8px 0">
    <div style="width:5%;height:100%;background:var(--ruivo);border-radius:2px"></div>
  </div>
</div>
<div style="flex:1;padding:10px 14px;display:flex;flex-direction:column;gap:8px;min-height:0">
  <div style="display:flex;gap:7px;align-items:flex-start">
    {avatar}
    <div class="bubble bub-ai grow" style="max-width:200px">Vamos começar! Apresente-se em inglês: nome, idade e de onde você é.</div>
  </div>
  <div style="display:flex;justify-content:flex-end">
    <div class="bubble bub-user" style="max-width:205px">My name is Ana, I am 28 years old and I from Brazil.</div>
  </div>
  <div style="display:flex;gap:7px;align-items:flex-start">
    {avatar}
    <div class="grow" style="max-width:215px">
      <div class="bubble bub-ai">Muito bem, Ana! Um detalhe: para dizer de onde você é, use <b>I&#8217;m from Brazil</b>.</div>
      <div class="card" style="margin-top:6px;border-left:3px solid var(--ruivo);padding:8px 10px">
        <div style="font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--ruivo)">Correção gentil</div>
        <div style="font-size:11px;line-height:1.45;margin-top:3px">Frases melhores: &#8220;I am from Brazil.&#8221; · &#8220;I come from Brazil.&#8221;</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
          <span style="font-family:'Fraunces','Liberation Serif',serif;font-weight:700;font-size:15px;color:var(--ruivo)">8/10</span>
          <span style="font-size:9.5px;color:var(--muted)">nota da resposta</span>
        </div>
      </div>
    </div>
  </div>
</div>
<div style="padding:8px 14px 12px 14px;border-top:1px solid var(--borda);display:flex;gap:8px;align-items:center">
  <div class="field grow" style="padding:6px 11px;color:var(--muted);font-size:11px">Escreva em inglês&#8230;</div>
  <div style="width:30px;height:30px;border-radius:50%;background:var(--ruivo);display:flex;align-items:center;justify-content:center">
    <svg width="13" height="13" viewBox="0 0 24 24"><path d="M3 12 L18 4 L13 12 L18 20 Z" fill="#F6F1E6"/></svg>
  </div>
</div>'''


def screen_splash():
    return f'''
<div class="statusbar" style="color:var(--tinta)"><span>9:41</span><span style="display:inline-flex;align-items:center;gap:2px"><span style="width:14px;height:7px;border:1px solid currentColor;border-radius:2px;display:inline-block;position:relative"><span style="position:absolute;left:1px;top:1px;width:8px;height:3px;background:currentColor"></span></span></span></div>
<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px">
  {symbol("color", w=120)}
  {wordmark("primary", width=150)}
  <div class="cover-tag" style="font-size:15px">Toda voz se aprende.</div>
</div>
<div style="text-align:center;font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);padding-bottom:16px">Projeto de pesquisa · MBA USP/Esalq</div>'''
