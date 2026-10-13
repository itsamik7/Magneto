#!/usr/bin/env python3
"""
Magneto Realistic Refrigerator Asset & Catalogue Generator
Generates:
1. Photorealistic front-facing refrigerator SVG assets in public/fridges/
2. Refrigerator catalogue data in src/data/fridgeCatalog.ts with Indian & International models
"""

import os
import json

FRIDGES = [
    # ------------------ INDIAN BRANDS (10) ------------------
    {
        "id": "samsung-bespoke-double",
        "name": "Samsung Bespoke Dual-Tone",
        "brand": "Samsung",
        "style": "Double-door",
        "finish": "Bespoke Clean Navy & Pure White Glass",
        "colorHex": "#1E293B",
        "countryCategory": "Indian",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.80, "height": 0.84},
        "description": "Customizable luxury double-door refrigerator with sleek dual-tone glass panels and digital inverter technology.",
        "features": ["Bespoke Color Glass", "Twin Cooling Plus", "Digital Inverter", "Curd Maestro"],
        "svg_type": "bespoke_double"
    },
    {
        "id": "lg-instaview-stainless",
        "name": "LG DoorCooling+ InstaView",
        "brand": "LG",
        "style": "Top-freezer",
        "finish": "Brushed Platinum Silver Stainless Steel",
        "colorHex": "#94A3B8",
        "countryCategory": "Indian",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.78, "height": 0.84},
        "description": "Iconic cylindrical chrome bar handle with brushed stainless steel finish and LinearCooling smart inverter.",
        "features": ["DoorCooling+", "Smart Inverter", "Cylindrical Chrome Bar Handle", "Multi Air Flow"],
        "svg_type": "classic_stainless"  # Matches reference image exactly
    },
    {
        "id": "whirlpool-intellifresh-pro",
        "name": "Whirlpool IntelliFresh Pro",
        "brand": "Whirlpool",
        "style": "Double-door",
        "finish": "Titanium Steel Onyx",
        "colorHex": "#475569",
        "countryCategory": "Indian",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.82, "height": 0.84},
        "description": "Advanced 3D airflow with Zeolite technology and recessed pocket handles in sleek dark steel.",
        "features": ["Intellisense Inverter", "MicroBlock Technology", "Zeolite Freshizer", "Pocket Handles"],
        "svg_type": "dark_steel_double"
    },
    {
        "id": "godrej-edge-retro-ruby",
        "name": "Godrej Edge Pro Retro",
        "brand": "Godrej",
        "style": "Retro-style",
        "finish": "Vibrant Ruby Red High-Gloss Enamel",
        "colorHex": "#BE123C",
        "countryCategory": "Indian",
        "aspectRatio": 0.56,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.80, "height": 0.84},
        "description": "Curved single-door vintage classic with chrome teardrop latch and deep ruby enamel luster.",
        "features": ["Curved Vintage Profile", "Chrome Teardrop Handle", "Turbo Cooling", "Toughened Glass"],
        "svg_type": "retro_ruby"
    },
    {
        "id": "haier-bottom-mounted",
        "name": "Haier Bottom Mount Inox",
        "brand": "Haier",
        "style": "Bottom-freezer",
        "finish": "Brushed Inox Steel",
        "colorHex": "#64748B",
        "countryCategory": "Indian",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.82, "height": 0.84},
        "description": "Ergonomic bottom freezer refrigerator that reduces bending by 90% with spacious upper refrigerator surface.",
        "features": ["1 Hour Icing Technology", "Triple Inverter", "Bottom Freezer Design", "8-in-1 Convertible"],
        "svg_type": "bottom_mount_inox"
    },
    {
        "id": "voltas-beko-prosmart",
        "name": "Voltas Beko ProSmart",
        "brand": "Voltas Beko",
        "style": "French-door",
        "finish": "Charcoal Black Brushed Steel",
        "colorHex": "#1E293B",
        "countryCategory": "Indian",
        "aspectRatio": 0.64,
        "magneticRegion": {"top": 0.08, "left": 0.06, "width": 0.88, "height": 0.84},
        "description": "Grand multi-door French door layout with dual upper magnetic doors and NeoFrost dual cooling.",
        "features": ["ProSmart Inverter", "Active Fresh Blue Light", "Dual Upper Doors", "StoreFresh+"],
        "svg_type": "french_door_charcoal"
    },
    {
        "id": "bosch-series-6",
        "name": "Bosch Series 6 Anti-Fingerprint",
        "brand": "Bosch",
        "style": "Double-door",
        "finish": "Anti-Fingerprint Brushed Stainless Steel",
        "colorHex": "#94A3B8",
        "countryCategory": "Indian",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.82, "height": 0.84},
        "description": "German engineered VitaFresh plus double-door refrigerator with seamless stainless steel doors and vertical edge bar.",
        "features": ["VitaFresh Plus", "MultiAirflow", "Anti-Fingerprint Coating", "VarioInverter"],
        "svg_type": "bosch_series6"
    },
    {
        "id": "panasonic-prime-fresh",
        "name": "Panasonic Prime Fresh",
        "brand": "Panasonic",
        "style": "Double-door",
        "finish": "Sparkling Diamond Black Glass",
        "colorHex": "#0F172A",
        "countryCategory": "Indian",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.82, "height": 0.84},
        "description": "Premium black reflective glass finish with Econavi smart sensors and soft-freezing technology.",
        "features": ["Prime Fresh -3°C", "Econavi Sensors", "Ag Clean Antibacterial", "Full Flat Glass"],
        "svg_type": "black_glass_double"
    },
    {
        "id": "ifb-fastcool-inverter",
        "name": "IFB FastCool Titanium",
        "brand": "IFB",
        "style": "Top-freezer",
        "finish": "Titanium Silver Metal Finish",
        "colorHex": "#CBD5E1",
        "countryCategory": "Indian",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.82, "height": 0.84},
        "description": "Durable metal door refrigerator with 360-degree surround cooling and metal ice trays.",
        "features": ["FastCool Technology", "Metal Shield Finish", "Surround Air Flow", "Smart Humidity Controller"],
        "svg_type": "silver_top_freezer"
    },
    {
        "id": "liebherr-duotone-premium",
        "name": "Liebherr DuoTone SmartFrost",
        "brand": "Liebherr",
        "style": "Bottom-freezer",
        "finish": "SmartSteel Satin Finish",
        "colorHex": "#64748B",
        "countryCategory": "Indian",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.82, "height": 0.84},
        "description": "Swiss-engineered precision refrigeration with SmartSteel scratch-resistant magnetic finish.",
        "features": ["SmartSteel Surface", "DuoCooling", "Central VarioSpace", "Precision Touch Control"],
        "svg_type": "liebherr_smartsteel"
    },

    # ------------------ INTERNATIONAL BRANDS (10) ------------------
    {
        "id": "retro-mint-smeg",
        "name": "1950s Vintage Pastel Mint",
        "brand": "Retro Classics",
        "style": "Retro-style",
        "finish": "Pastel Mint Green High-Gloss Enamel",
        "colorHex": "#A7F3D0",
        "countryCategory": "International",
        "aspectRatio": 0.56,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.80, "height": 0.84},
        "description": "Mid-century iconic curved profile with chrome horizontal pull handle and cheerful pastel enamel.",
        "features": ["1950s Curved Aesthetics", "Chrome Horizontal Pull", "Deep Gloss Enamel", "Quiet Inverter"],
        "svg_type": "retro_mint"
    },
    {
        "id": "sub-zero-pro-sidebyside",
        "name": "Sub-Zero Pro 48 Side-by-Side",
        "brand": "Sub-Zero",
        "style": "Side-by-side",
        "finish": "Commercial Heavy-Gauge Stainless Steel",
        "colorHex": "#94A3B8",
        "countryCategory": "International",
        "aspectRatio": 0.68,
        "magneticRegion": {"top": 0.08, "left": 0.06, "width": 0.88, "height": 0.84},
        "description": "Legendary American dual-compressor side-by-side icon featuring heavy-duty commercial tubular handles.",
        "features": ["Dual Refrigeration", "Heavy-Duty Tubular Handles", "Commercial Gauge Steel", "Louvred Top Grille"],
        "svg_type": "side_by_side_pro"
    },
    {
        "id": "ge-profile-french-door",
        "name": "GE Profile Smart French Door",
        "brand": "GE Appliances",
        "style": "French-door",
        "finish": "Fingerprint Resistant Stainless Steel",
        "colorHex": "#CBD5E1",
        "countryCategory": "International",
        "aspectRatio": 0.64,
        "magneticRegion": {"top": 0.08, "left": 0.06, "width": 0.88, "height": 0.84},
        "description": "Spacious American French door design with dual magnetic upper doors and lower freezer pull drawer.",
        "features": ["TwinChill Evaporators", "Full-Width Temperature Drawer", "Door In Door", "SmartHQ Connect"],
        "svg_type": "ge_french_door"
    },
    {
        "id": "kitchenaid-architect-series",
        "name": "KitchenAid Architect Series",
        "brand": "KitchenAid",
        "style": "Multi-door",
        "finish": "Monochrome Stainless with Satin Textured Handles",
        "colorHex": "#94A3B8",
        "countryCategory": "International",
        "aspectRatio": 0.64,
        "magneticRegion": {"top": 0.08, "left": 0.06, "width": 0.88, "height": 0.84},
        "description": "Signature red medallion knurled handles on commercial stainless steel doors for serious home chefs.",
        "features": ["Preserva Food Care System", "Knurled Red Medallion Handles", "Soft-Close Drawers", "Herb Storage"],
        "svg_type": "kitchenaid_multidoor"
    },
    {
        "id": "miele-mastercool-stainless",
        "name": "Miele MasterCool MasterLine",
        "brand": "Miele",
        "style": "Single-door",
        "finish": "CleanSteel Satin Brushed",
        "colorHex": "#64748B",
        "countryCategory": "International",
        "aspectRatio": 0.56,
        "magneticRegion": {"top": 0.06, "left": 0.08, "width": 0.84, "height": 0.88},
        "description": "Minimalist European full-height column refrigerator with architectural push-to-open flat door face.",
        "features": ["Push2open Motorized Door", "MasterFresh Micro-Climate", "Full Height Column", "BrilliantLight LED"],
        "svg_type": "miele_column"
    },
    {
        "id": "fisher-paykel-activesmart",
        "name": "Fisher & Paykel ActiveSmart",
        "brand": "Fisher & Paykel",
        "style": "French-door",
        "finish": "Contemporary Matte Black Glass",
        "colorHex": "#1E293B",
        "countryCategory": "International",
        "aspectRatio": 0.64,
        "magneticRegion": {"top": 0.08, "left": 0.06, "width": 0.88, "height": 0.84},
        "description": "New Zealand minimalist black glass French door with flush recessed handles and ActiveSmart intelligence.",
        "features": ["ActiveSmart Foodcare", "Ultra-Flat Black Glass", "Variable Temperature Zone", "Concealed Hinges"],
        "svg_type": "fisher_paykel_black"
    },
    {
        "id": "electrolux-tastelock-double",
        "name": "Electrolux TasteLock Inox",
        "brand": "Electrolux",
        "style": "Double-door",
        "finish": "Arctic Silver Brushed Stainless",
        "colorHex": "#94A3B8",
        "countryCategory": "International",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.82, "height": 0.84},
        "description": "Scandinavian clean design with EvenTemp 360 cooling and TasteLock auto-humidity crispers.",
        "features": ["TasteLock Auto Humidity", "EvenTemp Cooling", "NutriFresh Inverter", "Eco Indicator"],
        "svg_type": "electrolux_silver"
    },
    {
        "id": "hisense-pureflat-titanium",
        "name": "Hisense PureFlat Infinite",
        "brand": "Hisense",
        "style": "Multi-door",
        "finish": "Dark Titanium Metal",
        "colorHex": "#334155",
        "countryCategory": "International",
        "aspectRatio": 0.64,
        "magneticRegion": {"top": 0.08, "left": 0.06, "width": 0.88, "height": 0.84},
        "description": "Ultra-modern PureFlat seamless door with recessed vertical handles and Triple Zone cooling.",
        "features": ["PureFlat Seamless Design", "Triple Zone Technology", "Metal-Tech Cooling", "Multi-Air Flow"],
        "svg_type": "hisense_titanium"
    },
    {
        "id": "studio-compact-matte-black",
        "name": "Urban Studio Compact Mini",
        "brand": "Modern Studio",
        "style": "Compact",
        "finish": "Matte Velvet Black with Chrome Handle",
        "colorHex": "#0F172A",
        "countryCategory": "International",
        "aspectRatio": 0.66,
        "magneticRegion": {"top": 0.10, "left": 0.10, "width": 0.80, "height": 0.80},
        "description": "Sleek compact bar refrigerator ideal for studio apartments, dorms, or cozy kitchen nooks.",
        "features": ["Compact Footprint", "Quiet 38dB Operation", "Chiller Compartment", "Reversible Door"],
        "svg_type": "compact_mini_black"
    },
    {
        "id": "classic-white-enamel-top",
        "name": "Heritage Clean White Enamel",
        "brand": "Heritage Home",
        "style": "Top-freezer",
        "finish": "Crisp White High-Gloss Enamel",
        "colorHex": "#F8FAFC",
        "countryCategory": "International",
        "aspectRatio": 0.58,
        "magneticRegion": {"top": 0.08, "left": 0.08, "width": 0.82, "height": 0.84},
        "description": "Timeless domestic classic featuring pure white gloss enamel doors and brushed chrome handles.",
        "features": ["Clean White Finish", "SpillSafe Glass Shelves", "Crisper Drawers", "Quiet Compressor"],
        "svg_type": "classic_white_enamel"
    }
]

print(f"Total refrigerator models curated: {len(FRIDGES)}")

def generate_fridge_svg(f):
    """
    Generates a realistic photorealistic refrigerator SVG asset with:
    - Fixed proportions matching aspectRatio
    - Realistic door metal / glass gradients and bevels
    - Cylindrical chrome or pocket handles
    - Specular sheen reflections
    - Seams for Double-Door, French-Door, Bottom-Mount, Retro, etc.
    """
    svg_type = f.get("svg_type", "classic_stainless")
    ar = f["aspectRatio"]
    w = 400
    h = int(w / ar)  # e.g. 400 / 0.58 = 689

    # Common SVG template
    if svg_type == "classic_stainless":
        # The benchmark reference model with vertical chrome bar handle on right edge
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <defs>
    <!-- Appliance Outer Floating Shadow -->
    <filter id="fridge-body-shadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="25" stdDeviation="20" flood-color="rgba(30,41,59,0.35)" />
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(0,0,0,0.18)" />
    </filter>

    <!-- Brushed Stainless Steel Gradient -->
    <linearGradient id="steel-body" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0" />
      <stop offset="25%" stop-color="#CBD5E1" />
      <stop offset="50%" stop-color="#94A3B8" />
      <stop offset="75%" stop-color="#CBD5E1" />
      <stop offset="100%" stop-color="#64748B" />
    </linearGradient>

    <!-- Chrome Outer Bevel Rim -->
    <linearGradient id="chrome-rim" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#CBD5E1" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#94A3B8" />
    </linearGradient>

    <!-- Chrome Handle Cylinder Gradient -->
    <linearGradient id="handle-chrome" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="25%" stop-color="#94A3B8" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="75%" stop-color="#CBD5E1" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>

    <!-- Diagonal Reflection Sheen -->
    <linearGradient id="specular-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.0" />
      <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0.18" />
      <stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>
  </defs>

  <g filter="url(#fridge-body-shadow)">
    <!-- 1. Outer Chassis Casing -->
    <rect x="15" y="15" width="{w - 30}" height="{h - 30}" rx="36"
          fill="url(#chrome-rim)" stroke="#94A3B8" stroke-width="2" />

    <!-- 2. Main Stainless Door Surface -->
    <rect x="22" y="22" width="{w - 44}" height="{h - 44}" rx="30"
          fill="url(#steel-body)" stroke="#FFFFFF" stroke-width="1.5" />

    <!-- 3. Horizontal Freezer Split Seam -->
    <line x1="22" y1="{int(h * 0.28)}" x2="{w - 22}" y2="{int(h * 0.28)}"
          stroke="#475569" stroke-width="2.5" opacity="0.65" />
    <line x1="22" y1="{int(h * 0.28) + 2}" x2="{w - 22}" y2="{int(h * 0.28) + 2}"
          stroke="#FFFFFF" stroke-width="1" opacity="0.8" />

    <!-- 4. Diagonal Specular Sheen Reflection Layer -->
    <path d="M 22,22 L {w - 120},22 L {w - 22},{h - 150} L {w - 22},{h - 22} L 120,{h - 22} Z"
          fill="url(#specular-sheen)" pointer-events="none" />

    <!-- 5. Vertical Cylindrical Chrome Bar Handle on Right Edge -->
    <g transform="translate({w - 46}, {int(h * 0.16)})">
      <!-- Mounting Bracket Top -->
      <rect x="-4" y="-12" width="22" height="18" rx="4"
            fill="url(#handle-chrome)" stroke="#334155" stroke-width="1" />
      <!-- Long Cylindrical Bar -->
      <rect x="0" y="0" width="14" height="{int(h * 0.65)}" rx="7"
            fill="url(#handle-chrome)" stroke="#475569" stroke-width="1.5" />
      <!-- Mounting Bracket Bottom -->
      <rect x="-4" y="{int(h * 0.65) - 6}" width="22" height="18" rx="4"
            fill="url(#handle-chrome)" stroke="#334155" stroke-width="1" />
    </g>

    <!-- 6. Bottom Kickplate Seam -->
    <line x1="22" y1="{h - 42}" x2="{w - 22}" y2="{h - 42}"
          stroke="#334155" stroke-width="2" opacity="0.5" />
  </g>
</svg>"""

    elif svg_type == "bespoke_double":
        # Samsung Bespoke: Dual-Tone (Navy top freezer, White bottom fridge)
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <defs>
    <filter id="bespoke-shadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="25" stdDeviation="20" flood-color="rgba(15,23,42,0.38)" />
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(0,0,0,0.18)" />
    </filter>
    <linearGradient id="navy-glass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="white-glass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="50%" stop-color="#F8FAFC" />
      <stop offset="100%" stop-color="#E2E8F0" />
    </linearGradient>
  </defs>
  <g filter="url(#bespoke-shadow)">
    <!-- Chassis -->
    <rect x="15" y="15" width="{w - 30}" height="{h - 30}" rx="32" fill="#0F172A" />
    <!-- Top Navy Panel -->
    <rect x="22" y="22" width="{w - 44}" height="{int(h * 0.32)}" rx="24"
          fill="url(#navy-glass)" stroke="#334155" stroke-width="2" />
    <!-- Bottom White Glass Panel -->
    <rect x="22" y="{int(h * 0.35)}" width="{w - 44}" height="{int(h * 0.58)}" rx="24"
          fill="url(#white-glass)" stroke="#CBD5E1" stroke-width="2" />
    <!-- Recessed Pocket Handles -->
    <rect x="{int(w * 0.35)}" y="{int(h * 0.33) - 3}" width="{int(w * 0.3)}" height="7" rx="3.5" fill="#020617" />
    <rect x="{int(w * 0.35)}" y="{int(h * 0.35) - 3}" width="{int(w * 0.3)}" height="7" rx="3.5" fill="#020617" />
    <!-- Glass Sheen Overlays -->
    <path d="M 22,22 L 200,22 L 22,{int(h * 0.32)} Z" fill="#FFFFFF" opacity="0.12" pointer-events="none" />
    <path d="M 22,{int(h * 0.35)} L 250,{int(h * 0.35)} L 22,{int(h * 0.9)} Z" fill="#FFFFFF" opacity="0.25" pointer-events="none" />
  </g>
</svg>"""

    elif svg_type == "retro_ruby" or svg_type == "retro_mint":
        # Curvaceous vintage 1950s single-door with chrome latch
        c1 = "#BE123C" if svg_type == "retro_ruby" else "#6EE7B7"
        c2 = "#881337" if svg_type == "retro_ruby" else "#34D399"
        c3 = "#4C0519" if svg_type == "retro_ruby" else "#059669"
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <defs>
    <filter id="retro-shadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="25" stdDeviation="20" flood-color="rgba(15,23,42,0.38)" />
    </filter>
    <linearGradient id="retro-enamel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}" />
      <stop offset="50%" stop-color="{c2}" />
      <stop offset="100%" stop-color="{c3}" />
    </linearGradient>
    <linearGradient id="chrome-latch" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#64748B" />
    </linearGradient>
  </defs>
  <g filter="url(#retro-shadow)">
    <!-- Curvy 1950s Single Door Body -->
    <rect x="15" y="15" width="{w - 30}" height="{h - 30}" rx="46"
          fill="url(#retro-enamel)" stroke="#FFFFFF" stroke-width="2.5" />
    <!-- High-Gloss Bubble Specular Sheen -->
    <path d="M 35,35 Q {w // 2},100 {w - 40},40 L {w - 40},180 Q {w // 2},240 35,160 Z"
          fill="#FFFFFF" opacity="0.24" pointer-events="none" />
    <!-- Vintage Chrome Teardrop Latch on Right -->
    <g transform="translate({w - 65}, {int(h * 0.44)})">
      <rect x="0" y="0" width="36" height="16" rx="8" fill="url(#chrome-latch)" stroke="#334155" stroke-width="1.5" />
      <circle cx="10" cy="8" r="5" fill="#FFFFFF" />
    </g>
    <!-- Chrome Lower Stand Feet -->
    <rect x="45" y="{h - 18}" width="40" height="12" rx="4" fill="url(#chrome-latch)" />
    <rect x="{w - 85}" y="{h - 18}" width="40" height="12" rx="4" fill="url(#chrome-latch)" />
  </g>
</svg>"""

    elif svg_type == "french_door_charcoal" or svg_type == "ge_french_door" or svg_type == "kitchenaid_multidoor":
        # French Door: Dual upper doors with vertical split, lower freezer drawer
        c_body = "#1E293B" if "charcoal" in svg_type else "#94A3B8"
        c_rim = "#334155" if "charcoal" in svg_type else "#CBD5E1"
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <defs>
    <filter id="french-shadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="25" stdDeviation="20" flood-color="rgba(15,23,42,0.38)" />
    </filter>
    <linearGradient id="fd-steel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c_rim}" />
      <stop offset="50%" stop-color="{c_body}" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>
    <linearGradient id="bar-chrome" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#64748B" />
    </linearGradient>
  </defs>
  <g filter="url(#french-shadow)">
    <!-- Chassis -->
    <rect x="15" y="15" width="{w - 30}" height="{h - 30}" rx="32" fill="#0F172A" stroke="#475569" stroke-width="2" />
    <!-- Upper Left Door -->
    <rect x="22" y="22" width="{w // 2 - 25}" height="{int(h * 0.62)}" rx="20"
          fill="url(#fd-steel)" stroke="#CBD5E1" stroke-width="1.5" />
    <!-- Upper Right Door -->
    <rect x="{w // 2 + 3}" y="22" width="{w // 2 - 25}" height="{int(h * 0.62)}" rx="20"
          fill="url(#fd-steel)" stroke="#CBD5E1" stroke-width="1.5" />
    <!-- Center Split Seam -->
    <line x1="{w // 2}" y1="22" x2="{w // 2}" y2="{int(h * 0.62) + 22}" stroke="#0F172A" stroke-width="4" />
    <!-- Lower Pull-Out Freezer Drawer -->
    <rect x="22" y="{int(h * 0.68)}" width="{w - 44}" height="{int(h * 0.25)}" rx="20"
          fill="url(#fd-steel)" stroke="#CBD5E1" stroke-width="1.5" />
    <!-- Dual Upper Handles -->
    <rect x="{w // 2 - 18}" y="{int(h * 0.18)}" width="8" height="{int(h * 0.32)}" rx="4" fill="url(#bar-chrome)" />
    <rect x="{w // 2 + 10}" y="{int(h * 0.18)}" width="8" height="{int(h * 0.32)}" rx="4" fill="url(#bar-chrome)" />
    <!-- Lower Drawer Handle -->
    <rect x="{w // 2 - 60}" y="{int(h * 0.70)}" width="120" height="8" rx="4" fill="url(#bar-chrome)" />
  </g>
</svg>"""

    elif svg_type == "side_by_side_pro":
        # Side-by-Side: Full vertical split from top to bottom
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <defs>
    <filter id="sbs-shadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="25" stdDeviation="20" flood-color="rgba(15,23,42,0.38)" />
    </filter>
    <linearGradient id="pro-steel" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E2E8F0" />
      <stop offset="50%" stop-color="#94A3B8" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>
    <linearGradient id="sbs-chrome" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>
  </defs>
  <g filter="url(#sbs-shadow)">
    <!-- Heavy Louvred Top Grille -->
    <rect x="15" y="15" width="{w - 30}" height="42" rx="8" fill="#1E293B" stroke="#475569" />
    <line x1="25" y1="28" x2="{w - 25}" y2="28" stroke="#94A3B8" stroke-width="2" />
    <line x1="25" y1="38" x2="{w - 25}" y2="38" stroke="#94A3B8" stroke-width="2" />
    <line x1="25" y1="48" x2="{w - 25}" y2="48" stroke="#94A3B8" stroke-width="2" />
    <!-- Left Freezer Door -->
    <rect x="18" y="65" width="{int(w * 0.42)}" height="{h - 85}" rx="16"
          fill="url(#pro-steel)" stroke="#FFFFFF" stroke-width="1.5" />
    <!-- Right Refrigerator Door -->
    <rect x="{int(w * 0.45)}" y="65" width="{int(w * 0.52)}" height="{h - 85}" rx="16"
          fill="url(#pro-steel)" stroke="#FFFFFF" stroke-width="1.5" />
    <!-- Dual Tubular Handles -->
    <rect x="{int(w * 0.38)}" y="{int(h * 0.25)}" width="10" height="{int(h * 0.45)}" rx="5" fill="url(#sbs-chrome)" />
    <rect x="{int(w * 0.48)}" y="{int(h * 0.25)}" width="10" height="{int(h * 0.45)}" rx="5" fill="url(#sbs-chrome)" />
  </g>
</svg>"""

    elif svg_type == "compact_mini_black":
        # Compact Mini Fridge in Matte Velvet Black
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <defs>
    <filter id="mini-shadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="25" stdDeviation="20" flood-color="rgba(15,23,42,0.38)" />
    </filter>
    <linearGradient id="matte-black" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="chrome-pull" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#475569" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#64748B" />
    </linearGradient>
  </defs>
  <g filter="url(#mini-shadow)">
    <!-- Compact Body -->
    <rect x="20" y="20" width="{w - 40}" height="{h - 40}" rx="32"
          fill="url(#matte-black)" stroke="#334155" stroke-width="2.5" />
    <!-- Top Recessed Handgrip -->
    <rect x="{w - 65}" y="35" width="22" height="14" rx="4" fill="url(#chrome-pull)" />
    <!-- Subtle Specular Reflection -->
    <path d="M 25,25 L {w - 100},25 L {w - 25},{h - 120} L {w - 25},{h - 25} L 120,{h - 25} Z"
          fill="#FFFFFF" opacity="0.08" pointer-events="none" />
  </g>
</svg>"""

    else:
        # Default Double-Door with Inox / Dark / White finish
        c_top = "#CBD5E1" if "silver" in svg_type or "white" in svg_type else "#475569"
        c_mid = "#FFFFFF" if "white" in svg_type else ("#94A3B8" if "silver" in svg_type else "#1E293B")
        c_bot = "#E2E8F0" if "white" in svg_type else ("#64748B" if "silver" in svg_type else "#0F172A")
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <defs>
    <filter id="def-shadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="25" stdDeviation="20" flood-color="rgba(15,23,42,0.38)" />
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="rgba(0,0,0,0.18)" />
    </filter>
    <linearGradient id="body-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c_top}" />
      <stop offset="50%" stop-color="{c_mid}" />
      <stop offset="100%" stop-color="{c_bot}" />
    </linearGradient>
    <linearGradient id="metal-handle" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#334155" />
      <stop offset="50%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>
  </defs>
  <g filter="url(#def-shadow)">
    <!-- Chassis Outer -->
    <rect x="15" y="15" width="{w - 30}" height="{h - 30}" rx="32" fill="{c_top}" stroke="#64748B" stroke-width="2" />
    <!-- Door Surface -->
    <rect x="22" y="22" width="{w - 44}" height="{h - 44}" rx="26" fill="url(#body-grad)" stroke="#FFFFFF" stroke-width="1.5" />
    <!-- Seam (Top or Bottom split) -->
    <line x1="22" y1="{int(h * (0.65 if 'bottom' in svg_type else 0.30))}" x2="{w - 22}" y2="{int(h * (0.65 if 'bottom' in svg_type else 0.30))}"
          stroke="#334155" stroke-width="2.5" opacity="0.6" />
    <!-- Handle Bar on Right -->
    <rect x="{w - 46}" y="{int(h * 0.16)}" width="12" height="{int(h * 0.65)}" rx="6" fill="url(#metal-handle)" />
  </g>
</svg>"""

    return svg

# Generate all SVGs
os.makedirs("public/fridges", exist_ok=True)
catalog_models = []

for f in FRIDGES:
    fid = f["id"]
    svg_filename = f"{fid}.svg"
    svg_path = os.path.join("public/fridges", svg_filename)
    svg_content = generate_fridge_svg(f)

    with open(svg_path, "w", encoding="utf-8") as out:
        out.write(svg_content)

    catalog_models.append({
        "id": f["id"],
        "name": f["name"],
        "brand": f["brand"],
        "style": f["style"],
        "finish": f["finish"],
        "colorHex": f["colorHex"],
        "countryCategory": f["countryCategory"],
        "imageUrl": f"/fridges/{svg_filename}",
        "aspectRatio": f["aspectRatio"],
        "magneticRegion": f["magneticRegion"],
        "description": f["description"],
        "features": f["features"],
        "isCustom": False
    })

print(f"Generated {len(FRIDGES)} SVG refrigerator assets in public/fridges/")

# Write src/data/fridgeCatalog.ts
ts_content = f"""// AUTO-GENERATED REFRIGERATOR CATALOGUE
// Indian & International Refrigerator Models with Magnetic Surface Bounds
import type {{ FridgeModel }} from '../types/fridge'

export const DEFAULT_FRIDGE_ID = 'lg-instaview-stainless'

export const FRIDGE_MODELS: FridgeModel[] = {json.dumps(catalog_models, indent=2)};

export const GET_DEFAULT_FRIDGE = (): FridgeModel => {{
  return FRIDGE_MODELS.find((m) => m.id === DEFAULT_FRIDGE_ID) || FRIDGE_MODELS[0]
}}
"""

with open("src/data/fridgeCatalog.ts", "w", encoding="utf-8") as out:
    out.write(ts_content)

print("Generated src/data/fridgeCatalog.ts successfully!")
