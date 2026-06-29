#!/usr/bin/env python3
"""Add real WTI + Brent daily series to public/market-data/desk-series.json.

Reads the farmed FRED caches (DCOILWTICO / DCOILBRENTEU), takes the last ~250
clean daily closes, and MERGES them into the existing desk-series bundle under
keys "WTI" and "BRENT" (same shape as the other series). Existing series are
loaded and preserved — never dropped.
"""
import csv
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
FRONT = os.path.dirname(HERE)
BUNDLE = os.path.join(FRONT, "public", "market-data", "desk-series.json")
FRED = os.path.join(
    os.path.dirname(os.path.dirname(FRONT)),  # THEPRICINGLIBRARY
    "Tools", "pricinglibrary_rag_backend", "data", "market_history", "fred",
)

SERIES = {
    "WTI": {
        "csv": "DCOILWTICO.csv",
        "label": "Crude Oil (WTI)",
        "unit": "USD/bbl",
        "source": "FRED DCOILWTICO",
    },
    "BRENT": {
        "csv": "DCOILBRENTEU.csv",
        "label": "Crude Oil (Brent)",
        "unit": "USD/bbl",
        "source": "FRED DCOILBRENTEU",
    },
}
N = 250


def read_points(path):
    pts = []
    with open(path, newline="") as f:
        for row in csv.DictReader(f):
            d = (row.get("datetime") or "").strip()
            c = (row.get("close") or "").strip()
            if not d or not c or c == ".":
                continue
            try:
                pts.append({"d": d, "c": round(float(c), 2)})
            except ValueError:
                continue
    return pts[-N:]


def main():
    with open(BUNDLE, encoding="utf-8") as f:
        bundle = json.load(f)
    bundle.setdefault("series", {})
    for key, meta in SERIES.items():
        pts = read_points(os.path.join(FRED, meta["csv"]))
        bundle["series"][key] = {
            "label": meta["label"],
            "unit": meta["unit"],
            "source": meta["source"],
            "points": pts,
        }
        print(f"{key}: {len(pts)} points, {pts[0]['d']}..{pts[-1]['d']} last={pts[-1]['c']}")
    with open(BUNDLE, "w", encoding="utf-8") as f:
        json.dump(bundle, f, separators=(",", ":"))
    print("wrote", BUNDLE, "series:", list(bundle["series"].keys()))


if __name__ == "__main__":
    main()
