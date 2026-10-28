import type { FridgeProduct, FridgeShelf, ProductCategory } from '../types/fridgeProduct'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const STORAGE_KEY = 'magneto_fridge_interior_products_v3'
export const FRIDGE_PRODUCTS_UPDATED_EVENT = 'magneto_fridge_products_changed'

// Empty initial products array: the refrigerator starts completely empty!
export const DEFAULT_FRIDGE_PRODUCTS: FridgeProduct[] = []

// Optional stock grocery templates available in Admin Panel
export const STOCK_GROCERY_TEMPLATES: FridgeProduct[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'Fresh Whole Milk Carton',
    category: 'Dairy',
    imageUrl: '/assets/products/milk-carton.png',
    model3dUrl: '/assets/products/3d/milk-carton.glb',
    description: 'Organic whole milk, pasteurized & fortified with Vitamin D',
    shelf: 'middle_shelf',
    positionX: 25,
    displayScale: 1.05,
    quantity: '3 Cartons',
    itemCount: 3,
    arrangement: 'row',
    spacing: 22,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 1,
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    name: 'Farm Fresh Brown Eggs',
    category: 'Dairy',
    imageUrl: '/assets/products/egg-carton.png',
    model3dUrl: '/assets/products/3d/egg-carton.glb',
    description: 'Pasture-raised grade A large brown eggs',
    shelf: 'top_shelf',
    positionX: 28,
    displayScale: 0.95,
    quantity: 'Pack of 6',
    itemCount: 1,
    arrangement: 'single',
    spacing: 18,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 2,
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    name: 'Sparkling Mineral Water',
    category: 'Beverages',
    imageUrl: '/assets/products/water-bottle.png',
    model3dUrl: '/assets/products/3d/water-bottle.glb',
    description: 'Naturally effervescent spring water with mineral electrolytes',
    shelf: 'middle_shelf',
    positionX: 74,
    displayScale: 1.0,
    quantity: '2 Bottles',
    itemCount: 2,
    arrangement: 'row',
    spacing: 22,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 3,
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    name: 'Pure Squeezed Orange Juice',
    category: 'Beverages',
    imageUrl: '/assets/products/orange-juice.png',
    model3dUrl: '/assets/products/3d/orange-juice.glb',
    description: '100% pure squeezed Florida orange juice with pulp',
    shelf: 'bottom_shelf',
    positionX: 28,
    displayScale: 1.0,
    quantity: '1 Carafe',
    itemCount: 1,
    arrangement: 'single',
    spacing: 18,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 4,
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    name: 'Artisanal Greek Yogurt',
    category: 'Dairy',
    imageUrl: '/assets/products/yogurt-jar.png',
    model3dUrl: '/assets/products/3d/yogurt-jar.glb',
    description: 'Strained whole milk plain Greek yogurt with probiotics',
    shelf: 'top_shelf',
    positionX: 72,
    displayScale: 0.9,
    quantity: '2 Jars',
    itemCount: 2,
    arrangement: 'row',
    spacing: 20,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 5,
  },
  {
    id: '11111111-1111-1111-1111-111111111106',
    name: 'Dijon Mustard & Condiment',
    category: 'Condiments',
    imageUrl: '/assets/products/condiment-jar.png',
    model3dUrl: '/assets/products/3d/condiment-jar.glb',
    description: 'Authentic French stone-ground Dijon mustard',
    shelf: 'door_bin_middle',
    positionX: 25,
    displayScale: 0.9,
    quantity: '250g Jar',
    itemCount: 1,
    arrangement: 'single',
    spacing: 18,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 6,
  },
  {
    id: '11111111-1111-1111-1111-111111111107',
    name: 'Artisan Strawberry Conserve',
    category: 'Condiments',
    imageUrl: '/assets/products/jam-jar.png',
    model3dUrl: '/assets/products/3d/jam-jar.glb',
    description: 'Slow-cooked handpicked wild strawberry preserves',
    shelf: 'door_bin_middle',
    positionX: 75,
    displayScale: 0.85,
    quantity: '340g Jar',
    itemCount: 1,
    arrangement: 'single',
    spacing: 18,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 7,
  },
  {
    id: '11111111-1111-1111-1111-111111111108',
    name: 'Crisper Fresh Citrus Basket',
    category: 'Fruits & Vegetables',
    imageUrl: '/assets/products/citrus-basket.png',
    model3dUrl: '/assets/products/3d/citrus-basket.glb',
    description: 'Juicy organic lemons, sweet clementines and Valencia oranges',
    shelf: 'crisper_drawer',
    positionX: 32,
    displayScale: 1.1,
    quantity: '1 Basket',
    itemCount: 1,
    arrangement: 'single',
    spacing: 18,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 8,
  },
  {
    id: '11111111-1111-1111-1111-111111111109',
    name: 'Hydroponic Salad Greens',
    category: 'Fruits & Vegetables',
    imageUrl: '/assets/products/green-lettuce.png',
    model3dUrl: '/assets/products/3d/green-lettuce.glb',
    description: 'Crisp romaine and butterhead salad greens',
    shelf: 'crisper_drawer',
    positionX: 72,
    displayScale: 1.05,
    quantity: '1 Head',
    itemCount: 1,
    arrangement: 'single',
    spacing: 18,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 9,
  },
  {
    id: '11111111-1111-1111-1111-111111111110',
    name: 'Glass Meal Prep Container',
    category: 'Prepared Meals',
    imageUrl: '/assets/products/meal-container.png',
    model3dUrl: '/assets/products/3d/meal-container.glb',
    description: 'Grilled chicken, roasted asparagus, and quinoa in airtight borosilicate container',
    shelf: 'bottom_shelf',
    positionX: 72,
    displayScale: 1.0,
    quantity: '2 Containers (Stacked)',
    itemCount: 2,
    arrangement: 'stack',
    spacing: 16,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 10,
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Artisan Gelato Ice Cream Pint',
    category: 'Freezer',
    imageUrl: '/assets/products/ice-cream.png',
    model3dUrl: '/assets/products/3d/ice-cream.glb',
    description: 'Madagascar vanilla bean and salted caramel gelato',
    shelf: 'freezer',
    positionX: 50,
    displayScale: 1.0,
    quantity: '2 Pints',
    itemCount: 2,
    arrangement: 'row',
    spacing: 22,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 11,
  },
  {
    id: '11111111-1111-1111-1111-111111111112',
    name: 'Chilled Sparkling Champagne',
    category: 'Beverages',
    imageUrl: '/assets/products/champagne-bottle.png',
    model3dUrl: '/assets/products/3d/champagne-bottle.glb',
    description: 'Brut vintage reserve champagne chilled for celebrations',
    shelf: 'door_bin_bottom',
    positionX: 50,
    displayScale: 1.15,
    quantity: '750 ml',
    itemCount: 1,
    arrangement: 'single',
    spacing: 18,
    rotation: 0,
    isActive: true,
    isArchived: false,
    displayOrder: 12,
  },
]

// In-memory fallback
const memoryStore = new Map<string, string>()

function getLocalProducts(): FridgeProduct[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Clear legacy keys that pre-seeded items
      window.localStorage.removeItem('magneto_fridge_interior_products_v1')
      window.localStorage.removeItem('magneto_fridge_interior_products_v2')
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw !== null) {
        const parsed = JSON.parse(raw) as FridgeProduct[]
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
    } else {
      const raw = memoryStore.get(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as FridgeProduct[]
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
    }
  } catch (err) {
    console.warn('[FridgeProductService] Error parsing local products:', err)
  }
  return []
}

/**
 * Returns current cached products synchronously for zero-latency initial UI rendering.
 */
export function getLocalCachedProducts(): FridgeProduct[] {
  return getLocalProducts()
}

/**
 * Helper to update a product's shelf and horizontal position during drag-and-drop.
 */
export async function moveProduct(
  id: string,
  newShelf: FridgeShelf,
  newPositionX: number
): Promise<FridgeProduct> {
  return updateProduct(id, { shelf: newShelf, positionX: newPositionX })
}

function saveLocalProducts(products: FridgeProduct[], options?: { broadcast?: boolean }): void {
  try {
    const serialized = JSON.stringify(products)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, serialized)
    }
    memoryStore.set(STORAGE_KEY, serialized)
    // Only broadcast when actual changes happen (not on passive read-sync) to avoid infinite loop
    if (options?.broadcast !== false && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FRIDGE_PRODUCTS_UPDATED_EVENT, { detail: products }))
    }
  } catch (err) {
    console.warn('[FridgeProductService] Error saving local products:', err)
  }
}

// Convert Supabase database row (snake_case) to FridgeProduct model (camelCase)
interface DbFridgeProduct {
  id: string
  name: string
  category: string
  image_url: string
  description?: string | null
  shelf: string
  position_x: number
  display_scale: number
  quantity?: string | null
  is_active: boolean
  is_archived: boolean
  display_order: number
  created_at?: string
  updated_at?: string
  created_by?: string | null
}

function mapRowToProduct(row: DbFridgeProduct): FridgeProduct {
  let itemCount: number = 1
  let arrangement: StackingArrangement = 'single'
  let spacing: number = 18
  let rotation: number | undefined = undefined
  let model3dUrl: string | undefined = undefined
  let cleanDescription = row.description ?? undefined

  if (row.description && row.description.includes('__META__:')) {
    try {
      const parts = row.description.split('__META__:')
      cleanDescription = parts[0].trim() || undefined
      const meta = JSON.parse(parts[1])
      if (meta.itemCount !== undefined) itemCount = Math.max(1, Math.min(12, Number(meta.itemCount)))
      if (meta.arrangement) arrangement = meta.arrangement
      if (meta.spacing !== undefined) spacing = Math.max(10, Math.min(45, Number(meta.spacing)))
      if (meta.rotation !== undefined) rotation = Number(meta.rotation)
      if (meta.model3dUrl) model3dUrl = String(meta.model3dUrl)
    } catch (e) {
      console.warn('[FridgeProductService] Error parsing arrangement metadata:', e)
    }
  } else if (row.quantity) {
    const match = row.quantity.match(/^(\d+)\s*(units?|bottles?|cartons?|cans?|jars?|pints?|containers?|items?|pack)/i)
    if (match) {
      itemCount = Math.min(12, Math.max(1, parseInt(match[1], 10)))
      if (itemCount > 1) arrangement = 'row'
    }
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category as ProductCategory,
    imageUrl: row.image_url,
    description: cleanDescription,
    shelf: row.shelf as FridgeShelf,
    positionX: Number(row.position_x),
    displayScale: Number(row.display_scale),
    quantity: row.quantity ?? undefined,
    itemCount,
    arrangement,
    spacing,
    rotation,
    model3dUrl,
    isActive: Boolean(row.is_active),
    isArchived: Boolean(row.is_archived),
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? undefined,
  }
}

import type { Database } from '../types/database'
import type { StackingArrangement } from '../types/fridgeProduct'

type DbFridgeProductInsert = Database['public']['Tables']['fridge_products']['Insert']
type DbFridgeProductUpdate = Database['public']['Tables']['fridge_products']['Update']

function mapProductToRow(product: Partial<FridgeProduct>): DbFridgeProductUpdate {
  const row: DbFridgeProductUpdate = {}
  if (product.name !== undefined) row.name = product.name
  if (product.category !== undefined) row.category = product.category
  if (product.imageUrl !== undefined) row.image_url = product.imageUrl

  // Attach metadata cleanly into description column for Supabase persistence
  let descToSave = product.description ?? ''
  const hasMeta =
    (product.itemCount !== undefined && product.itemCount > 1) ||
    (product.arrangement !== undefined && product.arrangement !== 'single') ||
    product.spacing !== undefined ||
    product.rotation !== undefined ||
    product.model3dUrl !== undefined

  if (hasMeta) {
    const metaJson = JSON.stringify({
      itemCount: product.itemCount ?? 1,
      arrangement: product.arrangement ?? 'single',
      spacing: product.spacing ?? 18,
      rotation: product.rotation,
      model3dUrl: product.model3dUrl,
    })
    descToSave = `${descToSave ? descToSave + ' ' : ''}__META__:${metaJson}`
  }

  if (product.description !== undefined || hasMeta) {
    row.description = descToSave.trim() || null
  }

  if (product.shelf !== undefined) row.shelf = product.shelf
  if (product.positionX !== undefined) row.position_x = product.positionX
  if (product.displayScale !== undefined) row.display_scale = product.displayScale
  if (product.quantity !== undefined) row.quantity = product.quantity
  if (product.isActive !== undefined) row.is_active = product.isActive
  if (product.isArchived !== undefined) row.is_archived = product.isArchived
  if (product.displayOrder !== undefined) row.display_order = product.displayOrder
  return row
}

/**
 * Returns all active, non-archived products to render inside the public refrigerator.
 */
export async function getPublicActiveProducts(): Promise<FridgeProduct[]> {
  if (isSupabaseConfigured) {
    try {
      const queryPromise = supabase
        .from('fridge_products')
        .select('*')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('display_order', { ascending: true })

      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase query timed out')), 3500)
      )

      const result = (await Promise.race([queryPromise, timeoutPromise])) as {
        data: DbFridgeProduct[] | null
        error: { message?: string } | null
      }
      const { data, error } = result

      if (!error && data) {
        const mapped = data.map((d) => mapRowToProduct(d as unknown as DbFridgeProduct))
        const localActive = getLocalProducts().filter((p) => p.isActive && !p.isArchived)
        const localOnly = localActive.filter((loc) => !mapped.some((rem) => rem.id === loc.id))
        const merged = [...mapped, ...localOnly]
        saveLocalProducts(merged, { broadcast: false })
        return merged
      }
    } catch (err) {
      console.warn('[FridgeProductService] Remote fetch fallback to local inventory:', err)
    }
  }

  // Fallback to local cache filtered by active & non-archived
  return getLocalProducts().filter((p) => p.isActive && !p.isArchived)
}

/**
 * Returns all products (including inactive and archived) for the Admin Dashboard.
 */
export async function getAllAdminProducts(): Promise<FridgeProduct[]> {
  if (isSupabaseConfigured) {
    try {
      const queryPromise = supabase
        .from('fridge_products')
        .select('*')
        .order('display_order', { ascending: true })

      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase query timed out')), 3500)
      )

      const result = (await Promise.race([queryPromise, timeoutPromise])) as {
        data: DbFridgeProduct[] | null
        error: { message?: string } | null
      }
      const { data, error } = result

      if (!error && data) {
        const mapped = data.map((d) => mapRowToProduct(d as unknown as DbFridgeProduct))
        const local = getLocalProducts()
        const localOnly = local.filter((loc) => !mapped.some((rem) => rem.id === loc.id))
        const merged = [...mapped, ...localOnly]
        saveLocalProducts(merged, { broadcast: false })
        return merged
      }
    } catch (err) {
      console.warn('[FridgeProductService] Remote fetch fallback to local inventory:', err)
    }
  }

  return getLocalProducts()
}

/**
 * Generates an RFC4122 v4 compliant UUID string.
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // fallback below
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Creates a new product in the refrigerator inventory.
 */
export async function createProduct(
  input: Omit<FridgeProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FridgeProduct> {
  const newId = generateUUID()
  const now = new Date().toISOString()

  const newProduct: FridgeProduct = {
    ...input,
    id: newId,
    createdAt: now,
    updatedAt: now,
  }

  if (isSupabaseConfigured) {
    try {
      const rowUpdates = mapProductToRow(newProduct)
      const rowData: DbFridgeProductInsert = {
        ...rowUpdates,
        id: newId,
        name: newProduct.name,
        category: newProduct.category,
        image_url: newProduct.imageUrl,
        shelf: newProduct.shelf,
        position_x: newProduct.positionX,
        display_scale: newProduct.displayScale,
        is_active: newProduct.isActive,
        is_archived: newProduct.isArchived,
        display_order: newProduct.displayOrder,
      }
      const { data, error } = await supabase
        .from('fridge_products')
        .insert(rowData)
        .select()

      if (!error && data && data.length > 0) {
        const created = mapRowToProduct(data[0] as unknown as DbFridgeProduct)
        const current = getLocalProducts().filter((p) => p.id !== created.id)
        saveLocalProducts([...current, created])
        return created
      } else if (error) {
        console.warn(
          '[FridgeProductService] Remote insert note:',
          error.message,
          '- Product safely saved to local inventory and live fridge.'
        )
      }
    } catch (err: unknown) {
      console.warn(
        '[FridgeProductService] Remote insert exception:',
        err,
        '- Product safely saved to local inventory and live fridge.'
      )
    }
  }

  // Local fallback
  const list = getLocalProducts().filter((p) => p.id !== newId)
  const updated = [...list, newProduct]
  saveLocalProducts(updated)
  return newProduct
}

/**
 * Updates an existing refrigerator product.
 */
export async function updateProduct(
  id: string,
  updates: Partial<Omit<FridgeProduct, 'id' | 'createdAt'>>
): Promise<FridgeProduct> {
  const currentList = getLocalProducts()
  const existing = currentList.find((p) => p.id === id)
  if (!existing) {
    throw new Error(`Product with ID "${id}" was not found.`)
  }

  const updatedProduct: FridgeProduct = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  }

  if (isSupabaseConfigured) {
    try {
      const rowUpdates = mapProductToRow(updatedProduct)
      const fullRow: DbFridgeProductInsert = {
        ...rowUpdates,
        id,
        name: updatedProduct.name,
        category: updatedProduct.category,
        image_url: updatedProduct.imageUrl,
        shelf: updatedProduct.shelf,
        position_x: updatedProduct.positionX,
        display_scale: updatedProduct.displayScale,
        is_active: updatedProduct.isActive,
        is_archived: updatedProduct.isArchived,
        display_order: updatedProduct.displayOrder,
      }
      const { data, error } = await supabase
        .from('fridge_products')
        .upsert(fullRow)
        .select()

      if (!error && data && data.length > 0) {
        const mapped = mapRowToProduct(data[0] as unknown as DbFridgeProduct)
        const newLocal = currentList.map((p) => (p.id === id ? mapped : p))
        saveLocalProducts(newLocal)
        return mapped
      } else if (error) {
        console.warn(
          '[FridgeProductService] Remote update note:',
          error.message,
          '- Product safely updated in local inventory and live fridge.'
        )
      }
    } catch (err: unknown) {
      console.warn(
        '[FridgeProductService] Remote update exception:',
        err,
        '- Product safely updated in local inventory and live fridge.'
      )
    }
  }

  const newLocal = currentList.map((p) => (p.id === id ? updatedProduct : p))
  saveLocalProducts(newLocal)
  return updatedProduct
}

/**
 * Toggles product active/inactive visibility.
 */
export async function toggleProductActive(id: string, isActive: boolean): Promise<FridgeProduct> {
  return updateProduct(id, { isActive })
}

/**
 * Archives a product (soft delete so references remain intact).
 */
export async function archiveProduct(id: string): Promise<FridgeProduct> {
  return updateProduct(id, { isArchived: true, isActive: false })
}

/**
 * Restores an archived product.
 */
export async function unarchiveProduct(id: string): Promise<FridgeProduct> {
  return updateProduct(id, { isArchived: false, isActive: true })
}

/**
 * Permanently deletes a product from the database.
 */
export async function deleteProductPermanent(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('fridge_products').delete().eq('id', id)
      if (error) {
        console.warn('[FridgeProductService] Remote delete note:', error.message)
      }
    } catch (err: unknown) {
      console.warn('[FridgeProductService] Remote delete exception:', err)
    }
  }

  const current = getLocalProducts()
  const filtered = current.filter((p) => p.id !== id)
  saveLocalProducts(filtered)
  return true
}

/**
 * Uploads a product image or reads as data URL.
 * Validates file size (max 5MB) and mime type (images only).
 */
export async function uploadProductImage(file: File): Promise<string> {
  // 1. Validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please upload PNG, JPG, WebP, or SVG.')
  }
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    throw new Error('Image file exceeds the 5MB size limit.')
  }

  // 2. Try Supabase Storage if configured
  if (isSupabaseConfigured) {
    try {
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `inventory/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fridge-products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('fridge-products')
          .getPublicUrl(filePath)

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl
        }
      }
    } catch (storageErr) {
      console.warn('[FridgeProductService] Supabase storage upload failed, falling back to data URL:', storageErr)
    }
  }

  // 3. Fallback: Base64 Data URL (instant, resilient, offline-safe)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed reading file data.'))
      }
    }
    reader.onerror = () => reject(new Error('File reading error.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Clears all products so the refrigerator interior is 100% completely empty.
 */
export async function clearAllProducts(): Promise<FridgeProduct[]> {
  if (isSupabaseConfigured) {
    try {
      await supabase.from('fridge_products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    } catch (err) {
      console.warn('[FridgeProductService] Remote clear note:', err)
    }
  }
  saveLocalProducts([])
  return []
}

/**
 * Restores catalogue to default state (completely empty).
 */
export async function resetToDefaultProducts(): Promise<FridgeProduct[]> {
  return clearAllProducts()
}

/**
 * Optional admin helper: populates all 12 stock grocery templates.
 */
export async function populateStockTemplates(): Promise<FridgeProduct[]> {
  if (isSupabaseConfigured) {
    try {
      const rows = STOCK_GROCERY_TEMPLATES.map((item) => {
        const rowUpdates = mapProductToRow(item)
        return {
          ...rowUpdates,
          id: item.id,
          name: item.name,
          category: item.category,
          image_url: item.imageUrl,
          shelf: item.shelf,
          position_x: item.positionX,
          display_scale: item.displayScale,
          is_active: item.isActive,
          is_archived: item.isArchived,
          display_order: item.displayOrder,
        }
      })
      await supabase.from('fridge_products').upsert(rows)
    } catch (err) {
      console.warn('[FridgeProductService] Remote populate templates note:', err)
    }
  }
  saveLocalProducts([...STOCK_GROCERY_TEMPLATES])
  return [...STOCK_GROCERY_TEMPLATES]
}
