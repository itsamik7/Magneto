import type { FridgeShelf } from './fridgeProduct'

export type AdvertisingPlacementType =
  | 'fridge_magnet'
  | 'magnet_banner'
  | 'fridge_product'
  | 'led_display'

export type CampaignStatus =
  | 'draft'
  | 'pending_payment'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'rejected'
  | 'completed'
  | 'expired'

export type SubscriptionStatus = 'pending_payment' | 'active' | 'cancelled' | 'expired'
export type PlanTier = 'standard' | 'featured' | 'premium' | 'exclusive'
export type CreativeType = 'image' | 'video' | '3d_model'

export interface MerchantProfile {
  id: string
  userId: string
  businessName: string
  contactPerson: string
  businessEmail: string
  phoneNumber: string
  businessCategory: string
  businessWebsite?: string | null
  logoUrl?: string | null
  verificationStatus: 'pending' | 'verified' | 'rejected'
  accountStatus?: 'active' | 'suspended' | 'restricted'
  suspensionReason?: string | null
  adminNotes?: string | null
  customDiscountPercentage?: number
  createdAt: string
  updatedAt: string
}

export interface AdvertisingPlacement {
  id: AdvertisingPlacementType
  name: string
  description: string
  category: AdvertisingPlacementType
  isActive: boolean
  createdAt: string
}

export interface AdvertisingSlot {
  id: string
  name: string
  placementId: AdvertisingPlacementType
  locationDescription: string
  shelf?: FridgeShelf | null
  defaultPositionX?: number
  defaultPositionY?: number
  defaultDisplayScale?: number
  magnetFormat?: 'standard' | 'compact' | 'showcase' | 'horizontal'
  capacity: number
  supportedFormats: string[]
  maxFileSizeMb: number
  isExclusive: boolean
  isActive: boolean
  displayOrder: number
  createdAt: string
}

export interface AdvertisingPlan {
  id: string
  name: string
  placementId: AdvertisingPlacementType
  tier: PlanTier
  priceInrMinor: number
  billingCurrency: string
  durationDays: number
  creativeSlots: number
  inventoryCapacity: number
  billingInterval?: 'one_time' | 'monthly' | 'quarterly' | 'annual'
  supportedFormats: string[]
  maxFileSizeMb: number
  priorityWeight: number
  features: string[]
  isActive: boolean
  isArchived?: boolean
  priceSafeguardPolicy?: 'new_only' | 'immediate' | 'renewal'
  createdAt: string
  updatedAt: string
}

export interface MerchantSubscription {
  id: string
  merchantId: string
  planId: string
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  paymentMethod: string
  autoRenew: boolean
  createdAt: string
  updatedAt: string
  plan?: AdvertisingPlan
}

export interface AdvertisingCreative {
  id: string
  merchantId: string
  name: string
  creativeType: CreativeType
  placementCategory: AdvertisingPlacementType
  fileUrl: string
  thumbnailUrl?: string | null
  aspectRatio?: string
  fileSizeBytes: number
  mimeType: string
  dimensions?: { width: number; height: number }
  modelMetadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface AdvertisingCampaign {
  id: string
  merchantId: string
  subscriptionId?: string | null
  placementId: AdvertisingPlacementType
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
  shelf?: FridgeShelf | null
  positionX?: number
  positionY?: number
  displayScale?: number
  status: CampaignStatus
  isPaid?: boolean
  paymentTransactionId?: string | null
  rejectionReason?: string | null
  changeRequestNote?: string | null
  internalNotes?: string | null
  isGloballyPaused?: boolean
  priorityWeight?: number
  budgetLimitMinor?: number
  startDate: string
  endDate: string
  createdAt: string
  updatedAt: string
  merchant?: MerchantProfile
  slot?: AdvertisingSlot
  subscription?: MerchantSubscription
}

export interface PaymentTransaction {
  id: string
  merchantId: string
  subscriptionId?: string | null
  amountMinor: number
  currency: string
  gateway: string
  gatewayOrderId: string
  gatewayPaymentId?: string | null
  gatewaySignature?: string | null
  status: 'pending' | 'success' | 'failed' | 'refunded'
  paymentMethod: string
  receiptUrl?: string | null
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface AdvertisingEvent {
  id: string
  campaignId: string
  eventType: 'impression' | 'click' | 'interaction' | 'fridge_product_inspect'
  placementType: AdvertisingPlacementType
  visitorIpHash?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface MerchantMetrics {
  activeCampaigns: number
  totalPlacements: number
  subscriptionStatus: string
  totalSpendMinor: number
  impressions: number
  clicks: number
  ctr: number
  productInteractions: number
}
