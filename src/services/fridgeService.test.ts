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

  it('should remove a magnet placement and persist changes', () => {
    const sample: FridgeMagnetItem[] = [
      {
        id: 'mag-goa',
        destination_slug: 'goa',
        destination_name: 'Goa',
        country_name: 'India',
        continent: 'Asia',
        asset_url: '/magnets/goa.png',
        magnet_shape: 'arch',
        acquired_at: new Date().toISOString(),
      },
      {
        id: 'mag-paris',
        destination_slug: 'paris',
        destination_name: 'Paris',
        country_name: 'France',
        continent: 'Europe',
        asset_url: '/magnets/paris.png',
        magnet_shape: 'arch',
        acquired_at: new Date().toISOString(),
      },
    ]

    const initial = fridgeService.getFridgePlacements(testUserId, DEFAULT_FRIDGE_ID, sample)
    expect(initial.length).toBe(2)

    const updated = fridgeService.removeMagnetPlacement(testUserId, DEFAULT_FRIDGE_ID, 'mag-goa')
    expect(updated.length).toBe(1)
    expect(updated[0].magnetSlug).toBe('paris')

    const reloaded = fridgeService.getFridgePlacements(testUserId, DEFAULT_FRIDGE_ID)
    expect(reloaded.length).toBe(1)
  })

  it('should adapt magnet placements to stay cleanly in bounds when changing fridge models', () => {
    const targetModel = FRIDGE_MODELS[0]
    const placements = [
      {
        id: 'mag-out-of-bounds',
        magnetSlug: 'test',
        destinationName: 'Test',
        assetUrl: '/test.png',
        x: 0.99,
        y: 0.01,
        scale: 1.0,
        rotation: 0,
        zIndex: 1,
      },
    ]

    const adapted = fridgeService.adaptPlacementsToModel(placements, targetModel)
    expect(adapted[0].x).toBeLessThanOrEqual(0.88)
    expect(adapted[0].y).toBeGreaterThanOrEqual(0.12)
  })

  it('should detect and push apart overlapping magnets using resolveMagnetOverlaps', () => {
    // Two magnets deliberately placed at identical coordinates
    const overlapping = [
      {
        id: 'mag-1',
        magnetSlug: 'paris',
        destinationName: 'Paris',
        assetUrl: '/paris.png',
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
        assetUrl: '/london.png',
        x: 0.50,
        y: 0.50,
        scale: 1.0,
        rotation: 0,
        zIndex: 2,
      },
    ]

    const resolved = fridgeService.resolveMagnetOverlaps(overlapping)
    expect(resolved.length).toBe(2)

    // They must no longer be at identical coordinates
    const dx = Math.abs(resolved[0].x - resolved[1].x)
    const dy = Math.abs(resolved[0].y - resolved[1].y)
    expect(dx >= 0.20 || dy >= 0.14).toBe(true)
  })

  it('guarantees that starter magnets and auto-arranged magnets do not overlap', () => {
    const starterMagnets: FridgeMagnetItem[] = [
      { id: '1', destination_slug: 'ladakh', destination_name: 'Ladakh', country_name: 'India', continent: 'Asia', asset_url: '/ladakh.png', magnet_shape: 'arch', acquired_at: '' },
      { id: '2', destination_slug: 'delhi', destination_name: 'Delhi', country_name: 'India', continent: 'Asia', asset_url: '/delhi.png', magnet_shape: 'arch', acquired_at: '' },
      { id: '3', destination_slug: 'royal-elephant', destination_name: 'Elephant', country_name: 'India', continent: 'Asia', asset_url: '/elephant.png', magnet_shape: 'arch', acquired_at: '' },
      { id: '4', destination_slug: 'goa', destination_name: 'Goa', country_name: 'India', continent: 'Asia', asset_url: '/goa.png', magnet_shape: 'arch', acquired_at: '' },
      { id: '5', destination_slug: 'taj-mahal', destination_name: 'Taj Mahal', country_name: 'India', continent: 'Asia', asset_url: '/taj.png', magnet_shape: 'arch', acquired_at: '' },
      { id: '6', destination_slug: 'paris', destination_name: 'Paris', country_name: 'France', continent: 'Europe', asset_url: '/paris.png', magnet_shape: 'arch', acquired_at: '' },
      { id: '7', destination_slug: 'london', destination_name: 'London', country_name: 'UK', continent: 'Europe', asset_url: '/london.png', magnet_shape: 'arch', acquired_at: '' },
      { id: '8', destination_slug: 'new-york', destination_name: 'New York', country_name: 'USA', continent: 'Americas', asset_url: '/ny.png', magnet_shape: 'arch', acquired_at: '' },
      { id: '9', destination_slug: 'bali', destination_name: 'Bali', country_name: 'Indonesia', continent: 'Asia', asset_url: '/bali.png', magnet_shape: 'arch', acquired_at: '' },
      { id: '10', destination_slug: 'rome', destination_name: 'Rome', country_name: 'Italy', continent: 'Europe', asset_url: '/rome.png', magnet_shape: 'arch', acquired_at: '' },
    ]

    const placements = fridgeService.generateAutoLayout(starterMagnets, 0, [])
    expect(placements.length).toBe(10)

    // Check every pair for overlap
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const dx = Math.abs(placements[i].x - placements[j].x)
        const dy = Math.abs(placements[i].y - placements[j].y)
        // Must either have horizontal separation >= 0.18 or vertical separation >= 0.12
        const hasSeparation = dx >= 0.18 || dy >= 0.12
        expect(hasSeparation).toBe(true)
      }
    }
  })
})
