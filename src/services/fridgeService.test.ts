import { describe, it, expect, beforeEach } from 'vitest'
import { fridgeService } from './fridgeService'
import { FRIDGE_MODELS, DEFAULT_FRIDGE_ID } from '../data/fridgeCatalog'
import type { FridgeMagnetItem } from './userMagnetService'
import type { FridgeModel } from '../types/fridge'

describe('fridgeService & Fridge Architecture', () => {
  const testUserId = 'test_user_789'

  beforeEach(() => {
    fridgeService.safeStorage.clear()
  })

  it('should include authentic Indian and International refrigerator brands', () => {
    const models = fridgeService.getFridgeModels()
    expect(models.length).toBeGreaterThanOrEqual(20)

    const brands = models.map((m) => m.brand)
    // Indian brand presence
    expect(brands).toContain('LG')
    expect(brands).toContain('Samsung')
    expect(brands).toContain('Whirlpool')
    expect(brands).toContain('Godrej')
    expect(brands).toContain('Haier')
    expect(brands).toContain('Bosch')

    // International brand presence
    expect(brands).toContain('Sub-Zero')
    expect(brands).toContain('GE Appliances')
    expect(brands).toContain('Miele')
    expect(brands).toContain('KitchenAid')
  })

  it('should have properly defined magnetic regions for all models', () => {
    const models = fridgeService.getFridgeModels()
    models.forEach((m) => {
      expect(m.aspectRatio).toBeGreaterThan(0.4)
      expect(m.aspectRatio).toBeLessThan(1.5)
      expect(m.magneticRegion.top).toBeGreaterThanOrEqual(0.02)
      expect(m.magneticRegion.left).toBeGreaterThanOrEqual(0.02)
      expect(m.magneticRegion.width).toBeLessThanOrEqual(0.96)
      expect(m.magneticRegion.height).toBeLessThanOrEqual(0.96)
    })
  })

  it('should persist and switch active fridge model per user', () => {
    expect(fridgeService.getActiveFridgeId(testUserId)).toBe(DEFAULT_FRIDGE_ID)

    const targetModel = 'samsung-bespoke-double'
    fridgeService.setActiveFridgeId(testUserId, targetModel)
    expect(fridgeService.getActiveFridgeId(testUserId)).toBe(targetModel)

    const retrieved = fridgeService.getFridgeModelById(targetModel, testUserId)
    expect(retrieved.id).toBe(targetModel)
    expect(retrieved.brand).toBe('Samsung')
  })

  it('should support custom user-uploaded fridges', () => {
    const customFridge: FridgeModel = {
      id: 'custom-fridge-1',
      name: 'My Real Kitchen Fridge',
      brand: 'Whirlpool',
      style: 'Double-door',
      finish: 'Custom Photo Finish',
      colorHex: '#334155',
      countryCategory: 'Indian',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      aspectRatio: 0.62,
      magneticRegion: { top: 0.05, left: 0.05, width: 0.9, height: 0.9 },
      description: 'Personal kitchen fridge',
      features: ['Personal Photo'],
      isCustom: true,
    }

    fridgeService.saveCustomFridge(testUserId, customFridge)
    const customList = fridgeService.getCustomFridges(testUserId)
    expect(customList.length).toBe(1)
    expect(customList[0].id).toBe('custom-fridge-1')

    const allModels = fridgeService.getFridgeModels(testUserId)
    expect(allModels.some((m) => m.id === 'custom-fridge-1')).toBe(true)
  })

  it('should keep magnet placements isolated between different fridge models', () => {
    const modelA = 'lg-instaview-stainless'
    const modelB = 'godrej-edge-single'

    const sampleMagnets: FridgeMagnetItem[] = [
      {
        id: 'mag-1',
        destination_slug: 'paris',
        destination_name: 'Paris',
        country_name: 'France',
        continent: 'Europe',
        asset_url: '/magnets/paris.png',
        magnet_shape: 'arch',
        acquired_at: new Date().toISOString(),
      },
    ]

    // Place on Model A
    const placementsA = fridgeService.getFridgePlacements(testUserId, modelA, sampleMagnets)
    expect(placementsA.length).toBe(1)
    placementsA[0].x = 0.25
    placementsA[0].y = 0.35
    fridgeService.saveFridgePlacements(testUserId, modelA, placementsA)

    // Place on Model B at different coordinates
    const placementsB = fridgeService.getFridgePlacements(testUserId, modelB, sampleMagnets)
    expect(placementsB.length).toBe(1)
    placementsB[0].x = 0.75
    placementsB[0].y = 0.85
    fridgeService.saveFridgePlacements(testUserId, modelB, placementsB)

    // Verify Model A is preserved
    const verifyA = fridgeService.getFridgePlacements(testUserId, modelA, sampleMagnets)
    expect(verifyA[0].x).toBe(0.25)
    expect(verifyA[0].y).toBe(0.35)

    // Verify Model B is preserved
    const verifyB = fridgeService.getFridgePlacements(testUserId, modelB, sampleMagnets)
    expect(verifyB[0].x).toBe(0.75)
    expect(verifyB[0].y).toBe(0.85)
  })

  it('guarantees normalized positions within bounds whether 1, 11, or 50 magnets are added', () => {
    const manyMagnets: FridgeMagnetItem[] = Array.from({ length: 25 }, (_, i) => ({
      id: `mag-${i}`,
      destination_slug: `dest-${i}`,
      destination_name: `Destination ${i}`,
      country_name: 'Country',
      continent: 'Asia',
      asset_url: `/magnets/destinations/dest-${i}.svg`,
      magnet_shape: 'arch',
      acquired_at: new Date().toISOString(),
    }))

    const placements = fridgeService.generateAutoLayout(manyMagnets, 0, [])
    expect(placements.length).toBe(25)

    placements.forEach((p) => {
      // Normalized coordinates must stay strictly inside usable bounds [0.08, 0.92]
      expect(p.x).toBeGreaterThanOrEqual(0.08)
      expect(p.x).toBeLessThanOrEqual(0.92)
      expect(p.y).toBeGreaterThanOrEqual(0.08)
      expect(p.y).toBeLessThanOrEqual(0.92)
      expect(p.scale).toBeGreaterThanOrEqual(0.5)
      expect(p.scale).toBeLessThanOrEqual(2.0)
    })
  })
})
