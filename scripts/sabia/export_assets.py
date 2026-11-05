#!/usr/bin/env python3
"""Exporta ativos de marca em PNG: ícone de app, símbolo, lockup horizontal."""
import sys
sys.path.insert(0, "/home/z/my-project/scripts/sabia")
import book_assets as A
from playwright.sync_api import sync_playwright

OUT = "/home/z/my-project/download/sabia-logo"

PAGES = {
    "sabia-app-icon.html": f'''
    <div class="asset" style="width:1024px;height:1024px;background:#F6F1E6;
         display:flex;align-items:center;justify-content:center">
      {A.symbol("color", w=660)}
    </div>''',
    "sabia-app-icon-verde.html": f'''
    <div class="asset" style="width:1024px;height:1024px;background:#243D2C;
         display:flex;align-items:center;justify-content:center">
      {A.symbol("negative", w=660)}
    </div>''',
    "sabia-simbolo.html": f'''
    <div class="asset" style="width:1024px;height:1024px;display:flex;
         align-items:center;justify-content:center">
      {A.symbol("color", w=880)}
    </div>''',
    "sabia-lockup-horizontal.html": f'''
    <div class="asset" style="display:flex;align-items:center;justify-content:center;
         gap:64px;padding:96px 88px;background:transparent">
      {A.symbol("color", w=300)}
      <div style="width:4px;height:300px;background:#C1502E;opacity:.35"></div>
      <div style="transform:translateY(-64px)">{A.wordmark("primary", width=880)}</div>
    </div>''',
}

WRAPPER = """<!DOCTYPE html><html><head><meta charset="utf-8">
<style>html,body{{margin:0;padding:0;background:transparent}}
.asset{{display:inline-block}}</style></head><body>{inner}</body></html>"""

with sync_playwright() as pw:
    b = pw.chromium.launch()
    for name, inner in PAGES.items():
        html_path = f"/home/z/my-project/scripts/sabia/{name}"
        with open(html_path, "w") as f:
            f.write(WRAPPER.format(inner=inner))
        page = b.new_page(viewport={"width": 1400, "height": 1400},
                          device_scale_factor=1)
        page.goto(f"file://{html_path}")
        page.wait_for_timeout(300)
        el = page.locator(".asset")
        out = f"{OUT}/{name.replace('.html', '.png')}"
        el.screenshot(path=out, omit_background=True)
        page.close()
        print("ok:", out)
    b.close()
