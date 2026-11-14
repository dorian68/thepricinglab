"""Trace the existing TPL logo into a lightweight, transparent web SVG.

Run from the frontend: python scripts/build_brand_svg.py
Authoring dependencies: Pillow, numpy, opencv-python (not browser dependencies).
This reads the original artwork; it never rewrites it or generates new glyphs.
"""

import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parents[1] / "Visuels" / "ThePricingLibrary_logo.png"
OUTPUT = ROOT / "public" / "brand" / "thepricinglibrary.svg"
HORIZONTAL_OUTPUT = OUTPUT.with_name("thepricinglibrary-horizontal.svg")


def horizontal_lockup(svg):
    """Reposition the original symbol and word contours; draw no new glyphs."""
    paths = ET.fromstring(svg).findall("{http://www.w3.org/2000/svg}path")
    symbol, letters = paths

    def bounds(contour):
        points = [(float(x), float(y)) for x, y in re.findall(r"(-?[\d.]+),(-?[\d.]+)", contour)]
        return min(x for x, _ in points), min(y for _, y in points), max(x for x, _ in points), max(y for _, y in points)

    words = [[], [], []]
    for contour in re.findall(r"M[^M]+", letters.attrib["d"]):
        _, top, _, bottom = bounds(contour)
        words[0 if (top + bottom) / 2 < 140 else 1 if (top + bottom) / 2 < 270 else 2].append(contour)
    left, top, right, bottom = bounds(symbol.attrib["d"])
    height = 180
    scale = height / (bottom - top)
    cursor = (right - left) * scale + 24
    groups = [f'<g transform="scale({scale:.8f}) translate({-left:g} {-top:g})"><path fill="{symbol.attrib["fill"]}" fill-rule="evenodd" d="{symbol.attrib["d"]}"/></g>']
    for word in words:
        contours = "".join(word)
        x0, y0, x1, y1 = bounds(contours)
        groups.append(f'<g transform="translate({cursor - x0:.3f} {(height - (y1 - y0)) / 2 - y0:.3f})"><path fill="{letters.attrib["fill"]}" fill-rule="evenodd" d="{contours}"/></g>')
        cursor += x1 - x0 + 12
    width = round(cursor - 12, 3)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height}" role="img" aria-labelledby="brand-title"><title id="brand-title">ThePricingLibrary</title><metadata>Horizontal arrangement of the original logo contours; symbol, letter shapes and colors unchanged.</metadata>{"".join(groups)}</svg>\n'


def outline(mask):
    # Trace on an 8x pixel grid so pixel-center contours do not thin the
    # original letter strokes or enlarge their counters at web sizes.
    scale = 8
    expanded = cv2.resize(mask, None, fx=scale, fy=scale, interpolation=cv2.INTER_NEAREST)
    contours, _ = cv2.findContours(expanded, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    paths = []
    for contour in contours:
        if cv2.contourArea(contour) < 8 * scale * scale:
            continue
        points = cv2.approxPolyDP(contour, 0.3 * scale, True).reshape(-1, 2)
        coordinate = lambda value: f"{value / scale:.3f}".rstrip("0").rstrip(".")
        paths.append("M" + "L".join(f"{coordinate(x)},{coordinate(y)}" for x, y in points) + "Z")
    return "".join(sorted(paths))


def main():
    original = SOURCE.read_bytes()
    rgb = np.array(Image.open(SOURCE).convert("RGB"))
    # Bounds from the original artwork, with four pixels of safety padding.
    x, y, width, height = 200, 398, 841, 401
    artwork = rgb[y:y + height, x:x + width].astype(np.int16)
    red = ((artwork[:, :, 0] > 100) & (artwork[:, :, 0] > artwork[:, :, 1] * 1.5) & (artwork[:, :, 0] > artwork[:, :, 2] * 1.4))
    white = (artwork.min(axis=2) > 160) & (artwork.max(axis=2) - artwork.min(axis=2) < 50)
    colors = ["#" + "".join(f"{value:02x}" for value in np.median(artwork[mask], axis=0).astype(int)) for mask in (red, white)]
    metadata = json.dumps({"source": "Visuels/ThePricingLibrary_logo.png", "sha256": hashlib.sha256(original).hexdigest(), "bounds": [x, y, width, height], "method": "original red/white contours; preserved symbol and letter outlines", "colors": colors}, separators=(",", ":"))
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" role="img" aria-labelledby="brand-title">
<title id="brand-title">The Pricing Library</title>
<metadata>{metadata}</metadata>
<path fill="{colors[0]}" fill-rule="evenodd" d="{outline(red.astype(np.uint8) * 255)}"/>
<path fill="{colors[1]}" fill-rule="evenodd" d="{outline(white.astype(np.uint8) * 255)}"/>
</svg>
'''
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(svg, encoding="utf-8")
    HORIZONTAL_OUTPUT.write_text(horizontal_lockup(svg), encoding="utf-8")
    assert SOURCE.read_bytes() == original, "Original brand artwork must remain unchanged"
    print(json.dumps({"status": "PASS", "asset": str(OUTPUT.relative_to(ROOT)), "bytes": OUTPUT.stat().st_size, "source_sha256": hashlib.sha256(original).hexdigest(), "colors": colors}))


if __name__ == "__main__":
    main()
