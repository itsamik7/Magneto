import os
import sys
from PIL import Image, ImageDraw, ImageFilter

def remove_background_and_save(input_path: str, output_path: str, white_threshold: int = 236):
    """
    Remove solid white studio background from product photograph using
    corner-connected flood-fill and feathered alpha matting.
    """
    if not os.path.exists(input_path):
        print(f"Error: input file not found: {input_path}")
        return False

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    img = Image.open(input_path).convert("RGBA")
    w, h = img.size

    # Convert to grayscale luminance
    gray = img.convert("L")
    gray_pixels = gray.load()

    # Create binary difference image: pure white / near-white pixels
    bin_img = Image.new("L", (w, h), 0)
    bin_pixels = bin_img.load()

    for y in range(h):
        for x in range(w):
            val = gray_pixels[x, y]
            if val >= white_threshold:
                bin_pixels[x, y] = 255

    # Flood fill background from 4 corners and middle edges
    flood = bin_img.copy()
    seeds = [
        (0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
        (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)
    ]
    for sx, sy in seeds:
        if bin_pixels[sx, sy] == 255:
            ImageDraw.floodfill(flood, (sx, sy), 128, thresh=15)

    flood_pixels = flood.load()

    # Build Alpha Mask: 255 for foreground, 0 for background
    alpha_mask = Image.new("L", (w, h), 255)
    alpha_pixels = alpha_mask.load()

    for y in range(h):
        for x in range(w):
            if flood_pixels[x, y] == 128:
                alpha_pixels[x, y] = 0

    # Gentle box blur on mask to anti-alias edges
    smooth_alpha = alpha_mask.filter(ImageFilter.GaussianBlur(radius=0.75))

    # Apply alpha mask
    r, g, b, _ = img.split()
    result = Image.merge("RGBA", (r, g, b, smooth_alpha))

    # Bounding box crop
    bbox = result.getbbox()
    if bbox:
        # Add 12px margin
        x1 = max(0, bbox[0] - 12)
        y1 = max(0, bbox[1] - 12)
        x2 = min(w, bbox[2] + 12)
        y2 = min(h, bbox[3] + 12)
        result = result.crop((x1, y1, x2, y2))

    result.save(output_path, format="PNG", optimize=True)
    print(f"Processed: {input_path} -> {output_path} (size: {result.size})")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 process_magnets.py <input_img> <output_png> [threshold]")
        sys.exit(1)

    thresh = int(sys.argv[3]) if len(sys.argv) > 3 else 236
    remove_background_and_save(sys.argv[1], sys.argv[2], thresh)
