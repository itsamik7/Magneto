import { describe, it, expect, beforeEach } from 'vitest'
import { userMagnetService } from './userMagnetService'
import { DESTINATIONS_CATALOG } from '../data/destinationsCatalog'

describe('userMagnetService', () => {
  const testUserId = '00000000-0000-0000-0000-000000000001'

  beforeEach(() => {
    userMagnetService.safeStorage.clear()
  })

  it('should start with an empty fridge for a new user', async () => {
    const magnets = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(magnets.length).toBe(0)
  }, 15000)

  it('should add a magnet to the user fridge', async () => {
    const dest = DESTINATIONS_CATALOG[0] // Taj Mahal
    const res = await userMagnetService.addMagnetToFridge(testUserId, dest)
    expect(res.success).toBe(true)
    expect(res.magnetItem?.destination_slug).toBe(dest.slug)

    const fridge = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(fridge.length).toBe(1)
    expect(fridge[0].destination_slug).toBe(dest.slug)
  }, 15000)

  it('should prevent adding duplicate magnets for the same user', async () => {
    const dest = DESTINATIONS_CATALOG[0] // Taj Mahal
    await userMagnetService.addMagnetToFridge(testUserId, dest)

    // Attempt to add again
    const duplicateRes = await userMagnetService.addMagnetToFridge(testUserId, dest)
    expect(duplicateRes.success).toBe(false)
    expect(duplicateRes.message).toContain('already on your fridge')

    const fridge = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(fridge.length).toBe(1)
  })

  it('should remove a magnet from the fridge', async () => {
    const dest1 = DESTINATIONS_CATALOG[0]
    const dest2 = DESTINATIONS_CATALOG[1]

    await userMagnetService.addMagnetToFridge(testUserId, dest1)
    await userMagnetService.addMagnetToFridge(testUserId, dest2)

    let fridge = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(fridge.length).toBe(2)

    await userMagnetService.removeMagnetFromFridge(testUserId, dest1.slug)
    fridge = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(fridge.length).toBe(1)
    expect(fridge[0].destination_slug).toBe(dest2.slug)
  })
})
