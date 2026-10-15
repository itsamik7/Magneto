import { describe, it, expect, beforeEach } from 'vitest'
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
  DEFAULT_FRIDGE_PRODUCTS,
} from './fridgeProductService'

describe('fridgeProductService', () => {
  beforeEach(async () => {
    await resetToDefaultProducts()
  })

  it('should load default fridge products', async () => {
    const products = await getAllAdminProducts()
    expect(products.length).toBe(DEFAULT_FRIDGE_PRODUCTS.length)
    expect(products.some((p) => p.name.includes('Milk'))).toBe(true)
    expect(products.some((p) => p.name.includes('Eggs'))).toBe(true)
  })

  it('should filter public products to only active and non-archived', async () => {
    const all = await getAllAdminProducts()
    // Archive first product
    await archiveProduct(all[0].id)
    // Deactivate second product
    await toggleProductActive(all[1].id, false)

    const publicProducts = await getPublicActiveProducts()
    expect(publicProducts.some((p) => p.id === all[0].id)).toBe(false)
    expect(publicProducts.some((p) => p.id === all[1].id)).toBe(false)
    expect(publicProducts.length).toBe(all.length - 2)
  })

  it('should create a new fridge product with correct shelf and position', async () => {
    const created = await createProduct({
      name: 'Cold Brew Coffee',
      category: 'Beverages',
      imageUrl: '/assets/products/water-bottle.svg',
      description: 'Slow-steeped organic arabica cold brew',
      shelf: 'middle_shelf',
      positionX: 42,
      displayScale: 1.1,
      quantity: '1 Bottle',
      isActive: true,
      isArchived: false,
      displayOrder: 20,
    })

    expect(created.id).toBeDefined()
    expect(created.name).toBe('Cold Brew Coffee')
    expect(created.shelf).toBe('middle_shelf')
    expect(created.positionX).toBe(42)

    const all = await getAllAdminProducts()
    expect(all.some((p) => p.id === created.id)).toBe(true)
  })

  it('should update product properties and position', async () => {
    const all = await getAllAdminProducts()
    const target = all[0]

    const updated = await updateProduct(target.id, {
      name: 'Updated Milk Name',
      positionX: 88,
      shelf: 'bottom_shelf',
    })

    expect(updated.name).toBe('Updated Milk Name')
    expect(updated.positionX).toBe(88)
    expect(updated.shelf).toBe('bottom_shelf')
  })

  it('should toggle active status and restore archived products', async () => {
    const all = await getAllAdminProducts()
    const target = all[0]

    const archived = await archiveProduct(target.id)
    expect(archived.isArchived).toBe(true)
    expect(archived.isActive).toBe(false)

    const restored = await unarchiveProduct(target.id)
    expect(restored.isArchived).toBe(false)
    expect(restored.isActive).toBe(true)
  })

  it('should permanently delete a product', async () => {
    const created = await createProduct({
      name: 'Temporary Snack',
      category: 'Snacks',
      imageUrl: '/assets/products/yogurt-jar.svg',
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
})
