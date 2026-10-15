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
  }, 15000)

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
  }, 15000)

  it('should save and persist a collection of magnets via saveUserFridgeMagnets', async () => {
    const sample = [
      {
        id: 'magnet-paris',
        destination_slug: 'paris',
        destination_name: 'Paris',
        country_name: 'France',
        continent: 'Europe',
        asset_url: '/magnets/paris.png',
        magnet_shape: 'arch',
        acquired_at: new Date().toISOString(),
      },
    ]

    await userMagnetService.saveUserFridgeMagnets(testUserId, sample)
    const result = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(result.length).toBe(1)
    expect(result[0].destination_slug).toBe('paris')
  }, 15000)

  it('should remove a magnet using canonical ID (magnet-<slug>)', async () => {
    const dest = DESTINATIONS_CATALOG[0]
    await userMagnetService.addMagnetToFridge(testUserId, dest)

    let fridge = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(fridge.length).toBe(1)

    // Remove using canonical ID 'magnet-' + slug
    await userMagnetService.removeMagnetFromFridge(testUserId, `magnet-${dest.slug}`)
    fridge = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(fridge.length).toBe(0)
  }, 15000)

  it('should accurately record savings deposit, update total saved, and transition unlock state', async () => {
    const dest = DESTINATIONS_CATALOG[0] // Taj Mahal
    await userMagnetService.addMagnetToFridge(testUserId, dest)

    // Deposit ₹500 (50,000 paise) towards a target of ₹1,000 (100,000 paise)
    const res1 = await userMagnetService.recordMagnetDeposit(testUserId, dest.slug, 50000, {
      targetBudgetMinor: 100000,
      note: 'First savings installment',
    })

    expect(res1.newTotalSavedMinor).toBe(50000)
    expect(res1.progressPercentage).toBe(50)
    expect(res1.unlockState).toBe('saving')

    // Verify stored magnet
    let fridge = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(fridge[0].total_saved_minor).toBe(50000)
    expect(fridge[0].unlock_state).toBe('saving')

    // Deposit remaining ₹500 to hit 100% funding
    const res2 = await userMagnetService.recordMagnetDeposit(testUserId, dest.slug, 50000, {
      targetBudgetMinor: 100000,
    })

    expect(res2.newTotalSavedMinor).toBe(100000)
    expect(res2.progressPercentage).toBe(100)
    expect(res2.unlockState).toBe('ready_to_go')

    fridge = await userMagnetService.getUserFridgeMagnets(testUserId)
    expect(fridge[0].total_saved_minor).toBe(100000)
    expect(fridge[0].unlock_state).toBe('ready_to_go')
  }, 15000)
})
