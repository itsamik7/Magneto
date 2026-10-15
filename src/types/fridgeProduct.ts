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
  /** Approximate vertical center position in percent (0 - 100) */
  verticalCenterPercent: number
  /** Allowed height range percent */
  heightRange: [number, number]
  description: string
}

export const SHELF_DEFINITIONS: Record<FridgeShelf, ShelfDefinition> = {
  freezer: {
    id: 'freezer',
    label: 'Top Freezer Compartment',
    location: 'cavity',
    verticalCenterPercent: 11,
    heightRange: [4, 18],
    description: 'Frosted sub-zero freezer shelf for frozen treats and ice.',
  },
  top_shelf: {
    id: 'top_shelf',
    label: 'Upper Fresh Food Shelf',
    location: 'cavity',
    verticalCenterPercent: 27,
    heightRange: [20, 35],
    description: 'Tempered glass shelf for eggs, dairy jars, and delicate items.',
  },
  middle_shelf: {
    id: 'middle_shelf',
    label: 'Middle Fresh Food Shelf',
    location: 'cavity',
    verticalCenterPercent: 46,
    heightRange: [38, 54],
    description: 'Primary tempered glass shelf for cartons, bottles, and daily drinks.',
  },
  bottom_shelf: {
    id: 'bottom_shelf',
    label: 'Lower Fresh Food Shelf',
    location: 'cavity',
    verticalCenterPercent: 65,
    heightRange: [57, 72],
    description: 'Sturdy glass shelf above crisper for meal preps, heavy juice carafes.',
  },
  crisper_drawer: {
    id: 'crisper_drawer',
    label: 'Bottom Crisper Humidity Drawer',
    location: 'cavity',
    verticalCenterPercent: 82,
    heightRange: [74, 93],
    description: 'Transparent high-humidity vegetable & citrus fruit drawer.',
  },
  door_bin_top: {
    id: 'door_bin_top',
    label: 'Door Top Dairy Bin',
    location: 'door',
    verticalCenterPercent: 20,
    heightRange: [14, 28],
    description: 'Covered upper acrylic bin for butter, small cheeses, and spreads.',
  },
  door_bin_middle: {
    id: 'door_bin_middle',
    label: 'Door Middle Condiment Bin',
    location: 'door',
    verticalCenterPercent: 44,
    heightRange: [36, 52],
    description: 'Intermediate acrylic door rack for mustard, sauces, and jam jars.',
  },
  door_bin_bottom: {
    id: 'door_bin_bottom',
    label: 'Door Bottom Beverage Gallon Bin',
    location: 'door',
    verticalCenterPercent: 74,
    heightRange: [60, 88],
    description: 'Deep guardrail door rack for champagne, tall bottles, and juices.',
  },
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
}

export const APPROVED_ASSETS: ApprovedAsset[] = [
  {
    id: 'asset-milk-carton',
    name: 'Fresh Whole Milk Carton',
    category: 'Dairy',
    path: '/assets/products/milk-carton.png',
    suggestedShelf: 'middle_shelf',
    defaultQuantity: '1 Litre',
  },
  {
    id: 'asset-egg-carton',
    name: 'Farm Fresh Brown Eggs',
    category: 'Dairy',
    path: '/assets/products/egg-carton.png',
    suggestedShelf: 'top_shelf',
    defaultQuantity: 'Pack of 6',
  },
  {
    id: 'asset-water-bottle',
    name: 'Sparkling Mineral Water',
    category: 'Beverages',
    path: '/assets/products/water-bottle.png',
    suggestedShelf: 'middle_shelf',
    defaultQuantity: '2 Bottles',
  },
  {
    id: 'asset-orange-juice',
    name: 'Pure Squeezed Orange Juice',
    category: 'Beverages',
    path: '/assets/products/orange-juice.png',
    suggestedShelf: 'bottom_shelf',
    defaultQuantity: '1 Carafe',
  },
  {
    id: 'asset-yogurt-jar',
    name: 'Artisanal Greek Yogurt',
    category: 'Dairy',
    path: '/assets/products/yogurt-jar.png',
    suggestedShelf: 'top_shelf',
    defaultQuantity: '500g Jar',
  },
  {
    id: 'asset-condiment-jar',
    name: 'Dijon Mustard & Condiment',
    category: 'Condiments',
    path: '/assets/products/condiment-jar.png',
    suggestedShelf: 'door_bin_middle',
    defaultQuantity: '250g Jar',
  },
  {
    id: 'asset-jam-jar',
    name: 'Artisan Strawberry Conserve',
    category: 'Condiments',
    path: '/assets/products/jam-jar.png',
    suggestedShelf: 'door_bin_middle',
    defaultQuantity: '340g Jar',
  },
  {
    id: 'asset-citrus-basket',
    name: 'Crisper Fresh Citrus Basket',
    category: 'Fruits & Vegetables',
    path: '/assets/products/citrus-basket.png',
    suggestedShelf: 'crisper_drawer',
    defaultQuantity: '1.2 kg',
  },
  {
    id: 'asset-green-lettuce',
    name: 'Hydroponic Salad Greens',
    category: 'Fruits & Vegetables',
    path: '/assets/products/green-lettuce.png',
    suggestedShelf: 'crisper_drawer',
    defaultQuantity: '1 Head',
  },
  {
    id: 'asset-meal-container',
    name: 'Glass Meal Prep Container',
    category: 'Prepared Meals',
    path: '/assets/products/meal-container.png',
    suggestedShelf: 'bottom_shelf',
    defaultQuantity: '1 Container',
  },
  {
    id: 'asset-ice-cream',
    name: 'Artisan Gelato Ice Cream Pint',
    category: 'Freezer',
    path: '/assets/products/ice-cream.png',
    suggestedShelf: 'freezer',
    defaultQuantity: '1 Pint',
  },
  {
    id: 'asset-champagne-bottle',
    name: 'Chilled Sparkling Champagne',
    category: 'Beverages',
    path: '/assets/products/champagne-bottle.png',
    suggestedShelf: 'door_bin_bottom',
    defaultQuantity: '750 ml',
  },
]
