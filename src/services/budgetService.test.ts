import { describe, it, expect, beforeEach } from 'vitest'
import { budgetService, type BudgetItem } from './budgetService'

describe('budgetService', () => {
  beforeEach(() => {
    budgetService.safeStorage.clear()
  })

  it('should return default budget items for known destinations like santorini', () => {
    const items = budgetService.getBudgetItems('santorini')
    expect(items.length).toBeGreaterThan(0)
    const flight = items.find((i) => i.name.toLowerCase().includes('flight'))
    expect(flight).toBeDefined()
    expect(flight?.amount).toBe(60000)

    const total = budgetService.calculateTotalCost(items)
    expect(total).toBe(250000)
  })

  it('should return proportional default items for unknown destination with custom target', () => {
    const items = budgetService.getBudgetItems('unknown-island', 10000000) // ₹100,000
    expect(items.length).toBe(6)
    const total = budgetService.calculateTotalCost(items)
    expect(total).toBe(100000)
  })

  it('should save and retrieve user-customized budget items', () => {
    const customItems: BudgetItem[] = [
      { id: '1', name: 'Emirates Business Flight', amount: 95000, category: 'flight' },
      { id: '2', name: 'Luxury Cave Villa', amount: 120000, category: 'stay' },
      { id: '3', name: 'Sunset Catamaran & Wine', amount: 25000, category: 'activity' },
    ]

    budgetService.saveBudgetItems('santorini', customItems)

    const retrieved = budgetService.getBudgetItems('santorini')
    expect(retrieved).toHaveLength(3)
    expect(retrieved[0].name).toBe('Emirates Business Flight')
    expect(retrieved[0].amount).toBe(95000)
    expect(budgetService.calculateTotalCost(retrieved)).toBe(240000)
  })

  it('should allow adding new custom expense items and deleting existing ones', () => {
    const initial = budgetService.getBudgetItems('bali')
    const initialCount = initial.length

    // Add new item
    const newItem: BudgetItem = {
      id: 'custom-scuba',
      name: 'Nusa Penida Scuba Diving',
      amount: 15000,
      category: 'activity',
    }
    const updated = [...initial, newItem]
    budgetService.saveBudgetItems('bali', updated)

    const afterAdd = budgetService.getBudgetItems('bali')
    expect(afterAdd.length).toBe(initialCount + 1)
    expect(afterAdd.some((i) => i.name === 'Nusa Penida Scuba Diving')).toBe(true)

    // Delete flights item
    const filtered = afterAdd.filter((i) => !i.name.toLowerCase().includes('flight'))
    budgetService.saveBudgetItems('bali', filtered)

    const afterDelete = budgetService.getBudgetItems('bali')
    expect(afterDelete.length).toBe(initialCount)
    expect(afterDelete.some((i) => i.name.toLowerCase().includes('flight'))).toBe(false)
  })

  it('should reset custom budget items back to default', () => {
    budgetService.saveBudgetItems('santorini', [{ id: 'test', name: 'Only item', amount: 5000 }])
    expect(budgetService.getBudgetItems('santorini')).toHaveLength(1)

    const restored = budgetService.resetBudgetItems('santorini')
    expect(restored.length).toBe(6)
    expect(budgetService.calculateTotalCost(restored)).toBe(250000)
  })
})
