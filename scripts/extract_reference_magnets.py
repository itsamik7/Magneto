#!/usr/bin/env python3
"""
High-Fidelity Souvenir Magnet Extraction Script
Extracts the 6 authentic destination magnets from the original reference image:
- Solid 100% opaque interior containing all original artwork and typography
- Thick die-cut white borders
- Seamless transparent background outside the magnet silhouette
- Smooth anti-aliased contour
"""

from PIL import Image, ImageFilter
import os

orig_path = "/Users/itsamik/.gemini/antigravity/brain/454074dc-065c-4746-902f-d8018f440679/.user_uploaded/media_1791888987745_47aac942.jpg"
orig = Image.open(orig_path).convert("RGBA")

# Bounding box regions on the 646 x 954 reference image
# [left, top, right, bottom]
CONFIGS = {
    "paris": {
        "box": (70, 48, 292, 320),
        "lum_thresh": 226,
        "sat_thresh": 14,
    },
    "japan": {
        "box": (366, 60, 582, 285),
        "lum_thresh": 226,
        "sat_thresh": 14,
    },
    "london": {
        "box": (75, 388, 292, 615),
        "lum_thresh": 226,
        "sat_thresh": 14,
    },
    "switzerland": {
        "box": (375, 418, 582, 606),
        "lum_thresh": 226,
        "sat_thresh": 14,
    },
    "bali": {
        "box": (75, 712, 292, 902),
        "lum_thresh": 226,
        "sat_thresh": 14,
    },
    "singapore": {
        "box": (366, 728, 582, 898),
        "lum_thresh": 226,
        "sat_thresh": 14,
    },
}

for name, cfg in CONFIGS.items():
    cropped = orig.crop(cfg["box"])
    w, h = cropped.size
    mask = Image.new("L", (w, h), 0)

    lum_thresh = cfg["lum_thresh"]
    sat_thresh = cfg["sat_thresh"]

    def is_magnet_pixel(r, g, b):
        sat = max(r, g, b) - min(r, g, b)
        lum = (r + g + b) // 3
        if sat >= sat_thresh:
            return True
        if lum >= lum_thresh:
            return True
        return False

    # Scan rows: left and right
    row_spans = []
    for y in range(h):
        left = None
        for x in range(w // 2):
            r, g, b, _ = cropped.getpixel((x, y))
            if is_magnet_pixel(r, g, b):
                left = x
                break

        right = None
        for x in range(w - 1, w // 2, -1):
            r, g, b, _ = cropped.getpixel((x, y))
            if is_magnet_pixel(r, g, b):
                right = x
                break

        if left is not None and right is not None and right > left + 10:
            row_spans.append((y, left, right))

    # Fill mask
    for y, left, right in row_spans:
        for x in range(left, right + 1):
            mask.putpixel((x, y), 255)

    # Column scan to clip empty tops and bottoms
    col_mask = Image.new("L", (w, h), 0)
    for x in range(w):
        top = None
        for y in range(h // 2):
            r, g, b, _ = cropped.getpixel((x, y))
            if is_magnet_pixel(r, g, b):
                top = y
                break

        bot = None
        for y in range(h - 1, h // 2, -1):
            r, g, b, _ = cropped.getpixel((x, y))
            if is_magnet_pixel(r, g, b):
                bot = y
                break

        if top is not None and bot is not None and bot > top + 10:
            for y in range(top, bot + 1):
                col_mask.putpixel((x, y), 255)

    # Intersection of row and column spans eliminates stray corner pixels
    final_mask = Image.new("L", (w, h), 0)
    for y in range(h):
        for x in range(w):
            if mask.getpixel((x, y)) > 0 and col_mask.getpixel((x, y)) > 0:
                final_mask.putpixel((x, y), 255)

    # Smooth feathering for beautiful edges
    smooth_mask = final_mask.filter(ImageFilter.GaussianBlur(radius=0.9))

    # Composite onto transparent canvas
    out_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out_img.paste(cropped, (0, 0), mask=smooth_mask)

    # Save to public/magnets/
    out_path = f"public/magnets/{name}.png"
    out_hd_path = f"public/magnets/{name}_hd.png"
    out_img.save(out_path)
    out_img.save(out_hd_path)

    # Check stats
    alpha = out_img.split()[-1]
    hist = alpha.histogram()
    opaque_pct = sum(hist[200:]) / (w * h) * 100
    print(f"Extracted {name:12s}: size=({w:3d}, {h:3d}), opaque={opaque_pct:.1f}%, saved to {out_path}")

print("All 6 souvenir magnet cutouts successfully generated and solid!")
