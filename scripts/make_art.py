"""Regenerates the extension icons and the store promo images.

Requires Pillow (pip install pillow). Run from anywhere:  python scripts/make_art.py
"""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS = os.path.join(ROOT, "icons")
STORE = os.path.join(ROOT, "store")
os.makedirs(ICONS, exist_ok=True)
os.makedirs(STORE, exist_ok=True)
import math
from PIL import Image, ImageDraw, ImageFont

BG = (28, 31, 38, 255)
WHITE = (240, 244, 248, 255)
GOLD = (210, 169, 90, 255)
BLUE = (62, 166, 255, 255)
SS = 8  # supersampling

def glyph(d, cx, cy, S, stroke_scale=1.0):
    """Diamond tile (the tessera) with a clockwise quarter-turn arrow around it."""
    w = max(2, round(S * 0.075 * stroke_scale))
    dd = S * 0.28
    pts = [(cx, cy - dd), (cx + dd, cy), (cx, cy + dd), (cx - dd, cy)]
    d.line(pts + [pts[0]], fill=WHITE, width=w, joint="curve")
    for p in pts:
        d.ellipse([p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2], fill=WHITE)
    # arrow arc: PIL angles are clockwise from 3 o'clock
    r = S * 0.43
    a0, a1 = 215, 335
    d.arc([cx - r, cy - r, cx + r, cy + r], start=a0, end=a1, fill=GOLD, width=w)
    a = math.radians(a1)
    px, py = cx + r * math.cos(a), cy + r * math.sin(a)
    tx, ty = -math.sin(a), math.cos(a)          # clockwise tangent
    nx, ny = math.cos(a), math.sin(a)           # outward normal
    L, W = S * 0.17, S * 0.12
    tip = (px + tx * L, py + ty * L)
    b1 = (px - tx * L * 0.1 + nx * W, py - ty * L * 0.1 + ny * W)
    b2 = (px - tx * L * 0.1 - nx * W, py - ty * L * 0.1 - ny * W)
    d.polygon([tip, b1, b2], fill=GOLD)

def icon(size, pad_ratio, radius_ratio, stroke_scale):
    S = size * SS
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = S * pad_ratio
    d.rounded_rectangle([pad, pad, S - pad, S - pad], radius=S * radius_ratio, fill=BG)
    inner = S - 2 * pad
    glyph(d, S / 2, S / 2, inner, stroke_scale)
    return img.resize((size, size), Image.LANCZOS)

# 128: the store asks for ~96px artwork inside a 128 canvas (16px transparent padding)
specs = {128: (0.125, 0.22, 1.0), 48: (0.04, 0.22, 1.15), 32: (0.03, 0.22, 1.35), 16: (0.0, 0.22, 1.7)}
for size, (pad, rad, sw) in specs.items():
    icon(size, pad, rad, sw).save(os.path.join(ICONS, f"icon{size}.png"))

def font(sz, bold=True):
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def tile(w, h, title_sz, tag_sz, glyph_ratio, chips, path, tx_ratio=0.335):
    S = SS
    img = Image.new("RGB", (w * S, h * S), (18, 21, 27))
    d = ImageDraw.Draw(img, "RGBA")
    # soft flat accent band, no gradients
    d.rectangle([0, int(h * S * 0.93), w * S, h * S], fill=(210, 169, 90, 255))
    gs = h * S * glyph_ratio
    gx, gy = w * S * 0.2, h * S * 0.47
    d.rounded_rectangle([gx - gs / 2, gy - gs / 2, gx + gs / 2, gy + gs / 2], radius=gs * 0.22, fill=BG)
    glyph(d, gx, gy, gs, 1.0)
    tx = w * S * tx_ratio
    d.text((tx, h * S * 0.27), "TesseraFlip", font=font(title_sz * S), fill=WHITE)
    d.text((tx, h * S * 0.27 + title_sz * S * 1.35), "Rotate, step, and save", font=font(tag_sz * S, False), fill=(190, 198, 208))
    d.text((tx, h * S * 0.27 + title_sz * S * 1.35 + tag_sz * S * 1.4), "YouTube frames.", font=font(tag_sz * S, False), fill=(190, 198, 208))
    cx = tx
    cy = h * S * 0.74
    cf = font(int(tag_sz * 0.72 * S))
    for label in chips:
        bbox = d.textbbox((0, 0), label, font=cf)
        tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
        padx, pady = tag_sz * 0.6 * S, tag_sz * 0.35 * S
        d.rounded_rectangle([cx, cy, cx + tw + 2 * padx, cy + th + 2 * pady], radius=(th + 2 * pady) / 2,
                            fill=(62, 166, 255, 46), outline=(62, 166, 255, 200), width=max(1, S))
        d.text((cx + padx - bbox[0], cy + pady - bbox[1]), label, font=cf, fill=(200, 226, 255))
        cx += tw + 2 * padx + tag_sz * 0.5 * S
    img.resize((w, h), Image.LANCZOS).save(path)

tile(440, 280, 36, 16, 0.44, ["Rotate", "Step", "Save PNG"], os.path.join(STORE, "promo-small-440x280.png"), 0.38)
tile(1400, 560, 96, 38, 0.56, ["90° rotate", "Frame step x1-x8", "Save as PNG"], os.path.join(STORE, "promo-marquee-1400x560.png"))
print("ok")
