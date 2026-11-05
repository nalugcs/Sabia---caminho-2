#!/usr/bin/env python3
"""CSS do livro de identidade Sabiá (794x1123 por página)."""

CSS = r"""
@page { size: 794px 1123px; margin: 0; }
html, body { margin: 0; padding: 0; width: 794px; background: #243D2C; }
* { box-sizing: border-box; }

:root {
  --creme: #F6F1E6; --areia: #EDE5D3; --tinta: #28221C;
  --verde: #243D2C; --verde-d: #152619; --verde-folha: #4E7A62;
  --ruivo: #C1502E; --amarelo: #E9A83B;
  --borda: rgba(36, 61, 44, 0.22);
  --muted: rgba(40, 34, 28, 0.62);
}

body { font-family: 'Inter', 'Liberation Sans', sans-serif; color: var(--tinta); }
.page { width: 794px; height: 1123px; position: relative; background: var(--creme);
        overflow: visible; page-break-after: always; }
.page.last { page-break-after: auto; }
.page.dark { background: var(--verde); color: var(--creme); }

@media screen {
  html { height: auto; display: flex; justify-content: center; background: #243D2C; }
  body { transform-origin: top center;
         scale: min(1, calc(100vw / 794)); margin: 0 auto;
         box-shadow: 0 0 60px rgba(0,0,0,0.35); }
}

/* ---------- tipografia ---------- */
.fraunces { font-family: 'Fraunces', 'Liberation Serif', serif; }
.kicker { font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
          font-weight: 600; color: var(--ruivo); }
.kicker.on-dark { color: var(--amarelo); }
h1 { font-family: 'Fraunces', 'Liberation Serif', serif; font-size: 40px;
     line-height: 1.12; font-weight: 600; margin: 10px 0 0 0; letter-spacing: -0.2px; }
h2 { font-family: 'Fraunces', 'Liberation Serif', serif; font-size: 26px;
     line-height: 1.15; font-weight: 600; margin: 0; }
.lead { font-size: 15px; line-height: 1.65; color: var(--tinta); }
.body-txt { font-size: 14.5px; line-height: 1.62; }
.caption { font-size: 12px; line-height: 1.5; color: var(--muted); }
.mono { font-family: 'Liberation Mono', 'DejaVu Sans Mono', monospace; }

/* ---------- estrutura ---------- */
.pad { padding: 88px 86px 96px 86px; }
.footer { position: absolute; left: 86px; right: 86px; bottom: 40px;
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: var(--muted); }
.footer .pg { font-family: 'Liberation Mono', monospace; letter-spacing: 1px; }
.dark .footer { color: rgba(246, 241, 230, 0.75); }
.rule { height: 1px; background: var(--borda); margin: 26px 0; }
.hairline { height: 0.5px; background: var(--borda); }

.card { background: #FFFFFF; border: 1px solid var(--borda); border-radius: 10px; }
.chip { display: inline-flex; align-items: center; border-radius: 999px;
        border: 1px solid var(--borda); padding: 5px 12px; font-size: 12px;
        font-weight: 500; }

/* ---------- capa ---------- */
.cover-bg { position: absolute; inset: 0; overflow: hidden; z-index: 1; }
.cover-l2 { position: absolute; inset: 0; z-index: 2; }
.cover-l3 { position: absolute; inset: 0; z-index: 3; }
.cover-meta { position: absolute; left: 86px; right: 86px; }
.cover-tag { font-family: 'Fraunces', 'Liberation Serif', serif; font-style: italic;
             font-size: 21px; color: var(--verde); }

/* ---------- swatches ---------- */
.sw { border-radius: 10px; border: 1px solid var(--borda); padding: 14px 16px; }
.sw .nome { font-family: 'Fraunces', 'Liberation Serif', serif; font-size: 17px;
            font-weight: 600; }
.sw .hex { font-family: 'Liberation Mono', monospace; font-size: 12px; }
.sw .papel { font-size: 11.5px; line-height: 1.45; margin-top: 6px; }

/* ---------- anotações do símbolo ---------- */
.ann { font-size: 11.5px; line-height: 1.4; color: var(--tinta); }
.ann b { color: var(--ruivo); }

/* ---------- telefone ---------- */
.phone { width: 264px; height: 552px; border-radius: 36px; background: #1C1814;
         padding: 10px; box-shadow: 0 18px 40px rgba(40,34,28,0.28); position: relative; }
.screen { width: 100%; height: 100%; border-radius: 27px; background: var(--creme);
          overflow: hidden; position: relative; display: flex; flex-direction: column; }
.statusbar { height: 30px; display: flex; justify-content: space-between;
             align-items: center; padding: 0 18px; font-size: 10px; font-weight: 600;
             color: var(--tinta); }
.field { background: var(--areia); border: 1px solid var(--borda); border-radius: 9px;
         padding: 8px 12px; font-size: 12px; color: var(--tinta); }
.field .lbl { font-size: 9.5px; letter-spacing: 1px; text-transform: uppercase;
              color: var(--muted); font-weight: 600; }
.bubble { border-radius: 14px; padding: 9px 12px; font-size: 11.5px; line-height: 1.45; }
.bub-ai { background: var(--areia); border: 1px solid var(--borda);
          border-bottom-left-radius: 4px; }
.bub-user { background: var(--verde); color: var(--creme);
            border-bottom-right-radius: 4px; }
.cta { background: var(--verde); color: var(--creme); border-radius: 12px;
       text-align: center; padding: 11px 0; font-size: 13px; font-weight: 600; }

/* ---------- grids utilitários ---------- */
.row { display: flex; flex-wrap: wrap; gap: 18px; max-width: 100%; }
.col { display: flex; flex-direction: column; }
.grow { flex: 1 1 auto; min-width: 0; }
.half { flex: 1 1 0; min-width: 0; }
.third { flex: 1 1 0; min-width: 0; }
.center { align-items: center; }
.nums { font-family: 'Fraunces', 'Liberation Serif', serif; font-weight: 600; }

/* botões de legenda de seção */
.secno { font-family: 'Fraunces', 'Liberation Serif', serif; font-size: 15px;
         color: var(--ruivo); font-weight: 700; }
"""
