#!/usr/bin/env python3
"""Mede overflow de cada .page do livro (scrollHeight vs 1123)."""
import json
from playwright.sync_api import sync_playwright

HTML = "/home/z/my-project/download/sabia-identidade-visual.html"

JS = """
() => {
  const out = [];
  document.querySelectorAll('.page').forEach((p, i) => {
    const pad = p.querySelector('.pad');
    let contentBottom = 0;
    if (pad) {
      const pr = pad.getBoundingClientRect();
      contentBottom = pr.bottom;
      // considera também elementos absolutos dentro da page
    }
    const pageRect = p.getBoundingClientRect();
    // menor topo entre filhos absolutos e fluxo
    let maxBottom = pageRect.top;
    p.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom > maxBottom) maxBottom = r.bottom;
    });
    out.push({
      i: i + 1,
      scrollH: p.scrollHeight,
      clientH: p.clientHeight,
      contentBeyond: Math.round(maxBottom - pageRect.bottom),
      padBottomGap: Math.round(pageRect.bottom - contentBottom),
    });
  });
  return out;
}
"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    page = b.new_page(viewport={"width": 794, "height": 1200})
    page.goto(f"file://{HTML}")
    page.wait_for_timeout(1200)
    data = page.evaluate(JS)
    b.close()

for d in data:
    flag = "OVERFLOW!" if (d["scrollH"] > d["clientH"] + 2 or d["contentBeyond"] > 2) else "ok"
    print(f"página {d['i']:>2}: scrollH={d['scrollH']:>5} clientH={d['clientH']} "
          f"além_do_fundo={d['contentBeyond']:>5}px folga={d['padBottomGap']:>5}px  {flag}")
