#!/usr/bin/env python3
"""Lista a altura dos blocos de cada .pad (para depurar overflow)."""
import sys
from playwright.sync_api import sync_playwright

HTML = "/home/z/my-project/download/sabia-identidade-visual.html"
targets = [int(x) for x in sys.argv[1:]] or [3, 4, 5, 6, 8]

JS = """
(t) => {
  const pages = document.querySelectorAll('.page');
  const out = [];
  t.forEach(n => {
    const p = pages[n - 1];
    if (!p) return;
    const rows = [];
    const pad = p.querySelector('.pad') || p;
    const pr = pad.getBoundingClientRect();
    [...pad.children].forEach(el => {
      const r = el.getBoundingClientRect();
      rows.push({
        tag: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
             ? '.' + el.className.split(' ')[0] : ''),
        h: Math.round(r.height),
        y: Math.round(r.top - pr.top),
        txt: (el.textContent || '').trim().slice(0, 38),
      });
    });
    out.push({ n, rows, padH: Math.round(pr.height) });
  });
  return out;
}
"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    page = b.new_page(viewport={"width": 794, "height": 1200})
    page.goto(f"file://{HTML}")
    page.wait_for_timeout(1000)
    for pg in page.evaluate(JS, targets):
        print(f"===== página {pg['n']} (pad {pg['padH']}px) =====")
        cum = 0
        for r in pg["rows"]:
            cum += r["h"]
            print(f"  y={r['y']:>5} h={r['h']:>4}  {r['tag']:<14} {r['txt']}")
        print(f"  TOTAL blocos: {cum}px (útil: 1123-88-96=939px)\n")
    b.close()
