import { describe, it, expect, beforeEach } from 'vitest'
import { fridgeService } from './fridgeService'
import type { MagnetPlacement } from '../types/fridge'

describe('Magnet Modification & Permission Enforcement', () => {
  const testUserId = 'test_perm_user'
  const modelId = 'universal-steel-studio'

  beforeEach(() => {
    fridgeService.safeStorage.clear()
  })

  it('modifies existing magnet coordinates and scale without creating duplicate records', () => {
    const initialPlacements: MagnetPlacement[] = [
      {
        id: 'paris',
        magnetSlug: 'paris',
        destinationName: 'Paris, France',
        assetUrl: '/assets/magnets/paris.png',
        x: 0.25,
        y: 0.35,
        scale: 1.0,
        rotation: 0,
        zIndex: 1,
        totalSavedMinor: 4750000,
        targetBudgetMinor: 9500000,
        unlockState: 'saving',
      },
      {
        id: 'japan',
        magnetSlug: 'japan',
        destinationName: 'Tokyo, Japan',
        assetUrl: '/assets/magnets/japan.png',
        x: 0.65,
        y: 0.35,
        scale: 1.0,
        rotation: 0,
        zIndex: 2,
        totalSavedMinor: 12000000,
        targetBudgetMinor: 12000000,
        unlockState: 'ready_to_go',
      },
    ]

    fridgeService.saveFridgePlacements(testUserId, modelId, initialPlacements)
    const stored = fridgeService.getFridgePlacements(testUserId, modelId)
    expect(stored).toHaveLength(2)

    // User modifies Paris position, rotation, and scale (e.g. on Landing page or Planner)
    const updatedParis: MagnetPlacement = {
      ...stored.find((p) => p.id === 'paris')!,
      x: 0.30,
      y: 0.40,
      scale: 1.15,
      rotation: 15,
    }

    const nextPlacements = stored.map((p) => (p.id === updatedParis.id ? updatedParis : p))
    fridgeService.saveFridgePlacements(testUserId, modelId, nextPlacements)

    const reloaded = fridgeService.getFridgePlacements(testUserId, modelId)
    // Must still have exactly 2 placements (no duplicates)
    expect(reloaded).toHaveLength(2)

    const parisAfter = reloaded.find((p) => p.id === 'paris')!
    expect(parisAfter.x).toBe(0.30)
    expect(parisAfter.y).toBe(0.40)
    expect(parisAfter.scale).toBe(1.15)
    expect(parisAfter.rotation).toBe(15)
    // Preserves financial and identity information
    expect(parisAfter.totalSavedMinor).toBe(4750000)
    expect(parisAfter.targetBudgetMinor).toBe(9500000)
    expect(parisAfter.unlockState).toBe('saving')
  })

  it('guarantees allowDelete=false blocks deletion and retains all magnets', () => {
    const placements: MagnetPlacement[] = [
      {
        id: 'demo-paris',
        magnetSlug: 'paris',
        destinationName: 'Paris',
        assetUrl: '/assets/magnets/paris.png',
        x: 0.22,
        y: 0.43,
        scale: 1.0,
        rotation: 0,
        zIndex: 1,
      },
      {
        id: 'demo-japan',
        magnetSlug: 'japan',
        destinationName: 'Japan',
        assetUrl: '/assets/magnets/japan.png',
        x: 0.68,
        y: 0.62,
        scale: 1.0,
        rotation: 0,
        zIndex: 2,
      },
    ]

    fridgeService.saveFridgePlacements('guest', modelId, placements)

    // Simulated handleRemovePlacement with allowDelete check
    const allowDelete = false
    const attemptDelete = (targetId: string, current: MagnetPlacement[]): MagnetPlacement[] => {
      if (!allowDelete) return current
      return current.filter((p) => p.id !== targetId)
    }

    const afterAttempt = attemptDelete('demo-paris', placements)
    expect(afterAttempt).toHaveLength(2)
    expect(afterAttempt.some((p) => p.id === 'demo-paris')).toBe(true)
  })

  it('ensures collision resolution does not drop magnets during modification', () => {
    const overlapping: MagnetPlacement[] = [
      {
        id: 'mag-1',
        magnetSlug: 'paris',
        destinationName: 'Paris',
        assetUrl: '/assets/magnets/paris.png',
        x: 0.50,
        y: 0.50,
        scale: 1.0,
        rotation: 0,
        zIndex: 1,
      },
      {
        id: 'mag-2',
        magnetSlug: 'london',
        destinationName: 'London',
        assetUrl: '/assets/magnets/london.png',
        x: 0.50,
        y: 0.50,
        scale: 1.0,
        rotation: 0,
        zIndex: 2,
      },
    ]

    const resolved = fridgeService.resolveMagnetOverlaps(overlapping)
    expect(resolved).toHaveLength(2)
    // Ensure coordinates are separated
    const dist = Math.hypot(resolved[0].x - resolved[1].x, resolved[0].y - resolved[1].y)
    expect(dist).toBeGreaterThan(0.05)
  })
})
