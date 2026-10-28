import type {
  MerchantProfile,
  AdvertisingPlacement,
  AdvertisingSlot,
  AdvertisingPlan,
  MerchantSubscription,
  AdvertisingCreative,
  AdvertisingCampaign,
  PaymentTransaction,
  AdvertisingEvent,
  MerchantMetrics,
  AdvertisingPlacementType,
  CampaignStatus,
} from '../types/advertising'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Storage Keys
const MERCHANT_PROFILES_KEY = 'magneto_merchant_profiles_v1'
const AD_PLANS_KEY = 'magneto_advertising_plans_v1'
const AD_SLOTS_KEY = 'magneto_advertising_slots_v1'
const AD_SUBSCRIPTIONS_KEY = 'magneto_merchant_subscriptions_v1'
const AD_CREATIVES_KEY = 'magneto_advertising_creatives_v1'
const AD_CAMPAIGNS_KEY = 'magneto_advertising_campaigns_v1'
const AD_PAYMENTS_KEY = 'magneto_advertising_payments_v1'
const AD_EVENTS_KEY = 'magneto_advertising_events_v1'

export const ADVERTISING_UPDATED_EVENT = 'magneto_advertising_updated'

// Broadcast sync event
export function broadcastAdUpdate(detail?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADVERTISING_UPDATED_EVENT, { detail }))
  }
}

// --------------------------------------------------------------------
// Default Placements
// --------------------------------------------------------------------
export const DEFAULT_PLACEMENTS: AdvertisingPlacement[] = [
  {
    id: 'fridge_magnet',
    name: 'Virtual Fridge Magnet Advertising',
    description: 'Exclusive sponsored travel magnets placed directly on the virtual refrigerator surface seen by travelers.',
    category: 'fridge_magnet',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'fridge_product',
    name: 'Virtual Fridge 3D Products',
    description: 'Photorealistic sponsored products placed naturally onto interior refrigerator shelves and compartments.',
    category: 'fridge_product',
    isActive: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'magnet_banner',
    name: 'Destination Magnet Banner',
    description: 'Premium advertising banner embedded in the right-side destination details and trip savings panel.',
    category: 'magnet_banner',
    isActive: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'led_display',
    name: 'Digital LED Screen Display',
    description: 'Modern thin-bezel advertising LED TV display standing attractively beside the refrigerator.',
    category: 'led_display',
    isActive: false,
    createdAt: new Date().toISOString(),
  },
]

// --------------------------------------------------------------------
// Default Advertising Slots (Admin Defined)
// --------------------------------------------------------------------
export const DEFAULT_SLOTS: AdvertisingSlot[] = [
  {
    id: 'slot_magnet_door_top_right',
    name: 'Door Top Right — Prime Eye Level',
    placementId: 'fridge_magnet',
    locationDescription: 'Upper right quadrant of the refrigerator door, directly in the user primary line of sight.',
    defaultPositionX: 72,
    defaultPositionY: 22,
    defaultDisplayScale: 1.05,
    magnetFormat: 'standard',
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 10,
    isExclusive: true,
    isActive: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_magnet_door_top_left',
    name: 'Door Top Left — High Visibility',
    placementId: 'fridge_magnet',
    locationDescription: 'Upper left quadrant of the refrigerator door, beside featured destination magnets.',
    defaultPositionX: 28,
    defaultPositionY: 22,
    defaultDisplayScale: 1.0,
    magnetFormat: 'standard',
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 10,
    isExclusive: true,
    isActive: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_magnet_door_center',
    name: 'Door Center — Spotlight Feature',
    placementId: 'fridge_magnet',
    locationDescription: 'Central showcase placement on the main refrigerator door with highest visual prominence.',
    defaultPositionX: 50,
    defaultPositionY: 42,
    defaultDisplayScale: 1.15,
    magnetFormat: 'showcase',
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 15,
    isExclusive: true,
    isActive: true,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_magnet_door_mid_right',
    name: 'Door Mid Right — Interaction Zone',
    placementId: 'fridge_magnet',
    locationDescription: 'Right-side middle door placement situated naturally among travel milestone magnets.',
    defaultPositionX: 75,
    defaultPositionY: 58,
    defaultDisplayScale: 1.0,
    magnetFormat: 'standard',
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 10,
    isExclusive: true,
    isActive: true,
    displayOrder: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_magnet_door_mid_left',
    name: 'Door Mid Left — Balanced Position',
    placementId: 'fridge_magnet',
    locationDescription: 'Left-side middle door placement with strong engagement as users review saved goals.',
    defaultPositionX: 25,
    defaultPositionY: 58,
    defaultDisplayScale: 1.0,
    magnetFormat: 'standard',
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 10,
    isExclusive: true,
    isActive: true,
    displayOrder: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_magnet_door_bottom_center',
    name: 'Door Lower Anchor — Wide Magnet',
    placementId: 'fridge_magnet',
    locationDescription: 'Lower central anchor position ideal for prominent horizontal brand badges.',
    defaultPositionX: 50,
    defaultPositionY: 75,
    defaultDisplayScale: 1.0,
    magnetFormat: 'horizontal',
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 10,
    isExclusive: false,
    isActive: true,
    displayOrder: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_fridge_middle_shelf_featured',
    name: 'Middle Shelf — Prime Eyeline',
    placementId: 'fridge_product',
    locationDescription: 'Center stage on the main glass refrigerator shelf, immediately visible upon opening doors.',
    shelf: 'middle_shelf',
    defaultPositionX: 50,
    defaultDisplayScale: 1.1,
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'model/gltf-binary'],
    maxFileSizeMb: 25,
    isExclusive: false,
    isActive: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_fridge_top_shelf_center',
    name: 'Top Shelf — High Visibility',
    placementId: 'fridge_product',
    locationDescription: 'Upper tempered glass shelf ideal for premium beverages and gourmet specialties.',
    shelf: 'top_shelf',
    defaultPositionX: 42,
    defaultDisplayScale: 1.0,
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'model/gltf-binary'],
    maxFileSizeMb: 20,
    isExclusive: false,
    isActive: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_fridge_bottom_shelf',
    name: 'Bottom Shelf — Spacious Area',
    placementId: 'fridge_product',
    locationDescription: 'Spacious lower level ideal for beverage packs, large cartons, and grocery essentials.',
    shelf: 'bottom_shelf',
    defaultPositionX: 58,
    defaultDisplayScale: 1.0,
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'model/gltf-binary'],
    maxFileSizeMb: 20,
    isExclusive: false,
    isActive: true,
    displayOrder: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_fridge_crisper_drawer',
    name: 'Fresh Harvest Crisper Drawer',
    placementId: 'fridge_product',
    locationDescription: 'Articulated vegetable crisper drawer for farm-fresh produce and health snacks.',
    shelf: 'crisper_drawer',
    defaultPositionX: 50,
    defaultDisplayScale: 0.95,
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'model/gltf-binary'],
    maxFileSizeMb: 15,
    isExclusive: false,
    isActive: true,
    displayOrder: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_fridge_door_bin_mid',
    name: 'Right Door Bin — Quick Grab',
    placementId: 'fridge_product',
    locationDescription: 'Swinging door bin with high interaction rate when user checks items.',
    shelf: 'door_bin_middle',
    defaultPositionX: 35,
    defaultDisplayScale: 0.9,
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'model/gltf-binary'],
    maxFileSizeMb: 15,
    isExclusive: false,
    isActive: true,
    displayOrder: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_banner_sidebar_top',
    name: 'Magnet Details Top Banner',
    placementId: 'magnet_banner',
    locationDescription: 'Prominently placed above destination insights and itinerary milestones in the details panel.',
    capacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 10,
    isExclusive: false,
    isActive: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'slot_led_tv_main',
    name: 'Beside-Fridge Digital LED Screen',
    placementId: 'led_display',
    locationDescription: 'High-definition digital LED screen standing beside the refrigerator in the main view.',
    capacity: 5,
    supportedFormats: ['image/png', 'image/jpeg', 'video/mp4'],
    maxFileSizeMb: 50,
    isExclusive: false,
    isActive: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
]

// --------------------------------------------------------------------
// Default Subscription Plans
// --------------------------------------------------------------------
export const DEFAULT_PLANS: AdvertisingPlan[] = [
  {
    id: 'plan_magnet_starter_15d',
    name: 'Starter Magnet Placement (15 Days)',
    placementId: 'fridge_magnet',
    tier: 'standard',
    priceInrMinor: 149900, // ₹ 1,499
    billingCurrency: 'INR',
    durationDays: 15,
    creativeSlots: 1,
    inventoryCapacity: 1,
    billingInterval: 'one_time',
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 10,
    priorityWeight: 1,
    features: [
      'Virtual Fridge Door Magnet',
      '15 Days Continuous Visibility',
      'Direct Click-Through Destination URL',
      'Real-Time Impressions & Clicks Tracking',
      'Sponsored Brand Badge',
    ],
    isActive: true,
    isArchived: false,
    priceSafeguardPolicy: 'new_only',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan_magnet_standard_30d',
    name: 'Standard Magnet Placement (30 Days)',
    placementId: 'fridge_magnet',
    tier: 'featured',
    priceInrMinor: 299900, // ₹ 2,999
    billingCurrency: 'INR',
    durationDays: 30,
    creativeSlots: 1,
    inventoryCapacity: 1,
    billingInterval: 'one_time',
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 10,
    priorityWeight: 2,
    features: [
      'Virtual Fridge Door Magnet',
      '30 Days Continuous Placement',
      'Choice of Door Placement Zone',
      'Direct Destination URL CTA',
      'Impression & Click Analytics',
      'Priority Admin Review',
    ],
    isActive: true,
    isArchived: false,
    priceSafeguardPolicy: 'new_only',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan_magnet_featured_60d',
    name: 'Featured Eye-Level Magnet (60 Days)',
    placementId: 'fridge_magnet',
    tier: 'premium',
    priceInrMinor: 549900, // ₹ 5,499
    billingCurrency: 'INR',
    durationDays: 60,
    creativeSlots: 2,
    inventoryCapacity: 1,
    billingInterval: 'one_time',
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 15,
    priorityWeight: 4,
    features: [
      'Prime Eye-Level Placement Guarantee',
      '60 Days Continuous Presence',
      'A/B Creative Artwork Replacement',
      'Higher Priority Display Weight',
      'Detailed Performance & CTR Reports',
      'Discount on Plan Renewal',
    ],
    isActive: true,
    isArchived: false,
    priceSafeguardPolicy: 'new_only',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan_magnet_exclusive_90d',
    name: 'Exclusive Center Spotlight Magnet (90 Days)',
    placementId: 'fridge_magnet',
    tier: 'exclusive',
    priceInrMinor: 799900, // ₹ 7,999
    billingCurrency: 'INR',
    durationDays: 90,
    creativeSlots: 3,
    inventoryCapacity: 1,
    billingInterval: 'one_time',
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 20,
    priorityWeight: 8,
    features: [
      'Exclusive Centerpiece Magnet Position',
      '90 Days Uninterrupted Placement',
      'Conflict-Free Dedicated Slot Guarantee',
      'Prominent Brand CTA Button',
      'Weekly Engagement Reports',
      'Dedicated Account Support',
    ],
    isActive: true,
    isArchived: false,
    priceSafeguardPolicy: 'new_only',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan_fridge_standard_30d',
    name: 'Fridge Shelf Placement — Standard (Legacy)',
    placementId: 'fridge_product',
    tier: 'standard',
    priceInrMinor: 499900,
    billingCurrency: 'INR',
    durationDays: 30,
    creativeSlots: 1,
    inventoryCapacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'model/gltf-binary'],
    maxFileSizeMb: 15,
    priorityWeight: 1,
    features: ['3D Shelf Placement (Archived)'],
    isActive: false,
    isArchived: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan_banner_standard_30d',
    name: 'Magnet Details Standard Banner (Legacy)',
    placementId: 'magnet_banner',
    tier: 'standard',
    priceInrMinor: 299900,
    billingCurrency: 'INR',
    durationDays: 30,
    creativeSlots: 1,
    inventoryCapacity: 1,
    supportedFormats: ['image/png', 'image/jpeg', 'image/webp'],
    maxFileSizeMb: 10,
    priorityWeight: 1,
    features: ['Header Banner (Archived)'],
    isActive: false,
    isArchived: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'plan_led_standard_30d',
    name: 'Digital LED Display (Legacy)',
    placementId: 'led_display',
    tier: 'standard',
    priceInrMinor: 399900,
    billingCurrency: 'INR',
    durationDays: 30,
    creativeSlots: 2,
    inventoryCapacity: 5,
    supportedFormats: ['image/png', 'image/jpeg', 'video/mp4'],
    maxFileSizeMb: 25,
    priorityWeight: 1,
    features: ['Digital LED Screen (Archived)'],
    isActive: false,
    isArchived: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// --------------------------------------------------------------------
// Helper for Safe Storage Access (Browser, Test, or Node)
// --------------------------------------------------------------------
const memoryStore = new Map<string, string>()

function getStorageInstance() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage
  }
  return {
    getItem: (key: string) => memoryStore.get(key) || null,
    setItem: (key: string, val: string) => {
      memoryStore.set(key, val)
    },
    removeItem: (key: string) => {
      memoryStore.delete(key)
    },
    clear: () => {
      memoryStore.clear()
    },
  }
}

function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const storage = getStorageInstance()
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    const storage = getStorageInstance()
    storage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Failed to save to localStorage (${key}):`, e)
  }
}

// --------------------------------------------------------------------
// 1. MERCHANT PROFILE SERVICE
// --------------------------------------------------------------------
export async function getMerchantProfile(userId: string): Promise<MerchantProfile | null> {
  // Check Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('merchant_profiles' as any)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      const row = data as any
      if (!error && row) {
        return {
          id: row.id,
          userId: row.user_id,
          businessName: row.business_name,
          contactPerson: row.contact_person,
          businessEmail: row.business_email,
          phoneNumber: row.phone_number,
          businessCategory: row.business_category,
          businessWebsite: row.business_website,
          logoUrl: row.logo_url,
          verificationStatus: row.verification_status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      }
    } catch {
      // Fallback to local
    }
  }

  // Fallback to local storage
  const profiles = getLocalItem<MerchantProfile[]>(MERCHANT_PROFILES_KEY, [])
  return profiles.find((p) => p.userId === userId) || null
}

export async function getAllMerchants(): Promise<MerchantProfile[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('merchant_profiles' as any)
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        return data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          businessName: d.business_name,
          contactPerson: d.contact_person,
          businessEmail: d.business_email,
          phoneNumber: d.phone_number,
          businessCategory: d.business_category,
          businessWebsite: d.business_website,
          logoUrl: d.logo_url,
          verificationStatus: d.verification_status,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }))
      }
    } catch {
      // Fallback
    }
  }

  return getLocalItem<MerchantProfile[]>(MERCHANT_PROFILES_KEY, [])
}

export async function registerMerchantProfile(params: {
  userId: string
  businessName: string
  contactPerson: string
  businessEmail: string
  phoneNumber: string
  businessCategory: string
  businessWebsite?: string | null
  logoUrl?: string | null
}): Promise<{ profile: MerchantProfile; error?: string }> {
  const newProfile: MerchantProfile = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `merchant_${Date.now()}`,
    userId: params.userId,
    businessName: params.businessName.trim(),
    contactPerson: params.contactPerson.trim(),
    businessEmail: params.businessEmail.trim().toLowerCase(),
    phoneNumber: params.phoneNumber.trim(),
    businessCategory: params.businessCategory,
    businessWebsite: params.businessWebsite?.trim() || null,
    logoUrl: params.logoUrl?.trim() || null,
    verificationStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Save to local storage
  const profiles = getLocalItem<MerchantProfile[]>(MERCHANT_PROFILES_KEY, [])
  const existingIndex = profiles.findIndex((p) => p.userId === params.userId)
  if (existingIndex >= 0) {
    profiles[existingIndex] = newProfile
  } else {
    profiles.push(newProfile)
  }
  setLocalItem(MERCHANT_PROFILES_KEY, profiles)

  // Sync to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('merchant_profiles' as any).upsert({
        id: newProfile.id,
        user_id: newProfile.userId,
        business_name: newProfile.businessName,
        contact_person: newProfile.contactPerson,
        business_email: newProfile.businessEmail,
        phone_number: newProfile.phoneNumber,
        business_category: newProfile.businessCategory,
        business_website: newProfile.businessWebsite,
        logo_url: newProfile.logoUrl,
        verification_status: newProfile.verificationStatus,
        updated_at: newProfile.updatedAt,
      })
    } catch {
      // Offline fallback already stored
    }
  }

  broadcastAdUpdate({ type: 'merchant_registered', profileId: newProfile.id })
  return { profile: newProfile }
}

export async function updateMerchantProfile(
  merchantId: string,
  updates: Partial<MerchantProfile>
): Promise<MerchantProfile> {
  const profiles = getLocalItem<MerchantProfile[]>(MERCHANT_PROFILES_KEY, [])
  const idx = profiles.findIndex((p) => p.id === merchantId)
  if (idx < 0) {
    throw new Error('Merchant profile not found')
  }

  const updated: MerchantProfile = {
    ...profiles[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  profiles[idx] = updated
  setLocalItem(MERCHANT_PROFILES_KEY, profiles)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('merchant_profiles' as any)
        .update({
          business_name: updated.businessName,
          contact_person: updated.contactPerson,
          business_email: updated.businessEmail,
          phone_number: updated.phoneNumber,
          business_category: updated.businessCategory,
          business_website: updated.businessWebsite,
          logo_url: updated.logoUrl,
          verification_status: updated.verificationStatus,
          updated_at: updated.updatedAt,
        })
        .eq('id', merchantId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'merchant_updated', profileId: merchantId })
  return updated
}

// --------------------------------------------------------------------
// 2. ADVERTISING INVENTORY & SLOTS
// --------------------------------------------------------------------
export async function getAdvertisingPlacements(): Promise<AdvertisingPlacement[]> {
  return DEFAULT_PLACEMENTS
}

export async function getAdvertisingSlots(placementId?: AdvertisingPlacementType): Promise<AdvertisingSlot[]> {
  const slots = getLocalItem<AdvertisingSlot[]>(AD_SLOTS_KEY, DEFAULT_SLOTS)
  if (placementId) {
    return slots.filter((s) => s.placementId === placementId && s.isActive)
  }
  return slots
}

export async function saveAdvertisingSlot(slot: AdvertisingSlot): Promise<void> {
  const slots = getLocalItem<AdvertisingSlot[]>(AD_SLOTS_KEY, DEFAULT_SLOTS)
  const idx = slots.findIndex((s) => s.id === slot.id)
  if (idx >= 0) {
    slots[idx] = slot
  } else {
    slots.push(slot)
  }
  setLocalItem(AD_SLOTS_KEY, slots)
  broadcastAdUpdate({ type: 'slot_saved', slotId: slot.id })
}

/**
 * Checks if a slot has conflict with another campaign in the requested date window.
 * Enforces exclusive slot rules and capacity constraints.
 */
export async function checkSlotAvailability(
  slotId: string,
  startDate: string,
  endDate: string,
  excludeCampaignId?: string
): Promise<{ isAvailable: boolean; conflictCampaign?: AdvertisingCampaign; reason?: string }> {
  const slots = await getAdvertisingSlots()
  const slot = slots.find((s) => s.id === slotId)
  if (!slot) {
    return { isAvailable: true }
  }

  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const reqStart = new Date(startDate).getTime()
  const reqEnd = new Date(endDate).getTime()

  const overlapping = campaigns.filter((c) => {
    if (c.id === excludeCampaignId) return false
    if (c.slotId !== slotId) return false
    if (c.status === 'rejected' || c.status === 'expired' || c.status === 'completed') return false

    const cStart = new Date(c.startDate).getTime()
    const cEnd = new Date(c.endDate).getTime()
    return cStart <= reqEnd && cEnd >= reqStart
  })

  if (slot.isExclusive && overlapping.length > 0) {
    const conflict = overlapping[0]
    return {
      isAvailable: false,
      conflictCampaign: conflict,
      reason: `Slot "${slot.name}" is exclusive and already booked by "${conflict.brandName || conflict.name}" from ${new Date(conflict.startDate).toLocaleDateString()} to ${new Date(conflict.endDate).toLocaleDateString()}.`,
    }
  }

  if (overlapping.length >= (slot.capacity || 1)) {
    const conflict = overlapping[0]
    return {
      isAvailable: false,
      conflictCampaign: conflict,
      reason: `Slot "${slot.name}" reached max capacity of ${slot.capacity} campaign(s) during this date window.`,
    }
  }

  return { isAvailable: true }
}

// --------------------------------------------------------------------
// 3. ADVERTISING PLANS
// --------------------------------------------------------------------
export async function getAdvertisingPlans(
  placementId?: AdvertisingPlacementType,
  activeOnly: boolean = false
): Promise<AdvertisingPlan[]> {
  const plans = getLocalItem<AdvertisingPlan[]>(AD_PLANS_KEY, DEFAULT_PLANS)
  let filtered = plans
  if (placementId) {
    filtered = filtered.filter((p) => p.placementId === placementId)
  }
  if (activeOnly) {
    filtered = filtered.filter((p) => p.isActive && !p.isArchived)
  }
  return filtered
}

export async function saveAdvertisingPlan(plan: AdvertisingPlan): Promise<void> {
  const plans = getLocalItem<AdvertisingPlan[]>(AD_PLANS_KEY, DEFAULT_PLANS)
  const idx = plans.findIndex((p) => p.id === plan.id)
  if (idx >= 0) {
    plans[idx] = plan
  } else {
    plans.push(plan)
  }
  setLocalItem(AD_PLANS_KEY, plans)
  broadcastAdUpdate({ type: 'plan_saved', planId: plan.id })
}

// --------------------------------------------------------------------
// 4. MERCHANT SUBSCRIPTIONS & VERIFIED PAYMENTS
// --------------------------------------------------------------------
export async function getMerchantSubscriptions(merchantId: string): Promise<MerchantSubscription[]> {
  const subs = getLocalItem<MerchantSubscription[]>(AD_SUBSCRIPTIONS_KEY, [])
  const plans = await getAdvertisingPlans()
  return subs
    .filter((s) => s.merchantId === merchantId)
    .map((s) => ({
      ...s,
      plan: plans.find((p) => p.id === s.planId),
    }))
}

export async function getActiveSubscriptionForPlacement(
  merchantId: string,
  placementId: AdvertisingPlacementType
): Promise<MerchantSubscription | null> {
  const subs = await getMerchantSubscriptions(merchantId)
  const now = new Date().getTime()
  return (
    subs.find(
      (s) =>
        s.status === 'active' &&
        s.plan?.placementId === placementId &&
        new Date(s.currentPeriodEnd).getTime() > now
    ) || null
  )
}

/**
 * Creates and executes a verifiable payment transaction for a subscription plan
 */
export async function purchaseSubscriptionWithSandboxPayment(params: {
  merchantId: string
  planId: string
  paymentMethod: string
  cardOrUpiRef?: string
}): Promise<{
  subscription: MerchantSubscription
  payment: PaymentTransaction
}> {
  const plans = await getAdvertisingPlans()
  const plan = plans.find((p) => p.id === params.planId)
  if (!plan) {
    throw new Error('Selected advertising subscription plan does not exist.')
  }

  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)

  const subscriptionId =
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sub_${Date.now()}`
  const orderId = `order_mag_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const paymentId = `pay_mag_${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const signature = `sig_${Date.now()}_verified_sandbox_token`

  // 1. Create Payment Transaction
  const payment: PaymentTransaction = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `payment_${Date.now()}`,
    merchantId: params.merchantId,
    subscriptionId,
    amountMinor: plan.priceInrMinor,
    currency: plan.billingCurrency,
    gateway: 'magneto_sandbox_verified',
    gatewayOrderId: orderId,
    gatewayPaymentId: paymentId,
    gatewaySignature: signature,
    status: 'success',
    paymentMethod: params.paymentMethod || 'upi_autopay',
    receiptUrl: `https://magnetos.in/receipts/${orderId}`,
    metadata: {
      planName: plan.name,
      durationDays: plan.durationDays,
      paymentTimestamp: new Date().toISOString(),
      cardOrUpiRef: params.cardOrUpiRef || 'merchant@okaxis',
      sandboxVerified: true,
    },
    createdAt: new Date().toISOString(),
  }

  // 2. Create Active Subscription
  const subscription: MerchantSubscription = {
    id: subscriptionId,
    merchantId: params.merchantId,
    planId: plan.id,
    status: 'active',
    currentPeriodStart: startDate.toISOString(),
    currentPeriodEnd: endDate.toISOString(),
    paymentMethod: params.paymentMethod || 'upi_autopay',
    autoRenew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plan,
  }

  // Save subscription
  const subs = getLocalItem<MerchantSubscription[]>(AD_SUBSCRIPTIONS_KEY, [])
  subs.unshift(subscription)
  setLocalItem(AD_SUBSCRIPTIONS_KEY, subs)

  // Save payment
  const payments = getLocalItem<PaymentTransaction[]>(AD_PAYMENTS_KEY, [])
  payments.unshift(payment)
  setLocalItem(AD_PAYMENTS_KEY, payments)

  // Sync to Supabase if configured
  if (isSupabaseConfigured) {
    try {
      await supabase.from('merchant_subscriptions' as any).insert({
        id: subscription.id,
        merchant_id: subscription.merchantId,
        plan_id: subscription.planId,
        status: subscription.status,
        current_period_start: subscription.currentPeriodStart,
        current_period_end: subscription.currentPeriodEnd,
        payment_method: subscription.paymentMethod,
        auto_renew: subscription.autoRenew,
      })
      await supabase.from('advertising_payments' as any).insert({
        id: payment.id,
        merchant_id: payment.merchantId,
        subscription_id: payment.subscriptionId,
        amount_minor: payment.amountMinor,
        currency: payment.currency,
        gateway: payment.gateway,
        gateway_order_id: payment.gatewayOrderId,
        gateway_payment_id: payment.gatewayPaymentId,
        gateway_signature: payment.gatewaySignature,
        status: payment.status,
        payment_method: payment.paymentMethod,
        metadata: payment.metadata,
      })
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'subscription_activated', subscriptionId })
  return { subscription, payment }
}

export async function getMerchantPayments(merchantId: string): Promise<PaymentTransaction[]> {
  const payments = getLocalItem<PaymentTransaction[]>(AD_PAYMENTS_KEY, [])
  return payments.filter((p) => p.merchantId === merchantId)
}

// --------------------------------------------------------------------
// 5. CREATIVE LIBRARY
// --------------------------------------------------------------------
export async function getMerchantCreatives(
  merchantId: string,
  placementCategory?: AdvertisingPlacementType
): Promise<AdvertisingCreative[]> {
  const creatives = getLocalItem<AdvertisingCreative[]>(AD_CREATIVES_KEY, [])
  let list = creatives.filter((c) => c.merchantId === merchantId)
  if (placementCategory) {
    list = list.filter((c) => c.placementCategory === placementCategory)
  }
  return list
}

export async function addCreativeAsset(params: {
  merchantId: string
  name: string
  creativeType: 'image' | 'video' | '3d_model'
  placementCategory: AdvertisingPlacementType
  fileUrl: string
  thumbnailUrl?: string | null
  aspectRatio?: string
  fileSizeBytes: number
  mimeType: string
  dimensions?: { width: number; height: number }
  modelMetadata?: Record<string, unknown>
}): Promise<AdvertisingCreative> {
  const creative: AdvertisingCreative = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `creative_${Date.now()}`,
    merchantId: params.merchantId,
    name: params.name.trim(),
    creativeType: params.creativeType,
    placementCategory: params.placementCategory,
    fileUrl: params.fileUrl,
    thumbnailUrl: params.thumbnailUrl || params.fileUrl,
    aspectRatio: params.aspectRatio || '1:1',
    fileSizeBytes: params.fileSizeBytes,
    mimeType: params.mimeType,
    dimensions: params.dimensions || { width: 800, height: 800 },
    modelMetadata: params.modelMetadata || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const creatives = getLocalItem<AdvertisingCreative[]>(AD_CREATIVES_KEY, [])
  creatives.unshift(creative)
  setLocalItem(AD_CREATIVES_KEY, creatives)

  if (isSupabaseConfigured) {
    try {
      await supabase.from('advertising_creatives' as any).insert({
        id: creative.id,
        merchant_id: creative.merchantId,
        name: creative.name,
        creative_type: creative.creativeType,
        placement_category: creative.placementCategory,
        file_url: creative.fileUrl,
        thumbnail_url: creative.thumbnailUrl,
        aspect_ratio: creative.aspectRatio,
        file_size_bytes: creative.fileSizeBytes,
        mime_type: creative.mimeType,
        dimensions: creative.dimensions,
        model_metadata: creative.modelMetadata,
      })
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'creative_added', creativeId: creative.id })
  return creative
}

export async function deleteCreativeAsset(creativeId: string, merchantId: string): Promise<void> {
  const creatives = getLocalItem<AdvertisingCreative[]>(AD_CREATIVES_KEY, [])
  const filtered = creatives.filter((c) => !(c.id === creativeId && c.merchantId === merchantId))
  setLocalItem(AD_CREATIVES_KEY, filtered)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('advertising_creatives' as any)
        .delete()
        .eq('id', creativeId)
        .eq('merchant_id', merchantId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'creative_deleted', creativeId })
}

export async function updateCreativeAsset(
  creativeId: string,
  merchantId: string,
  updates: Partial<AdvertisingCreative>
): Promise<AdvertisingCreative> {
  const creatives = getLocalItem<AdvertisingCreative[]>(AD_CREATIVES_KEY, [])
  const idx = creatives.findIndex((c) => c.id === creativeId && c.merchantId === merchantId)
  if (idx < 0) throw new Error('Creative not found')

  const updated: AdvertisingCreative = {
    ...creatives[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  creatives[idx] = updated
  setLocalItem(AD_CREATIVES_KEY, creatives)
  broadcastAdUpdate({ type: 'creative_updated', creativeId })
  return updated
}

// --------------------------------------------------------------------
// 6. CAMPAIGN MANAGEMENT & STATE MACHINE
// --------------------------------------------------------------------
export async function getMerchantCampaigns(merchantId: string): Promise<AdvertisingCampaign[]> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const slots = await getAdvertisingSlots()
  const subs = await getMerchantSubscriptions(merchantId)

  return campaigns
    .filter((c) => c.merchantId === merchantId)
    .map((c) => ({
      ...c,
      slot: slots.find((s) => s.id === c.slotId),
      subscription: subs.find((s) => s.id === c.subscriptionId),
    }))
}

export async function getAllCampaigns(): Promise<AdvertisingCampaign[]> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const merchants = await getAllMerchants()
  const slots = await getAdvertisingSlots()

  return campaigns.map((c) => ({
    ...c,
    merchant: merchants.find((m) => m.id === c.merchantId),
    slot: slots.find((s) => s.id === c.slotId),
  }))
}

const PLATFORM_SETTINGS_KEY = 'magneto_platform_settings_v1'

interface PlatformSettingsLite {
  globalAdvertisingEnabled: boolean
  disabledPlacements: string[]
  pausedMerchantIds: string[]
  adModerationRequired: boolean
}

function getPlatformSettingsFromStorage(): PlatformSettingsLite {
  return getLocalItem<PlatformSettingsLite>(PLATFORM_SETTINGS_KEY, {
    globalAdvertisingEnabled: true,
    disabledPlacements: [],
    pausedMerchantIds: [],
    adModerationRequired: true,
  })
}

/**
 * Public delivery filter: fetches only active, approved campaigns valid right now.
 * Strictly respects central platform settings, disabled placements, and merchant suspensions.
 */
export async function getPublicActiveCampaigns(
  placementId: AdvertisingPlacementType = 'fridge_magnet'
): Promise<AdvertisingCampaign[]> {
  const settings = getPlatformSettingsFromStorage()

  // 1. Central advertising enable/disable setting enforced by backend/service layer
  if (!settings.globalAdvertisingEnabled) {
    return []
  }

  // 2. Specific placement disable switch
  if (settings.disabledPlacements?.includes(placementId)) {
    return []
  }

  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const merchants = await getAllMerchants()
  const now = new Date().getTime()

  let active = campaigns.filter((c) => {
    if (c.status !== 'active') return false
    if (c.isGloballyPaused) return false
    if (c.isPaid === false) return false

    // 3. Specific merchant paused list
    if (settings.pausedMerchantIds?.includes(c.merchantId)) return false

    // 4. Suspended merchant account check
    const m = merchants.find((x) => x.id === c.merchantId)
    if (m && m.accountStatus === 'suspended') return false

    // 5. If placement is disabled
    if (settings.disabledPlacements?.includes(c.placementId)) return false

    const start = new Date(c.startDate).getTime()
    const end = new Date(c.endDate).getTime()
    return now >= start && now <= end
  })

  active = active.filter((c) => c.placementId === placementId)

  // Sort by priority weight descending
  active.sort((a, b) => (b.priorityWeight || 1) - (a.priorityWeight || 1))

  return active
}

export async function createCampaign(params: {
  merchantId: string
  subscriptionId?: string | null
  placementId?: AdvertisingPlacementType
  slotId?: string | null
  name: string
  brandName: string
  productName: string
  description?: string | null
  destinationUrl: string
  ctaText?: string
  creativeId?: string | null
  creativeUrl: string
  model3dUrl?: string | null
  shelf?: any
  positionX?: number
  positionY?: number
  displayScale?: number
  startDate: string
  endDate: string
  isPaid?: boolean
  paymentTransactionId?: string | null
  submitForApproval?: boolean
  priorityWeight?: number
  budgetLimitMinor?: number
  internalNotes?: string | null
}): Promise<AdvertisingCampaign> {
  // Check slot availability if slot is specified
  if (params.slotId) {
    const slotCheck = await checkSlotAvailability(params.slotId, params.startDate, params.endDate)
    if (!slotCheck.isAvailable) {
      throw new Error(slotCheck.reason || 'Selected magnet slot is not available for the requested campaign dates.')
    }
  }

  const settings = getPlatformSettingsFromStorage()
  const requiresModeration = params.submitForApproval || settings.adModerationRequired

  const newCampaign: AdvertisingCampaign = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `camp_${Date.now()}`,
    merchantId: params.merchantId,
    subscriptionId: params.subscriptionId || null,
    placementId: params.placementId || 'fridge_magnet',
    slotId: params.slotId || null,
    name: params.name.trim(),
    brandName: params.brandName.trim(),
    productName: params.productName.trim(),
    description: params.description?.trim() || null,
    destinationUrl: params.destinationUrl.trim(),
    ctaText: params.ctaText?.trim() || 'Shop Now',
    creativeId: params.creativeId || null,
    creativeUrl: params.creativeUrl,
    model3dUrl: params.model3dUrl || null,
    shelf: params.shelf || 'middle_shelf',
    positionX: params.positionX ?? 50,
    positionY: params.positionY ?? 30,
    displayScale: params.displayScale ?? 1.0,
    status: requiresModeration ? 'pending_approval' : 'active',
    isPaid: params.isPaid !== undefined ? params.isPaid : true,
    paymentTransactionId: params.paymentTransactionId || null,
    startDate: params.startDate,
    endDate: params.endDate,
    priorityWeight: params.priorityWeight || 1,
    budgetLimitMinor: params.budgetLimitMinor,
    internalNotes: params.internalNotes || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  campaigns.unshift(newCampaign)
  setLocalItem(AD_CAMPAIGNS_KEY, campaigns)

  if (isSupabaseConfigured) {
    try {
      await supabase.from('advertising_campaigns' as any).insert({
        id: newCampaign.id,
        merchant_id: newCampaign.merchantId,
        subscription_id: newCampaign.subscriptionId,
        placement_id: newCampaign.placementId,
        slot_id: newCampaign.slotId,
        name: newCampaign.name,
        brand_name: newCampaign.brandName,
        product_name: newCampaign.productName,
        description: newCampaign.description,
        destination_url: newCampaign.destinationUrl,
        cta_text: newCampaign.ctaText,
        creative_id: newCampaign.creativeId,
        creative_url: newCampaign.creativeUrl,
        model_3d_url: newCampaign.model3dUrl,
        shelf: newCampaign.shelf,
        position_x: newCampaign.positionX,
        position_y: newCampaign.positionY,
        display_scale: newCampaign.displayScale,
        status: newCampaign.status,
        is_paid: newCampaign.isPaid,
        payment_transaction_id: newCampaign.paymentTransactionId,
        start_date: newCampaign.startDate,
        end_date: newCampaign.endDate,
      })
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'campaign_created', campaignId: newCampaign.id })
  return newCampaign
}

export async function updateCampaign(
  campaignId: string,
  merchantId: string,
  updates: Partial<AdvertisingCampaign>
): Promise<AdvertisingCampaign> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const idx = campaigns.findIndex((c) => c.id === campaignId && c.merchantId === merchantId)
  if (idx < 0) throw new Error('Campaign not found')

  const original = campaigns[idx]

  // If material creative changes occur on an active campaign, require re-approval
  let nextStatus = updates.status || original.status
  if (
    original.status === 'active' &&
    ((updates.creativeUrl && updates.creativeUrl !== original.creativeUrl) ||
     (updates.destinationUrl && updates.destinationUrl !== original.destinationUrl))
  ) {
    nextStatus = 'pending_approval'
  }

  const updated: AdvertisingCampaign = {
    ...original,
    ...updates,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  }
  campaigns[idx] = updated
  setLocalItem(AD_CAMPAIGNS_KEY, campaigns)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('advertising_campaigns' as any)
        .update({
          name: updated.name,
          brand_name: updated.brandName,
          product_name: updated.productName,
          description: updated.description,
          destination_url: updated.destinationUrl,
          cta_text: updated.ctaText,
          creative_url: updated.creativeUrl,
          model_3d_url: updated.model3dUrl,
          shelf: updated.shelf,
          position_x: updated.positionX,
          position_y: updated.positionY,
          display_scale: updated.displayScale,
          status: updated.status,
          updated_at: updated.updatedAt,
        })
        .eq('id', campaignId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'campaign_updated', campaignId })
  return updated
}

// --------------------------------------------------------------------
// Admin Actions: Approve, Reject, Request Changes, Expire, Pause, Resume
// --------------------------------------------------------------------
export async function adminApproveCampaign(campaignId: string): Promise<void> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const idx = campaigns.findIndex((c) => c.id === campaignId)
  if (idx < 0) throw new Error('Campaign not found')

  campaigns[idx].status = 'active'
  campaigns[idx].rejectionReason = null
  campaigns[idx].changeRequestNote = null
  campaigns[idx].updatedAt = new Date().toISOString()
  setLocalItem(AD_CAMPAIGNS_KEY, campaigns)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('advertising_campaigns' as any)
        .update({ status: 'active', rejection_reason: null, change_request_note: null, updated_at: new Date().toISOString() })
        .eq('id', campaignId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'campaign_approved', campaignId })
}

export async function adminRejectCampaign(campaignId: string, reason: string): Promise<void> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const idx = campaigns.findIndex((c) => c.id === campaignId)
  if (idx < 0) throw new Error('Campaign not found')

  campaigns[idx].status = 'rejected'
  campaigns[idx].rejectionReason = reason
  campaigns[idx].updatedAt = new Date().toISOString()
  setLocalItem(AD_CAMPAIGNS_KEY, campaigns)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('advertising_campaigns' as any)
        .update({ status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
        .eq('id', campaignId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'campaign_rejected', campaignId })
}

export async function adminRequestChanges(campaignId: string, note: string): Promise<void> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const idx = campaigns.findIndex((c) => c.id === campaignId)
  if (idx < 0) throw new Error('Campaign not found')

  campaigns[idx].status = 'rejected'
  campaigns[idx].changeRequestNote = note
  campaigns[idx].rejectionReason = `Revision Requested: ${note}`
  campaigns[idx].updatedAt = new Date().toISOString()
  setLocalItem(AD_CAMPAIGNS_KEY, campaigns)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('advertising_campaigns' as any)
        .update({
          status: 'rejected',
          change_request_note: note,
          rejection_reason: `Revision Requested: ${note}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'campaign_rejected', campaignId })
}

export async function adminExpireCampaign(campaignId: string): Promise<void> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const idx = campaigns.findIndex((c) => c.id === campaignId)
  if (idx < 0) throw new Error('Campaign not found')

  campaigns[idx].status = 'expired'
  campaigns[idx].updatedAt = new Date().toISOString()
  setLocalItem(AD_CAMPAIGNS_KEY, campaigns)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('advertising_campaigns' as any)
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', campaignId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'campaign_status_changed', campaignId, status: 'expired' })
}

export async function adminSetCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const idx = campaigns.findIndex((c) => c.id === campaignId)
  if (idx < 0) throw new Error('Campaign not found')

  campaigns[idx].status = status
  campaigns[idx].updatedAt = new Date().toISOString()
  setLocalItem(AD_CAMPAIGNS_KEY, campaigns)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('advertising_campaigns' as any)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', campaignId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'campaign_status_changed', campaignId, status })
}

export async function adminUpdateCampaignFull(
  campaignId: string,
  updates: Partial<AdvertisingCampaign>
): Promise<AdvertisingCampaign> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const idx = campaigns.findIndex((c) => c.id === campaignId)
  if (idx < 0) throw new Error('Campaign not found')

  const updated: AdvertisingCampaign = {
    ...campaigns[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  campaigns[idx] = updated
  setLocalItem(AD_CAMPAIGNS_KEY, campaigns)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('advertising_campaigns' as any)
        .update({
          name: updated.name,
          brand_name: updated.brandName,
          product_name: updated.productName,
          description: updated.description,
          destination_url: updated.destinationUrl,
          cta_text: updated.ctaText,
          creative_url: updated.creativeUrl,
          model_3d_url: updated.model3dUrl,
          shelf: updated.shelf,
          position_x: updated.positionX,
          display_scale: updated.displayScale,
          status: updated.status,
          start_date: updated.startDate,
          end_date: updated.endDate,
          updated_at: updated.updatedAt,
        })
        .eq('id', campaignId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'campaign_updated', campaignId })
  return updated
}

export async function adminDeleteCampaignPermanent(campaignId: string): Promise<void> {
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  const filtered = campaigns.filter((c) => c.id !== campaignId)
  setLocalItem(AD_CAMPAIGNS_KEY, filtered)

  if (isSupabaseConfigured) {
    try {
      await supabase.from('advertising_campaigns' as any).delete().eq('id', campaignId)
    } catch {
      // Ignored
    }
  }

  broadcastAdUpdate({ type: 'campaign_deleted', campaignId })
}

// --------------------------------------------------------------------
// 7. REAL ADVERTISING EVENTS & ANALYTICS
// --------------------------------------------------------------------
export async function trackAdvertisingEvent(params: {
  campaignId: string
  eventType: 'impression' | 'click' | 'interaction' | 'fridge_product_inspect'
  placementType: AdvertisingPlacementType
  metadata?: Record<string, unknown>
}): Promise<void> {
  const event: AdvertisingEvent = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `evt_${Date.now()}`,
    campaignId: params.campaignId,
    eventType: params.eventType,
    placementType: params.placementType,
    metadata: params.metadata || {},
    createdAt: new Date().toISOString(),
  }

  const events = getLocalItem<AdvertisingEvent[]>(AD_EVENTS_KEY, [])
  // Retain recent 1000 events in local storage
  events.push(event)
  if (events.length > 1000) {
    events.shift()
  }
  setLocalItem(AD_EVENTS_KEY, events)

  if (isSupabaseConfigured) {
    try {
      await supabase.from('advertising_events' as any).insert({
        id: event.id,
        campaign_id: event.campaignId,
        event_type: event.eventType,
        placement_type: event.placementType,
        metadata: event.metadata,
      })
    } catch {
      // Ignored
    }
  }
}

export async function getMerchantAnalytics(merchantId: string): Promise<MerchantMetrics> {
  const campaigns = await getMerchantCampaigns(merchantId)
  const payments = await getMerchantPayments(merchantId)
  const events = getLocalItem<AdvertisingEvent[]>(AD_EVENTS_KEY, [])

  const merchantCampaignIds = new Set(campaigns.map((c) => c.id))
  const relevantEvents = events.filter((e) => merchantCampaignIds.has(e.campaignId))

  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length
  const totalPlacements = campaigns.length

  const impressions = relevantEvents.filter((e) => e.eventType === 'impression').length
  const clicks = relevantEvents.filter((e) => e.eventType === 'click').length
  const productInteractions = relevantEvents.filter(
    (e) => e.eventType === 'fridge_product_inspect' || e.eventType === 'interaction'
  ).length

  const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0
  const totalSpendMinor = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amountMinor, 0)

  return {
    activeCampaigns,
    totalPlacements,
    subscriptionStatus: activeCampaigns > 0 ? 'Active Subscription' : 'No Active Plan',
    totalSpendMinor,
    impressions,
    clicks,
    ctr,
    productInteractions,
  }
}

// --------------------------------------------------------------------
// 8. SAMPLE SEED DATA GENERATOR FOR SANDBOX / PREVIEWS
// --------------------------------------------------------------------
export function populateSandboxMerchantData(userId: string) {
  // Check if already populated
  const existingMerchant = getLocalItem<MerchantProfile[]>(MERCHANT_PROFILES_KEY, []).find(
    (m) => m.userId === userId
  )
  if (existingMerchant) return existingMerchant

  const merchantId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `merchant_sample_1`
  const sampleMerchant: MerchantProfile = {
    id: merchantId,
    userId,
    businessName: 'Himalayan Organic Brews',
    contactPerson: 'Aditi Sharma',
    businessEmail: 'aditi@himalayanbrews.in',
    phoneNumber: '+91 98765 43210',
    businessCategory: 'Food & Beverage',
    businessWebsite: 'https://himalayanbrews.in',
    logoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=200&q=80',
    verificationStatus: 'verified',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  // Register profile
  const profiles = getLocalItem<MerchantProfile[]>(MERCHANT_PROFILES_KEY, [])
  profiles.push(sampleMerchant)
  setLocalItem(MERCHANT_PROFILES_KEY, profiles)

  // Add 1 sample subscription
  const plan = DEFAULT_PLANS[1] // Featured Shelf Placement
  const startDate = new Date()
  const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)

  const sampleSub: MerchantSubscription = {
    id: `sub_${merchantId}_1`,
    merchantId,
    planId: plan.id,
    status: 'active',
    currentPeriodStart: startDate.toISOString(),
    currentPeriodEnd: endDate.toISOString(),
    paymentMethod: 'upi_autopay',
    autoRenew: true,
    createdAt: startDate.toISOString(),
    updatedAt: startDate.toISOString(),
    plan,
  }
  const subs = getLocalItem<MerchantSubscription[]>(AD_SUBSCRIPTIONS_KEY, [])
  subs.push(sampleSub)
  setLocalItem(AD_SUBSCRIPTIONS_KEY, subs)

  // Add sample creatives
  const sampleCreatives: AdvertisingCreative[] = [
    {
      id: `creative_${merchantId}_fridge_juice`,
      merchantId,
      name: 'Himalayan Cold-Pressed Apple Juice',
      creativeType: '3d_model',
      placementCategory: 'fridge_product',
      fileUrl: '/assets/products/orange-juice.png',
      thumbnailUrl: '/assets/products/orange-juice.png',
      aspectRatio: '1:1',
      fileSizeBytes: 2450000,
      mimeType: 'model/gltf-binary',
      dimensions: { width: 800, height: 800 },
      modelMetadata: { modelPath: '/assets/products/3d/orange-juice.glb' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `creative_${merchantId}_magnet_banner`,
      merchantId,
      name: 'Santorini Sunset Flight & Stay Pass',
      creativeType: 'image',
      placementCategory: 'magnet_banner',
      fileUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      aspectRatio: '16:9',
      fileSizeBytes: 1200000,
      mimeType: 'image/jpeg',
      dimensions: { width: 1200, height: 400 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: `creative_${merchantId}_led_promo`,
      merchantId,
      name: 'Summer Wanderlust Travel Gear Promo',
      creativeType: 'image',
      placementCategory: 'led_display',
      fileUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80',
      thumbnailUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80',
      aspectRatio: '16:9',
      fileSizeBytes: 1850000,
      mimeType: 'image/jpeg',
      dimensions: { width: 1920, height: 1080 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
  const creatives = getLocalItem<AdvertisingCreative[]>(AD_CREATIVES_KEY, [])
  creatives.push(...sampleCreatives)
  setLocalItem(AD_CREATIVES_KEY, creatives)

  // Add 3 sample active campaigns (one for each placement category)
  const sampleCampaigns: AdvertisingCampaign[] = [
    {
      id: `camp_${merchantId}_fridge_product`,
      merchantId,
      subscriptionId: sampleSub.id,
      placementId: 'fridge_product',
      slotId: 'slot_fridge_middle_shelf_featured',
      name: 'Organic Himalayan Apple Juice - Spring Campaign',
      brandName: 'Himalayan Organic',
      productName: 'Kinnaur Cold-Pressed Apple Juice',
      description: '100% natural cold pressed juice straight from high altitude orchards in Kinnaur.',
      destinationUrl: 'https://himalayanbrews.in/products/kinnaur-apple',
      ctaText: 'Taste Purity',
      creativeId: sampleCreatives[0].id,
      creativeUrl: '/assets/products/orange-juice.png',
      model3dUrl: '/assets/products/3d/orange-juice.glb',
      shelf: 'middle_shelf',
      positionX: 50,
      displayScale: 1.05,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: startDate.toISOString(),
      updatedAt: startDate.toISOString(),
    },
    {
      id: `camp_${merchantId}_magnet_banner`,
      merchantId,
      subscriptionId: sampleSub.id,
      placementId: 'magnet_banner',
      slotId: 'slot_banner_sidebar_top',
      name: 'Santorini Luxury Villa Exclusive Offer',
      brandName: 'Aegean Escapes',
      productName: 'Santorini Cliffside Stay & Wine Tour',
      description: 'Book 3 nights in Oia and receive complimentary sunset catamaran cruise.',
      destinationUrl: 'https://aegeanescapes.example/santorini-special',
      ctaText: 'Claim 20% Off',
      creativeId: sampleCreatives[1].id,
      creativeUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: startDate.toISOString(),
      updatedAt: startDate.toISOString(),
    },
    {
      id: `camp_${merchantId}_led_tv`,
      merchantId,
      subscriptionId: sampleSub.id,
      placementId: 'led_display',
      slotId: 'slot_led_tv_main',
      name: 'Wanderlust Explorer Backpack Showcase',
      brandName: 'Wanderer Gear',
      productName: 'Ultralight Waterproof 45L Pack',
      description: 'Engineered for European cobblestones and Himalayan passes. Lifetime guarantee.',
      destinationUrl: 'https://wanderergear.example/ultralight-pack',
      ctaText: 'Explore Gear',
      creativeId: sampleCreatives[2].id,
      creativeUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80',
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      createdAt: startDate.toISOString(),
      updatedAt: startDate.toISOString(),
    },
  ]
  const campaigns = getLocalItem<AdvertisingCampaign[]>(AD_CAMPAIGNS_KEY, [])
  campaigns.push(...sampleCampaigns)
  setLocalItem(AD_CAMPAIGNS_KEY, campaigns)

  // Seed sample analytics events
  const sampleEvents: AdvertisingEvent[] = []
  for (let i = 0; i < 48; i++) {
    sampleEvents.push({
      id: `evt_sample_${i}`,
      campaignId: sampleCampaigns[i % 3].id,
      eventType: i % 5 === 0 ? 'click' : i % 7 === 0 ? 'fridge_product_inspect' : 'impression',
      placementType: sampleCampaigns[i % 3].placementId,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
    })
  }
  const events = getLocalItem<AdvertisingEvent[]>(AD_EVENTS_KEY, [])
  events.push(...sampleEvents)
  setLocalItem(AD_EVENTS_KEY, events)

  broadcastAdUpdate({ type: 'sample_data_populated', merchantId })
  return sampleMerchant
}
