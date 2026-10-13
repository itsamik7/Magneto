import { DESTINATIONS_CATALOG } from './destinationsCatalog'

export interface SouvenirMagnetData {
  id: string
  name: string
  destination: string
  region: 'India' | 'International'
  category: 'Monuments' | 'Nature' | 'Beaches' | 'Mountains' | 'Culture' | 'Cities' | 'Food'
  material: string
  imagePath: string
  description: string
  tags: string[]
  defaultScale?: number
  isFeatured?: boolean
}

const PRIMARY_FEATURED_MAGNETS: SouvenirMagnetData[] = [
  // --- INDIA DESTINATIONS ---
  {
    id: 'taj-mahal',
    name: 'Taj Mahal',
    destination: 'Agra, India',
    region: 'India',
    category: 'Monuments',
    material: 'Glazed Carved Ceramic Relief',
    imagePath: '/assets/magnets/india/taj-mahal.png',
    description: 'A 3D sculpted glazed ceramic relief souvenir magnet of the Taj Mahal in Agra with intricate marble domes, minarets, and an embossed TAJ MAHAL plaque.',
    tags: ['Monuments', 'India', 'UNESCO', 'Architecture'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'india-gate',
    name: 'India Gate',
    destination: 'New Delhi, India',
    region: 'India',
    category: 'Monuments',
    material: 'Carved Sandstone Relief',
    imagePath: '/assets/magnets/india/india-gate.png',
    description: 'A 3D carved red-and-yellow sandstone archway monument souvenir magnet with architectural cornices and an embossed INDIA plaque at the base.',
    tags: ['Monuments', 'India', 'Memorial', 'Architecture'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'hawa-mahal',
    name: 'Hawa Mahal',
    destination: 'Jaipur, India',
    region: 'India',
    category: 'Monuments',
    material: 'Terracotta Pink Sandstone',
    imagePath: '/assets/magnets/india/hawa-mahal.png',
    description: 'A 3D sculpted terracotta-pink sandstone relief souvenir magnet featuring the five-story honeycomb jharokha lattice windows and an embossed JAIPUR plaque.',
    tags: ['Monuments', 'India', 'Pink City', 'Palace'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'gateway-of-india',
    name: 'Gateway of India',
    destination: 'Mumbai, India',
    region: 'India',
    category: 'Monuments',
    material: 'Carved Basalt Stone Relief',
    imagePath: '/assets/magnets/india/gateway-of-india.png',
    description: 'A 3D carved yellow basalt stone relief souvenir magnet of the triumphal archway monument in Mumbai with an embossed MUMBAI plaque at the base.',
    tags: ['Monuments', 'India', 'Coastal', 'Heritage'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'golden-temple',
    name: 'Golden Temple',
    destination: 'Amritsar, India',
    region: 'India',
    category: 'Culture',
    material: 'Gilded Gold & Marble Relief',
    imagePath: '/assets/magnets/india/golden-temple.png',
    description: 'A 3D gilded gold-leaf and white marble relief souvenir magnet of the Harmandir Sahib resting above the sacred Amrit Sarovar reflection pool with AMRITSAR plaque.',
    tags: ['Culture', 'India', 'Spiritual', 'Heritage'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'kerala-backwaters',
    name: 'Kerala Backwaters',
    destination: 'Kerala, India',
    region: 'India',
    category: 'Nature',
    material: 'Carved Wood & Painted Resin',
    imagePath: '/assets/magnets/india/kerala-backwaters.png',
    description: 'A 3D carved wood and painted resin souvenir magnet depicting a traditional thatched Kettuvallam houseboat on emerald palm-lined backwaters with KERALA plaque.',
    tags: ['Nature', 'India', 'Backwaters', 'Coastal'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'goa-beach',
    name: 'Goa Beach',
    destination: 'Goa, India',
    region: 'India',
    category: 'Beaches',
    material: 'Sculpted Resin & Ceramic',
    imagePath: '/assets/magnets/india/goa-beach.png',
    description: 'A beautiful souvenir magnet capturing the sunset beaches of Goa with coconut palm trees and the Arabian Sea, featuring an embossed rustic wooden GOA plaque.',
    tags: ['Beaches', 'Nature', 'India', 'Coastal'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'ladakh',
    name: 'Ladakh Landscapes',
    destination: 'Ladakh, India',
    region: 'India',
    category: 'Mountains',
    material: 'Sculpted Mountain Stone Relief',
    imagePath: '/assets/magnets/india/ladakh.png',
    description: 'A 3D sculpted stone relief souvenir magnet of rugged snow-capped Himalayan peaks over the deep cobalt-blue Pangong Tso lake with Buddhist prayer flags and LADAKH plaque.',
    tags: ['Mountains', 'Nature', 'India', 'Himalayas'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'royal-elephant',
    name: 'Royal Indian Elephant',
    destination: 'Rajasthan, India',
    region: 'India',
    category: 'Culture',
    material: 'Enamel & Embossed Gold',
    imagePath: '/assets/magnets/india/royal-elephant.png',
    description: 'A 3D sculpted enamel and gold-embossed souvenir magnet of a decorated royal Indian elephant with ornate ceremonial jhool saddle blanket and gold jewelry with INDIA banner.',
    tags: ['Culture', 'India', 'Heritage', 'Art'],
    defaultScale: 1.0,
    isFeatured: true,
  },

  // --- INTERNATIONAL DESTINATIONS ---
  {
    id: 'eiffel-tower',
    name: 'Eiffel Tower',
    destination: 'Paris, France',
    region: 'International',
    category: 'Monuments',
    material: 'Antique Cast Bronze Relief',
    imagePath: '/assets/magnets/international/eiffel-tower.png',
    description: 'A 3D sculpted antique cast bronze relief souvenir magnet of the Eiffel Tower with Paris arches, ornate filigree, and an embossed PARIS plaque.',
    tags: ['Monuments', 'International', 'Europe', 'Landmark'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'colosseum-rome',
    name: 'Colosseum',
    destination: 'Rome, Italy',
    region: 'International',
    category: 'Monuments',
    material: 'Weathered Travertine Stone Relief',
    imagePath: '/assets/magnets/international/colosseum-rome.png',
    description: 'A photorealistic 3D sculpted weathered travertine stone relief souvenir refrigerator magnet of the Roman Colosseum with tiered arcades and an embossed ROMA plaque.',
    tags: ['Monuments', 'International', 'Europe', 'Ancient'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'london',
    name: 'Big Ben & London Bus',
    destination: 'London, UK',
    region: 'International',
    category: 'Cities',
    material: 'Die-Cast Enamel & Metal',
    imagePath: '/assets/magnets/international/london.png',
    description: 'A classic London souvenir badge magnet featuring Big Ben, the iconic red double-decker bus, and a traditional red telephone box with gold lettering.',
    tags: ['Cities', 'International', 'Europe', 'Landmark'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'fuji-japan',
    name: 'Mount Fuji & Pagoda',
    destination: 'Fujinomiya, Japan',
    region: 'International',
    category: 'Mountains',
    material: 'Glazed Porcelain & Enamel',
    imagePath: '/assets/magnets/international/fuji-japan.png',
    description: 'An organic die-cut souvenir magnet featuring snow-capped Mount Fuji, a traditional multi-tier Japanese pagoda, and delicate blooming cherry blossoms.',
    tags: ['Mountains', 'International', 'Asia', 'Nature'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'bali-temple',
    name: 'Bali Temple',
    destination: 'Bali, Indonesia',
    region: 'International',
    category: 'Culture',
    material: 'Carved Volcanic Stone Relief',
    imagePath: '/assets/magnets/international/bali-temple.png',
    description: 'A rounded organic souvenir magnet with Balinese temple architecture, lush tiered rice paddies, and tropical palm fronds with golden accents.',
    tags: ['Culture', 'International', 'Asia', 'Spiritual'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'swiss-alps',
    name: 'Swiss Alps',
    destination: 'Zermatt, Switzerland',
    region: 'International',
    category: 'Mountains',
    material: 'Layered Wood & Enamel Relief',
    imagePath: '/assets/magnets/international/swiss-alps.png',
    description: 'An organic landscape-shaped souvenir magnet featuring jagged snow-covered alpine peaks, crystal-clear mountain lakes, and evergreen pine forests.',
    tags: ['Mountains', 'International', 'Europe', 'Alps'],
    defaultScale: 1.0,
    isFeatured: true,
  },
  {
    id: 'singapore',
    name: 'Singapore Cityscape',
    destination: 'Singapore',
    region: 'International',
    category: 'Cities',
    material: 'Brushed Die-Cast Metallic Relief',
    imagePath: '/assets/magnets/international/singapore.png',
    description: 'A modern architectural souvenir magnet featuring Marina Bay Sands, the iconic Merlion fountain, and Gardens by the Bay supertrees.',
    tags: ['Cities', 'International', 'Asia', 'Modern'],
    defaultScale: 1.0,
    isFeatured: true,
  },
]

// Helper to map category from destination_type
function mapCategory(type: string): 'Monuments' | 'Nature' | 'Beaches' | 'Mountains' | 'Culture' | 'Cities' | 'Food' {
  if (type === 'Beach' || type === 'Island') return 'Beaches'
  if (type === 'Mountain') return 'Mountains'
  if (type === 'City') return 'Cities'
  if (type === 'Natural Wonder' || type === 'Wildlife') return 'Nature'
  if (type === 'Cultural Heritage') return 'Culture'
  return 'Monuments'
}

// Convert all DESTINATIONS_CATALOG entries to SouvenirMagnetData
const catalogAdditionalMagnets: SouvenirMagnetData[] = DESTINATIONS_CATALOG.map((dest) => ({
  id: dest.slug,
  name: dest.city || dest.name.split(',')[0].trim(),
  destination: dest.name,
  region: dest.country_name === 'India' ? ('India' as const) : ('International' as const),
  category: mapCategory(dest.destination_type),
  material: '3D Sculpted Die-Cut Enamel Relief',
  imagePath: dest.asset_url || `/magnets/destinations/${dest.slug}.png`,
  description: dest.short_description || `Authentic 3D souvenir magnet for ${dest.name}.`,
  tags: [dest.destination_type, ...(dest.tags || []), dest.country_name],
  defaultScale: 1.0,
  isFeatured: !!dest.is_featured,
}))

// Primary IDs set for deduplication
const primaryIds = new Set(PRIMARY_FEATURED_MAGNETS.map((m) => m.id))

export const SOUVENIR_MAGNETS_CATALOG: SouvenirMagnetData[] = [
  ...PRIMARY_FEATURED_MAGNETS,
  ...catalogAdditionalMagnets.filter((m) => !primaryIds.has(m.id)),
]
