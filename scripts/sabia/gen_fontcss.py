#!/usr/bin/env python3
"""Gera scripts/sabia/fonts_b64.css com @font-face em base64 (auto-hospedado)."""
import base64

ASSETS = "/home/z/my-project/scripts/sabia/assets"
OUT = "/home/z/my-project/scripts/sabia/fonts_b64.css"

faces = [
    ("Fraunces", "normal", f"{ASSETS}/Fraunces-var.ttf"),
    ("Fraunces", "italic", f"{ASSETS}/Fraunces-Italic-var.ttf"),
    ("Inter", "normal", f"{ASSETS}/Inter-var.ttf"),
    ("Inter", "italic", f"{ASSETS}/Inter-Italic-var.ttf"),
]

css = ""
for family, style, path in faces:
    b64 = base64.b64encode(open(path, "rb").read()).decode()
    css += (f"@font-face {{ font-family: '{family}'; font-style: {style}; "
            f"font-weight: 100 900; font-display: swap; "
            f"src: url(data:font/ttf;base64,{b64}) format('truetype'); }}\n")

with open(OUT, "w") as f:
    f.write(css)
print("fonts_b64.css ok:", len(css), "bytes")
