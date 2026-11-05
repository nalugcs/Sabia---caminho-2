#!/usr/bin/env python3
"""Screenshot de um HTML local para inspeção visual (não gera PDF)."""
import sys
from playwright.sync_api import sync_playwright

html_path, png_path = sys.argv[1], sys.argv[2]
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 2.0

with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": 700, "height": 700}, device_scale_factor=scale)
    page.goto(f"file://{html_path}")
    page.wait_for_timeout(400)
    page.screenshot(path=png_path, full_page=True)
    b.close()
print("ok:", png_path)
