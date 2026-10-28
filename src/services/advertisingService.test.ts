import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase to ensure sandbox offline/in-memory resilience
vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  checkSupabaseReady: () => ({ ready: false }),
}))

// Ensure localStorage is polyfilled if running in node environment
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>()
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => {
      store.set(key, String(val))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (i: number) => Array.from(store.keys())[i] || null,
    length: 0,
  } as Storage
}

import {
  registerMerchantProfile,
  getMerchantProfile,
  getAllMerchants,
  getAdvertisingPlacements,
  getAdvertisingSlots,
  getAdvertisingPlans,
  createCampaign,
  getMerchantCampaigns,
  purchaseSubscriptionWithSandboxPayment,
  getMerchantSubscriptions,
  adminApproveCampaign,
  adminRejectCampaign,
  trackAdvertisingEvent,
  getMerchantAnalytics,
  getPublicActiveCampaigns,
  addCreativeAsset,
  getMerchantCreatives,
  deleteCreativeAsset,
} from './advertisingService'

describe('advertisingService', () => {
  const testUserId = 'test-merchant-user-1'

  beforeEach(() => {
    localStorage.clear()
  })

  it('should register and retrieve a merchant profile', async () => {
    const regResult = await registerMerchantProfile({
      userId: testUserId,
      businessName: 'Acme Gelato & Beverages',
      contactPerson: 'Mario Rossi',
      businessEmail: 'mario@acmegelato.com',
      phoneNumber: '+1-555-0199',
      businessCategory: 'Food & Beverage',
      businessWebsite: 'https://acmegelato.com',
      logoUrl: 'https://images.unsplash.com/photo-gelato.png',
    })

    expect(regResult.profile).toBeDefined()
    expect(regResult.profile.businessName).toBe('Acme Gelato & Beverages')
    expect(regResult.profile.verificationStatus).toBe('verified')

    const fetched = await getMerchantProfile(testUserId)
    expect(fetched).not.toBeNull()
    expect(fetched?.businessName).toBe('Acme Gelato & Beverages')
    expect(fetched?.contactPerson).toBe('Mario Rossi')
    expect(fetched?.businessEmail).toBe('mario@acmegelato.com')

    const allMerchants = await getAllMerchants()
    expect(allMerchants.some((m) => m.userId === testUserId)).toBe(true)
  })

  it('should return advertising placements, slots, and plans', async () => {
    const placements = await getAdvertisingPlacements()
    expect(placements.length).toBeGreaterThanOrEqual(3)

    const categories = placements.map((p) => p.category)
    expect(categories).toContain('fridge_product')
    expect(categories).toContain('magnet_banner')
    expect(categories).toContain('led_display')

    const slots = await getAdvertisingSlots('fridge_product')
    expect(slots.length).toBeGreaterThanOrEqual(1)
    expect(slots[0].placementId).toBe('fridge_product')

    const plans = await getAdvertisingPlans('fridge_product')
    expect(plans.length).toBeGreaterThanOrEqual(1)
    expect(plans[0].placementId).toBe('fridge_product')
    expect(plans[0].priceInrMinor).toBeGreaterThan(0)
  })

  it('should process sandbox payments and activate merchant subscription', async () => {
    const reg = await registerMerchantProfile({
      userId: testUserId,
      businessName: 'Gelato Sub Test',
      contactPerson: 'Mario',
      businessEmail: 'sub@gelato.com',
      phoneNumber: '+1234567890',
      businessCategory: 'Food & Beverage',
    })

    const plans = await getAdvertisingPlans('fridge_product')
    const selectedPlan = plans[0]

    const paymentResult = await purchaseSubscriptionWithSandboxPayment({
      merchantId: reg.profile.id,
      planId: selectedPlan.id,
      paymentMethod: 'Corporate Card',
    })

    expect(paymentResult.payment).toBeDefined()
    expect(paymentResult.subscription).toBeDefined()
    expect(paymentResult.subscription.status).toBe('active')
    expect(paymentResult.subscription.planId).toBe(selectedPlan.id)

    const subs = await getMerchantSubscriptions(reg.profile.id)
    expect(subs.length).toBeGreaterThanOrEqual(1)
    expect(subs[0].status).toBe('active')
  })

  it('should manage creative assets', async () => {
    const reg = await registerMerchantProfile({
      userId: testUserId,
      businessName: 'Creative Asset Test',
      contactPerson: 'Mario',
      businessEmail: 'asset@gelato.com',
      phoneNumber: '+1234567890',
      businessCategory: 'Food & Beverage',
    })

    const creative = await addCreativeAsset({
      merchantId: reg.profile.id,
      name: 'Organic Milk Bottle 3D Asset',
      creativeType: '3d_model',
      placementCategory: 'fridge_product',
      fileUrl: 'https://images.unsplash.com/photo-milk.png',
      fileSizeBytes: 240000,
      mimeType: 'model/gltf-binary',
      modelMetadata: { model3dUrl: 'https://assets.magnetos.app/models/milk.glb' },
    })

    expect(creative.id).toBeDefined()
    expect(creative.name).toBe('Organic Milk Bottle 3D Asset')

    const creatives = await getMerchantCreatives(reg.profile.id)
    expect(creatives.length).toBe(1)
    expect(creatives[0].id).toBe(creative.id)

    await deleteCreativeAsset(creative.id, reg.profile.id)

    const afterDelete = await getMerchantCreatives(reg.profile.id)
    expect(afterDelete.length).toBe(0)
  })

  it('should create campaigns, moderate them by admin, and deliver only active campaigns to public users', async () => {
    const regResult = await registerMerchantProfile({
      userId: testUserId,
      businessName: 'Nordic Brews',
      contactPerson: 'Astrid Lind',
      businessEmail: 'astrid@nordicbrews.com',
      phoneNumber: '+46-8-123456',
      businessCategory: 'Food & Beverage',
    })

    const now = new Date()
    const startDate = new Date(now.getTime() - 1000).toISOString()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const campaign = await createCampaign({
      merchantId: regResult.profile.id,
      name: 'Nordic Sparkling Cider Summer Campaign',
      placementId: 'fridge_product',
      slotId: 'slot_fridge_middle_shelf_featured',
      brandName: 'Nordic Brews',
      productName: 'Sparkling Apple Cider',
      description: 'Handcrafted Swedish crisp organic cider',
      destinationUrl: 'https://nordicbrews.example/cider',
      ctaText: 'Taste Now',
      creativeUrl: 'https://images.unsplash.com/photo-cider.png',
      shelf: 'middle_shelf',
      positionX: 45,
      displayScale: 1.1,
      startDate,
      endDate,
      submitForApproval: true,
    })

    expect(campaign.id).toBeDefined()
    expect(campaign.status).toBe('pending_approval')

    // Normal public user should NOT see pending_approval campaigns
    const publicPending = await getPublicActiveCampaigns('fridge_product')
    expect(publicPending.some((c) => c.id === campaign.id)).toBe(false)

    // Admin approves the campaign
    await adminApproveCampaign(campaign.id)

    // Now public user DOES see the approved campaign
    const publicActive = await getPublicActiveCampaigns('fridge_product')
    expect(publicActive.some((c) => c.id === campaign.id)).toBe(true)

    // Admin can reject with feedback
    await adminRejectCampaign(campaign.id, 'Image resolution below guidelines')

    const publicAfterReject = await getPublicActiveCampaigns('fridge_product')
    expect(publicAfterReject.some((c) => c.id === campaign.id)).toBe(false)
  })

  it('should record real telemetry events and aggregate accurate merchant analytics', async () => {
    const reg = await registerMerchantProfile({
      userId: testUserId,
      businessName: 'Sunset Coffee',
      contactPerson: 'Elena Rostova',
      businessEmail: 'elena@sunsetcoffee.com',
      phoneNumber: '+1-555-4321',
      businessCategory: 'Food & Beverage',
    })

    const now = new Date()
    const startDate = new Date(now.getTime() - 1000).toISOString()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const camp = await createCampaign({
      merchantId: reg.profile.id,
      name: 'Sunset Cold Brew Display',
      placementId: 'led_display',
      slotId: 'slot_led_tv_main',
      brandName: 'Sunset Coffee',
      productName: 'Nitro Cold Brew',
      destinationUrl: 'https://sunsetcoffee.example',
      creativeUrl: 'https://images.unsplash.com/photo-coldbrew.png',
      startDate,
      endDate,
      submitForApproval: true,
    })

    // Track 10 impressions
    for (let i = 0; i < 10; i++) {
      await trackAdvertisingEvent({
        campaignId: camp.id,
        eventType: 'impression',
        placementType: 'led_display',
      })
    }

    // Track 2 clicks
    for (let i = 0; i < 2; i++) {
      await trackAdvertisingEvent({
        campaignId: camp.id,
        eventType: 'click',
        placementType: 'led_display',
      })
    }

    const metrics = await getMerchantAnalytics(reg.profile.id)
    expect(metrics.impressions).toBe(10)
    expect(metrics.clicks).toBe(2)
    expect(metrics.ctr).toBe(20) // 2 / 10 * 100 = 20%
  })
})
