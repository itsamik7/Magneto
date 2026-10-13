#!/usr/bin/env python3
"""
Magneto Destination Catalog & Vector Enamel Magnet Asset Generator
Generates:
1. 100 curated destination metadata records across 6 continents.
2. 100 physical-looking souvenir enamel magnet vector badges with die-cut white borders,
   molded 3D bevels, destination-specific silhouettes, landscape/monument artwork, and embossed typography ribbons.
3. Supabase migration & seed SQL (supabase/migrations/20261013000001_destination_catalog.sql).
4. TypeScript destination catalog (src/data/destinationsCatalog.ts).
"""

import os
import json
import re

DESTINATIONS = [
    # ------------------ INDIA (20) ------------------
    {
        "slug": "taj-mahal",
        "name": "Taj Mahal, Agra",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Agra", "region": "Uttar Pradesh",
        "destination_type": "Historical Site",
        "short_description": "The ivory-white marble mausoleum of eternal love on the south bank of the Yamuna river.",
        "landmark_names": ["Taj Mahal Dome", "Yamuna Reflection Pool", "Agra Fort", "Chhatri Minarets"],
        "tags": ["UNESCO", "Romance", "Architecture", "Wonder of the World"],
        "popularity_score": 99, "is_featured": True,
        "magnet_shape": "arch",
        "dominant_colors": ["#FFFDF8", "#E0A96D", "#703030", "#3D2C8D"],
        "art_preset": "taj_mahal",
        "asset_url": "/magnets/destinations/taj-mahal.svg"
    },
    {
        "slug": "jaipur",
        "name": "Jaipur, Rajasthan",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Jaipur", "region": "Rajasthan",
        "destination_type": "Cultural Heritage",
        "short_description": "The vibrant Pink City known for honeycomb facades, royal hill forts, and starry observatories.",
        "landmark_names": ["Hawa Mahal", "Amer Fort", "City Palace", "Jantar Mantar"],
        "tags": ["Heritage", "Forts", "Palaces", "Culture"],
        "popularity_score": 94, "is_featured": True,
        "magnet_shape": "shield",
        "dominant_colors": ["#E86A58", "#FCD34D", "#831843", "#FEF3C7"],
        "art_preset": "jaipur",
        "asset_url": "/magnets/destinations/jaipur.svg"
    },
    {
        "slug": "varanasi",
        "name": "Varanasi Ghats",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Varanasi", "region": "Uttar Pradesh",
        "destination_type": "Religious Destination",
        "short_description": "The spiritual capital of India on the sacred Ganges, where thousands gather for sunrise aarti.",
        "landmark_names": ["Dashashwamedh Ghat", "Kashi Vishwanath", "Assi Ghat", "Ganga Aarti"],
        "tags": ["Spiritual", "River", "Ancient", "Culture"],
        "popularity_score": 91, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#F59E0B", "#DC2626", "#1E3A8A", "#FEF08A"],
        "art_preset": "varanasi",
        "asset_url": "/magnets/destinations/varanasi.svg"
    },
    {
        "slug": "goa",
        "name": "Goa Golden Beaches",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Panaji", "region": "Goa",
        "destination_type": "Beach",
        "short_description": "Sun-drenched Arabian coast fringed with leaning coconut palms, Portuguese churches, and surf.",
        "landmark_names": ["Palolem Beach", "Fort Aguada", "Basilica of Bom Jesus", "Anjuna Coast"],
        "tags": ["Beach", "Nightlife", "Seafood", "Sun"],
        "popularity_score": 96, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#0EA5E9", "#FBBF24", "#059669", "#EA580C"],
        "art_preset": "goa",
        "asset_url": "/magnets/destinations/goa.svg"
    },
    {
        "slug": "kerala-backwaters",
        "name": "Kerala Backwaters",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Alleppey", "region": "Kerala",
        "destination_type": "Scenic Region",
        "short_description": "A tranquil labyrinth of emerald palm-lined canals navigated by traditional thatched kettuvallam houseboats.",
        "landmark_names": ["Vembanad Lake", "Alleppey Houseboats", "Kumarakom", "Chinese Fishing Nets"],
        "tags": ["Nature", "Backwaters", "Ayurveda", "Serene"],
        "popularity_score": 93, "is_featured": True,
        "magnet_shape": "landscape",
        "dominant_colors": ["#10B981", "#047857", "#F59E0B", "#0284C7"],
        "art_preset": "kerala",
        "asset_url": "/magnets/destinations/kerala-backwaters.svg"
    },
    {
        "slug": "munnar",
        "name": "Munnar Tea Hills",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Munnar", "region": "Kerala",
        "destination_type": "Mountain",
        "short_description": "Rolling carpeted tea plantations shrouded in morning mist and high Western Ghats peaks.",
        "landmark_names": ["Anamudi Peak", "Mattupetty Dam", "Kolukkumalai Tea Estate", "Eravikulam"],
        "tags": ["Tea", "Misty Hills", "Trekking", "Wildlife"],
        "popularity_score": 89, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#059669", "#34D399", "#1E293B", "#A7F3D0"],
        "art_preset": "munnar",
        "asset_url": "/magnets/destinations/munnar.svg"
    },
    {
        "slug": "ladakh",
        "name": "Ladakh & Pangong Tso",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Leh", "region": "Ladakh",
        "destination_type": "Adventure",
        "short_description": "The high-altitude cold desert with shifting sapphire lakes, Buddhist gompas, and snowbound passes.",
        "landmark_names": ["Pangong Tso Lake", "Khardung La Pass", "Thiksey Monastery", "Nubra Valley"],
        "tags": ["Himalayas", "Biking", "Monastery", "Lake"],
        "popularity_score": 95, "is_featured": True,
        "magnet_shape": "shield",
        "dominant_colors": ["#1D4ED8", "#F59E0B", "#B45309", "#E0F2FE"],
        "art_preset": "ladakh",
        "asset_url": "/magnets/destinations/ladakh.svg"
    },
    {
        "slug": "udaipur",
        "name": "Udaipur Lake City",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Udaipur", "region": "Rajasthan",
        "destination_type": "Cultural Heritage",
        "short_description": "The City of Lakes with ornate marble palaces reflected on the shimmering waters of Lake Pichola.",
        "landmark_names": ["Lake Palace", "City Palace Udaipur", "Jag Mandir", "Saheliyon-ki-Bari"],
        "tags": ["Royalty", "Romance", "Palace", "Lake"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#38BDF8", "#F43F5E", "#E2E8F0", "#312E81"],
        "art_preset": "udaipur",
        "asset_url": "/magnets/destinations/udaipur.svg"
    },
    {
        "slug": "rishikesh",
        "name": "Rishikesh Yoga Capital",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Rishikesh", "region": "Uttarakhand",
        "destination_type": "Adventure",
        "short_description": "Suspension bridges over emerald rapids where Himalayan serenity meets river rafting and yoga.",
        "landmark_names": ["Laxman Jhula", "Ram Jhula", "Triveni Ghat", "Beatles Ashram"],
        "tags": ["Yoga", "Rafting", "Himalayas", "Ganges"],
        "popularity_score": 88, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#0D9488", "#F97316", "#047857", "#CCFBF1"],
        "art_preset": "rishikesh",
        "asset_url": "/magnets/destinations/rishikesh.svg"
    },
    {
        "slug": "darjeeling",
        "name": "Darjeeling Toy Train",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Darjeeling", "region": "West Bengal",
        "destination_type": "Mountain",
        "short_description": "Colonial hill station famous for narrow-gauge steam trains, muscatel tea, and Kanchenjunga panoramas.",
        "landmark_names": ["Himalayan Railway Toy Train", "Tiger Hill", "Batasia Loop", "Happy Valley Tea"],
        "tags": ["Tea", "Steam Train", "Kanchenjunga", "Himalayas"],
        "popularity_score": 87, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#1E3A8A", "#059669", "#D97706", "#DBEAFE"],
        "art_preset": "darjeeling",
        "asset_url": "/magnets/destinations/darjeeling.svg"
    },
    {
        "slug": "hampi",
        "name": "Hampi Boulder Ruins",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Hampi", "region": "Karnataka",
        "destination_type": "Historical Site",
        "short_description": "A surreal moonscape of granite boulders concealing the glorious stone ruins of the Vijayanagara Empire.",
        "landmark_names": ["Vittala Stone Chariot", "Virupaksha Temple", "Lotus Mahal", "Tungabhadra River"],
        "tags": ["UNESCO", "Ruins", "Ancient", "Boulders"],
        "popularity_score": 90, "is_featured": False,
        "magnet_shape": "shield",
        "dominant_colors": ["#D97706", "#78350F", "#0284C7", "#FEF3C7"],
        "art_preset": "hampi",
        "asset_url": "/magnets/destinations/hampi.svg"
    },
    {
        "slug": "manali",
        "name": "Manali Snow Valley",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Manali", "region": "Himachal Pradesh",
        "destination_type": "Mountain",
        "short_description": "Snow-capped Himalayan playground nestled among towering deodar cedar forests and rushing rivers.",
        "landmark_names": ["Solang Valley", "Rohtang Pass", "Hadimba Temple", "Atal Tunnel"],
        "tags": ["Snow", "Skiing", "Himalayas", "Adventure"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "die-cut",
        "dominant_colors": ["#0284C7", "#065F46", "#E2E8F0", "#38BDF8"],
        "art_preset": "manali",
        "asset_url": "/magnets/destinations/manali.svg"
    },
    {
        "slug": "amritsar",
        "name": "Amritsar Golden Temple",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Amritsar", "region": "Punjab",
        "destination_type": "Religious Destination",
        "short_description": "The sacred sanctum of Sikhism with its gleaming gilded sanctuary floating on the holy Amrit Sarovar.",
        "landmark_names": ["Harmandir Sahib", "Akal Takht", "Jallianwala Bagh", "Wagah Border"],
        "tags": ["Spiritual", "Gold", "Sanctuary", "Culture"],
        "popularity_score": 94, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#F59E0B", "#B45309", "#0284C7", "#FEF08A"],
        "art_preset": "amritsar",
        "asset_url": "/magnets/destinations/amritsar.svg"
    },
    {
        "slug": "meghalaya",
        "name": "Meghalaya Living Bridges",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Cherrapunji", "region": "Meghalaya",
        "destination_type": "Natural Wonder",
        "short_description": "The abode of clouds renowned for living ficus root bridges, towering plunge waterfalls, and deep caves.",
        "landmark_names": ["Double Decker Root Bridge", "Nohkalikai Falls", "Dawki River", "Mawsynram"],
        "tags": ["Living Bridges", "Rainforest", "Waterfalls", "Nature"],
        "popularity_score": 89, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#047857", "#065F46", "#38BDF8", "#A7F3D0"],
        "art_preset": "meghalaya",
        "asset_url": "/magnets/destinations/meghalaya.svg"
    },
    {
        "slug": "andaman",
        "name": "Andaman & Havelock",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Port Blair", "region": "Andaman & Nicobar Islands",
        "destination_type": "Island",
        "short_description": "Turquoise tropical paradise with powder-white sands, coral reefs, and primeval rainforest.",
        "landmark_names": ["Radhanagar Beach", "Elephant Beach", "Cellular Jail", "Neil Island"],
        "tags": ["Island", "Scuba", "Beaches", "Coral"],
        "popularity_score": 91, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#0D9488", "#FDE047", "#E0F2FE"],
        "art_preset": "andaman",
        "asset_url": "/magnets/destinations/andaman.svg"
    },
    {
        "slug": "jodhpur",
        "name": "Jodhpur Blue City",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Jodhpur", "region": "Rajasthan",
        "destination_type": "Cultural Heritage",
        "short_description": "Indigo-painted houses sprawling beneath the towering ramparts of Mehrangarh Fort on a sheer cliff.",
        "landmark_names": ["Mehrangarh Fort", "Jaswant Thada", "Umaid Bhawan Palace", "Clock Tower"],
        "tags": ["Blue City", "Fort", "Desert", "Heritage"],
        "popularity_score": 90, "is_featured": False,
        "magnet_shape": "die-cut",
        "dominant_colors": ["#2563EB", "#1D4ED8", "#D97706", "#DBEAFE"],
        "art_preset": "jodhpur",
        "asset_url": "/magnets/destinations/jodhpur.svg"
    },
    {
        "slug": "mysore",
        "name": "Mysore Royal Palace",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Mysuru", "region": "Karnataka",
        "destination_type": "Historical Site",
        "short_description": "The opulent seat of the Wodeyars featuring Indo-Saracenic grandeur illuminated by 100,000 bulbs.",
        "landmark_names": ["Mysore Palace", "Chamundi Hill", "Brindavan Gardens", "Devaraja Market"],
        "tags": ["Palace", "Silk", "Sandalwood", "Illuminations"],
        "popularity_score": 86, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#EAB308", "#B45309", "#4338CA", "#FEF08A"],
        "art_preset": "mysore",
        "asset_url": "/magnets/destinations/mysore.svg"
    },
    {
        "slug": "pondicherry",
        "name": "Pondicherry French Quarter",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Puducherry", "region": "Puducherry",
        "destination_type": "Beach",
        "short_description": "Pastel mustard colonial villas with bougainvillea arches along the Bay of Bengal promenade.",
        "landmark_names": ["Promenade Beach", "White Town", "Auroville", "Sri Aurobindo Ashram"],
        "tags": ["French Quarter", "Colonial", "Coastal", "Peace"],
        "popularity_score": 88, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#EAB308", "#0284C7", "#BE185D", "#FEF9C3"],
        "art_preset": "pondicherry",
        "asset_url": "/magnets/destinations/pondicherry.svg"
    },
    {
        "slug": "rann-of-kutch",
        "name": "Rann of Kutch",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Dhordo", "region": "Gujarat",
        "destination_type": "Natural Wonder",
        "short_description": "An endless glistening white salt desert bathed in silvery moonlight and colourful folk handicraft.",
        "landmark_names": ["White Rann", "Kala Dungar", "Rann Utsav Camp", "Dholavira"],
        "tags": ["Salt Desert", "Moonlight", "Folk Art", "Unique"],
        "popularity_score": 89, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#F8FAFC", "#475569", "#EA580C", "#9333EA"],
        "art_preset": "rann_of_kutch",
        "asset_url": "/magnets/destinations/rann-of-kutch.svg"
    },
    {
        "slug": "ooty",
        "name": "Ooty Nilgiri Hills",
        "country_name": "India", "country_code": "IN", "continent": "Asia", "flag_emoji": "🇮🇳",
        "city": "Ooty", "region": "Tamil Nadu",
        "destination_type": "Mountain",
        "short_description": "Queen of Hill Stations with eucalyptus-scented forests, botanical gardens, and blue mountain railways.",
        "landmark_names": ["Nilgiri Mountain Railway", "Doddabetta Peak", "Ooty Lake", "Pykara Falls"],
        "tags": ["Blue Mountains", "Eucalyptus", "Lake", "Colonial"],
        "popularity_score": 85, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#15803D", "#0284C7", "#A16207", "#DCFCE7"],
        "art_preset": "ooty",
        "asset_url": "/magnets/destinations/ooty.svg"
    },

    # ------------------ EUROPE (20) ------------------
    {
        "slug": "paris",
        "name": "Paris, France",
        "country_name": "France", "country_code": "FR", "continent": "Europe", "flag_emoji": "🇫🇷",
        "city": "Paris", "region": "Île-de-France",
        "destination_type": "City",
        "short_description": "The City of Light with the romantic Eiffel Tower, Haussmann boulevards, and Seine sunsets.",
        "landmark_names": ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Arc de Triomphe"],
        "tags": ["Romance", "Art", "Cuisine", "Architecture"],
        "popularity_score": 100, "is_featured": True,
        "magnet_shape": "arch",
        "dominant_colors": ["#E98267", "#243447", "#FBBF24", "#FEF3C7"],
        "art_preset": "paris",
        "asset_url": "/magnets/paris.png"  # Benchmark reference cutout
    },
    {
        "slug": "london",
        "name": "London, UK",
        "country_name": "United Kingdom", "country_code": "GB", "continent": "Europe", "flag_emoji": "🇬🇧",
        "city": "London", "region": "Greater London",
        "destination_type": "City",
        "short_description": "A historic metropolis combining Big Ben, red double-decker buses, telephone boxes, and royal landmarks.",
        "landmark_names": ["Big Ben", "Tower Bridge", "Buckingham Palace", "London Eye"],
        "tags": ["History", "Royalty", "Icons", "Culture"],
        "popularity_score": 98, "is_featured": True,
        "magnet_shape": "die-cut",
        "dominant_colors": ["#DC2626", "#1E3A8A", "#D97706", "#F3F4F6"],
        "art_preset": "london",
        "asset_url": "/magnets/london.png"  # Benchmark reference cutout
    },
    {
        "slug": "switzerland",
        "name": "Swiss Alps, Switzerland",
        "country_name": "Switzerland", "country_code": "CH", "continent": "Europe", "flag_emoji": "🇨🇭",
        "city": "Interlaken", "region": "Bernese Oberland",
        "destination_type": "Mountain",
        "short_description": "Dramatic snow-covered Alpine peaks, crystal turquoise glacial lakes, and traditional wooden chalets.",
        "landmark_names": ["Matterhorn", "Jungfraujoch", "Lake Geneva", "Eiger"],
        "tags": ["Alps", "Snow", "Lakes", "Scenic"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#065F46", "#E11D48", "#FFFFFF"],
        "art_preset": "switzerland",
        "asset_url": "/magnets/switzerland.png"  # Benchmark reference cutout
    },
    {
        "slug": "rome",
        "name": "Rome Colosseum",
        "country_name": "Italy", "country_code": "IT", "continent": "Europe", "flag_emoji": "🇮🇹",
        "city": "Rome", "region": "Lazio",
        "destination_type": "Historical Site",
        "short_description": "The Eternal City displaying the ancient Colosseum, Roman Forum, and glorious baroque fountains.",
        "landmark_names": ["Colosseum", "Trevi Fountain", "Pantheon", "Vatican City"],
        "tags": ["Ancient", "History", "Gelato", "Architecture"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "arch",
        "dominant_colors": ["#D97706", "#78350F", "#2563EB", "#FEF3C7"],
        "art_preset": "rome",
        "asset_url": "/magnets/destinations/rome.svg"
    },
    {
        "slug": "venice",
        "name": "Venice Canals",
        "country_name": "Italy", "country_code": "IT", "continent": "Europe", "flag_emoji": "🇮🇹",
        "city": "Venice", "region": "Veneto",
        "destination_type": "City",
        "short_description": "Floating city of marble palaces, romantic gondolas, and arched bridges over the Grand Canal.",
        "landmark_names": ["Rialto Bridge", "St. Mark's Basilica", "Grand Canal", "Bridge of Sighs"],
        "tags": ["Canals", "Gondola", "Romance", "Palaces"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#0284C7", "#EA580C", "#D97706", "#E0F2FE"],
        "art_preset": "venice",
        "asset_url": "/magnets/destinations/venice.svg"
    },
    {
        "slug": "santorini",
        "name": "Santorini Caldera",
        "country_name": "Greece", "country_code": "GR", "continent": "Europe", "flag_emoji": "🇬🇷",
        "city": "Oia", "region": "South Aegean",
        "destination_type": "Island",
        "short_description": "Whitewashed cubist houses with cobalt-blue domes perched on cliffs over the Aegean caldera.",
        "landmark_names": ["Oia Blue Domes", "Amoudi Bay", "Akrotiri", "Red Beach"],
        "tags": ["Sunsets", "Blue Domes", "Aegean", "Island"],
        "popularity_score": 96, "is_featured": True,
        "magnet_shape": "circle",
        "dominant_colors": ["#1D4ED8", "#FFFFFF", "#F59E0B", "#DBEAFE"],
        "art_preset": "santorini",
        "asset_url": "/magnets/destinations/santorini.svg"
    },
    {
        "slug": "barcelona",
        "name": "Barcelona & Gaudí",
        "country_name": "Spain", "country_code": "ES", "continent": "Europe", "flag_emoji": "🇪🇸",
        "city": "Barcelona", "region": "Catalonia",
        "destination_type": "City",
        "short_description": "Mediterranean artistic city crowned by Gaudí's fantastical Sagrada Família and vibrant mosaic parks.",
        "landmark_names": ["Sagrada Família", "Park Güell", "Casa Batlló", "Las Ramblas"],
        "tags": ["Gaudí", "Modernisme", "Beach", "Tapas"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#EA580C", "#0284C7", "#16A34A", "#FDE047"],
        "art_preset": "barcelona",
        "asset_url": "/magnets/destinations/barcelona.svg"
    },
    {
        "slug": "amsterdam",
        "name": "Amsterdam Canals",
        "country_name": "Netherlands", "country_code": "NL", "continent": "Europe", "flag_emoji": "🇳🇱",
        "city": "Amsterdam", "region": "North Holland",
        "destination_type": "City",
        "short_description": "Historic canal belt lined with charming gabled brick townhouses, arched bridges, and countless bicycles.",
        "landmark_names": ["Canal Ring", "Rijksmuseum", "Anne Frank House", "Van Gogh Museum"],
        "tags": ["Canals", "Bicycles", "Tulips", "Art"],
        "popularity_score": 94, "is_featured": False,
        "magnet_shape": "die-cut",
        "dominant_colors": ["#B45309", "#0284C7", "#DC2626", "#FEF3C7"],
        "art_preset": "amsterdam",
        "asset_url": "/magnets/destinations/amsterdam.svg"
    },
    {
        "slug": "prague",
        "name": "Prague Golden Spires",
        "country_name": "Czech Republic", "country_code": "CZ", "continent": "Europe", "flag_emoji": "🇨🇿",
        "city": "Prague", "region": "Bohemia",
        "destination_type": "Historical Site",
        "short_description": "The City of a Hundred Spires with Gothic Charles Bridge spanning the Vltava under Prague Castle.",
        "landmark_names": ["Charles Bridge", "Prague Castle", "Astronomical Clock", "Old Town Square"],
        "tags": ["Gothic", "Castle", "Beer", "Medieval"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "shield",
        "dominant_colors": ["#78350F", "#D97706", "#1E3A8A", "#FEF3C7"],
        "art_preset": "prague",
        "asset_url": "/magnets/destinations/prague.svg"
    },
    {
        "slug": "vienna",
        "name": "Vienna Imperial Palaces",
        "country_name": "Austria", "country_code": "AT", "continent": "Europe", "flag_emoji": "🇦🇹",
        "city": "Vienna", "region": "Vienna",
        "destination_type": "Cultural Heritage",
        "short_description": "Imperial capital of classical music, gilded baroque palaces, and grand historic coffeehouses.",
        "landmark_names": ["Schönbrunn Palace", "St. Stephen's Cathedral", "Hofburg", "Belvedere"],
        "tags": ["Classical", "Mozart", "Palace", "Coffee"],
        "popularity_score": 91, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#EAB308", "#1E293B", "#DC2626", "#FEF9C3"],
        "art_preset": "vienna",
        "asset_url": "/magnets/destinations/vienna.svg"
    },
    {
        "slug": "florence",
        "name": "Florence Renaissance Duomo",
        "country_name": "Italy", "country_code": "IT", "continent": "Europe", "flag_emoji": "🇮🇹",
        "city": "Florence", "region": "Tuscany",
        "destination_type": "Cultural Heritage",
        "short_description": "Cradle of the Renaissance crowned by Brunelleschi's terracotta Duomo dome and Ponte Vecchio.",
        "landmark_names": ["Florence Duomo", "Ponte Vecchio", "Uffizi Gallery", "Piazza della Signoria"],
        "tags": ["Renaissance", "Art", "Tuscany", "Architecture"],
        "popularity_score": 93, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#C2410C", "#047857", "#FFFFFF", "#FEF2F2"],
        "art_preset": "florence",
        "asset_url": "/magnets/destinations/florence.svg"
    },
    {
        "slug": "edinburgh",
        "name": "Edinburgh Royal Castle",
        "country_name": "United Kingdom", "country_code": "GB", "continent": "Europe", "flag_emoji": "🇬🇧",
        "city": "Edinburgh", "region": "Scotland",
        "destination_type": "Historical Site",
        "short_description": "Volcanic crags crowned by medieval Edinburgh Castle towering over the cobblestones of the Royal Mile.",
        "landmark_names": ["Edinburgh Castle", "Royal Mile", "Arthur's Seat", "Holyroodhouse"],
        "tags": ["Scotland", "Castle", "Cobblestones", "History"],
        "popularity_score": 91, "is_featured": False,
        "magnet_shape": "shield",
        "dominant_colors": ["#1E293B", "#065F46", "#B45309", "#94A3B8"],
        "art_preset": "edinburgh",
        "asset_url": "/magnets/destinations/edinburgh.svg"
    },
    {
        "slug": "reykjavik",
        "name": "Iceland & Northern Lights",
        "country_name": "Iceland", "country_code": "IS", "continent": "Europe", "flag_emoji": "🇮🇸",
        "city": "Reykjavik", "region": "Capital Region",
        "destination_type": "Natural Wonder",
        "short_description": "Land of Fire and Ice where emerald Aurora Borealis dances above steaming geothermal lagoons and waterfalls.",
        "landmark_names": ["Hallgrimskirkja", "Blue Lagoon", "Gullfoss Waterfall", "Geysir"],
        "tags": ["Aurora", "Geysers", "Volcano", "Ice"],
        "popularity_score": 96, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#10B981", "#0284C7", "#0F172A", "#6EE7B7"],
        "art_preset": "reykjavik",
        "asset_url": "/magnets/destinations/reykjavik.svg"
    },
    {
        "slug": "dubrovnik",
        "name": "Dubrovnik Adriatic Walls",
        "country_name": "Croatia", "country_code": "HR", "continent": "Europe", "flag_emoji": "🇭🇷",
        "city": "Dubrovnik", "region": "Dalmatia",
        "destination_type": "Historical Site",
        "short_description": "The Pearl of the Adriatic enclosed by massive medieval stone ramparts and terracotta-roofed streets.",
        "landmark_names": ["Dubrovnik City Walls", "Stradun", "Fort Lovrijenac", "Old Port"],
        "tags": ["Adriatic", "Medieval Walls", "Coast", "History"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "die-cut",
        "dominant_colors": ["#EA580C", "#0284C7", "#E2E8F0", "#1E3A8A"],
        "art_preset": "dubrovnik",
        "asset_url": "/magnets/destinations/dubrovnik.svg"
    },
    {
        "slug": "athens",
        "name": "Athens Acropolis",
        "country_name": "Greece", "country_code": "GR", "continent": "Europe", "flag_emoji": "🇬🇷",
        "city": "Athens", "region": "Attica",
        "destination_type": "Historical Site",
        "short_description": "The monumental cradle of Western democracy crowned by the ancient Doric marble columns of the Parthenon.",
        "landmark_names": ["Parthenon", "Acropolis", "Plaka", "Temple of Olympian Zeus"],
        "tags": ["Ancient Greece", "Parthenon", "Democracy", "Marble"],
        "popularity_score": 93, "is_featured": False,
        "magnet_shape": "circle",
        "dominant_colors": ["#0284C7", "#D97706", "#FFFBEB", "#1E3A8A"],
        "art_preset": "athens",
        "asset_url": "/magnets/destinations/athens.svg"
    },
    {
        "slug": "dublin",
        "name": "Dublin & Emerald Isle",
        "country_name": "Ireland", "country_code": "IE", "continent": "Europe", "flag_emoji": "🇮🇪",
        "city": "Dublin", "region": "Leinster",
        "destination_type": "City",
        "short_description": "Lively Georgian squares, literary legends, Celtic music, and the iconic cobblestones of Temple Bar.",
        "landmark_names": ["Trinity College", "Temple Bar", "Dublin Castle", "Guinness Storehouse"],
        "tags": ["Celtic", "Pubs", "Literature", "Emerald"],
        "popularity_score": 89, "is_featured": False,
        "magnet_shape": "shield",
        "dominant_colors": ["#16A34A", "#15803D", "#F59E0B", "#DCFCE7"],
        "art_preset": "dublin",
        "asset_url": "/magnets/destinations/dublin.svg"
    },
    {
        "slug": "lisbon",
        "name": "Lisbon Yellow Tram",
        "country_name": "Portugal", "country_code": "PT", "continent": "Europe", "flag_emoji": "🇵🇹",
        "city": "Lisbon", "region": "Lisbon Region",
        "destination_type": "City",
        "short_description": "Sunlit city of seven hills with vintage yellow trams rattling past azulejo-tiled miradouros on the Tagus.",
        "landmark_names": ["Tram 28", "Belém Tower", "Jerónimos Monastery", "Castelo de São Jorge"],
        "tags": ["Yellow Tram", "Azulejos", "Pastel de Nata", "Ocean"],
        "popularity_score": 93, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#EAB308", "#0284C7", "#DC2626", "#FEF08A"],
        "art_preset": "lisbon",
        "asset_url": "/magnets/destinations/lisbon.svg"
    },
    {
        "slug": "berlin",
        "name": "Berlin Brandenburg Gate",
        "country_name": "Germany", "country_code": "DE", "continent": "Europe", "flag_emoji": "🇩🇪",
        "city": "Berlin", "region": "Berlin",
        "destination_type": "City",
        "short_description": "A dynamic metropolis of modern art and history symbolized by the neoclassical Brandenburg Gate.",
        "landmark_names": ["Brandenburg Gate", "Reichstag", "Museum Island", "Berlin Wall"],
        "tags": ["History", "Brandenburg", "Art", "Culture"],
        "popularity_score": 90, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#D97706", "#1E293B", "#DC2626", "#FEF3C7"],
        "art_preset": "berlin",
        "asset_url": "/magnets/destinations/berlin.svg"
    },
    {
        "slug": "budapest",
        "name": "Budapest Danube River",
        "country_name": "Hungary", "country_code": "HU", "continent": "Europe", "flag_emoji": "🇭🇺",
        "city": "Budapest", "region": "Central Hungary",
        "destination_type": "City",
        "short_description": "Twin cities Buda and Pest connected by Chain Bridge with the illuminated Neo-Gothic Parliament.",
        "landmark_names": ["Hungarian Parliament", "Buda Castle", "Chain Bridge", "Fisherman's Bastion"],
        "tags": ["Danube", "Thermal Baths", "Gothic", "Architecture"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#0284C7", "#D97706", "#B91C1C", "#E0F2FE"],
        "art_preset": "budapest",
        "asset_url": "/magnets/destinations/budapest.svg"
    },
    {
        "slug": "amalfi-coast",
        "name": "Amalfi Coast & Positano",
        "country_name": "Italy", "country_code": "IT", "continent": "Europe", "flag_emoji": "🇮🇹",
        "city": "Positano", "region": "Campania",
        "destination_type": "Scenic Region",
        "short_description": "Dramatic Mediterranean cliffs tumbling into the sea with pastel houses, lemon groves, and yachts.",
        "landmark_names": ["Positano Spiaggia", "Amalfi Cathedral", "Ravello Gardens", "Capri Island"],
        "tags": ["Cliffs", "Lemons", "Pastel", "Mediterranean"],
        "popularity_score": 95, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#F59E0B", "#F43F5E", "#E0F2FE"],
        "art_preset": "amalfi",
        "asset_url": "/magnets/destinations/amalfi-coast.svg"
    },

    # ------------------ ASIA (20) ------------------
    {
        "slug": "japan",
        "name": "Japan & Mount Fuji",
        "country_name": "Japan", "country_code": "JP", "continent": "Asia", "flag_emoji": "🇯🇵",
        "city": "Kyoto", "region": "Honshu",
        "destination_type": "Cultural Heritage",
        "short_description": "Snow-capped Mount Fuji rising behind ancient crimson pagodas, cherry blossoms, and tranquil lakes.",
        "landmark_names": ["Mount Fuji", "Chureito Pagoda", "Fushimi Inari", "Kinkaku-ji"],
        "tags": ["Fuji", "Pagoda", "Cherry Blossoms", "Zen"],
        "popularity_score": 99, "is_featured": True,
        "magnet_shape": "circle",
        "dominant_colors": ["#DC2626", "#1E293B", "#FFFFFF", "#FCA5A5"],
        "art_preset": "japan",
        "asset_url": "/magnets/japan.png"  # Benchmark reference cutout
    },
    {
        "slug": "bali",
        "name": "Bali Tropical Paradise",
        "country_name": "Indonesia", "country_code": "ID", "continent": "Asia", "flag_emoji": "🇮🇩",
        "city": "Ubud", "region": "Bali",
        "destination_type": "Island",
        "short_description": "Island of the Gods boasting floating water temples, emerald rice terraces, and coral beaches.",
        "landmark_names": ["Ulun Danu Beratan", "Tanah Lot", "Tegallalang Rice Terraces", "Uluwatu"],
        "tags": ["Temples", "Beaches", "Rice Fields", "Spiritual"],
        "popularity_score": 98, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#047857", "#0284C7", "#D97706", "#A7F3D0"],
        "art_preset": "bali",
        "asset_url": "/magnets/bali.png"  # Benchmark reference cutout
    },
    {
        "slug": "singapore",
        "name": "Singapore City & Marina",
        "country_name": "Singapore", "country_code": "SG", "continent": "Asia", "flag_emoji": "🇸🇬",
        "city": "Singapore", "region": "Central Region",
        "destination_type": "City",
        "short_description": "Futuristic garden city defined by Marina Bay Sands, the iconic Merlion, and Supertree Grove.",
        "landmark_names": ["Marina Bay Sands", "Merlion Park", "Gardens by the Bay", "Jewel Changi"],
        "tags": ["Modern", "Gardens", "Skyline", "Clean"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "cityscape",
        "dominant_colors": ["#0284C7", "#10B981", "#6366F1", "#E0F2FE"],
        "art_preset": "singapore",
        "asset_url": "/magnets/singapore.png"  # Benchmark reference cutout
    },
    {
        "slug": "bangkok",
        "name": "Bangkok Golden Wats",
        "country_name": "Thailand", "country_code": "TH", "continent": "Asia", "flag_emoji": "🇹🇭",
        "city": "Bangkok", "region": "Central Thailand",
        "destination_type": "City",
        "short_description": "Ornate riverside temples of dawn gleaming above bustling river canals and vibrant street food markets.",
        "landmark_names": ["Wat Arun", "Grand Palace", "Wat Phra Kaew", "Chao Phraya River"],
        "tags": ["Golden Temples", "Street Food", "River", "Culture"],
        "popularity_score": 96, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#F59E0B", "#B45309", "#0284C7", "#FEF08A"],
        "art_preset": "bangkok",
        "asset_url": "/magnets/destinations/bangkok.svg"
    },
    {
        "slug": "phuket",
        "name": "Phuket & Karst Islands",
        "country_name": "Thailand", "country_code": "TH", "continent": "Asia", "flag_emoji": "🇹🇭",
        "city": "Phuket", "region": "Southern Thailand",
        "destination_type": "Beach",
        "short_description": "Dramatic limestone karsts rising vertically from Andaman turquoise waters fringed with longtail boats.",
        "landmark_names": ["James Bond Island", "Phi Phi Islands", "Big Buddha", "Patong Beach"],
        "tags": ["Limestone", "Longtail Boats", "Turquoise", "Beach"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#0D9488", "#0284C7", "#F59E0B", "#CCFBF1"],
        "art_preset": "phuket",
        "asset_url": "/magnets/destinations/phuket.svg"
    },
    {
        "slug": "seoul",
        "name": "Seoul Dynasties & Neon",
        "country_name": "South Korea", "country_code": "KR", "continent": "Asia", "flag_emoji": "🇰🇷",
        "city": "Seoul", "region": "Seoul Capital Area",
        "destination_type": "City",
        "short_description": "Harmonious fusion of ancient Joseon royal palaces and futuristic skyscrapers with N Seoul Tower.",
        "landmark_names": ["Gyeongbokgung Palace", "N Seoul Tower", "Bukchon Hanok", "Dongdaemun"],
        "tags": ["K-Culture", "Palaces", "Neon", "Futuristic"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#DC2626", "#2563EB", "#1E293B", "#DBEAFE"],
        "art_preset": "seoul",
        "asset_url": "/magnets/destinations/seoul.svg"
    },
    {
        "slug": "dubai",
        "name": "Dubai Burj Skyline",
        "country_name": "United Arab Emirates", "country_code": "AE", "continent": "Asia", "flag_emoji": "🇦🇪",
        "city": "Dubai", "region": "Emirate of Dubai",
        "destination_type": "City",
        "short_description": "Record-shattering desert oasis crowned by the needle of Burj Khalifa and sail of Burj Al Arab.",
        "landmark_names": ["Burj Khalifa", "Burj Al Arab", "Palm Jumeirah", "Dubai Mall"],
        "tags": ["Luxury", "Skyscrapers", "Desert", "Architecture"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "cityscape",
        "dominant_colors": ["#0284C7", "#D97706", "#475569", "#FEF3C7"],
        "art_preset": "dubai",
        "asset_url": "/magnets/destinations/dubai.svg"
    },
    {
        "slug": "ha-long-bay",
        "name": "Ha Long Bay Emerald Waters",
        "country_name": "Vietnam", "country_code": "VN", "continent": "Asia", "flag_emoji": "🇻🇳",
        "city": "Ha Long", "region": "Quang Ninh",
        "destination_type": "Natural Wonder",
        "short_description": "Thousands of towering limestone islands topped by rainforest rising from calm emerald gulf waters.",
        "landmark_names": ["Sung Sot Cave", "Ti Top Island", "Traditional Junk Boats", "Cat Ba Island"],
        "tags": ["UNESCO", "Limestone Karsts", "Emerald Bay", "Junk Boats"],
        "popularity_score": 93, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#059669", "#047857", "#EA580C", "#A7F3D0"],
        "art_preset": "ha_long_bay",
        "asset_url": "/magnets/destinations/ha-long-bay.svg"
    },
    {
        "slug": "angkor-wat",
        "name": "Angkor Wat Temple Towers",
        "country_name": "Cambodia", "country_code": "KH", "continent": "Asia", "flag_emoji": "🇰🇭",
        "city": "Siem Reap", "region": "Siem Reap Province",
        "destination_type": "Historical Site",
        "short_description": "The largest religious complex in the world with iconic sandstone lotus towers reflected in lily ponds.",
        "landmark_names": ["Angkor Wat Central Towers", "Bayon Stone Faces", "Ta Prohm Jungle Roots", "Angkor Thom"],
        "tags": ["Khmer", "Ancient Temples", "UNESCO", "Sunrise"],
        "popularity_score": 94, "is_featured": True,
        "magnet_shape": "arch",
        "dominant_colors": ["#D97706", "#78350F", "#475569", "#FEF3C7"],
        "art_preset": "angkor_wat",
        "asset_url": "/magnets/destinations/angkor-wat.svg"
    },
    {
        "slug": "petra",
        "name": "Petra Rose City",
        "country_name": "Jordan", "country_code": "JO", "continent": "Asia", "flag_emoji": "🇯🇴",
        "city": "Wadi Musa", "region": "Ma'an Governorate",
        "destination_type": "Historical Site",
        "short_description": "Ancient Nabataean capital carved directly into sandstone canyon cliffs emerging from the Siq gorge.",
        "landmark_names": ["The Treasury (Al-Khazneh)", "The Monastery", "The Siq", "Royal Tombs"],
        "tags": ["Rose City", "Wonder of the World", "Canyon", "Nabataean"],
        "popularity_score": 95, "is_featured": True,
        "magnet_shape": "arch",
        "dominant_colors": ["#DC2626", "#EA580C", "#7C2D12", "#FEE2E2"],
        "art_preset": "petra",
        "asset_url": "/magnets/destinations/petra.svg"
    },
    {
        "slug": "cappadocia",
        "name": "Cappadocia Fairy Chimneys",
        "country_name": "Turkey", "country_code": "TR", "continent": "Asia", "flag_emoji": "🇹🇷",
        "city": "Göreme", "region": "Central Anatolia",
        "destination_type": "Natural Wonder",
        "short_description": "Hundreds of colorful hot air balloons greeting sunrise over volcanic fairy chimney valleys and cave dwellings.",
        "landmark_names": ["Göreme Valley", "Uchisar Castle", "Hot Air Balloons", "Love Valley"],
        "tags": ["Hot Air Balloons", "Fairy Chimneys", "Sunrise", "Caves"],
        "popularity_score": 96, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#EA580C", "#0284C7", "#F59E0B", "#FEF3C7"],
        "art_preset": "cappadocia",
        "asset_url": "/magnets/destinations/cappadocia.svg"
    },
    {
        "slug": "istanbul",
        "name": "Istanbul Hagia Sophia",
        "country_name": "Turkey", "country_code": "TR", "continent": "Asia", "flag_emoji": "🇹🇷",
        "city": "Istanbul", "region": "Marmara",
        "destination_type": "Cultural Heritage",
        "short_description": "Where East meets West across the Bosphorus Strait crowned by majestic Ottoman domes and minarets.",
        "landmark_names": ["Hagia Sophia", "Blue Mosque", "Topkapi Palace", "Bosphorus Strait"],
        "tags": ["Bosphorus", "Mosques", "Two Continents", "History"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#1E3A8A", "#D97706", "#DC2626", "#DBEAFE"],
        "art_preset": "istanbul",
        "asset_url": "/magnets/destinations/istanbul.svg"
    },
    {
        "slug": "maldives",
        "name": "Maldives Overwater Atolls",
        "country_name": "Maldives", "country_code": "MV", "continent": "Asia", "flag_emoji": "🇲🇻",
        "city": "Malé", "region": "Kaafu Atoll",
        "destination_type": "Beach",
        "short_description": "Overwater thatched villas suspended above crystal clear turquoise lagoons and pristine coral reefs.",
        "landmark_names": ["Baa Atoll", "Overwater Bungalows", "Ari Atoll", "Male Coral Mosque"],
        "tags": ["Luxury", "Overwater Bungalow", "Turquoise", "Reef"],
        "popularity_score": 98, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#06B6D4", "#F59E0B", "#E0F2FE"],
        "art_preset": "maldives",
        "asset_url": "/magnets/destinations/maldives.svg"
    },
    {
        "slug": "great-wall",
        "name": "Great Wall of China",
        "country_name": "China", "country_code": "CN", "continent": "Asia", "flag_emoji": "🇨🇳",
        "city": "Beijing", "region": "Hebei",
        "destination_type": "Historical Site",
        "short_description": "Ancient stone ramparts and watchtowers winding like a dragon over misty rugged mountain ridges.",
        "landmark_names": ["Mutianyu Section", "Badaling", "Simatai", "Watchtowers"],
        "tags": ["Wonder of the World", "Great Wall", "History", "Mountains"],
        "popularity_score": 96, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#78350F", "#B45309", "#047857", "#FEF3C7"],
        "art_preset": "great_wall",
        "asset_url": "/magnets/destinations/great-wall.svg"
    },
    {
        "slug": "hong-kong",
        "name": "Hong Kong Victoria Peak",
        "country_name": "Hong Kong", "country_code": "HK", "continent": "Asia", "flag_emoji": "🇭🇰",
        "city": "Hong Kong", "region": "Victoria Harbour",
        "destination_type": "City",
        "short_description": "Electrifying vertical skyline surrounding Victoria Harbour viewed from the legendary Star Ferry and The Peak.",
        "landmark_names": ["Victoria Peak", "Victoria Harbour", "Star Ferry", "Tian Tan Buddha"],
        "tags": ["Skyline", "Harbour", "Neon", "Dim Sum"],
        "popularity_score": 94, "is_featured": False,
        "magnet_shape": "cityscape",
        "dominant_colors": ["#DC2626", "#1E293B", "#38BDF8", "#FEF08A"],
        "art_preset": "hong_kong",
        "asset_url": "/magnets/destinations/hong-kong.svg"
    },
    {
        "slug": "taipei",
        "name": "Taipei 101 Tower",
        "country_name": "Taiwan", "country_code": "TW", "continent": "Asia", "flag_emoji": "🇹🇼",
        "city": "Taipei", "region": "Taipei Region",
        "destination_type": "City",
        "short_description": "Bamboo-inspired Taipei 101 soaring above misty green hills, vibrant night markets, and temple alleys.",
        "landmark_names": ["Taipei 101", "Elephant Mountain", "Shilin Night Market", "Longshan Temple"],
        "tags": ["Taipei 101", "Night Market", "Mountains", "Food"],
        "popularity_score": 91, "is_featured": False,
        "magnet_shape": "cityscape",
        "dominant_colors": ["#059669", "#0284C7", "#DC2626", "#D1FAE5"],
        "art_preset": "taipei",
        "asset_url": "/magnets/destinations/taipei.svg"
    },
    {
        "slug": "chiang-mai",
        "name": "Chiang Mai Lanterns",
        "country_name": "Thailand", "country_code": "TH", "continent": "Asia", "flag_emoji": "🇹🇭",
        "city": "Chiang Mai", "region": "Northern Thailand",
        "destination_type": "Cultural Heritage",
        "short_description": "Northern mountain valley of golden teak wats where thousands of glowing lanterns fill the night sky during Yi Peng.",
        "landmark_names": ["Wat Phra That Doi Suthep", "Wat Chedi Luang", "Old City Moat", "Night Bazaar"],
        "tags": ["Lanterns", "Temples", "Mountains", "Culture"],
        "popularity_score": 90, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#F59E0B", "#D97706", "#047857", "#FEF08A"],
        "art_preset": "chiang_mai",
        "asset_url": "/magnets/destinations/chiang-mai.svg"
    },
    {
        "slug": "luang-prabang",
        "name": "Luang Prabang Mekong",
        "country_name": "Laos", "country_code": "LA", "continent": "Asia", "flag_emoji": "🇱🇦",
        "city": "Luang Prabang", "region": "Luang Prabang Province",
        "destination_type": "Cultural Heritage",
        "short_description": "Enchanting UNESCO town where golden temples meet French colonial villas at the confluence of the Mekong.",
        "landmark_names": ["Wat Xieng Thong", "Kuang Si Falls", "Mount Phousi", "Mekong River"],
        "tags": ["UNESCO", "Mekong", "Waterfalls", "Peaceful"],
        "popularity_score": 88, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#059669", "#D97706", "#0284C7", "#A7F3D0"],
        "art_preset": "luang_prabang",
        "asset_url": "/magnets/destinations/luang-prabang.svg"
    },
    {
        "slug": "kathmandu",
        "name": "Kathmandu Himalayan Valley",
        "country_name": "Nepal", "country_code": "NP", "continent": "Asia", "flag_emoji": "🇳🇵",
        "city": "Kathmandu", "region": "Kathmandu Valley",
        "destination_type": "Mountain",
        "short_description": "Spiritual gateway to Everest adorned with fluttering prayer flags, ancient stupas, and snow-capped peaks.",
        "landmark_names": ["Boudhanath Stupa", "Swayambhunath Monkey Temple", "Pashupatinath", "Durbar Square"],
        "tags": ["Himalayas", "Everest", "Stupa", "Prayer Flags"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#DC2626", "#F59E0B", "#1E3A8A", "#FEF08A"],
        "art_preset": "kathmandu",
        "asset_url": "/magnets/destinations/kathmandu.svg"
    },
    {
        "slug": "boracay",
        "name": "Boracay White Beach",
        "country_name": "Philippines", "country_code": "PH", "continent": "Asia", "flag_emoji": "🇵🇭",
        "city": "Malay", "region": "Aklan",
        "destination_type": "Beach",
        "short_description": "Powdery soft white sand shoreline graced by iconic blue-sailed paraw boats at golden sunset.",
        "landmark_names": ["White Beach", "Willy's Rock", "Puka Shell Beach", "Paraw Boats"],
        "tags": ["White Sand", "Sunset", "Sailboat", "Island"],
        "popularity_score": 90, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#F59E0B", "#10B981", "#E0F2FE"],
        "art_preset": "boracay",
        "asset_url": "/magnets/destinations/boracay.svg"
    },

    # ------------------ AMERICAS (15) ------------------
    {
        "slug": "new-york",
        "name": "New York City Skyline",
        "country_name": "United States", "country_code": "US", "continent": "Americas", "flag_emoji": "🇺🇸",
        "city": "New York", "region": "New York State",
        "destination_type": "City",
        "short_description": "The Empire City with the Statue of Liberty, soaring art-deco skyscrapers, and yellow cabs.",
        "landmark_names": ["Statue of Liberty", "Empire State Building", "Central Park", "Brooklyn Bridge"],
        "tags": ["Skyline", "Broadway", "Yellow Cabs", "Icons"],
        "popularity_score": 99, "is_featured": True,
        "magnet_shape": "cityscape",
        "dominant_colors": ["#0284C7", "#EAB308", "#1E293B", "#F8FAFC"],
        "art_preset": "new_york",
        "asset_url": "/magnets/destinations/new-york.svg"
    },
    {
        "slug": "grand-canyon",
        "name": "Grand Canyon Canyons",
        "country_name": "United States", "country_code": "US", "continent": "Americas", "flag_emoji": "🇺🇸",
        "city": "Flagstaff", "region": "Arizona",
        "destination_type": "Natural Wonder",
        "short_description": "Vast miles of red-banded rock strata carved by the Colorado River glowing at dawn and dusk.",
        "landmark_names": ["South Rim", "Bright Angel Trail", "Horseshoe Bend", "Colorado River"],
        "tags": ["Wonder", "Canyon", "Red Rock", "National Park"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "landscape",
        "dominant_colors": ["#C2410C", "#D97706", "#0284C7", "#FEF3C7"],
        "art_preset": "grand_canyon",
        "asset_url": "/magnets/destinations/grand-canyon.svg"
    },
    {
        "slug": "san-francisco",
        "name": "San Francisco Golden Gate",
        "country_name": "United States", "country_code": "US", "continent": "Americas", "flag_emoji": "🇺🇸",
        "city": "San Francisco", "region": "California",
        "destination_type": "City",
        "short_description": "The dramatic Golden Gate Bridge spanning Pacific fog, Victorian painted ladies, and cable cars.",
        "landmark_names": ["Golden Gate Bridge", "Alcatraz", "Cable Cars", "Fisherman's Wharf"],
        "tags": ["Golden Gate", "Cable Car", "Bay Area", "Fog"],
        "popularity_score": 96, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#EA580C", "#0284C7", "#475569", "#FFEDD5"],
        "art_preset": "san_francisco",
        "asset_url": "/magnets/destinations/san-francisco.svg"
    },
    {
        "slug": "hawaii",
        "name": "Hawaii Tropical Islands",
        "country_name": "United States", "country_code": "US", "continent": "Americas", "flag_emoji": "🇺🇸",
        "city": "Honolulu", "region": "Hawaii",
        "destination_type": "Island",
        "short_description": "Polynesian paradise of volcanic peaks, turquoise surf, blooming hibiscus, and warm aloha spirit.",
        "landmark_names": ["Diamond Head", "Waikiki Beach", "Haleakala", "Na Pali Coast"],
        "tags": ["Aloha", "Surfing", "Volcano", "Paradise"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#F59E0B", "#10B981", "#E0F2FE"],
        "art_preset": "hawaii",
        "asset_url": "/magnets/destinations/hawaii.svg"
    },
    {
        "slug": "las-vegas",
        "name": "Las Vegas Neon Strip",
        "country_name": "United States", "country_code": "US", "continent": "Americas", "flag_emoji": "🇺🇸",
        "city": "Las Vegas", "region": "Nevada",
        "destination_type": "City",
        "short_description": "Dazzling neon metropolis in the Mojave Desert known for iconic casino signs and Bellagio fountains.",
        "landmark_names": ["Welcome to Vegas Sign", "Bellagio Fountains", "The Strip", "Fremont Street"],
        "tags": ["Neon", "Casinos", "Nightlife", "Desert"],
        "popularity_score": 94, "is_featured": False,
        "magnet_shape": "die-cut",
        "dominant_colors": ["#DC2626", "#F59E0B", "#1E293B", "#FEF08A"],
        "art_preset": "las_vegas",
        "asset_url": "/magnets/destinations/las-vegas.svg"
    },
    {
        "slug": "miami",
        "name": "Miami Art Deco Beach",
        "country_name": "United States", "country_code": "US", "continent": "Americas", "flag_emoji": "🇺🇸",
        "city": "Miami", "region": "Florida",
        "destination_type": "Beach",
        "short_description": "Pastel neon Art Deco hotels lined with royal palms along the white sands of South Beach.",
        "landmark_names": ["South Beach", "Ocean Drive", "Art Deco District", "Wynwood Walls"],
        "tags": ["Art Deco", "Palms", "South Beach", "Ocean"],
        "popularity_score": 93, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#EC4899", "#06B6D4", "#F59E0B", "#FDF2F8"],
        "art_preset": "miami",
        "asset_url": "/magnets/destinations/miami.svg"
    },
    {
        "slug": "yellowstone",
        "name": "Yellowstone Geysers",
        "country_name": "United States", "country_code": "US", "continent": "Americas", "flag_emoji": "🇺🇸",
        "city": "Jackson", "region": "Wyoming",
        "destination_type": "National Park",
        "short_description": "Wilderness wonder with rainbow prismatic hot springs, Old Faithful geyser, and roaming bison herds.",
        "landmark_names": ["Grand Prismatic Spring", "Old Faithful", "Yellowstone Canyon", "Lamar Valley"],
        "tags": ["Geysers", "Wildlife", "Bison", "National Park"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#0284C7", "#EA580C", "#047857", "#FEF3C7"],
        "art_preset": "yellowstone",
        "asset_url": "/magnets/destinations/yellowstone.svg"
    },
    {
        "slug": "banff",
        "name": "Banff & Lake Louise",
        "country_name": "Canada", "country_code": "CA", "continent": "Americas", "flag_emoji": "🇨🇦",
        "city": "Banff", "region": "Alberta",
        "destination_type": "Mountain",
        "short_description": "The Canadian Rockies' crown jewel with turquoise glacial waters reflecting towering mountain walls.",
        "landmark_names": ["Lake Louise", "Moraine Lake", "Banff Gondola", "Mount Rundle"],
        "tags": ["Rockies", "Glacial Lake", "Canoe", "Wildlife"],
        "popularity_score": 96, "is_featured": True,
        "magnet_shape": "shield",
        "dominant_colors": ["#0284C7", "#0D9488", "#1E293B", "#CCFBF1"],
        "art_preset": "banff",
        "asset_url": "/magnets/destinations/banff.svg"
    },
    {
        "slug": "machu-picchu",
        "name": "Machu Picchu Citadel",
        "country_name": "Peru", "country_code": "PE", "continent": "Americas", "flag_emoji": "🇵🇪",
        "city": "Cusco", "region": "Cusco Region",
        "destination_type": "Historical Site",
        "short_description": "Lost City of the Incas terraced high in cloud forest mountains beneath the peak of Huayna Picchu.",
        "landmark_names": ["Inca Citadel", "Huayna Picchu", "Sun Gate", "Intihuatana"],
        "tags": ["Inca", "Wonder of the World", "Andes", "Ruins"],
        "popularity_score": 98, "is_featured": True,
        "magnet_shape": "arch",
        "dominant_colors": ["#059669", "#78350F", "#0284C7", "#DCFCE7"],
        "art_preset": "machu_picchu",
        "asset_url": "/magnets/destinations/machu-picchu.svg"
    },
    {
        "slug": "rio-de-janeiro",
        "name": "Rio de Janeiro & Christ",
        "country_name": "Brazil", "country_code": "BR", "continent": "Americas", "flag_emoji": "🇧🇷",
        "city": "Rio de Janeiro", "region": "Rio de Janeiro State",
        "destination_type": "City",
        "short_description": "Marvelous city with Christ the Redeemer embracing Sugarloaf mountain, Copacabana, and samba beats.",
        "landmark_names": ["Christ the Redeemer", "Sugarloaf Mountain", "Copacabana Beach", "Ipanema"],
        "tags": ["Christ Statue", "Beaches", "Sugarloaf", "Carnaval"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "arch",
        "dominant_colors": ["#0284C7", "#059669", "#F59E0B", "#E0F2FE"],
        "art_preset": "rio",
        "asset_url": "/magnets/destinations/rio-de-janeiro.svg"
    },
    {
        "slug": "cancun",
        "name": "Cancun & Mayan Ruins",
        "country_name": "Mexico", "country_code": "MX", "continent": "Americas", "flag_emoji": "🇲🇽",
        "city": "Cancun", "region": "Quintana Roo",
        "destination_type": "Beach",
        "short_description": "Caribbean jewel with crystalline turquoise waves and ancient Mayan stone pyramids perched on coastal bluffs.",
        "landmark_names": ["Tulum Ruins", "Chichen Itza", "Isla Mujeres", "Playa Delfines"],
        "tags": ["Mayan", "Caribbean", "Cenotes", "Turquoise"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#0D9488", "#0284C7", "#D97706", "#CCFBF1"],
        "art_preset": "cancun",
        "asset_url": "/magnets/destinations/cancun.svg"
    },
    {
        "slug": "patagonia",
        "name": "Patagonia Fitz Roy",
        "country_name": "Argentina", "country_code": "AR", "continent": "Americas", "flag_emoji": "🇦🇷",
        "city": "El Chaltén", "region": "Santa Cruz",
        "destination_type": "Mountain",
        "short_description": "Dramatic windswept wilderness of jagged granite needles, glacial blue lakes, and calving icebergs.",
        "landmark_names": ["Mount Fitz Roy", "Perito Moreno Glacier", "Torres del Paine", "Laguna de los Tres"],
        "tags": ["Glaciers", "Trekking", "Granite Peaks", "Wild"],
        "popularity_score": 94, "is_featured": False,
        "magnet_shape": "shield",
        "dominant_colors": ["#0284C7", "#1E293B", "#E2E8F0", "#38BDF8"],
        "art_preset": "patagonia",
        "asset_url": "/magnets/destinations/patagonia.svg"
    },
    {
        "slug": "mexico-city",
        "name": "Mexico City Bellas Artes",
        "country_name": "Mexico", "country_code": "MX", "continent": "Americas", "flag_emoji": "🇲🇽",
        "city": "Mexico City", "region": "CDMX",
        "destination_type": "Cultural Heritage",
        "short_description": "Vibrant cultural metropolis featuring the marble palace of Bellas Artes, murals, and ancient Aztec roots.",
        "landmark_names": ["Palacio de Bellas Artes", "Zócalo", "Teotihuacan", "Chapultepec Castle"],
        "tags": ["Culture", "Murals", "Palace", "Cuisine"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#EA580C", "#D97706", "#1E3A8A", "#FEF3C7"],
        "art_preset": "mexico_city",
        "asset_url": "/magnets/destinations/mexico-city.svg"
    },
    {
        "slug": "havana",
        "name": "Havana Classic Cars",
        "country_name": "Cuba", "country_code": "CU", "continent": "Americas", "flag_emoji": "🇨🇺",
        "city": "Havana", "region": "La Habana",
        "destination_type": "City",
        "short_description": "Pastel colonial facades and classic vintage convertibles along the wave-swept seawall of the Malecón.",
        "landmark_names": ["El Malecón", "Old Havana (Habana Vieja)", "El Capitolio", "Plaza de la Revolución"],
        "tags": ["Classic Cars", "Colonial", "Music", "Caribbean"],
        "popularity_score": 91, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#0284C7", "#E11D48", "#F59E0B", "#E0F2FE"],
        "art_preset": "havana",
        "asset_url": "/magnets/destinations/havana.svg"
    },
    {
        "slug": "galapagos",
        "name": "Galápagos Islands",
        "country_name": "Ecuador", "country_code": "EC", "continent": "Americas", "flag_emoji": "🇪🇨",
        "city": "Puerto Ayora", "region": "Galápagos Province",
        "destination_type": "Wildlife",
        "short_description": "Living museum of evolution with giant tortoises, blue-footed boobies, and marine iguanas on volcanic shores.",
        "landmark_names": ["Kicker Rock", "Tortuga Bay", "Bartolomé Island", "Charles Darwin Station"],
        "tags": ["Evolution", "Tortoises", "Volcanic", "Wildlife"],
        "popularity_score": 94, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#059669", "#78350F", "#E0F2FE"],
        "art_preset": "galapagos",
        "asset_url": "/magnets/destinations/galapagos.svg"
    },

    # ------------------ AFRICA & MIDDLE EAST (10) ------------------
    {
        "slug": "pyramids-giza",
        "name": "Giza Pyramids & Cairo",
        "country_name": "Egypt", "country_code": "EG", "continent": "Africa", "flag_emoji": "🇪🇬",
        "city": "Giza", "region": "Cairo",
        "destination_type": "Historical Site",
        "short_description": "Last standing Wonder of the Ancient World with Great Pyramids guarded by the enigmatic Great Sphinx.",
        "landmark_names": ["Great Pyramid of Khufu", "The Sphinx", "Pyramid of Khafre", "Nile River"],
        "tags": ["Ancient Egypt", "Pyramids", "Sphinx", "Wonder of the World"],
        "popularity_score": 98, "is_featured": True,
        "magnet_shape": "shield",
        "dominant_colors": ["#D97706", "#B45309", "#0284C7", "#FEF3C7"],
        "art_preset": "pyramids",
        "asset_url": "/magnets/destinations/pyramids-giza.svg"
    },
    {
        "slug": "cape-town",
        "name": "Cape Town Table Mountain",
        "country_name": "South Africa", "country_code": "ZA", "continent": "Africa", "flag_emoji": "🇿🇦",
        "city": "Cape Town", "region": "Western Cape",
        "destination_type": "Scenic Region",
        "short_description": "Flat-topped Table Mountain towering between two roaring oceans with colorful Bo-Kaap houses.",
        "landmark_names": ["Table Mountain", "Cape Point", "Bo-Kaap", "Boulders Beach Penguins"],
        "tags": ["Table Mountain", "Penguins", "Ocean", "Two Oceans"],
        "popularity_score": 96, "is_featured": True,
        "magnet_shape": "landscape",
        "dominant_colors": ["#0284C7", "#059669", "#F59E0B", "#E0F2FE"],
        "art_preset": "cape_town",
        "asset_url": "/magnets/destinations/cape-town.svg"
    },
    {
        "slug": "serengeti",
        "name": "Serengeti Great Migration",
        "country_name": "Tanzania", "country_code": "TZ", "continent": "Africa", "flag_emoji": "🇹🇿",
        "city": "Arusha", "region": "Mara Region",
        "destination_type": "Wildlife",
        "short_description": "Endless savanna plains staging the Great Migration beneath golden acacia trees and blazing sunsets.",
        "landmark_names": ["Great Migration", "Acacia Trees", "Ngorongoro Crater", "Seronera Valley"],
        "tags": ["Safari", "Migration", "Lions", "Savanna"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "landscape",
        "dominant_colors": ["#EA580C", "#D97706", "#78350F", "#FEF3C7"],
        "art_preset": "serengeti",
        "asset_url": "/magnets/destinations/serengeti.svg"
    },
    {
        "slug": "marrakech",
        "name": "Marrakech Medina & Souks",
        "country_name": "Morocco", "country_code": "MA", "continent": "Africa", "flag_emoji": "🇲🇦",
        "city": "Marrakech", "region": "Marrakesh-Safi",
        "destination_type": "Cultural Heritage",
        "short_description": "The Red City of terracotta ramparts, aromatic spice souks, and vibrant Jemaa el-Fnaa square.",
        "landmark_names": ["Jemaa el-Fnaa", "Koutoubia Mosque", "Jardin Majorelle", "Bahia Palace"],
        "tags": ["Souks", "Medina", "Spices", "Riad"],
        "popularity_score": 94, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#DC2626", "#D97706", "#1D4ED8", "#FEF3C7"],
        "art_preset": "marrakech",
        "asset_url": "/magnets/destinations/marrakech.svg"
    },
    {
        "slug": "victoria-falls",
        "name": "Victoria Falls Smoke",
        "country_name": "Zimbabwe", "country_code": "ZW", "continent": "Africa", "flag_emoji": "🇿🇼",
        "city": "Victoria Falls", "region": "Matabeleland North",
        "destination_type": "Natural Wonder",
        "short_description": "The Smoke That Thunders: the world's largest curtain of falling water creating permanent rainbows.",
        "landmark_names": ["Devil's Pool", "Zambezi River Gorge", "Knife-Edge Bridge", "Rainforest Walk"],
        "tags": ["Waterfalls", "Rainbow", "Zambezi", "Wonder"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#0284C7", "#059669", "#F59E0B", "#E0F2FE"],
        "art_preset": "victoria_falls",
        "asset_url": "/magnets/destinations/victoria-falls.svg"
    },
    {
        "slug": "zanzibar",
        "name": "Zanzibar Spice Island",
        "country_name": "Tanzania", "country_code": "TZ", "continent": "Africa", "flag_emoji": "🇹🇿",
        "city": "Zanzibar City", "region": "Unguja",
        "destination_type": "Beach",
        "short_description": "Carved teak doors of Stone Town, fragrant clove plantations, and traditional wooden dhows on cyan seas.",
        "landmark_names": ["Stone Town", "Nungwi Beach", "Prison Island", "Dhow Sailboats"],
        "tags": ["Dhows", "Spices", "Indian Ocean", "Stone Town"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#0D9488", "#D97706", "#E0F2FE"],
        "art_preset": "zanzibar",
        "asset_url": "/magnets/destinations/zanzibar.svg"
    },
    {
        "slug": "mauritius",
        "name": "Mauritius Underwater Waterfall",
        "country_name": "Mauritius", "country_code": "MU", "continent": "Africa", "flag_emoji": "🇲🇺",
        "city": "Port Louis", "region": "Black River",
        "destination_type": "Island",
        "short_description": "Rugged basalt monolith of Le Morne towering over the breathtaking underwater waterfall optical illusion.",
        "landmark_names": ["Le Morne Brabant", "Underwater Waterfall", "Chamarel 7 Colored Earth", "Ile aux Cerfs"],
        "tags": ["Underwater Waterfall", "Le Morne", "Lagoon", "Island"],
        "popularity_score": 93, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#06B6D4", "#047857", "#E0F2FE"],
        "art_preset": "mauritius",
        "asset_url": "/magnets/destinations/mauritius.svg"
    },
    {
        "slug": "abu-dhabi",
        "name": "Abu Dhabi Grand Mosque",
        "country_name": "United Arab Emirates", "country_code": "AE", "continent": "Middle East", "flag_emoji": "🇦🇪",
        "city": "Abu Dhabi", "region": "Emirate of Abu Dhabi",
        "destination_type": "Cultural Heritage",
        "short_description": "The majestic Sheikh Zayed Grand Mosque with 82 white marble domes and reflective prayer pools.",
        "landmark_names": ["Sheikh Zayed Grand Mosque", "Louvre Abu Dhabi", "Corniche", "Qasr Al Watan"],
        "tags": ["White Marble", "Grand Mosque", "Architecture", "Luxury"],
        "popularity_score": 94, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#FFFFFF", "#0284C7", "#EAB308", "#E2E8F0"],
        "art_preset": "abu_dhabi",
        "asset_url": "/magnets/destinations/abu-dhabi.svg"
    },
    {
        "slug": "masai-mara",
        "name": "Masai Mara Savanna",
        "country_name": "Kenya", "country_code": "KE", "continent": "Africa", "flag_emoji": "🇰🇪",
        "city": "Narok", "region": "Rift Valley",
        "destination_type": "Wildlife",
        "short_description": "The ancestral savanna of the Maasai where giraffes and lions roam beneath big African skies.",
        "landmark_names": ["Mara River Crossing", "Maasai Villages", "Oloololo Escarpment", "Big Five"],
        "tags": ["Safari", "Maasai", "Giraffe", "Lion"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#EA580C", "#D97706", "#78350F", "#FEF3C7"],
        "art_preset": "masai_mara",
        "asset_url": "/magnets/destinations/masai-mara.svg"
    },
    {
        "slug": "luxor",
        "name": "Luxor & Valley of Kings",
        "country_name": "Egypt", "country_code": "EG", "continent": "Africa", "flag_emoji": "🇪🇬",
        "city": "Luxor", "region": "Upper Egypt",
        "destination_type": "Historical Site",
        "short_description": "World's greatest open-air museum where Karnak's colossal stone columns rise beside the Nile.",
        "landmark_names": ["Karnak Temple", "Valley of the Kings", "Luxor Temple", "Nile Feluccas"],
        "tags": ["Pharaohs", "Karnak", "Nile", "Tombs"],
        "popularity_score": 93, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#D97706", "#B45309", "#0284C7", "#FEF3C7"],
        "art_preset": "luxor",
        "asset_url": "/magnets/destinations/luxor.svg"
    },

    # ------------------ OCEANIA & GLOBAL (15) ------------------
    {
        "slug": "sydney",
        "name": "Sydney Harbour & Opera",
        "country_name": "Australia", "country_code": "AU", "continent": "Oceania", "flag_emoji": "🇦🇺",
        "city": "Sydney", "region": "New South Wales",
        "destination_type": "City",
        "short_description": "Iconic billowing sails of the Sydney Opera House and the arch of Harbour Bridge over sparkling waters.",
        "landmark_names": ["Sydney Opera House", "Harbour Bridge", "Bondi Beach", "Circular Quay"],
        "tags": ["Opera House", "Harbour", "Bondi", "Sails"],
        "popularity_score": 98, "is_featured": True,
        "magnet_shape": "die-cut",
        "dominant_colors": ["#0284C7", "#FFFFFF", "#1E293B", "#DBEAFE"],
        "art_preset": "sydney",
        "asset_url": "/magnets/destinations/sydney.svg"
    },
    {
        "slug": "great-barrier-reef",
        "name": "Great Barrier Reef",
        "country_name": "Australia", "country_code": "AU", "continent": "Oceania", "flag_emoji": "🇦🇺",
        "city": "Cairns", "region": "Queensland",
        "destination_type": "Natural Wonder",
        "short_description": "Earth's largest living organism: kaleidoscopic coral gardens teeming with sea turtles and clownfish.",
        "landmark_names": ["Heart Reef", "Outer Reef Pontoon", "Green Island", "Coral Gardens"],
        "tags": ["Coral Reef", "Scuba", "Turtles", "Natural Wonder"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#06B6D4", "#F43F5E", "#E0F2FE"],
        "art_preset": "great_barrier_reef",
        "asset_url": "/magnets/destinations/great-barrier-reef.svg"
    },
    {
        "slug": "melbourne",
        "name": "Melbourne Lanes & Tram",
        "country_name": "Australia", "country_code": "AU", "continent": "Oceania", "flag_emoji": "🇦🇺",
        "city": "Melbourne", "region": "Victoria",
        "destination_type": "City",
        "short_description": "Cultural capital of copper-domed Flinders Street station, world-famous coffee, and street art laneways.",
        "landmark_names": ["Flinders Street Station", "Hosier Lane", "Yarra River", "St Kilda Pier"],
        "tags": ["Coffee", "Laneways", "Trams", "Art"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "arch",
        "dominant_colors": ["#EAB308", "#1E293B", "#15803D", "#FEF08A"],
        "art_preset": "melbourne",
        "asset_url": "/magnets/destinations/melbourne.svg"
    },
    {
        "slug": "queenstown",
        "name": "Queenstown Alpine Alps",
        "country_name": "New Zealand", "country_code": "NZ", "continent": "Oceania", "flag_emoji": "🇳🇿",
        "city": "Queenstown", "region": "Otago",
        "destination_type": "Adventure",
        "short_description": "Adventure capital nestled on the shores of Lake Wakatipu beneath the jagged peaks of The Remarkables.",
        "landmark_names": ["The Remarkables", "Lake Wakatipu", "Skyline Gondola", "Milford Road"],
        "tags": ["Adventure", "Alps", "Lake", "Bungy"],
        "popularity_score": 96, "is_featured": True,
        "magnet_shape": "shield",
        "dominant_colors": ["#0284C7", "#059669", "#1E293B", "#E0F2FE"],
        "art_preset": "queenstown",
        "asset_url": "/magnets/destinations/queenstown.svg"
    },
    {
        "slug": "milford-sound",
        "name": "Milford Sound Fjords",
        "country_name": "New Zealand", "country_code": "NZ", "continent": "Oceania", "flag_emoji": "🇳🇿",
        "city": "Te Anau", "region": "Fiordland",
        "destination_type": "Natural Wonder",
        "short_description": "Eighth Wonder of the World where Mitre Peak rises sheer from black deep waters amidst cascading falls.",
        "landmark_names": ["Mitre Peak", "Stirling Falls", "Fiordland National Park", "Bowen Falls"],
        "tags": ["Fjords", "Mitre Peak", "Waterfalls", "Nature"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#047857", "#0284C7", "#1E293B", "#A7F3D0"],
        "art_preset": "milford_sound",
        "asset_url": "/magnets/destinations/milford-sound.svg"
    },
    {
        "slug": "rotorua",
        "name": "Rotorua Geothermal & Māori",
        "country_name": "New Zealand", "country_code": "NZ", "continent": "Oceania", "flag_emoji": "🇳🇿",
        "city": "Rotorua", "region": "Bay of Plenty",
        "destination_type": "Cultural Heritage",
        "short_description": "Māori cultural heartland steeped in bubbling champagne pools, erupting geysers, and red cedar forests.",
        "landmark_names": ["Pohutu Geyser", "Te Puia Māori Village", "Wai-O-Tapu", "Redwoods Treewalk"],
        "tags": ["Māori", "Geothermal", "Geysers", "Culture"],
        "popularity_score": 90, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#EA580C", "#059669", "#78350F", "#FEF3C7"],
        "art_preset": "rotorua",
        "asset_url": "/magnets/destinations/rotorua.svg"
    },
    {
        "slug": "fiji",
        "name": "Fiji Bula Coral Islands",
        "country_name": "Fiji", "country_code": "FJ", "continent": "Oceania", "flag_emoji": "🇫🇯",
        "city": "Nadi", "region": "Viti Levu",
        "destination_type": "Island",
        "short_description": "South Pacific paradise of smiling Bula hospitality, sandbars, coconut palms, and crystal reefs.",
        "landmark_names": ["Mamanuca Islands", "Yasawa Islands", "Coral Coast", "Cloud 9 Floating Bar"],
        "tags": ["Bula", "Coral", "Sandbar", "Island"],
        "popularity_score": 94, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#06B6D4", "#F59E0B", "#E0F2FE"],
        "art_preset": "fiji",
        "asset_url": "/magnets/destinations/fiji.svg"
    },
    {
        "slug": "bora-bora",
        "name": "Bora Bora Otemanu Lagoon",
        "country_name": "French Polynesia", "country_code": "PF", "continent": "Oceania", "flag_emoji": "🇵🇫",
        "city": "Vaitape", "region": "Leeward Islands",
        "destination_type": "Island",
        "short_description": "Dramatic volcanic peak of Mount Otemanu surrounded by fifty shades of turquoise and overwater fares.",
        "landmark_names": ["Mount Otemanu", "Matira Beach", "Coral Gardens", "Overwater Fares"],
        "tags": ["Romantic", "Lagoon", "Otemanu", "Paradise"],
        "popularity_score": 97, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#059669", "#06B6D4", "#E0F2FE"],
        "art_preset": "bora_bora",
        "asset_url": "/magnets/destinations/bora-bora.svg"
    },
    {
        "slug": "uluru",
        "name": "Uluru Sacred Red Center",
        "country_name": "Australia", "country_code": "AU", "continent": "Oceania", "flag_emoji": "🇦🇺",
        "city": "Yulara", "region": "Northern Territory",
        "destination_type": "Cultural Heritage",
        "short_description": "Sacred ancient red sandstone monolith glowing fiery crimson at sunset in the heart of the Outback.",
        "landmark_names": ["Uluru Monolith", "Kata Tjuta", "Field of Light", "Anangu Cultural Center"],
        "tags": ["Sacred", "Outback", "Red Monolith", "Aboriginal"],
        "popularity_score": 95, "is_featured": False,
        "magnet_shape": "landscape",
        "dominant_colors": ["#DC2626", "#B45309", "#0284C7", "#FEE2E2"],
        "art_preset": "uluru",
        "asset_url": "/magnets/destinations/uluru.svg"
    },
    {
        "slug": "auckland",
        "name": "Auckland City of Sails",
        "country_name": "New Zealand", "country_code": "NZ", "continent": "Oceania", "flag_emoji": "🇳🇿",
        "city": "Auckland", "region": "Auckland Region",
        "destination_type": "City",
        "short_description": "Harbour city framed by volcanic cones with the iconic Sky Tower rising over fleets of white sailboats.",
        "landmark_names": ["Sky Tower", "Waitemata Harbour", "Mount Eden", "Waiheke Island"],
        "tags": ["Sky Tower", "Sailboats", "Harbour", "Volcanoes"],
        "popularity_score": 91, "is_featured": False,
        "magnet_shape": "cityscape",
        "dominant_colors": ["#0284C7", "#1E293B", "#38BDF8", "#E0F2FE"],
        "art_preset": "auckland",
        "asset_url": "/magnets/destinations/auckland.svg"
    },
    {
        "slug": "cairns-daintree",
        "name": "Cairns & Ancient Daintree",
        "country_name": "Australia", "country_code": "AU", "continent": "Oceania", "flag_emoji": "🇦🇺",
        "city": "Cairns", "region": "Queensland",
        "destination_type": "National Park",
        "short_description": "Oldest rainforest on Earth where primordial green canopy meets the coral sea at Cape Tribulation.",
        "landmark_names": ["Daintree Rainforest", "Kuranda Scenic Railway", "Cape Tribulation", "Mossman Gorge"],
        "tags": ["Rainforest", "Ancient", "Canopy", "Wild"],
        "popularity_score": 90, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#047857", "#059669", "#D97706", "#A7F3D0"],
        "art_preset": "cairns",
        "asset_url": "/magnets/destinations/cairns-daintree.svg"
    },
    {
        "slug": "gold-coast",
        "name": "Gold Coast Surfers Paradise",
        "country_name": "Australia", "country_code": "AU", "continent": "Oceania", "flag_emoji": "🇦🇺",
        "city": "Gold Coast", "region": "Queensland",
        "destination_type": "Beach",
        "short_description": "Golden sandy coastline where glittering high-rises overlook world-class rolling ocean surf breaks.",
        "landmark_names": ["Surfers Paradise Beach", "Q1 Skypoint", "Burleigh Heads", "Snapper Rocks"],
        "tags": ["Surfing", "Golden Sands", "Skyscrapers", "Sun"],
        "popularity_score": 91, "is_featured": False,
        "magnet_shape": "cityscape",
        "dominant_colors": ["#0284C7", "#F59E0B", "#1E293B", "#E0F2FE"],
        "art_preset": "gold_coast",
        "asset_url": "/magnets/destinations/gold-coast.svg"
    },
    {
        "slug": "tasmania",
        "name": "Tasmania Cradle Mountain",
        "country_name": "Australia", "country_code": "AU", "continent": "Oceania", "flag_emoji": "🇦🇺",
        "city": "Hobart", "region": "Tasmania",
        "destination_type": "Mountain",
        "short_description": "Jagged dolerite peak reflected in glacial Dove Lake surrounded by ancient button grass and wombats.",
        "landmark_names": ["Cradle Mountain", "Dove Lake", "Wineglass Bay", "Salamanca Market"],
        "tags": ["Wilderness", "Wombats", "Alpine", "Glacial Lake"],
        "popularity_score": 89, "is_featured": False,
        "magnet_shape": "shield",
        "dominant_colors": ["#1E293B", "#059669", "#0284C7", "#E2E8F0"],
        "art_preset": "tasmania",
        "asset_url": "/magnets/destinations/tasmania.svg"
    },
    {
        "slug": "cook-islands",
        "name": "Cook Islands & Rarotonga",
        "country_name": "Cook Islands", "country_code": "CK", "continent": "Oceania", "flag_emoji": "🇨🇰",
        "city": "Avarua", "region": "Rarotonga",
        "destination_type": "Island",
        "short_description": "Verdant volcanic needle pinnacles encircled by a crystalline reef lagoon where giant clams flourish.",
        "landmark_names": ["Aitutaki Lagoon", "Muri Lagoon", "The Needle (Te Rua Manga)", "One Foot Island"],
        "tags": ["Polynesia", "Lagoon", "Pacific", "Reef"],
        "popularity_score": 92, "is_featured": False,
        "magnet_shape": "organic",
        "dominant_colors": ["#0284C7", "#059669", "#F59E0B", "#E0F2FE"],
        "art_preset": "cook_islands",
        "asset_url": "/magnets/destinations/cook-islands.svg"
    },
    {
        "slug": "whitehaven-beach",
        "name": "Whitsundays Whitehaven",
        "country_name": "Australia", "country_code": "AU", "continent": "Oceania", "flag_emoji": "🇦🇺",
        "city": "Airlie Beach", "region": "Queensland",
        "destination_type": "Beach",
        "short_description": "Pure white 98% silica sand swirling with brilliant turquoise tidal currents at Hill Inlet.",
        "landmark_names": ["Hill Inlet Lookout", "Whitehaven Beach", "Hamilton Island", "Heart Reef"],
        "tags": ["Silica Sand", "Hill Inlet", "Turquoise", "Whitsundays"],
        "popularity_score": 96, "is_featured": True,
        "magnet_shape": "organic",
        "dominant_colors": ["#06B6D4", "#0284C7", "#FFFFFF", "#CCFBF1"],
        "art_preset": "whitehaven",
        "asset_url": "/magnets/destinations/whitehaven-beach.svg"
    }
]

print(f"Total destinations curated: {len(DESTINATIONS)}")
assert len(DESTINATIONS) == 100, f"Expected 100 destinations, found {len(DESTINATIONS)}"

def generate_svg_magnet(dest):
    """
    Generates a high-quality physical-looking souvenir enamel magnet SVG:
    - Outer 3D drop shadow filter
    - Molded 10px white border
    - Metallic / enamel beveled stroke
    - Shape silhouette (arch, circle, shield, cityscape, landscape, organic, die-cut)
    - Sunset / sky gradient
    - Landmark vector motifs & scenery
    - Tactile curved typography banner with embossed destination name & country
    - Resin enamel gloss sheen overlay
    """
    shape = dest.get("magnet_shape", "arch")
    colors = dest.get("dominant_colors", ["#0284C7", "#F59E0B", "#1E293B", "#FFFFFF"])
    c1, c2, c3, c4 = colors[0], colors[1], colors[2] if len(colors) > 2 else colors[0], colors[3] if len(colors) > 3 else "#FFFFFF"
    name = dest["name"].split(",")[0].upper()
    country = dest["country_name"].upper()

    # Dimensions for crisp viewBox
    w, h = 320, 380

    # Determine clip path and shape geometry
    if shape == "circle":
        shape_path = "M 160,20 A 140,140 0 1,1 159.9,20 Z"
        banner_y = 290
        banner_w = 260
        banner_x = 30
    elif shape == "shield":
        shape_path = "M 40,30 L 280,30 L 280,210 C 280,285 160,350 160,350 C 160,350 40,285 40,210 Z"
        banner_y = 285
        banner_w = 240
        banner_x = 40
    elif shape == "cityscape":
        shape_path = "M 35,130 L 65,130 L 65,90 L 105,90 L 105,45 L 140,45 L 140,20 L 180,20 L 180,55 L 215,55 L 215,100 L 255,100 L 255,140 L 285,140 C 295,140 300,150 300,165 L 300,320 C 300,345 280,360 250,360 L 70,360 C 40,360 20,345 20,320 L 20,165 C 20,150 25,130 35,130 Z"
        banner_y = 300
        banner_w = 260
        banner_x = 30
    elif shape == "landscape":
        shape_path = "M 30,120 C 70,60 140,50 160,65 C 180,50 250,60 290,120 C 305,150 305,290 290,325 C 265,360 55,360 30,325 C 15,290 15,150 30,120 Z"
        banner_y = 295
        banner_w = 250
        banner_x = 35
    elif shape == "organic":
        shape_path = "M 160,25 C 255,25 300,90 295,190 C 290,290 240,355 160,355 C 80,355 30,290 25,190 C 20,90 65,25 160,25 Z"
        banner_y = 290
        banner_w = 250
        banner_x = 35
    elif shape == "die-cut":
        shape_path = "M 50,70 C 90,30 230,30 270,70 C 295,95 300,150 285,190 C 300,230 295,290 270,325 C 235,360 85,360 50,325 C 25,290 20,230 35,190 C 20,150 25,95 50,70 Z"
        banner_y = 290
        banner_w = 250
        banner_x = 35
    else:  # arch
        shape_path = "M 40,160 C 40,75 95,25 160,25 C 225,25 280,75 280,160 L 280,320 C 280,345 260,360 230,360 L 90,360 C 60,360 40,345 40,320 Z"
        banner_y = 295
        banner_w = 250
        banner_x = 35

    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="100%" height="100%">
  <defs>
    <!-- 3D Physical Souvenir Drop Shadow -->
    <filter id="magnet-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="rgba(15,23,42,0.38)" />
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(15,23,42,0.22)" />
    </filter>

    <!-- Sky / Background Gradient -->
    <linearGradient id="sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{c1}" />
      <stop offset="65%" stop-color="{c2}" />
      <stop offset="100%" stop-color="{c3}" />
    </linearGradient>

    <!-- Enamel Border Sheen Gradient -->
    <linearGradient id="border-shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="40%" stop-color="#F1F5F9" />
      <stop offset="80%" stop-color="#E2E8F0" />
      <stop offset="100%" stop-color="#CBD5E1" />
    </linearGradient>

    <!-- Glossy Curved Reflection / Specular Highlight -->
    <linearGradient id="gloss-grad" x1="0%" y1="0%" x2="10% " y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55" />
      <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.0" />
    </linearGradient>

    <!-- Banner Gradient -->
    <linearGradient id="banner-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <clipPath id="inner-badge-clip">
      <path d="{shape_path}" />
    </clipPath>
  </defs>

  <!-- GROUP WITH SOUVENIR SHADOW -->
  <g filter="url(#magnet-shadow)">

    <!-- 1. THICK WHITE DIE-CUT BASE -->
    <path d="{shape_path}"
          fill="url(#border-shine)"
          stroke="#FFFFFF"
          stroke-width="14"
          stroke-linejoin="round"
          stroke-linecap="round" />

    <!-- 2. BEVELED INNER CONTOUR -->
    <path d="{shape_path}"
          fill="none"
          stroke="rgba(0,0,0,0.18)"
          stroke-width="3"
          stroke-linejoin="round" />

    <!-- 3. INNER CLIPPED ARTWORK -->
    <g clip-path="url(#inner-badge-clip)">
      <!-- Sky Background -->
      <rect x="0" y="0" width="{w}" height="{h}" fill="url(#sky-grad)" />

      <!-- Glowing Sun / Moon -->
      <circle cx="160" cy="115" r="48" fill="#FFFBEB" opacity="0.88" />
      <circle cx="160" cy="115" r="58" fill="#FEF08A" opacity="0.32" />

      <!-- Distant Hills / Clouds -->
      <path d="M 0,220 Q 90,170 170,215 T 320,200 L 320,380 L 0,380 Z" fill="{c3}" opacity="0.45" />
      <path d="M 0,245 Q 80,210 160,235 T 320,230 L 320,380 L 0,380 Z" fill="{c2}" opacity="0.7" />

      <!-- Core Architectural Silhouette / Landscape Profile -->
      <g opacity="0.95">
        <!-- Central Monument Base / Landscape -->
        <path d="M 70,360 L 70,240 Q 160,220 250,240 L 250,360 Z" fill="#0F172A" opacity="0.85" />
        <!-- Spires & Towers Silhouette -->
        <polygon points="160,110 175,230 145,230" fill="#0F172A" />
        <polygon points="110,160 120,240 100,240" fill="#0F172A" />
        <polygon points="210,160 220,240 200,240" fill="#0F172A" />
        <circle cx="160" cy="110" r="5" fill="#FBBF24" />
        <!-- Star / Sparkle Dots -->
        <circle cx="65" cy="85" r="2.5" fill="#FFFFFF" opacity="0.8" />
        <circle cx="255" cy="95" r="2" fill="#FFFFFF" opacity="0.8" />
        <circle cx="230" cy="65" r="1.5" fill="#FFFFFF" opacity="0.8" />
      </g>

      <!-- Water Reflection Foreground (if applicable) -->
      <rect x="0" y="275" width="{w}" height="105" fill="#020617" opacity="0.25" />

      <!-- High-Gloss Diagonal Resin Sheen -->
      <path d="M 20,20 Q 160,120 300,40 L 300,160 Q 160,260 20,140 Z"
            fill="url(#gloss-grad)"
            pointer-events="none" />
    </g>

    <!-- 4. EMBOSSED DESTINATION NAME BANNER (Tactile Souvenir Ribbon) -->
    <g transform="translate(0, 0)">
      <!-- Banner Drop Shadow -->
      <rect x="{banner_x}" y="{banner_y}" width="{banner_w}" height="52" rx="14"
            fill="#020617" opacity="0.5" />
      <!-- Banner Outer White Rim -->
      <rect x="{banner_x}" y="{banner_y}" width="{banner_w}" height="50" rx="13"
            fill="url(#banner-grad)"
            stroke="#FFFFFF"
            stroke-width="3" />
      <!-- Banner Inner Gold Inset -->
      <rect x="{banner_x + 3}" y="{banner_y + 3}" width="{banner_w - 6}" height="44" rx="10"
            fill="none"
            stroke="#F59E0B"
            stroke-width="1.2"
            opacity="0.85" />

      <!-- Destination Primary Title (Bold Embossed Lettering) -->
      <text x="160" y="{banner_y + 24}"
            text-anchor="middle"
            fill="#FFFFFF"
            font-family="'Cabinet Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            font-size="15"
            font-weight="900"
            letter-spacing="1.2"
            style="text-shadow: 0 1.5px 3px rgba(0,0,0,0.8);">
        {name}
      </text>

      <!-- Country Subtitle & Flag -->
      <text x="160" y="{banner_y + 40}"
            text-anchor="middle"
            fill="#FBBF24"
            font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            font-size="9.5"
            font-weight="800"
            letter-spacing="2">
        ★ {country} ★
      </text>
    </g>

  </g>
</svg>"""
    return svg_content

# 1. Generate all SVGs
dest_dir = "public/magnets/destinations"
os.makedirs(dest_dir, exist_ok=True)

for dest in DESTINATIONS:
    slug = dest["slug"]
    svg_path = os.path.join(dest_dir, f"{slug}.svg")
    content = generate_svg_magnet(dest)
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(content)

print(f"Generated 100 SVG magnet badges in {dest_dir}/")

# 2. Generate Supabase Migration & Seed SQL
countries_set = {}
for d in DESTINATIONS:
    code = d["country_code"]
    if code not in countries_set:
        countries_set[code] = {
            "name": d["country_name"],
            "country_code": code,
            "continent": d["continent"],
            "flag_emoji": d["flag_emoji"]
        }

sql_lines = []
sql_lines.append("-- ====================================================================")
sql_lines.append("-- Magneto Database Schema Migration: Global Destination Catalog & Magnets")
sql_lines.append("-- Version: 2.0.0")
sql_lines.append("-- Tables: countries, destinations, magnet_assets, user_magnets")
sql_lines.append("-- Includes full seed data for 100 world-class travel destinations")
sql_lines.append("-- ====================================================================\n")

sql_lines.append("""
-- 1. COUNTRIES TABLE
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code text unique not null,
  continent text not null,
  flag_emoji text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_countries_continent on public.countries(continent);
create index if not exists idx_countries_country_code on public.countries(country_code);
alter table public.countries enable row level security;

drop policy if exists "Allow public read access on countries" on public.countries;
create policy "Allow public read access on countries"
  on public.countries for select using (true);

-- 2. DESTINATIONS TABLE
create table if not exists public.destinations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  country_id uuid not null references public.countries(id) on delete cascade,
  city text,
  region text,
  continent text not null,
  destination_type text not null,
  short_description text,
  landmark_names text[] default array[]::text[],
  tags text[] default array[]::text[],
  popularity_score integer default 0,
  is_featured boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_destinations_slug on public.destinations(slug);
create index if not exists idx_destinations_country_id on public.destinations(country_id);
create index if not exists idx_destinations_continent on public.destinations(continent);
create index if not exists idx_destinations_type on public.destinations(destination_type);
create index if not exists idx_destinations_is_featured on public.destinations(is_featured);
create index if not exists idx_destinations_popularity on public.destinations(popularity_score desc);
alter table public.destinations enable row level security;

drop policy if exists "Allow public read access on destinations" on public.destinations;
create policy "Allow public read access on destinations"
  on public.destinations for select using (is_active = true);

-- 3. MAGNET_ASSETS TABLE
create table if not exists public.magnet_assets (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid not null references public.destinations(id) on delete cascade,
  asset_url text not null,
  thumbnail_url text,
  asset_format text default 'svg',
  background_type text default 'transparent',
  magnet_shape text default 'die-cut',
  artwork_style text default 'enamel-souvenir',
  dominant_colors text[] default array[]::text[],
  generation_status text default 'ready',
  is_primary boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_magnet_assets_destination_id on public.magnet_assets(destination_id);
create index if not exists idx_magnet_assets_is_primary on public.magnet_assets(is_primary);
alter table public.magnet_assets enable row level security;

drop policy if exists "Allow public read access on magnet_assets" on public.magnet_assets;
create policy "Allow public read access on magnet_assets"
  on public.magnet_assets for select using (true);

-- 4. USER_MAGNETS TABLE
create table if not exists public.user_magnets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_id uuid not null references public.destinations(id) on delete cascade,
  magnet_asset_id uuid not null references public.magnet_assets(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  acquired_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint uq_user_destination unique (user_id, destination_id)
);

create index if not exists idx_user_magnets_user_id on public.user_magnets(user_id);
create index if not exists idx_user_magnets_destination_id on public.user_magnets(destination_id);
create index if not exists idx_user_magnets_trip_id on public.user_magnets(trip_id);
alter table public.user_magnets enable row level security;

drop policy if exists "Users can view their own magnets" on public.user_magnets;
create policy "Users can view their own magnets"
  on public.user_magnets for select using (auth.uid() = user_id);

drop policy if exists "Users can collect magnets for their fridge" on public.user_magnets;
create policy "Users can collect magnets for their fridge"
  on public.user_magnets for insert with check (auth.uid() = user_id);

drop policy if exists "Users can remove magnets from their fridge" on public.user_magnets;
create policy "Users can remove magnets from their fridge"
  on public.user_magnets for delete using (auth.uid() = user_id);
""")

# Seed countries
sql_lines.append("\n-- --------------------------------------------------------------------")
sql_lines.append("-- SEED COUNTRIES")
sql_lines.append("-- --------------------------------------------------------------------")
for code, c in countries_set.items():
    name_esc = c["name"].replace("'", "''")
    flag = c["flag_emoji"]
    cont = c["continent"]
    sql_lines.append(f"""insert into public.countries (name, country_code, continent, flag_emoji)
values ('{name_esc}', '{code}', '{cont}', '{flag}')
on conflict (country_code) do update set name = excluded.name, flag_emoji = excluded.flag_emoji;""")

# Seed destinations & magnet_assets
sql_lines.append("\n-- --------------------------------------------------------------------")
sql_lines.append("-- SEED 100 DESTINATIONS AND MAGNET ASSETS")
sql_lines.append("-- --------------------------------------------------------------------")

for d in DESTINATIONS:
    slug = d["slug"]
    name_esc = d["name"].replace("'", "''")
    city_esc = d.get("city", "").replace("'", "''")
    reg_esc = d.get("region", "").replace("'", "''")
    desc_esc = d.get("short_description", "").replace("'", "''")
    cont = d["continent"]
    dtype = d["destination_type"]
    code = d["country_code"]
    pop = d["popularity_score"]
    is_feat = "true" if d["is_featured"] else "false"
    landmarks_sql = "array[" + ", ".join([f"'{l.replace("'", "''")}'" for l in d["landmark_names"]]) + "]::text[]"
    tags_sql = "array[" + ", ".join([f"'{t.replace("'", "''")}'" for t in d["tags"]]) + "]::text[]"
    colors_sql = "array[" + ", ".join([f"'{col}'" for col in d["dominant_colors"]]) + "]::text[]"
    shape = d["magnet_shape"]
    asset_url = d["asset_url"]
    fmt = "png" if asset_url.endswith(".png") else "svg"

    sql_lines.append(f"""
do $$
declare
  cid uuid;
  did uuid;
begin
  select id into cid from public.countries where country_code = '{code}';

  insert into public.destinations (
    slug, name, country_id, city, region, continent, destination_type,
    short_description, landmark_names, tags, popularity_score, is_featured
  )
  values (
    '{slug}', '{name_esc}', cid, '{city_esc}', '{reg_esc}', '{cont}', '{dtype}',
    '{desc_esc}', {landmarks_sql}, {tags_sql}, {pop}, {is_feat}
  )
  on conflict (slug) do update set
    name = excluded.name,
    city = excluded.city,
    region = excluded.region,
    short_description = excluded.short_description,
    landmark_names = excluded.landmark_names,
    tags = excluded.tags,
    popularity_score = excluded.popularity_score,
    is_featured = excluded.is_featured
  returning id into did;

  insert into public.magnet_assets (
    destination_id, asset_url, asset_format, magnet_shape, dominant_colors, is_primary
  )
  values (
    did, '{asset_url}', '{fmt}', '{shape}', {colors_sql}, true
  )
  on conflict do nothing;
end $$;""")

migration_path = "supabase/migrations/20261013000001_destination_catalog.sql"
with open(migration_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sql_lines))

print(f"Generated complete migration & seed SQL in {migration_path}")

# 3. Generate TypeScript Catalog src/data/destinationsCatalog.ts
ts_content = f"""// AUTO-GENERATED CURATED DESTINATION CATALOG
// 100 World-Class Travel Destinations with Physical Enamel Magnet Souvenirs
import type {{ DestinationWithMagnet }} from '../types/destination'

export const DESTINATIONS_CATALOG: DestinationWithMagnet[] = {json.dumps(DESTINATIONS, indent=2)};
"""

with open("src/data/destinationsCatalog.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Generated TypeScript catalog in src/data/destinationsCatalog.ts")
