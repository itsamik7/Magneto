import type { FridgeProduct, FridgeShelf, ProductCategory } from '../types/fridgeProduct'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const STORAGE_KEY = 'magneto_fridge_interior_products_v1'
export const FRIDGE_PRODUCTS_UPDATED_EVENT = 'magneto_fridge_products_changed'

// Default stock products matching database seed migration
export const DEFAULT_FRIDGE_PRODUCTS: FridgeProduct[] = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'Fresh Whole Milk Carton',
    category: 'Dairy',
    imageUrl: '/assets/products/milk-carton.svg',
    description: 'Organic whole milk, pasteurized & fortified with Vitamin D',
    shelf: 'middle_shelf',
    positionX: 22,
    displayScale: 1.05,
    quantity: '1 Litre',
    isActive: true,
    isArchived: false,
    displayOrder: 1,
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    name: 'Farm Fresh Brown Eggs',
    category: 'Dairy',
    imageUrl: '/assets/products/egg-carton.svg',
    description: 'Pasture-raised grade A large brown eggs',
    shelf: 'top_shelf',
    positionX: 26,
    displayScale: 0.95,
    quantity: 'Pack of 6',
    isActive: true,
    isArchived: false,
    displayOrder: 2,
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    name: 'Sparkling Mineral Water',
    category: 'Beverages',
    imageUrl: '/assets/products/water-bottle.svg',
    description: 'Naturally effervescent spring water with mineral electrolytes',
    shelf: 'middle_shelf',
    positionX: 75,
    displayScale: 1.0,
    quantity: '2 Bottles',
    isActive: true,
    isArchived: false,
    displayOrder: 3,
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    name: 'Pure Squeezed Orange Juice',
    category: 'Beverages',
    imageUrl: '/assets/products/orange-juice.svg',
    description: '100% pure squeezed Florida orange juice with pulp',
    shelf: 'bottom_shelf',
    positionX: 28,
    displayScale: 1.0,
    quantity: '1 Carafe',
    isActive: true,
    isArchived: false,
    displayOrder: 4,
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    name: 'Artisanal Greek Yogurt',
    category: 'Dairy',
    imageUrl: '/assets/products/yogurt-jar.svg',
    description: 'Strained whole milk plain Greek yogurt with probiotics',
    shelf: 'top_shelf',
    positionX: 70,
    displayScale: 0.9,
    quantity: '500g Jar',
    isActive: true,
    isArchived: false,
    displayOrder: 5,
  },
  {
    id: '11111111-1111-1111-1111-111111111106',
    name: 'Dijon Mustard & Condiment',
    category: 'Condiments',
    imageUrl: '/assets/products/condiment-jar.svg',
    description: 'Authentic French stone-ground Dijon mustard',
    shelf: 'door_bin_middle',
    positionX: 25,
    displayScale: 0.9,
    quantity: '250g Jar',
    isActive: true,
    isArchived: false,
    displayOrder: 6,
  },
  {
    id: '11111111-1111-1111-1111-111111111107',
    name: 'Artisan Strawberry Conserve',
    category: 'Condiments',
    imageUrl: '/assets/products/jam-jar.svg',
    description: 'Slow-cooked handpicked wild strawberry preserves',
    shelf: 'door_bin_middle',
    positionX: 75,
    displayScale: 0.85,
    quantity: '340g Jar',
    isActive: true,
    isArchived: false,
    displayOrder: 7,
  },
  {
    id: '11111111-1111-1111-1111-111111111108',
    name: 'Crisper Fresh Citrus Basket',
    category: 'Fruits & Vegetables',
    imageUrl: '/assets/products/citrus-basket.svg',
    description: 'Juicy organic lemons, sweet clementines and Valencia oranges',
    shelf: 'crisper_drawer',
    positionX: 30,
    displayScale: 1.1,
    quantity: '1.2 kg',
    isActive: true,
    isArchived: false,
    displayOrder: 8,
  },
  {
    id: '11111111-1111-1111-1111-111111111109',
    name: 'Hydroponic Salad Greens',
    category: 'Fruits & Vegetables',
    imageUrl: '/assets/products/green-lettuce.svg',
    description: 'Crisp romaine and butterhead salad greens',
    shelf: 'crisper_drawer',
    positionX: 72,
    displayScale: 1.05,
    quantity: '1 Head',
    isActive: true,
    isArchived: false,
    displayOrder: 9,
  },
  {
    id: '11111111-1111-1111-1111-111111111110',
    name: 'Glass Meal Prep Container',
    category: 'Prepared Meals',
    imageUrl: '/assets/products/meal-container.svg',
    description: 'Grilled chicken, roasted asparagus, and quinoa in airtight borosilicate container',
    shelf: 'bottom_shelf',
    positionX: 72,
    displayScale: 1.0,
    quantity: '1 Container',
    isActive: true,
    isArchived: false,
    displayOrder: 10,
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Artisan Gelato Ice Cream Pint',
    category: 'Freezer',
    imageUrl: '/assets/products/ice-cream.svg',
    description: 'Madagascar vanilla bean and salted caramel gelato',
    shelf: 'freezer',
    positionX: 50,
    displayScale: 1.0,
    quantity: '1 Pint',
    isActive: true,
    isArchived: false,
    displayOrder: 11,
  },
  {
    id: '11111111-1111-1111-1111-111111111112',
    name: 'Chilled Sparkling Champagne',
    category: 'Beverages',
    imageUrl: '/assets/products/champagne-bottle.svg',
    description: 'Brut vintage reserve champagne chilled for celebrations',
    shelf: 'door_bin_bottom',
    positionX: 50,
    displayScale: 1.15,
    quantity: '750 ml',
    isActive: true,
    isArchived: false,
    displayOrder: 12,
  },
]

// In-memory fallback
const memoryStore = new Map<string, string>()

function getLocalProducts(): FridgeProduct[] {
  try {
    const raw = typeof window !== 'undefined' && window.localStorage
      ? window.localStorage.getItem(STORAGE_KEY)
      : memoryStore.get(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FridgeProduct[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('[FridgeProductService] Error parsing local products:', err)
  }
  return [...DEFAULT_FRIDGE_PRODUCTS]
}

function saveLocalProducts(products: FridgeProduct[]): void {
  try {
    const serialized = JSON.stringify(products)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, serialized)
    }
    memoryStore.set(STORAGE_KEY, serialized)
    if (typeof window !== 'undefined') {
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
  return {
    id: row.id,
    name: row.name,
    category: row.category as ProductCategory,
    imageUrl: row.image_url,
    description: row.description ?? undefined,
    shelf: row.shelf as FridgeShelf,
    positionX: Number(row.position_x),
    displayScale: Number(row.display_scale),
    quantity: row.quantity ?? undefined,
    isActive: Boolean(row.is_active),
    isArchived: Boolean(row.is_archived),
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? undefined,
  }
}

import type { Database } from '../types/database'

type DbFridgeProductInsert = Database['public']['Tables']['fridge_products']['Insert']
type DbFridgeProductUpdate = Database['public']['Tables']['fridge_products']['Update']

function mapProductToRow(product: Partial<FridgeProduct>): DbFridgeProductUpdate {
  const row: DbFridgeProductUpdate = {}
  if (product.name !== undefined) row.name = product.name
  if (product.category !== undefined) row.category = product.category
  if (product.imageUrl !== undefined) row.image_url = product.imageUrl
  if (product.description !== undefined) row.description = product.description
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
      const { data, error } = await supabase
        .from('fridge_products')
        .select('*')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('display_order', { ascending: true })

      if (!error && data && data.length > 0) {
        const mapped = data.map((d) => mapRowToProduct(d as unknown as DbFridgeProduct))
        saveLocalProducts(mapped)
        return mapped
      }
    } catch (err) {
      console.warn('[FridgeProductService] Failed fetching public products from Supabase, using local:', err)
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
      const { data, error } = await supabase
        .from('fridge_products')
        .select('*')
        .order('display_order', { ascending: true })

      if (!error && data && data.length > 0) {
        const mapped = data.map((d) => mapRowToProduct(d as unknown as DbFridgeProduct))
        saveLocalProducts(mapped)
        return mapped
      }
    } catch (err) {
      console.warn('[FridgeProductService] Failed fetching admin products from Supabase, using local:', err)
    }
  }

  return getLocalProducts()
}

/**
 * Creates a new product in the refrigerator inventory.
 */
export async function createProduct(
  input: Omit<FridgeProduct, 'id' | 'createdAt' | 'updatedAt'>
): Promise<FridgeProduct> {
  const newId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`

  const newProduct: FridgeProduct = {
    ...input,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  if (isSupabaseConfigured) {
    try {
      const rowData: DbFridgeProductInsert = {
        id: newId,
        name: newProduct.name,
        category: newProduct.category,
        image_url: newProduct.imageUrl,
        description: newProduct.description ?? null,
        shelf: newProduct.shelf,
        position_x: newProduct.positionX,
        display_scale: newProduct.displayScale,
        quantity: newProduct.quantity ?? null,
        is_active: newProduct.isActive,
        is_archived: newProduct.isArchived,
        display_order: newProduct.displayOrder,
      }
      const { data, error } = await supabase
        .from('fridge_products')
        .insert(rowData)
        .select()
        .single()

      if (!error && data) {
        const created = mapRowToProduct(data as unknown as DbFridgeProduct)
        const current = getLocalProducts().filter((p) => p.id !== created.id)
        saveLocalProducts([...current, created])
        return created
      } else if (error) {
        const isMissingTable =
          error.message?.includes('schema cache') ||
          error.message?.includes('does not exist') ||
          error.code === '42P01' ||
          error.code === 'PGRST205'
        if (isMissingTable) {
          console.warn(
            '[FridgeProductService] Table public.fridge_products not yet created in Supabase. Falling back to local persistence.'
          )
        } else {
          throw new Error(error.message)
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      if (
        errMsg.includes('schema cache') ||
        errMsg.includes('does not exist')
      ) {
        console.warn(
          '[FridgeProductService] Remote table missing. Falling back to local persistence.'
        )
      } else {
        throw err
      }
    }
  }

  // Local fallback
  const list = getLocalProducts()
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
      const rowUpdates = mapProductToRow(updates)
      const { data, error } = await supabase
        .from('fridge_products')
        .update(rowUpdates)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        const mapped = mapRowToProduct(data as unknown as DbFridgeProduct)
        const newLocal = currentList.map((p) => (p.id === id ? mapped : p))
        saveLocalProducts(newLocal)
        return mapped
      } else if (error) {
        const isMissingTable =
          error.message?.includes('schema cache') ||
          error.message?.includes('does not exist') ||
          error.code === '42P01' ||
          error.code === 'PGRST205'
        if (isMissingTable) {
          console.warn(
            '[FridgeProductService] Table public.fridge_products not yet created in Supabase. Falling back to local persistence.'
          )
        } else {
          throw new Error(error.message)
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      if (
        errMsg.includes('schema cache') ||
        errMsg.includes('does not exist')
      ) {
        console.warn(
          '[FridgeProductService] Remote table missing. Falling back to local persistence.'
        )
      } else {
        throw err
      }
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
        const isMissingTable =
          error.message?.includes('schema cache') ||
          error.message?.includes('does not exist') ||
          error.code === '42P01' ||
          error.code === 'PGRST205'
        if (!isMissingTable) {
          throw new Error(error.message)
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      if (
        !errMsg.includes('schema cache') &&
        !errMsg.includes('does not exist')
      ) {
        throw err
      }
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
 * Restores catalogue to stock default products.
 */
export async function resetToDefaultProducts(): Promise<FridgeProduct[]> {
  saveLocalProducts([...DEFAULT_FRIDGE_PRODUCTS])
  return [...DEFAULT_FRIDGE_PRODUCTS]
}
