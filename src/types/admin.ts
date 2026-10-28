export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'operations_admin'
  | 'advertising_manager'
  | 'billing_manager'
  | 'support_agent'

export interface AdminRolePermission {
  role: AdminRole
  label: string
  description: string
  canManageSettings: boolean
  canManageRoles: boolean
  canManageAdvertisements: boolean
  canGlobalPauseAds: boolean
  canManagePlacements: boolean
  canManagePlansAndPricing: boolean
  canManageMerchants: boolean
  canImpersonateMerchants: boolean
  canManageUsers: boolean
  canViewFinancialsAndRefund: boolean
  canViewAuditLogs: boolean
  canExportData: boolean
}

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminRolePermission> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super Administrator',
    description: 'Full unconstrained platform-level authority across all operations and configurations.',
    canManageSettings: true,
    canManageRoles: true,
    canManageAdvertisements: true,
    canGlobalPauseAds: true,
    canManagePlacements: true,
    canManagePlansAndPricing: true,
    canManageMerchants: true,
    canImpersonateMerchants: true,
    canManageUsers: true,
    canViewFinancialsAndRefund: true,
    canViewAuditLogs: true,
    canExportData: true,
  },
  admin: {
    role: 'admin',
    label: 'Platform Administrator',
    description: 'Full unconstrained platform-level authority across all operations and configurations.',
    canManageSettings: true,
    canManageRoles: true,
    canManageAdvertisements: true,
    canGlobalPauseAds: true,
    canManagePlacements: true,
    canManagePlansAndPricing: true,
    canManageMerchants: true,
    canImpersonateMerchants: true,
    canManageUsers: true,
    canViewFinancialsAndRefund: true,
    canViewAuditLogs: true,
    canExportData: true,
  },
  operations_admin: {
    role: 'operations_admin',
    label: 'Operations Admin',
    description: 'Handles day-to-day user, merchant, campaign moderation, and dispute resolution.',
    canManageSettings: false,
    canManageRoles: false,
    canManageAdvertisements: true,
    canGlobalPauseAds: true,
    canManagePlacements: false,
    canManagePlansAndPricing: false,
    canManageMerchants: true,
    canImpersonateMerchants: true,
    canManageUsers: true,
    canViewFinancialsAndRefund: false,
    canViewAuditLogs: true,
    canExportData: true,
  },
  advertising_manager: {
    role: 'advertising_manager',
    label: 'Advertising Manager',
    description: 'Governs advertisements, placement inventory, and campaign analytics.',
    canManageSettings: false,
    canManageRoles: false,
    canManageAdvertisements: true,
    canGlobalPauseAds: false,
    canManagePlacements: true,
    canManagePlansAndPricing: true,
    canManageMerchants: false,
    canImpersonateMerchants: false,
    canManageUsers: false,
    canViewFinancialsAndRefund: false,
    canViewAuditLogs: true,
    canExportData: true,
  },
  billing_manager: {
    role: 'billing_manager',
    label: 'Billing & Commercial Manager',
    description: 'Controls subscription plans, pricing, invoices, and financial reports.',
    canManageSettings: false,
    canManageRoles: false,
    canManageAdvertisements: false,
    canGlobalPauseAds: false,
    canManagePlacements: false,
    canManagePlansAndPricing: true,
    canManageMerchants: false,
    canImpersonateMerchants: false,
    canManageUsers: false,
    canViewFinancialsAndRefund: true,
    canViewAuditLogs: true,
    canExportData: true,
  },
  support_agent: {
    role: 'support_agent',
    label: 'Customer Support Agent',
    description: 'Restricted access for addressing user and merchant support inquiries and account notes.',
    canManageSettings: false,
    canManageRoles: false,
    canManageAdvertisements: false,
    canGlobalPauseAds: false,
    canManagePlacements: false,
    canManagePlansAndPricing: false,
    canManageMerchants: false,
    canImpersonateMerchants: true, // Read-only inspection
    canManageUsers: false,
    canViewFinancialsAndRefund: false,
    canViewAuditLogs: false,
    canExportData: false,
  },
}

export type EntityType =
  | 'advertisement'
  | 'merchant'
  | 'user'
  | 'subscription_plan'
  | 'placement'
  | 'platform_settings'
  | 'support_session'
  | 'payment_refund'
  | 'role_permission'
  | 'system'

export interface AuditLog {
  id: string
  actorId?: string | null
  actorEmail: string
  actorRole: AdminRole | string
  action: string
  entityType: EntityType
  entityId?: string | null
  details: Record<string, unknown>
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  ipAddress?: string
  createdAt: string
}

export interface PlatformSettings {
  globalAdvertisingEnabled: boolean
  merchantAutoApproval: boolean
  adModerationRequired: boolean
  defaultCurrency: string
  defaultTaxRate: number
  maxCampaignDurationDays: number
  maxCreativeFileSizeMb: number
  platformMaintenanceMode: boolean
  disabledPlacements: string[]
  pausedMerchantIds: string[]
  featureFlags: {
    enable_3d_fridge_ads: boolean
    enable_led_video_ads: boolean
    enable_coupon_codes: boolean
    allow_custom_plans: boolean
    [key: string]: boolean
  }
  updatedAt: string
  updatedBy?: string | null
}

export interface AdminSupportSession {
  merchantId: string
  merchantName: string
  adminId: string
  adminEmail: string
  adminRole: AdminRole | string
  mode: 'read_only' | 'authorized_write'
  startedAt: string
}

export interface UserAccount {
  id: string
  displayName: string
  email: string
  accountStatus: 'active' | 'suspended' | 'restricted'
  createdAt: string
  tripsCount: number
  magnetsCount: number
  totalSavedMinor: number
  supportNotes?: string | null
  reportedAbuse?: boolean
  lastActive?: string
}

export interface SupportTicket {
  id: string
  userId?: string | null
  merchantId?: string | null
  ticketType: 'report_abuse' | 'billing_issue' | 'account_recovery' | 'moderation_review' | 'general'
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  internalNotes?: string | null
  assignedTo?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminUser {
  id: string
  email: string
  displayName: string
  role: AdminRole
  assignedAt: string
  lastLogin?: string
}

export type DateRangePreset = 'today' | 'last_7_days' | 'last_30_days' | 'this_month' | 'custom'

export interface DateRangeFilter {
  preset: DateRangePreset
  startDate?: string
  endDate?: string
}
