import { areSlugsEquivalent } from './fridgeService'

export interface BudgetItem {
  id: string
  name: string
  amount: number
  category?: 'flight' | 'stay' | 'food' | 'transport' | 'activity' | 'other'
}

export const DEFAULT_BUDGET_BREAKDOWNS: Record<string, BudgetItem[]> = {
  santorini: [
    { id: 'b-flight', name: 'Flights', amount: 60000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (7 nights)', amount: 80000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 40000, category: 'food' },
    { id: 'b-transport', name: 'Local Transport', amount: 20000, category: 'transport' },
    { id: 'b-activity', name: 'Activities & Tours', amount: 30000, category: 'activity' },
    { id: 'b-other', name: 'Other (Visa, Insurance etc.)', amount: 20000, category: 'other' },
  ],
  bali: [
    { id: 'b-flight', name: 'Flights', amount: 32000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (7 nights)', amount: 40000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 20000, category: 'food' },
    { id: 'b-transport', name: 'Local Transport', amount: 10000, category: 'transport' },
    { id: 'b-activity', name: 'Activities & Tours', amount: 12000, category: 'activity' },
    { id: 'b-other', name: 'Other (Visa, Insurance etc.)', amount: 6000, category: 'other' },
  ],
  paris: [
    { id: 'b-flight', name: 'Flights', amount: 50000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (7 nights)', amount: 80000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 40000, category: 'food' },
    { id: 'b-transport', name: 'Local Transport', amount: 18000, category: 'transport' },
    { id: 'b-activity', name: 'Activities & Tours', amount: 20000, category: 'activity' },
    { id: 'b-other', name: 'Other (Visa, Insurance etc.)', amount: 12000, category: 'other' },
  ],
  'new-york': [
    { id: 'b-flight', name: 'Flights', amount: 70000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (7 nights)', amount: 110000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 45000, category: 'food' },
    { id: 'b-transport', name: 'Local Transport', amount: 20000, category: 'transport' },
    { id: 'b-activity', name: 'Activities & Tours', amount: 25000, category: 'activity' },
    { id: 'b-other', name: 'Other (Visa, Insurance etc.)', amount: 10000, category: 'other' },
  ],
  tokyo: [
    { id: 'b-flight', name: 'Flights', amount: 55000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (7 nights)', amount: 65000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 35000, category: 'food' },
    { id: 'b-transport', name: 'Local Transport', amount: 25000, category: 'transport' },
    { id: 'b-activity', name: 'Activities & Tours', amount: 12000, category: 'activity' },
    { id: 'b-other', name: 'Other (Visa, Insurance etc.)', amount: 8000, category: 'other' },
  ],
  japan: [
    { id: 'b-flight', name: 'Flights', amount: 55000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (7 nights)', amount: 65000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 35000, category: 'food' },
    { id: 'b-transport', name: 'Local Transport', amount: 25000, category: 'transport' },
    { id: 'b-activity', name: 'Activities & Tours', amount: 12000, category: 'activity' },
    { id: 'b-other', name: 'Other (Visa, Insurance etc.)', amount: 8000, category: 'other' },
  ],
  rome: [
    { id: 'b-flight', name: 'Flights', amount: 45000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (7 nights)', amount: 55000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 30000, category: 'food' },
    { id: 'b-transport', name: 'Local Transport', amount: 15000, category: 'transport' },
    { id: 'b-activity', name: 'Activities & Tours', amount: 20000, category: 'activity' },
    { id: 'b-other', name: 'Other (Visa, Insurance etc.)', amount: 15000, category: 'other' },
  ],
  goa: [
    { id: 'b-flight', name: 'Flights / Train', amount: 10000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (5 nights)', amount: 15000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 7000, category: 'food' },
    { id: 'b-transport', name: 'Local Bike / Cab', amount: 3000, category: 'transport' },
    { id: 'b-activity', name: 'Water Sports & Shacks', amount: 3000, category: 'activity' },
    { id: 'b-other', name: 'Shopping & Miscellaneous', amount: 2000, category: 'other' },
  ],
  'goa-beach': [
    { id: 'b-flight', name: 'Flights / Train', amount: 10000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (5 nights)', amount: 15000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 7000, category: 'food' },
    { id: 'b-transport', name: 'Local Bike / Cab', amount: 3000, category: 'transport' },
    { id: 'b-activity', name: 'Water Sports & Shacks', amount: 3000, category: 'activity' },
    { id: 'b-other', name: 'Shopping & Miscellaneous', amount: 2000, category: 'other' },
  ],
  ladakh: [
    { id: 'b-flight', name: 'Flights', amount: 15000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (6 nights)', amount: 20000, category: 'stay' },
    { id: 'b-food', name: 'Food & Drinks', amount: 10000, category: 'food' },
    { id: 'b-transport', name: 'SUV / Bike Rental', amount: 8000, category: 'transport' },
    { id: 'b-activity', name: 'Permits & Monasteries', amount: 4000, category: 'activity' },
    { id: 'b-other', name: 'Warm Gear & Oxygen', amount: 3000, category: 'other' },
  ],
  'india-gate': [
    { id: 'b-flight', name: 'Flights / Train', amount: 8000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (3 nights)', amount: 8000, category: 'stay' },
    { id: 'b-food', name: 'Delhi Street Food & Dining', amount: 4000, category: 'food' },
    { id: 'b-transport', name: 'Metro & Cabs', amount: 2500, category: 'transport' },
    { id: 'b-activity', name: 'Museums & Monuments', amount: 1500, category: 'activity' },
    { id: 'b-other', name: 'Shopping & Souvenirs', amount: 1000, category: 'other' },
  ],
  'taj-mahal': [
    { id: 'b-flight', name: 'Express Train / Cabs', amount: 10000, category: 'flight' },
    { id: 'b-stay', name: 'Heritage Stay (3 nights)', amount: 10000, category: 'stay' },
    { id: 'b-food', name: 'Mughlai Dining & Sweets', amount: 5000, category: 'food' },
    { id: 'b-transport', name: 'Local Transport', amount: 2500, category: 'transport' },
    { id: 'b-activity', name: 'Monument Entry & Guide', amount: 1500, category: 'activity' },
    { id: 'b-other', name: 'Marble Souvenirs', amount: 1000, category: 'other' },
  ],
  'royal-elephant': [
    { id: 'b-flight', name: 'Travel & Transport', amount: 10000, category: 'flight' },
    { id: 'b-stay', name: 'Haveli Stay (4 nights)', amount: 12000, category: 'stay' },
    { id: 'b-food', name: 'Rajasthani Thali & Dining', amount: 5000, category: 'food' },
    { id: 'b-transport', name: 'Local Auto / Cabs', amount: 3000, category: 'transport' },
    { id: 'b-activity', name: 'Amber Fort & Palaces', amount: 3000, category: 'activity' },
    { id: 'b-other', name: 'Handicrafts & Gems', amount: 2000, category: 'other' },
  ],
  kerala: [
    { id: 'b-flight', name: 'Flights', amount: 12000, category: 'flight' },
    { id: 'b-stay', name: 'Houseboat & Resort', amount: 16000, category: 'stay' },
    { id: 'b-food', name: 'Coastal Cuisine', amount: 6000, category: 'food' },
    { id: 'b-transport', name: 'Cabs & Ferry', amount: 4000, category: 'transport' },
    { id: 'b-activity', name: 'Ayurveda & Backwaters', amount: 4000, category: 'activity' },
    { id: 'b-other', name: 'Spices & Tea', amount: 2000, category: 'other' },
  ],
  'kerala-boat': [
    { id: 'b-flight', name: 'Flights', amount: 12000, category: 'flight' },
    { id: 'b-stay', name: 'Houseboat & Resort', amount: 16000, category: 'stay' },
    { id: 'b-food', name: 'Coastal Cuisine', amount: 6000, category: 'food' },
    { id: 'b-transport', name: 'Cabs & Ferry', amount: 4000, category: 'transport' },
    { id: 'b-activity', name: 'Ayurveda & Backwaters', amount: 4000, category: 'activity' },
    { id: 'b-other', name: 'Spices & Tea', amount: 2000, category: 'other' },
  ],
  amritsar: [
    { id: 'b-flight', name: 'Travel & Train', amount: 6000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (3 nights)', amount: 6000, category: 'stay' },
    { id: 'b-food', name: 'Punjabi Food & Lassi', amount: 3000, category: 'food' },
    { id: 'b-transport', name: 'Local Cabs', amount: 2000, category: 'transport' },
    { id: 'b-activity', name: 'Golden Temple & Wagah', amount: 1500, category: 'activity' },
    { id: 'b-other', name: 'Phulkari & Souvenirs', amount: 1500, category: 'other' },
  ],
  'golden-temple': [
    { id: 'b-flight', name: 'Travel & Train', amount: 6000, category: 'flight' },
    { id: 'b-stay', name: 'Stay (3 nights)', amount: 6000, category: 'stay' },
    { id: 'b-food', name: 'Punjabi Food & Lassi', amount: 3000, category: 'food' },
    { id: 'b-transport', name: 'Local Cabs', amount: 2000, category: 'transport' },
    { id: 'b-activity', name: 'Golden Temple & Wagah', amount: 1500, category: 'activity' },
    { id: 'b-other', name: 'Phulkari & Souvenirs', amount: 1500, category: 'other' },
  ],
}

const STORAGE_KEY = 'magneto_budget_plans'
const memoryStorage = new Map<string, string>()

const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key)
      } catch {
        // Fallback to memory
      }
    }
    return memoryStorage.get(key) || null
  },
  setItem(key: string, val: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, val)
        return
      } catch {
        // Fallback to memory
      }
    }
    memoryStorage.set(key, val)
  },
  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key)
        return
      } catch {
        // Fallback to memory
      }
    }
    memoryStorage.delete(key)
  },
  clear(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.clear()
        return
      } catch {
        // Fallback to memory
      }
    }
    memoryStorage.clear()
  },
}

export const budgetService = {
  safeStorage,

  /**
   * Safe localStorage accessor with fallback for SSR or restricted environments
   */
  getStorageRecords(): Record<string, BudgetItem[]> {
    try {
      const raw = safeStorage.getItem(STORAGE_KEY)
      if (!raw) return {}
      return JSON.parse(raw) as Record<string, BudgetItem[]>
    } catch (e) {
      console.warn('Failed to parse budget plans from safeStorage', e)
      return {}
    }
  },

  /**
   * Retrieve budget items for a destination slug.
   * If user has customized items, returns them; otherwise returns defaults.
   */
  getBudgetItems(destinationSlug: string, fallbackTargetMinor?: number): BudgetItem[] {
    const records = this.getStorageRecords()
    const cleanSlug = (destinationSlug || '').toLowerCase()

    // 1. Check custom user-edited budget by matching slug
    for (const key of Object.keys(records)) {
      if (areSlugsEquivalent(key, cleanSlug)) {
        if (Array.isArray(records[key]) && records[key].length > 0) {
          return records[key].map((item, idx) => ({
            id: item.id || `b-${idx}-${Date.now()}`,
            name: item.name || 'Expense Item',
            amount: Number(item.amount) >= 0 ? Number(item.amount) : 0,
            category: item.category || 'other',
          }))
        }
      }
    }

    // 2. Check predefined defaults by matching slug
    for (const key of Object.keys(DEFAULT_BUDGET_BREAKDOWNS)) {
      if (areSlugsEquivalent(key, cleanSlug)) {
        return JSON.parse(JSON.stringify(DEFAULT_BUDGET_BREAKDOWNS[key]))
      }
    }

    // 3. Generate proportional defaults from fallbackTargetMinor or 200,000 INR
    const targetInr = fallbackTargetMinor && fallbackTargetMinor > 0 ? Math.round(fallbackTargetMinor / 100) : 200000
    return [
      { id: 'b-flight', name: 'Flights / Travel', amount: Math.round(targetInr * 0.3), category: 'flight' },
      { id: 'b-stay', name: 'Stay & Accommodation', amount: Math.round(targetInr * 0.35), category: 'stay' },
      { id: 'b-food', name: 'Food & Dining', amount: Math.round(targetInr * 0.15), category: 'food' },
      { id: 'b-transport', name: 'Local Transport', amount: Math.round(targetInr * 0.08), category: 'transport' },
      { id: 'b-activity', name: 'Activities & Tours', amount: Math.round(targetInr * 0.08), category: 'activity' },
      { id: 'b-other', name: 'Other (Visa, Insurance etc.)', amount: Math.round(targetInr * 0.04), category: 'other' },
    ]
  },

  /**
   * Save customized budget items for a destination slug.
   */
  saveBudgetItems(destinationSlug: string, items: BudgetItem[]): void {
    const cleanSlug = (destinationSlug || '').toLowerCase()
    const records = this.getStorageRecords()

    // Find and update matching key
    let targetKey = cleanSlug
    for (const key of Object.keys(records)) {
      if (areSlugsEquivalent(key, cleanSlug)) {
        targetKey = key
        break
      }
    }

    records[targetKey] = items

    try {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(records))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('magneto_sync', {
            detail: {
              source: 'budgetService',
              slug: cleanSlug,
              items,
            },
          })
        )
      }
    } catch (e) {
      console.warn('Failed to save budget items to safeStorage', e)
    }
  },

  /**
   * Reset budget items for a destination slug to default values.
   */
  resetBudgetItems(destinationSlug: string, fallbackTargetMinor?: number): BudgetItem[] {
    const cleanSlug = (destinationSlug || '').toLowerCase()
    const records = this.getStorageRecords()

    for (const key of Object.keys(records)) {
      if (areSlugsEquivalent(key, cleanSlug)) {
        delete records[key]
      }
    }

    try {
      safeStorage.setItem(STORAGE_KEY, JSON.stringify(records))
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('magneto_sync', {
            detail: {
              source: 'budgetService',
              slug: cleanSlug,
            },
          })
        )
      }
    } catch (e) {
      console.warn('Failed to reset budget items in safeStorage', e)
    }

    return this.getBudgetItems(cleanSlug, fallbackTargetMinor)
  },

  /**
   * Sum up total estimated cost of all budget items.
   */
  calculateTotalCost(items: BudgetItem[]): number {
    if (!Array.isArray(items)) return 0
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  },
}
