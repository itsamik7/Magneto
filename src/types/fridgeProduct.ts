export type FridgeShelf =
  | 'freezer'
  | 'top_shelf'
  | 'middle_shelf'
  | 'bottom_shelf'
  | 'crisper_drawer'
  | 'door_bin_top'
  | 'door_bin_middle'
  | 'door_bin_bottom'

export interface ShelfDefinition {
  id: FridgeShelf
  label: string
  location: 'cavity' | 'door'
  /** Precise physical top surface baseline where product bottom rests (percent from top, 0 - 100) */
  surfaceTopPercent: number
  /** Approximate vertical center position in percent (0 - 100) */
  verticalCenterPercent: number
  /** Allowed safe horizontal placement range percent [minX, maxX] */
  horizontalRange: [number, number]
  /** Allowed height range percent */
  heightRange: [number, number]
  description: string
}

export const SHELF_DEFINITIONS: Record<FridgeShelf, ShelfDefinition> = {
  freezer: {
    id: 'freezer',
    label: 'Top Freezer Compartment',
    location: 'cavity',
    surfaceTopPercent: 86.0, // within internal sub-zero box container
    verticalCenterPercent: 12,
    horizontalRange: [30, 84],
    heightRange: [4, 22],
    description: 'Frosted sub-zero freezer shelf for frozen treats and ice.',
  },
  top_shelf: {
    id: 'top_shelf',
    label: 'Upper Fresh Food Shelf',
    location: 'cavity',
    surfaceTopPercent: 44.8, // exact tempered glass top surface
    verticalCenterPercent: 36,
    horizontalRange: [14, 86],
    heightRange: [24, 45],
    description: 'Tempered glass shelf for eggs, dairy jars, and delicate items.',
  },
  middle_shelf: {
    id: 'middle_shelf',
    label: 'Middle Fresh Food Shelf',
    location: 'cavity',
    surfaceTopPercent: 60.1, // exact tempered glass top surface
    verticalCenterPercent: 52,
    horizontalRange: [14, 86],
    heightRange: [45, 60],
    description: 'Primary tempered glass shelf for cartons, bottles, and daily drinks.',
  },
  bottom_shelf: {
    id: 'bottom_shelf',
    label: 'Lower Fresh Food Shelf',
    location: 'cavity',
    surfaceTopPercent: 73.4, // exact tempered glass top surface
    verticalCenterPercent: 66,
    horizontalRange: [14, 86],
    heightRange: [60, 74],
    description: 'Sturdy glass shelf above crisper for meal preps, heavy juice carafes.',
  },
  crisper_drawer: {
    id: 'crisper_drawer',
    label: 'Bottom Crisper Humidity Drawer',
    location: 'cavity',
    surfaceTopPercent: 85.0, // within crisper drawer container
    verticalCenterPercent: 86,
    horizontalRange: [16, 84],
    heightRange: [75, 94],
    description: 'Transparent high-humidity vegetable & citrus fruit drawer.',
  },
  door_bin_top: {
    id: 'door_bin_top',
    label: 'Door Top Dairy Bin',
    location: 'door',
    surfaceTopPercent: 26.2, // floor of top acrylic dairy rack
    verticalCenterPercent: 20,
    horizontalRange: [16, 84],
    heightRange: [14, 28],
    description: 'Covered upper acrylic bin for butter, small cheeses, and spreads.',
  },
  door_bin_middle: {
    id: 'door_bin_middle',
    label: 'Door Middle Condiment Bin',
    location: 'door',
    surfaceTopPercent: 48.2, // floor of middle condiment rack
    verticalCenterPercent: 44,
    horizontalRange: [16, 84],
    heightRange: [36, 52],
    description: 'Intermediate acrylic door rack for mustard, sauces, and jam jars.',
  },
  door_bin_bottom: {
    id: 'door_bin_bottom',
    label: 'Door Bottom Beverage Gallon Bin',
    location: 'door',
    surfaceTopPercent: 88.5, // floor of deep gallon bottle rack
    verticalCenterPercent: 74,
    horizontalRange: [16, 84],
    heightRange: [60, 89],
    description: 'Deep guardrail door rack for champagne, tall bottles, and juices.',
  },
}

export interface ProductVisualDimensions {
  widthPx: number
  heightPx: number
  shadowWidthPercent: number
  shadowShape: 'ellipse' | 'rounded-rect'
}

/**
 * Resolves physically accurate spatial dimensions and contact shadow shapes
 * based on product category, name, and visual aspect ratio.
 */
export function getProductDimensions(product: {
  category?: string
  name?: string
  imageUrl?: string
}): ProductVisualDimensions {
  const name = (product.name || '').toLowerCase()
  const img = (product.imageUrl || '').toLowerCase()
  const cat = (product.category || '').toLowerCase()

  // 1. Wide rectangular meal prep containers
  if (name.includes('meal') || name.includes('container') || img.includes('meal-container')) {
    return { widthPx: 60, heightPx: 32, shadowWidthPercent: 92, shadowShape: 'rounded-rect' }
  }
  // 2. Wide crisper baskets
  if (name.includes('basket') || name.includes('citrus') || img.includes('citrus-basket')) {
    return { widthPx: 62, heightPx: 36, shadowWidthPercent: 88, shadowShape: 'ellipse' }
  }
  // 3. Molded pulp egg cartons (wide & low profile)
  if (name.includes('egg') || img.includes('egg-carton')) {
    return { widthPx: 56, heightPx: 36, shadowWidthPercent: 90, shadowShape: 'rounded-rect' }
  }
  // 4. Tall slender glass bottles (Champagne, Sparkling Water, Wine)
  if (
    name.includes('champagne') ||
    name.includes('wine') ||
    img.includes('champagne') ||
    img.includes('water-bottle') ||
    name.includes('water')
  ) {
    return { widthPx: 26, heightPx: 64, shadowWidthPercent: 76, shadowShape: 'ellipse' }
  }
  // 5. Cardboard milk cartons & juice carafes
  if (
    name.includes('milk') ||
    img.includes('milk') ||
    name.includes('orange') ||
    name.includes('juice') ||
    img.includes('orange-juice')
  ) {
    return { widthPx: 32, heightPx: 56, shadowWidthPercent: 84, shadowShape: 'rounded-rect' }
  }
  // 6. Round salad greens & lettuce
  if (name.includes('lettuce') || name.includes('salad') || img.includes('green-lettuce')) {
    return { widthPx: 46, heightPx: 42, shadowWidthPercent: 82, shadowShape: 'ellipse' }
  }
  // 7. Glass condiment jars & ice cream tubs
  if (
    name.includes('jam') ||
    name.includes('mustard') ||
    name.includes('yogurt') ||
    name.includes('gelato') ||
    name.includes('ice cream') ||
    img.includes('jar') ||
    img.includes('ice-cream')
  ) {
    return { widthPx: 34, heightPx: 40, shadowWidthPercent: 82, shadowShape: 'ellipse' }
  }

  // Category-based fallback
  if (cat === 'beverages') {
    return { widthPx: 28, heightPx: 60, shadowWidthPercent: 78, shadowShape: 'ellipse' }
  }
  if (cat === 'prepared meals') {
    return { widthPx: 58, heightPx: 34, shadowWidthPercent: 90, shadowShape: 'rounded-rect' }
  }
  if (cat === 'fruits & vegetables') {
    return { widthPx: 48, heightPx: 40, shadowWidthPercent: 85, shadowShape: 'ellipse' }
  }

  // Default balanced appliance product dimensions
  return { widthPx: 38, heightPx: 48, shadowWidthPercent: 82, shadowShape: 'ellipse' }
}

export type ProductCategory =
  | 'Dairy'
  | 'Beverages'
  | 'Condiments'
  | 'Fruits & Vegetables'
  | 'Prepared Meals'
  | 'Freezer'
  | 'Groceries'
  | 'Snacks'

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Dairy',
  'Beverages',
  'Condiments',
  'Fruits & Vegetables',
  'Prepared Meals',
  'Freezer',
  'Groceries',
  'Snacks',
]

export type StackingArrangement = 'single' | 'row' | 'depth' | 'grid' | 'stack'

export interface CompartmentCapacity {
  shelf: FridgeShelf
  maxUnits: number
  recommendedArrangements: StackingArrangement[]
  description: string
}

export const COMPARTMENT_CAPACITIES: Record<FridgeShelf, CompartmentCapacity> = {
  freezer: {
    shelf: 'freezer',
    maxUnits: 4,
    recommendedArrangements: ['single', 'row', 'stack'],
    description: 'Sub-zero insulated freezer for frozen treats, gelato pints, and ice tray.',
  },
  top_shelf: {
    shelf: 'top_shelf',
    maxUnits: 6,
    recommendedArrangements: ['single', 'row', 'depth', 'grid'],
    description: 'Upper tempered glass shelf for egg cartons, dairy jars, and delicacies.',
  },
  middle_shelf: {
    shelf: 'middle_shelf',
    maxUnits: 7,
    recommendedArrangements: ['single', 'row', 'depth'],
    description: 'High-clearance tempered glass shelf for whole milk cartons, bottles, and carafes.',
  },
  bottom_shelf: {
    shelf: 'bottom_shelf',
    maxUnits: 6,
    recommendedArrangements: ['single', 'row', 'grid', 'stack'],
    description: 'Sturdy lower glass shelf above crisper for meal prep containers and drink rows.',
  },
  crisper_drawer: {
    shelf: 'crisper_drawer',
    maxUnits: 5,
    recommendedArrangements: ['single', 'row', 'grid'],
    description: 'High-humidity sliding transparent acrylic drawer for fresh salad greens and citrus.',
  },
  door_bin_top: {
    shelf: 'door_bin_top',
    maxUnits: 4,
    recommendedArrangements: ['single', 'row'],
    description: 'Top covered acrylic door bin for butter dishes, small cheeses, and spreads.',
  },
  door_bin_middle: {
    shelf: 'door_bin_middle',
    maxUnits: 5,
    recommendedArrangements: ['single', 'row'],
    description: 'Intermediate acrylic door rack for condiment jars, Dijon mustard, and jam.',
  },
  door_bin_bottom: {
    shelf: 'door_bin_bottom',
    maxUnits: 4,
    recommendedArrangements: ['single', 'row'],
    description: 'Deep guardrail door rack for champagne bottles, chilled beverages, and gallons.',
  },
}

export interface FridgeProduct {
  id: string
  name: string
  category: ProductCategory | string
  imageUrl: string
  description?: string
  shelf: FridgeShelf
  positionX: number // 0 to 100 percentage horizontally
  displayScale: number // 0.4 to 2.5 (default 1.0)
  quantity?: string
  /** Number of physical units stacked or arranged on the shelf (1 to 12) */
  itemCount?: number
  /** Stacking and spatial arrangement mode */
  arrangement?: StackingArrangement
  /** Spacing in pixels between duplicate units (10 to 45px) */
  spacing?: number
  isActive: boolean
  isArchived: boolean
  displayOrder: number
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export interface ApprovedAsset {
  id: string
  name: string
  category: ProductCategory
  path: string
  suggestedShelf: FridgeShelf
  defaultQuantity: string
  defaultItemCount?: number
  defaultArrangement?: StackingArrangement
  defaultSpacing?: number
}

export const APPROVED_ASSETS: ApprovedAsset[] = [
  {
    id: 'asset-milk-carton',
    name: 'Fresh Whole Milk Carton',
    category: 'Dairy',
    path: '/assets/products/milk-carton.png',
    suggestedShelf: 'middle_shelf',
    defaultQuantity: '3 Cartons',
    defaultItemCount: 3,
    defaultArrangement: 'row',
    defaultSpacing: 22,
  },
  {
    id: 'asset-egg-carton',
    name: 'Farm Fresh Brown Eggs',
    category: 'Dairy',
    path: '/assets/products/egg-carton.png',
    suggestedShelf: 'top_shelf',
    defaultQuantity: 'Pack of 6',
    defaultItemCount: 1,
    defaultArrangement: 'single',
    defaultSpacing: 18,
  },
  {
    id: 'asset-water-bottle',
    name: 'Sparkling Mineral Water',
    category: 'Beverages',
    path: '/assets/products/water-bottle.png',
    suggestedShelf: 'middle_shelf',
    defaultQuantity: '2 Bottles',
    defaultItemCount: 2,
    defaultArrangement: 'row',
    defaultSpacing: 22,
  },
  {
    id: 'asset-orange-juice',
    name: 'Pure Squeezed Orange Juice',
    category: 'Beverages',
    path: '/assets/products/orange-juice.png',
    suggestedShelf: 'bottom_shelf',
    defaultQuantity: '1 Carafe',
    defaultItemCount: 1,
    defaultArrangement: 'single',
    defaultSpacing: 18,
  },
  {
    id: 'asset-yogurt-jar',
    name: 'Artisanal Greek Yogurt',
    category: 'Dairy',
    path: '/assets/products/yogurt-jar.png',
    suggestedShelf: 'top_shelf',
    defaultQuantity: '2 Jars',
    defaultItemCount: 2,
    defaultArrangement: 'row',
    defaultSpacing: 20,
  },
  {
    id: 'asset-condiment-jar',
    name: 'Dijon Mustard & Condiment',
    category: 'Condiments',
    path: '/assets/products/condiment-jar.png',
    suggestedShelf: 'door_bin_middle',
    defaultQuantity: '250g Jar',
    defaultItemCount: 1,
    defaultArrangement: 'single',
    defaultSpacing: 18,
  },
  {
    id: 'asset-jam-jar',
    name: 'Artisan Strawberry Conserve',
    category: 'Condiments',
    path: '/assets/products/jam-jar.png',
    suggestedShelf: 'door_bin_middle',
    defaultQuantity: '340g Jar',
    defaultItemCount: 1,
    defaultArrangement: 'single',
    defaultSpacing: 18,
  },
  {
    id: 'asset-citrus-basket',
    name: 'Crisper Fresh Citrus Basket',
    category: 'Fruits & Vegetables',
    path: '/assets/products/citrus-basket.png',
    suggestedShelf: 'crisper_drawer',
    defaultQuantity: '1 Basket',
    defaultItemCount: 1,
    defaultArrangement: 'single',
    defaultSpacing: 18,
  },
  {
    id: 'asset-green-lettuce',
    name: 'Hydroponic Salad Greens',
    category: 'Fruits & Vegetables',
    path: '/assets/products/green-lettuce.png',
    suggestedShelf: 'crisper_drawer',
    defaultQuantity: '1 Head',
    defaultItemCount: 1,
    defaultArrangement: 'single',
    defaultSpacing: 18,
  },
  {
    id: 'asset-meal-container',
    name: 'Glass Meal Prep Container',
    category: 'Prepared Meals',
    path: '/assets/products/meal-container.png',
    suggestedShelf: 'bottom_shelf',
    defaultQuantity: '2 Containers (Stacked)',
    defaultItemCount: 2,
    defaultArrangement: 'stack',
    defaultSpacing: 16,
  },
  {
    id: 'asset-ice-cream',
    name: 'Artisan Gelato Ice Cream Pint',
    category: 'Freezer',
    path: '/assets/products/ice-cream.png',
    suggestedShelf: 'freezer',
    defaultQuantity: '2 Pints',
    defaultItemCount: 2,
    defaultArrangement: 'row',
    defaultSpacing: 22,
  },
  {
    id: 'asset-champagne-bottle',
    name: 'Chilled Sparkling Champagne',
    category: 'Beverages',
    path: '/assets/products/champagne-bottle.png',
    suggestedShelf: 'door_bin_bottom',
    defaultQuantity: '750 ml',
    defaultItemCount: 1,
    defaultArrangement: 'single',
    defaultSpacing: 18,
  },
]
