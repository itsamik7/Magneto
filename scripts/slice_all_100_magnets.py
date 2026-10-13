import cv2
import numpy as np
from PIL import Image
import os
import shutil

MASTER_IMAGE_PATH = '/Users/itsamik/.gemini/antigravity/brain/454074dc-065c-4746-902f-d8018f440679/.user_uploaded/media_1791905402077_95c4323b.jpg'
DESTINATIONS_DIR = '/Users/itsamik/Documents/Magneto_01/public/magnets/destinations'
ASSETS_DIR = '/Users/itsamik/Documents/Magneto_01/public/assets/magnets'

os.makedirs(DESTINATIONS_DIR, exist_ok=True)
os.makedirs(f'{ASSETS_DIR}/india', exist_ok=True)
os.makedirs(f'{ASSETS_DIR}/international', exist_ok=True)

img = cv2.imread(MASTER_IMAGE_PATH)
h, w, _ = img.shape
print(f"Loaded master sheet: {w}x{h}")

def extract_magnet(crop):
    """Cleanly extracts a magnet from its crop with transparent background and 3x Lanczos upscale."""
    ch, cw, _ = crop.shape
    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    
    # Create mask for floodFill (must be ch+2, cw+2)
    mask = np.zeros((ch + 2, cw + 2), np.uint8)
    flooded = crop.copy()
    
    # Perimeter seed points to flood background
    seed_points = [
        (0, 0), (cw-1, 0), (0, ch-1), (cw-1, ch-1),
        (cw//2, 0), (cw//2, ch-1), (0, ch//2), (cw-1, ch//2),
        (cw//4, 0), (3*cw//4, 0), (cw//4, ch-1), (3*cw//4, ch-1),
    ]
    for sx, sy in seed_points:
        pix = crop[sy, sx]
        if np.std(pix) < 20 and 160 < np.mean(pix) < 230:
            cv2.floodFill(flooded, mask, (sx, sy), (0, 0, 0), (14, 14, 14), (14, 14, 14), cv2.FLOODFILL_FIXED_RANGE)
            
    bg_mask = mask[1:ch+1, 1:cw+1]
    fg_mask = (bg_mask == 0).astype(np.uint8) * 255
    
    # Find largest connected component (the magnet) to eliminate number labels outside
    num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(fg_mask)
    if num_labels > 1:
        # Keep components that are substantial in size (>250px)
        valid_labels = []
        for l in range(1, num_labels):
            area = stats[l, cv2.CC_STAT_AREA]
            if area > 250:
                valid_labels.append(l)
        if valid_labels:
            clean_mask = np.isin(labels, valid_labels).astype(np.uint8) * 255
        else:
            clean_mask = fg_mask
    else:
        clean_mask = fg_mask
        
    # Fill small interior holes if any
    cnts, _ = cv2.findContours(clean_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled_mask = np.zeros_like(clean_mask)
    if cnts:
        cv2.drawContours(filled_mask, cnts, -1, 255, -1)
    else:
        filled_mask = clean_mask
        
    # Smooth edges with 1px gaussian blur for antialiasing
    clean_mask = cv2.GaussianBlur(filled_mask, (3, 3), 0.5)
    
    # Compose RGBA
    rgba = np.dstack([rgb, clean_mask])
    
    # Crop to non-transparent bounding box with 2px padding
    y_indices, x_indices = np.where(clean_mask > 25)
    if len(y_indices) > 0 and len(x_indices) > 0:
        y1 = max(0, np.min(y_indices) - 2)
        y2 = min(ch - 1, np.max(y_indices) + 2)
        x1 = max(0, np.min(x_indices) - 2)
        x2 = min(cw - 1, np.max(x_indices) + 2)
        rgba = rgba[y1:y2+1, x1:x2+1]
        
    pil_img = Image.fromarray(rgba, 'RGBA')
    nw = pil_img.width * 3
    nh = pil_img.height * 3
    upscaled = pil_img.resize((nw, nh), Image.Resampling.LANCZOS)
    return upscaled

destinations_meta = []

# --- 1. INDIA (1-20) ---
india_row1_slugs = ['taj-mahal', 'jaipur', 'varanasi', 'goa', 'kerala', 'munnar', 'ladakh', 'udaipur', 'rishikesh', 'darjeeling']
india_row2_slugs = ['amritsar', 'mumbai', 'delhi', 'hampi', 'jodhpur', 'andaman', 'manali', 'jaisalmer', 'konark', 'madurai']
col_pts_in = np.linspace(0, 1024, 11).astype(int)

for i in range(10):
    destinations_meta.append({
        'slug': india_row1_slugs[i],
        'region': 'india',
        'crop': (20, 100, col_pts_in[i], col_pts_in[i+1])
    })
for i in range(10):
    destinations_meta.append({
        'slug': india_row2_slugs[i],
        'region': 'india',
        'crop': (105, 185, col_pts_in[i], col_pts_in[i+1])
    })

# --- 2. EUROPE (21-40) ---
eu_row1_slugs = ['paris', 'london', 'switzerland', 'rome', 'venice', 'santorini', 'barcelona', 'amsterdam', 'vienna']
eu_row2_slugs = ['athens', 'amalfi-coast', 'budapest', 'norwegian-fjords', 'iceland', 'lisbon', 'bavaria', 'dubrovnik', 'berlin']

x_cuts_eu1 = [8, 74, 138, 204, 272, 340, 408, 474, 536, 595]
x_cuts_eu2 = [8, 74, 138, 204, 272, 340, 406, 472, 536, 595]

for i in range(9):
    destinations_meta.append({
        'slug': eu_row1_slugs[i],
        'region': 'international',
        'crop': (220, 310, x_cuts_eu1[i], x_cuts_eu1[i+1])
    })
for i in range(9):
    destinations_meta.append({
        'slug': eu_row2_slugs[i],
        'region': 'international',
        'crop': (315, 410, x_cuts_eu2[i], x_cuts_eu2[i+1])
    })

# --- 3. ASIA (41-60) ---
asia_row1 = ['japan', 'bali', 'singapore', 'bangkok', 'phuket']
asia_row2 = ['seoul', 'dubai', 'ha-long-bay', 'angkor-wat', 'petra']
asia_row3 = ['maldives', 'hoi-an', 'cappadocia', 'istanbul', 'sigiriya']
asia_row4 = ['boracay', 'kuala-lumpur', 'hong-kong', 'nepal', 'chiang-mai']

col_pts_asia = np.linspace(600, 1024, 6).astype(int)
asia_rows = [
    (asia_row1, (210, 280)),
    (asia_row2, (280, 350)),
    (asia_row3, (350, 420)),
    (asia_row4, (420, 490)),
]
for slugs, (y1, y2) in asia_rows:
    for i in range(5):
        destinations_meta.append({
            'slug': slugs[i],
            'region': 'international',
            'crop': (y1, y2, col_pts_asia[i], col_pts_asia[i+1])
        })

# --- 4. AMERICAS (61-75) ---
am_row1 = ['new-york', 'grand-canyon', 'san-francisco', 'hawaii', 'las-vegas', 'miami', 'yellowstone', 'banff']
col_pts_am1 = np.linspace(0, 455, 9).astype(int)
for i in range(8):
    destinations_meta.append({
        'slug': am_row1[i],
        'region': 'international',
        'crop': (505, 580, col_pts_am1[i], col_pts_am1[i+1])
    })

am_row2 = ['machu-picchu', 'rio-de-janeiro', 'patagonia', 'cancun', 'cartagena', 'costa-rica', 'galapagos']
col_pts_am2 = np.linspace(0, 455, 8).astype(int)
for i in range(7):
    destinations_meta.append({
        'slug': am_row2[i],
        'region': 'international',
        'crop': (590, 675, col_pts_am2[i], col_pts_am2[i+1])
    })

# --- 5. OCEANIA (76-90) ---
oc_row1 = ['sydney', 'great-barrier-reef', 'melbourne', 'queenstown', 'milford-sound']
oc_row2 = ['rotorua', 'fiji', 'bora-bora', 'uluru', 'auckland']
oc_row3 = ['cairns-daintree', 'tahiti', 'cook-islands', 'tasmania', 'whitsundays']

col_pts_oc = np.linspace(458, 765, 6).astype(int)
oc_rows = [
    (oc_row1, (505, 560)),
    (oc_row2, (565, 620)),
    (oc_row3, (625, 680)),
]
for slugs, (y1, y2) in oc_rows:
    for i in range(5):
        destinations_meta.append({
            'slug': slugs[i],
            'region': 'international',
            'crop': (y1, y2, col_pts_oc[i], col_pts_oc[i+1])
        })

# --- 6. AFRICA & MIDDLE EAST (91-100) ---
af_row1 = ['giza', 'cape-town', 'serengeti']
col_pts_af1 = np.linspace(770, 1024, 4).astype(int)
for i in range(3):
    destinations_meta.append({
        'slug': af_row1[i],
        'region': 'international',
        'crop': (505, 560, col_pts_af1[i], col_pts_af1[i+1])
    })

af_row2 = ['marrakech', 'victoria-falls', 'zanzibar']
for i in range(3):
    destinations_meta.append({
        'slug': af_row2[i],
        'region': 'international',
        'crop': (565, 620, col_pts_af1[i], col_pts_af1[i+1])
    })

af_row3 = ['mauritius', 'masai-mara', 'luxor', 'abu-dhabi']
col_pts_af3 = np.linspace(770, 1024, 5).astype(int)
for i in range(4):
    destinations_meta.append({
        'slug': af_row3[i],
        'region': 'international',
        'crop': (625, 680, col_pts_af3[i], col_pts_af3[i+1])
    })

print(f"Total destinations configured for extraction: {len(destinations_meta)}")

# Process each magnet
success_count = 0
for idx, meta in enumerate(destinations_meta):
    slug = meta['slug']
    region = meta['region']
    y1, y2, x1, x2 = meta['crop']
    
    y1, y2 = max(0, y1), min(h, y2)
    x1, x2 = max(0, x1), min(w, x2)
    
    crop = img[y1:y2, x1:x2]
    if crop.size == 0:
        continue
        
    try:
        processed = extract_magnet(crop)
        
        # Save to public/magnets/destinations/{slug}.png
        out_path1 = os.path.join(DESTINATIONS_DIR, f"{slug}.png")
        processed.save(out_path1, "PNG")
        
        # Save to public/assets/magnets/{region}/{slug}.png
        out_path2 = os.path.join(ASSETS_DIR, region, f"{slug}.png")
        processed.save(out_path2, "PNG")
        
        # Handle aliases / alternate names
        aliases = {
            'bangkok': ['thailand'],
            'japan': ['fuji-japan', 'tokyo'],
            'paris': ['eiffel-tower'],
            'rome': ['colosseum-rome'],
            'bali': ['bali-temple'],
            'switzerland': ['swiss-alps'],
            'london': ['london-bus'],
            'delhi': ['india-gate'],
            'jaipur': ['hawa-mahal'],
            'mumbai': ['gateway-of-india'],
            'amritsar': ['golden-temple'],
            'kerala': ['kerala-backwaters'],
            'goa': ['goa-beach'],
            'budapest': ['prague'],
        }
        if slug in aliases:
            for alias in aliases[slug]:
                processed.save(os.path.join(DESTINATIONS_DIR, f"{alias}.png"), "PNG")
                processed.save(os.path.join(ASSETS_DIR, region, f"{alias}.png"), "PNG")
        
        success_count += 1
        if (idx + 1) % 15 == 0 or idx == len(destinations_meta) - 1:
            print(f"Extracted {idx + 1}/{len(destinations_meta)}: {slug}")
    except Exception as e:
        print(f"Error extracting {slug}: {e}")

print(f"\nSuccessfully extracted, upscaled, and saved {success_count} transparent PNG magnet souvenirs!")
