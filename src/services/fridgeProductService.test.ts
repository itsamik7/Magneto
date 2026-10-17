import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  checkSupabaseReady: () => ({ ready: false }),
}))

import {
  getPublicActiveProducts,
  getAllAdminProducts,
  createProduct,
  updateProduct,
  toggleProductActive,
  archiveProduct,
  unarchiveProduct,
  deleteProductPermanent,
  resetToDefaultProducts,
  populateStockTemplates,
  getLocalCachedProducts,
  normalizeProductShelf,
  DEFAULT_FRIDGE_PRODUCTS,
} from './fridgeProductService'

describe('fridgeProductService', () => {
  beforeEach(async () => {
    await resetToDefaultProducts()
  })

  it('should start with an empty refrigerator by default', async () => {
    const products = await getAllAdminProducts()
    expect(products.length).toBe(0)
    expect(DEFAULT_FRIDGE_PRODUCTS.length).toBe(0)

    const publicProducts = await getPublicActiveProducts()
    expect(publicProducts.length).toBe(0)
  })

  it('should create a new fridge product with correct shelf and position', async () => {
    const created = await createProduct({
      name: 'Cold Brew Coffee',
      category: 'Beverages',
      imageUrl: '/assets/products/water-bottle.png',
      description: 'Slow-steeped organic arabica cold brew',
      shelf: 'middle_shelf',
      positionX: 42,
      displayScale: 1.1,
      quantity: '1 Bottle',
      isActive: true,
      isArchived: false,
      displayOrder: 1,
    })

    expect(created.id).toBeDefined()
    expect(created.name).toBe('Cold Brew Coffee')
    expect(created.shelf).toBe('middle_shelf')
    expect(created.positionX).toBe(42)

    const all = await getAllAdminProducts()
    expect(all.length).toBe(1)
    expect(all[0].id).toBe(created.id)

    const publicList = await getPublicActiveProducts()
    expect(publicList.length).toBe(1)
  })

  it('should filter public products to only active and non-archived', async () => {
    const p1 = await createProduct({
      name: 'Item 1',
      category: 'Dairy',
      imageUrl: '/assets/products/milk-carton.png',
      shelf: 'middle_shelf',
      positionX: 20,
      displayScale: 1.0,
      isActive: true,
      isArchived: false,
      displayOrder: 1,
    })

    const p2 = await createProduct({
      name: 'Item 2',
      category: 'Beverages',
      imageUrl: '/assets/products/water-bottle.png',
      shelf: 'bottom_shelf',
      positionX: 60,
      displayScale: 1.0,
      isActive: true,
      isArchived: false,
      displayOrder: 2,
    })

    // Archive p1
    await archiveProduct(p1.id)
    // Deactivate p2
    await toggleProductActive(p2.id, false)

    const publicProducts = await getPublicActiveProducts()
    expect(publicProducts.some((p) => p.id === p1.id)).toBe(false)
    expect(publicProducts.some((p) => p.id === p2.id)).toBe(false)
    expect(publicProducts.length).toBe(0)
  })

  it('should update product properties and position', async () => {
    const created = await createProduct({
      name: 'Initial Name',
      category: 'Dairy',
      imageUrl: '/assets/products/milk-carton.png',
      shelf: 'top_shelf',
      positionX: 20,
      displayScale: 1.0,
      isActive: true,
      isArchived: false,
      displayOrder: 1,
    })

    const updated = await updateProduct(created.id, {
      name: 'Updated Milk Name',
      positionX: 88,
      shelf: 'bottom_shelf',
    })

    expect(updated.name).toBe('Updated Milk Name')
    expect(updated.positionX).toBe(88)
    expect(updated.shelf).toBe('bottom_shelf')
  })

  it('should toggle active status and restore archived products', async () => {
    const created = await createProduct({
      name: 'Yogurt',
      category: 'Dairy',
      imageUrl: '/assets/products/yogurt-jar.png',
      shelf: 'top_shelf',
      positionX: 50,
      displayScale: 1.0,
      isActive: true,
      isArchived: false,
      displayOrder: 1,
    })

    const archived = await archiveProduct(created.id)
    expect(archived.isArchived).toBe(true)
    expect(archived.isActive).toBe(false)

    const restored = await unarchiveProduct(created.id)
    expect(restored.isArchived).toBe(false)
    expect(restored.isActive).toBe(true)
  })

  it('should permanently delete a product', async () => {
    const created = await createProduct({
      name: 'Temporary Snack',
      category: 'Snacks',
      imageUrl: '/assets/products/yogurt-jar.png',
      shelf: 'top_shelf',
      positionX: 50,
      displayScale: 1.0,
      isActive: true,
      isArchived: false,
      displayOrder: 99,
    })

    const deleteResult = await deleteProductPermanent(created.id)
    expect(deleteResult).toBe(true)

    const all = await getAllAdminProducts()
    expect(all.some((p) => p.id === created.id)).toBe(false)
  })

  it('should generate a valid RFC4122 v4 UUID for newly created products', async () => {
    const created = await createProduct({
      name: 'Artisan Jam',
      category: 'Condiments',
      imageUrl: '/assets/products/jam-jar.png',
      shelf: 'top_shelf',
      positionX: 30,
      displayScale: 0.9,
      isActive: true,
      isArchived: false,
      displayOrder: 1,
    })

    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(created.id).toMatch(uuidV4Regex)
  })

  it('should safely normalize legacy crisper drawer and preserve active door shelves', () => {
    const legacyCrisper = {
      id: 'test-1',
      name: 'Carrot',
      shelf: 'crisper_drawer' as any,
      positionX: 20,
    } as any
    const activeDoor = {
      id: 'test-2',
      name: 'Mustard',
      shelf: 'door_bin_middle',
      positionX: 50,
    } as any

    expect(normalizeProductShelf(legacyCrisper).shelf).toBe('bottom_shelf')
    expect(normalizeProductShelf(activeDoor).shelf).toBe('door_bin_middle')
  })

  it('should preserve stacking arrangement, itemCount, and spacing metadata', async () => {
    const created = await createProduct({
      name: 'Sparkling Mineral Water',
      category: 'Beverages',
      imageUrl: '/assets/products/water-bottle.png',
      shelf: 'bottom_shelf',
      positionX: 45,
      displayScale: 1.0,
      itemCount: 4,
      arrangement: 'row',
      spacing: 22,
      isActive: true,
      isArchived: false,
      displayOrder: 1,
    })

    expect(created.itemCount).toBe(4)
    expect(created.arrangement).toBe('row')
    expect(created.spacing).toBe(22)

    const all = await getAllAdminProducts()
    const found = all.find((p) => p.id === created.id)
    expect(found?.itemCount).toBe(4)
    expect(found?.arrangement).toBe('row')
    expect(found?.spacing).toBe(22)
  })

  it('should update populated stock grocery templates seamlessly', async () => {
    const templates = await populateStockTemplates()
    expect(templates.length).toBeGreaterThan(0)

    const milkItem = templates.find((t) => t.name.toLowerCase().includes('milk'))
    expect(milkItem).toBeDefined()

    if (milkItem) {
      const updated = await updateProduct(milkItem.id, {
        positionX: 65,
        displayScale: 1.15,
        itemCount: 3,
        arrangement: 'row',
      })

      expect(updated.positionX).toBe(65)
      expect(updated.displayScale).toBe(1.15)
      expect(updated.itemCount).toBe(3)
    }
  })

  it('should return local cached products synchronously with getLocalCachedProducts', async () => {
    await createProduct({
      name: 'Organic Whole Milk',
      category: 'Dairy',
      imageUrl: '/assets/products/milk-carton.png',
      shelf: 'middle_shelf',
      positionX: 50,
      displayScale: 1.0,
      isActive: true,
      isArchived: false,
      displayOrder: 1,
    })

    const cached = getLocalCachedProducts()
    expect(cached.length).toBe(1)
    expect(cached[0].name).toBe('Organic Whole Milk')
  })
})
