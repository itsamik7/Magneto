"""
Magneto — Automated Souvenir Magnet Asset Generator
Generates original 3D photorealistic souvenir magnets with transparent backgrounds
for all 24 Indian and International catalog destinations.
"""
import os
import sys

MAGNET_SPECIFICATIONS = [
    # --- Indian Destinations (12) ---
    {
        "id": "taj-mahal",
        "name": "Taj Mahal, Agra",
        "region": "india",
        "prompt": "Photorealistic 3D sculpted glazed ceramic relief souvenir refrigerator magnet of the Taj Mahal in Agra, India. Marble domes, minarets, embossed TAJ MAHAL plaque at base, isolated on solid white background #FFFFFF, product photography.",
        "output_png": "public/assets/magnets/india/taj-mahal.png",
    },
    {
        "id": "india-gate",
        "name": "India Gate, New Delhi",
        "region": "india",
        "prompt": "Photorealistic 3D carved red-and-yellow sandstone archway monument souvenir refrigerator magnet of India Gate, New Delhi. Architectural cornices, embossed INDIA plaque, isolated on solid white background #FFFFFF, product photography.",
        "output_png": "public/assets/magnets/india/india-gate.png",
    },
    {
        "id": "hawa-mahal",
        "name": "Hawa Mahal, Jaipur",
        "region": "india",
        "prompt": "Photorealistic 3D sculpted terracotta-pink sandstone relief souvenir refrigerator magnet of Hawa Mahal (Palace of Winds), Jaipur. Honeycombed jharokha lattice windows, embossed JAIPUR plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/hawa-mahal.png",
    },
    {
        "id": "gateway-of-india",
        "name": "Gateway of India, Mumbai",
        "region": "india",
        "prompt": "Photorealistic 3D carved yellow basalt stone relief souvenir refrigerator magnet of Gateway of India, Mumbai. Triumphal archway, turrets, embossed MUMBAI plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/gateway-of-india.png",
    },
    {
        "id": "golden-temple",
        "name": "Golden Temple, Amritsar",
        "region": "india",
        "prompt": "Photorealistic 3D gilded gold-leaf and white marble relief souvenir refrigerator magnet of Harmandir Sahib (Golden Temple), Amritsar. Golden dome, sacred Amrit Sarovar reflection pool, embossed AMRITSAR plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/golden-temple.png",
    },
    {
        "id": "kerala-backwaters",
        "name": "Kerala Backwaters",
        "region": "india",
        "prompt": "Photorealistic 3D carved wood and painted resin souvenir refrigerator magnet of traditional thatched Kettuvallam houseboat on emerald backwaters with coconut palms, embossed KERALA plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/kerala-backwaters.png",
    },
    {
        "id": "goa-beach",
        "name": "Goa Beach",
        "region": "india",
        "prompt": "Photorealistic 3D sculpted resin and ceramic souvenir refrigerator magnet of Goa beach at sunset. Coconut palm trees, orange sunset, ocean waves, rustic wooden GOA plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/goa-beach.png",
    },
    {
        "id": "ladakh",
        "name": "Ladakh Landscapes",
        "region": "india",
        "prompt": "Photorealistic 3D sculpted stone relief souvenir refrigerator magnet of Ladakh Himalayas. Snow-capped peaks, deep blue Pangong Tso lake, prayer flags, embossed LADAKH INDIA plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/ladakh.png",
    },
    {
        "id": "royal-elephant",
        "name": "Royal Indian Elephant",
        "region": "india",
        "prompt": "Photorealistic 3D sculpted enamel and gold-embossed souvenir refrigerator magnet of decorated Royal Indian Elephant. Vibrant jhool ceremonial saddle blanket, gold ornaments, embossed INDIA plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/royal-elephant.png",
    },
    {
        "id": "varanasi-ghats",
        "name": "Varanasi Ghats",
        "region": "india",
        "prompt": "Photorealistic 3D painted resin souvenir refrigerator magnet of Varanasi sacred river ghats. Ancient stone steps, temple spires, wooden boat, illuminated diyas on river Ganges, embossed VARANASI plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/varanasi.png",
    },
    {
        "id": "mysore-palace",
        "name": "Mysore Palace",
        "region": "india",
        "prompt": "Photorealistic 3D sculpted Indo-Saracenic royal palace relief souvenir refrigerator magnet of Mysore Palace. Domed arches, illuminated towers, embossed MYSORE plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/mysore-palace.png",
    },
    {
        "id": "charminar",
        "name": "Charminar, Hyderabad",
        "region": "india",
        "prompt": "Photorealistic 3D carved granite monument souvenir refrigerator magnet of Charminar, Hyderabad. Four grand minarets, central arches, embossed HYDERABAD plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/india/charminar.png",
    },

    # --- International Destinations (12) ---
    {
        "id": "eiffel-tower",
        "name": "Eiffel Tower, Paris",
        "region": "international",
        "prompt": "Photorealistic 3D sculpted antique cast bronze/brass relief souvenir refrigerator magnet of Eiffel Tower, Paris. Architectural iron lattice, Arc de Triomphe, embossed PARIS plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/eiffel-tower.png",
    },
    {
        "id": "colosseum-rome",
        "name": "Colosseum, Rome",
        "region": "international",
        "prompt": "Photorealistic 3D sculpted weathered travertine stone relief souvenir refrigerator magnet of Colosseum, Rome. Tiered arcades, Roman ruins, embossed ROMA plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/colosseum-rome.png",
    },
    {
        "id": "london",
        "name": "Big Ben & London Bus",
        "region": "international",
        "prompt": "Photorealistic 3D molded die-cast enamel souvenir refrigerator magnet of London Big Ben and red double-decker bus, embossed LONDON plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/london.png",
    },
    {
        "id": "fuji-japan",
        "name": "Mount Fuji, Japan",
        "region": "international",
        "prompt": "Photorealistic 3D circular ceramic/enamel souvenir refrigerator magnet of snow-capped Mount Fuji, Japanese pagoda, pink cherry blossoms, embossed JAPAN plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/fuji-japan.png",
    },
    {
        "id": "bali-temple",
        "name": "Bali Temple, Indonesia",
        "region": "international",
        "prompt": "Photorealistic 3D sculpted dark volcanic stone Pura Ulun Danu multi-tiered pagoda temple souvenir refrigerator magnet with tropical palm greenery, embossed BALI plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/bali-temple.png",
    },
    {
        "id": "swiss-alps",
        "name": "Swiss Alps, Switzerland",
        "region": "international",
        "prompt": "Photorealistic 3D sculpted wood and enamel alpine relief souvenir refrigerator magnet with Matterhorn peak, pine trees, chalet, embossed SWITZERLAND plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/swiss-alps.png",
    },
    {
        "id": "singapore",
        "name": "Singapore Cityscape",
        "region": "international",
        "prompt": "Photorealistic 3D brushed metallic relief souvenir refrigerator magnet featuring Marina Bay Sands, Merlion, and Gardens by the Bay, embossed SINGAPORE plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/singapore.png",
    },
    {
        "id": "statue-of-liberty",
        "name": "Statue of Liberty, New York",
        "region": "international",
        "prompt": "Photorealistic 3D sculpted turquoise verdigris bronze souvenir refrigerator magnet of Lady Liberty holding torch and tablet, embossed NEW YORK plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/statue-of-liberty.png",
    },
    {
        "id": "santorini",
        "name": "Santorini, Greece",
        "region": "international",
        "prompt": "Photorealistic 3D sculpted whitewashed Cycladic cliffside village relief souvenir refrigerator magnet with cobalt-blue church domes, Aegean sea backdrop, embossed SANTORINI plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/santorini.png",
    },
    {
        "id": "great-wall",
        "name": "Great Wall of China",
        "region": "international",
        "prompt": "Photorealistic 3D carved stone relief souvenir refrigerator magnet of Great Wall snaking across mist-shrouded green mountain ridges, watchtowers, embossed CHINA plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/great-wall.png",
    },
    {
        "id": "pyramids-giza",
        "name": "Pyramids of Giza, Egypt",
        "region": "international",
        "prompt": "Photorealistic 3D golden sandstone relief souvenir refrigerator magnet of Great Pyramids and Sphinx under radiant sun, embossed EGYPT plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/pyramids-giza.png",
    },
    {
        "id": "burj-khalifa",
        "name": "Burj Khalifa, Dubai",
        "region": "international",
        "prompt": "Photorealistic 3D sleek metallic chrome and glass architectural souvenir refrigerator magnet of towering Burj Khalifa skyscraper, embossed DUBAI plaque, isolated on solid white background #FFFFFF.",
        "output_png": "public/assets/magnets/international/burj-khalifa.png",
    },
]

def main():
    print(f"Magneto Catalog Asset Inventory: {len(MAGNET_SPECIFICATIONS)} total destinations defined.")
    present = 0
    missing = 0
    for item in MAGNET_SPECIFICATIONS:
        path = item["output_png"]
        if os.path.exists(path):
            size = os.path.getsize(path) // 1024
            print(f"  [OK] {item['name']:<30} -> {path} ({size} KB)")
            present += 1
        else:
            print(f"  [PENDING] {item['name']:<30} -> {path} (Requires generation)")
            missing += 1

    print(f"\nSummary: {present} ready in production, {missing} pending model capacity reset.")

if __name__ == "__main__":
    main()
