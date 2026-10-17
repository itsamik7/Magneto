import { describe, it, expect } from 'vitest'
import {
  calculateClusterHalfWidthPercent,
  validateProductPlacement,
  resolveShelfOverlap,
} from './productPlacementValidator'
import type { FridgeProduct } from '../types/fridgeProduct'
import { STOCK_GROCERY_TEMPLATES } from './fridgeProductService'

describe('productPlacementValidator', () => {
  const eggProduct = STOCK_GROCERY_TEMPLATES.find((p) => p.name.includes('Egg'))!
  const milkProduct = STOCK_GROCERY_TEMPLATES.find((p) => p.name.includes('Milk'))!
  const gelatoProduct = STOCK_GROCERY_TEMPLATES.find((p) => p.name.includes('Gelato'))!
  const mustardProduct = STOCK_GROCERY_TEMPLATES.find((p) => p.name.includes('Mustard'))!

  describe('calculateClusterHalfWidthPercent', () => {
    it('returns at least 4% buffer for any product', () => {
      const halfWidth = calculateClusterHalfWidthPercent(eggProduct, 'cavity')
      expect(halfWidth).toBeGreaterThanOrEqual(4)
    })

    it('calculates wider half-width for door bins compared to cavity due to narrower bin width', () => {
      const cavityHalfWidth = calculateClusterHalfWidthPercent(mustardProduct, 'cavity')
      const doorHalfWidth = calculateClusterHalfWidthPercent(mustardProduct, 'door')
      expect(doorHalfWidth).toBeGreaterThanOrEqual(cavityHalfWidth)
    })

    it('increases half-width when itemCount increases in a row arrangement', () => {
      const singleItem: FridgeProduct = {
        ...milkProduct,
        itemCount: 1,
        arrangement: 'single',
      }
      const threeItems: FridgeProduct = {
        ...milkProduct,
        itemCount: 3,
        arrangement: 'row',
        spacing: 20,
      }
      const singleWidth = calculateClusterHalfWidthPercent(singleItem)
      const threeWidth = calculateClusterHalfWidthPercent(threeItems)
      expect(threeWidth).toBeGreaterThan(singleWidth)
    })
  })

  describe('validateProductPlacement', () => {
    it('approves a safe centered position on middle shelf', () => {
      const result = validateProductPlacement(milkProduct, 'middle_shelf', 50)
      expect(result.isValid).toBe(true)
      expect(result.safePositionX).toBe(50)
      expect(result.safeShelf).toBe('middle_shelf')
    })

    it('clamps position when dragged too close to the left wall', () => {
      const result = validateProductPlacement(milkProduct, 'middle_shelf', 5)
      expect(result.isValid).toBe(false)
      expect(result.safePositionX).toBeGreaterThanOrEqual(18)
      expect(result.reason).toContain('left wall')
    })

    it('clamps position when dragged too close to the right wall', () => {
      const result = validateProductPlacement(milkProduct, 'middle_shelf', 95)
      expect(result.isValid).toBe(false)
      expect(result.safePositionX).toBeLessThanOrEqual(82)
      expect(result.reason).toContain('right wall')
    })

    it('validates positions on door bins correctly', () => {
      const result = validateProductPlacement(mustardProduct, 'door_bin_top', 5)
      expect(result.isValid).toBe(false)
      expect(result.safePositionX).toBeGreaterThanOrEqual(14)
    })

    it('handles freezer shelf bounds', () => {
      const result = validateProductPlacement(gelatoProduct, 'freezer', 50)
      expect(result.safeShelf).toBe('freezer')
      expect(result.safePositionX).toBeGreaterThanOrEqual(24)
      expect(result.safePositionX).toBeLessThanOrEqual(76)
    })

    it('handles bottom shelf (cavity floor) bounds', () => {
      const saladProduct = STOCK_GROCERY_TEMPLATES.find((p) => p.name.includes('Salad'))!
      const result = validateProductPlacement(saladProduct, 'bottom_shelf', 50)
      expect(result.isValid).toBe(true)
      expect(result.safePositionX).toBe(50)
      expect(result.safeShelf).toBe('bottom_shelf')
    })
  })

  describe('resolveShelfOverlap', () => {
    it('returns target position unchanged if no other products are on that shelf', () => {
      const existing: FridgeProduct[] = [
        { ...milkProduct, shelf: 'top_shelf', positionX: 50 },
      ]
      const movedItem: FridgeProduct = { ...eggProduct, shelf: 'middle_shelf', positionX: 35 }
      const resolved = resolveShelfOverlap(existing, movedItem, 'middle_shelf', 35)
      expect(resolved).toBe(35)
    })

    it('shifts position when two products collide on the same shelf', () => {
      const existing: FridgeProduct[] = [
        { ...milkProduct, id: 'item-1', shelf: 'middle_shelf', positionX: 50, isActive: true, isArchived: false },
      ]
      const movedItem: FridgeProduct = {
        ...eggProduct,
        id: 'item-2',
        shelf: 'middle_shelf',
        positionX: 51,
        isActive: true,
        isArchived: false,
      }
      const resolved = resolveShelfOverlap(existing, movedItem, 'middle_shelf', 51)
      expect(resolved).not.toBe(51)
      expect(Math.abs(resolved - 50)).toBeGreaterThan(8)
    })

    it('ensures shifted position stays within safe shelf boundaries', () => {
      const existing: FridgeProduct[] = [
        { ...milkProduct, id: 'item-1', shelf: 'middle_shelf', positionX: 78, isActive: true, isArchived: false },
      ]
      const movedItem: FridgeProduct = {
        ...eggProduct,
        id: 'item-2',
        shelf: 'middle_shelf',
        positionX: 79,
        isActive: true,
        isArchived: false,
      }
      const resolved = resolveShelfOverlap(existing, movedItem, 'middle_shelf', 79)
      expect(resolved).toBeLessThanOrEqual(82)
      expect(resolved).toBeGreaterThanOrEqual(18)
    })
  })
})
