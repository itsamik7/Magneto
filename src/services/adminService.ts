import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type {
  AdminRole,
  AuditLog,
  PlatformSettings,
  AdminSupportSession,
  UserAccount,
  SupportTicket,
  AdminUser,
  DateRangeFilter,
  EntityType,
} from '../types/admin'
import { ADMIN_ROLE_PERMISSIONS } from '../types/admin'
import type {
  MerchantProfile,
  AdvertisingCampaign,
  AdvertisingPlan,
  PaymentTransaction,
  AdvertisingPlacementType,
} from '../types/advertising'
import {
  getAllCampaigns,
  getAllMerchants,
  getAdvertisingPlans,
  getAdvertisingSlots,
  broadcastAdUpdate,
} from './advertisingService'

export interface AdminAuthResult {
  isAdmin: boolean
  role?: AdminRole | null
  userId?: string
  email?: string
  error?: string | null
}

const MEMORY_ADMIN_SESSION_KEY = 'magneto_admin_verified_session'
const PLATFORM_SETTINGS_KEY = 'magneto_platform_settings_v1'
const AUDIT_LOGS_KEY = 'magneto_audit_logs_v1'
const ADMIN_SUPPORT_SESSION_KEY = 'magneto_admin_support_session_v1'
const USERS_STORE_KEY = 'magneto_managed_users_v1'
const SUPPORT_TICKETS_KEY = 'magneto_support_tickets_v1'
const ADMIN_USERS_KEY = 'magneto_admin_users_v1'

export const PLATFORM_SETTINGS_UPDATED_EVENT = 'magneto_platform_settings_updated'
export const AUDIT_LOG_ADDED_EVENT = 'magneto_audit_log_added'
export const ADMIN_SUPPORT_SESSION_EVENT = 'magneto_admin_support_session_changed'
export const USERS_UPDATED_EVENT = 'magneto_users_updated'
export const SUPPORT_TICKETS_UPDATED_EVENT = 'magneto_support_tickets_updated'

// Configured list of trusted primary administrator accounts (for offline/dev mode)
export const AUTHORIZED_SUPERADMIN_EMAILS: string[] = [
  '1amiteshk@gmail.com',
]

// --------------------------------------------------------------------
// Safe Local Storage Helper (Works in Browser, Node, Vitest)
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
    console.error(`Failed to save to storage (${key}):`, e)
  }
}

function broadcastEvent(eventName: string, detail?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
  }
}

// --------------------------------------------------------------------
// 1. AUTHENTICATION & ROLE VERIFICATION
// --------------------------------------------------------------------
export async function verifyUserAdminRole(user: User | null): Promise<AdminAuthResult> {
  if (!user) {
    return { isAdmin: false, error: 'No authenticated user session.' }
  }

  // When Supabase is configured, strictly verify admin authorization via supabase.rpc('is_admin')
  if (isSupabaseConfigured) {
    try {
      const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc('is_admin')
      if (rpcError) {
        console.warn('[AdminService] supabase.rpc(\'is_admin\') error:', rpcError)
        return {
          isAdmin: false,
          error: rpcError.message,
        }
      }

      if (rpcIsAdmin === true) {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        const mappedRole: AdminRole =
          roleRow?.role === 'admin' ? 'super_admin' : ((roleRow?.role as AdminRole) || 'super_admin')

        return {
          isAdmin: true,
          role: mappedRole,
          userId: user.id,
          email: user.email,
        }
      }

      return {
        isAdmin: false,
        error: 'Access denied: You do not have administrator permissions.',
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Database error verifying admin privileges'
      console.warn('[AdminService] Exception checking admin privileges:', message)
      return {
        isAdmin: false,
        error: message,
      }
    }
  }

  // Fallback for offline / development testing when Supabase credentials are not configured
  const normalizedEmail = user.email?.trim().toLowerCase()
  if (normalizedEmail && AUTHORIZED_SUPERADMIN_EMAILS.includes(normalizedEmail)) {
    return {
      isAdmin: true,
      role: 'super_admin',
      userId: user.id,
      email: user.email,
    }
  }

  const appRole = (user.app_metadata?.role as string) || (user.user_metadata?.role as string)
  if (appRole === 'admin' || appRole === 'super_admin' || appRole in ADMIN_ROLE_PERMISSIONS) {
    return {
      isAdmin: true,
      role: appRole as AdminRole,
      userId: user.id,
      email: user.email,
    }
  }

  // Check custom local admin users directory
  const adminUsers = getAdminUsersSync()
  const customAdmin = adminUsers.find(
    (a) => a.email.toLowerCase() === normalizedEmail || a.id === user.id
  )
  if (customAdmin) {
    return {
      isAdmin: true,
      role: customAdmin.role,
      userId: user.id,
      email: user.email,
    }
  }

  const isAdminEmail = Boolean(
    user.email &&
      (user.email.startsWith('admin@') ||
        user.email.includes('+admin@') ||
        user.email === 'admin@magnetos.in' ||
        user.email === 'admin@magnetos.internal' ||
        user.email === 'admin@magneto.internal')
  )
  if (isAdminEmail) {
    return {
      isAdmin: true,
      role: 'super_admin',
      userId: user.id,
      email: user.email,
    }
  }

  return {
    isAdmin: false,
    error: 'Access denied. Account is not registered in user_roles table as admin.',
  }
}

export function checkAdminPermission(
  role: AdminRole | string | undefined | null,
  permission: keyof typeof ADMIN_ROLE_PERMISSIONS.super_admin
): boolean {
  if (!role) return false
  const validRole = (role === 'admin' ? 'super_admin' : role) as AdminRole
  const perms = ADMIN_ROLE_PERMISSIONS[validRole]
  return perms ? Boolean(perms[permission]) : false
}

export async function adminSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; role?: AdminRole; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  if (!isSupabaseConfigured) {
    if (
      AUTHORIZED_SUPERADMIN_EMAILS.includes(trimmedEmail) ||
      trimmedEmail.startsWith('admin@') ||
      trimmedEmail.includes('+admin@') ||
      trimmedEmail === 'admin@magnetos.in' ||
      trimmedEmail === 'admin@magnetos.internal' ||
      trimmedEmail === 'admin@magneto.internal'
    ) {
      const mockAdminUser: User = {
        id: `admin_offline_${trimmedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        app_metadata: { role: 'super_admin' },
        user_metadata: { display_name: 'Super Administrator' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: trimmedEmail,
      } as unknown as User
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(MEMORY_ADMIN_SESSION_KEY, JSON.stringify(mockAdminUser))
      }
      return { success: true, user: mockAdminUser, role: 'super_admin' }
    }
    return {
      success: false,
      error: 'Supabase credentials are not configured and credentials do not match admin test account.',
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  })

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message || 'Invalid email or password.',
    }
  }

  const roleCheck = await verifyUserAdminRole(authData.user)
  if (!roleCheck.isAdmin) {
    await supabase.auth.signOut()
    return {
      success: false,
      error: 'Access denied: This user account does not possess administrator credentials.',
    }
  }

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(MEMORY_ADMIN_SESSION_KEY, 'active')
  }

  return {
    success: true,
    user: authData.user,
    role: roleCheck.role ?? 'super_admin',
  }
}

export async function adminSignInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const mockAdminUser: User = {
      id: 'admin-offline-id-001',
      app_metadata: { role: 'super_admin' },
      user_metadata: { display_name: 'Super Administrator', email: '1amiteshk@gmail.com' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      email: '1amiteshk@gmail.com',
    } as unknown as User
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(MEMORY_ADMIN_SESSION_KEY, JSON.stringify(mockAdminUser))
      window.location.reload()
    }
    return { success: true }
  }

  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://magnetos.in'
  const adminRedirect = `${origin}/auth/callback?next=/admin`

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: adminRedirect,
      queryParams: {
        prompt: 'select_account',
      },
    },
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function adminSignOut(): Promise<void> {
  endAdminSupportSession()
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(MEMORY_ADMIN_SESSION_KEY)
  }
  if (isSupabaseConfigured) {
    await supabase.auth.signOut()
  }
}

export function getAdminSetupInstructions(): {
  title: string
  description: string
  steps: string[]
  sqlSnippet: string
} {
  return {
    title: 'Administrator Account Provisioning Guide',
    description:
      'For security, ordinary users cannot grant themselves admin access. Administrator roles are strictly managed in the public.user_roles table with Row Level Security.',
    steps: [
      'Open your Supabase Project Dashboard > SQL Editor.',
      'Execute the SQL command below to grant super_admin to 1amiteshk@gmail.com.',
      'Reload /admin to access the control centre immediately.',
    ],
    sqlSnippet: `-- Grant Administrator Role to 1amiteshk@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = '1amiteshk@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;`,
  }
}

// --------------------------------------------------------------------
// 2. PLATFORM SETTINGS SERVICE
// --------------------------------------------------------------------
const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  globalAdvertisingEnabled: true,
  merchantAutoApproval: false,
  adModerationRequired: true,
  defaultCurrency: 'INR',
  defaultTaxRate: 18.0,
  maxCampaignDurationDays: 365,
  maxCreativeFileSizeMb: 50,
  platformMaintenanceMode: false,
  disabledPlacements: [],
  pausedMerchantIds: [],
  featureFlags: {
    enable_3d_fridge_ads: true,
    enable_led_video_ads: true,
    enable_coupon_codes: true,
    allow_custom_plans: true,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
}

export function getPlatformSettingsSync(): PlatformSettings {
  return getLocalItem<PlatformSettings>(PLATFORM_SETTINGS_KEY, DEFAULT_PLATFORM_SETTINGS)
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('platform_settings' as any)
        .select('*')
        .eq('id', 'primary')
        .maybeSingle()

      if (!error && data) {
        const row = data as any
        const settings: PlatformSettings = {
          globalAdvertisingEnabled: row.global_advertising_enabled ?? true,
          merchantAutoApproval: row.merchant_auto_approval ?? false,
          adModerationRequired: row.ad_moderation_required ?? true,
          defaultCurrency: row.default_currency || 'INR',
          defaultTaxRate: Number(row.default_tax_rate) || 18.0,
          maxCampaignDurationDays: row.max_campaign_duration_days || 365,
          maxCreativeFileSizeMb: row.max_creative_file_size_mb || 50,
          platformMaintenanceMode: row.platform_maintenance_mode ?? false,
          disabledPlacements: row.disabled_placements || [],
          pausedMerchantIds: row.paused_merchant_ids || [],
          featureFlags: row.feature_flags || DEFAULT_PLATFORM_SETTINGS.featureFlags,
          updatedAt: row.updated_at || new Date().toISOString(),
          updatedBy: row.updated_by,
        }
        setLocalItem(PLATFORM_SETTINGS_KEY, settings)
        return settings
      }
    } catch {
      // Fallback
    }
  }
  return getPlatformSettingsSync()
}

export async function updatePlatformSettings(
  updates: Partial<PlatformSettings>,
  actor: { email: string; id?: string; role?: string }
): Promise<PlatformSettings> {
  const current = await getPlatformSettings()
  const updated: PlatformSettings = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.email,
  }

  setLocalItem(PLATFORM_SETTINGS_KEY, updated)

  if (isSupabaseConfigured) {
    try {
      await supabase.from('platform_settings' as any).upsert({
        id: 'primary',
        global_advertising_enabled: updated.globalAdvertisingEnabled,
        merchant_auto_approval: updated.merchantAutoApproval,
        ad_moderation_required: updated.adModerationRequired,
        default_currency: updated.defaultCurrency,
        default_tax_rate: updated.defaultTaxRate,
        max_campaign_duration_days: updated.maxCampaignDurationDays,
        max_creative_file_size_mb: updated.maxCreativeFileSizeMb,
        platform_maintenance_mode: updated.platformMaintenanceMode,
        disabled_placements: updated.disabledPlacements,
        paused_merchant_ids: updated.pausedMerchantIds,
        feature_flags: updated.featureFlags,
        updated_at: updated.updatedAt,
      })
    } catch {
      // Ignored in offline
    }
  }

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: 'UPDATE_PLATFORM_SETTINGS',
    entityType: 'platform_settings',
    entityId: 'primary',
    details: { changes: updates },
    beforeState: current as any,
    afterState: updated as any,
  })

  broadcastEvent(PLATFORM_SETTINGS_UPDATED_EVENT, { settings: updated })
  broadcastAdUpdate({ type: 'platform_settings_changed', settings: updated })

  return updated
}

/**
 * Platform-wide Master Kill Switch for all advertisements
 */
export async function toggleGlobalAdvertising(
  enabled: boolean,
  actor: { email: string; id?: string; role?: string },
  reason?: string
): Promise<PlatformSettings> {
  const current = await getPlatformSettings()
  const updated = await updatePlatformSettings(
    { globalAdvertisingEnabled: enabled },
    actor
  )

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: enabled ? 'RESUME_ALL_ADVERTISEMENTS' : 'PAUSE_ALL_ADVERTISEMENTS',
    entityType: 'platform_settings',
    entityId: 'global_advertising',
    details: {
      enabled,
      reason: reason || 'Manual platform-wide toggle triggered by administrator',
    },
    beforeState: { globalAdvertisingEnabled: current.globalAdvertisingEnabled },
    afterState: { globalAdvertisingEnabled: enabled },
  })

  return updated
}

/**
 * Disable or restore a specific placement platform-wide
 */
export async function togglePlacementStatus(
  placementId: AdvertisingPlacementType,
  active: boolean,
  actor: { email: string; id?: string; role?: string }
): Promise<PlatformSettings> {
  const current = await getPlatformSettings()
  let disabled = [...current.disabledPlacements]
  if (!active) {
    if (!disabled.includes(placementId)) disabled.push(placementId)
  } else {
    disabled = disabled.filter((p) => p !== placementId)
  }

  const updated = await updatePlatformSettings({ disabledPlacements: disabled }, actor)

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: active ? 'RESTORE_PLACEMENT' : 'DISABLE_PLACEMENT',
    entityType: 'placement',
    entityId: placementId,
    details: { placementId, active },
    beforeState: { disabledPlacements: current.disabledPlacements },
    afterState: { disabledPlacements: disabled },
  })

  return updated
}

/**
 * Pause or resume all advertisements belonging to a specific merchant
 */
export async function toggleMerchantAds(
  merchantId: string,
  paused: boolean,
  actor: { email: string; id?: string; role?: string }
): Promise<PlatformSettings> {
  const current = await getPlatformSettings()
  let pausedList = [...current.pausedMerchantIds]
  if (paused) {
    if (!pausedList.includes(merchantId)) pausedList.push(merchantId)
  } else {
    pausedList = pausedList.filter((m) => m !== merchantId)
  }

  const updated = await updatePlatformSettings({ pausedMerchantIds: pausedList }, actor)

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: paused ? 'PAUSE_MERCHANT_ADS' : 'RESUME_MERCHANT_ADS',
    entityType: 'merchant',
    entityId: merchantId,
    details: { merchantId, paused },
    beforeState: { pausedMerchantIds: current.pausedMerchantIds },
    afterState: { pausedMerchantIds: pausedList },
  })

  return updated
}

// --------------------------------------------------------------------
// 3. AUDIT LOGGING SYSTEM (Append-Only)
// --------------------------------------------------------------------
const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log_seed_001',
    actorEmail: '1amiteshk@gmail.com',
    actorRole: 'super_admin',
    action: 'INITIALIZE_SUPER_ADMIN_SYSTEM',
    entityType: 'system',
    entityId: 'magnetos_core',
    details: { message: 'Super Admin Control Centre initialized with RBAC and secure audit trail.' },
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  },
  {
    id: 'log_seed_002',
    actorEmail: '1amiteshk@gmail.com',
    actorRole: 'super_admin',
    action: 'VERIFY_MERCHANT',
    entityType: 'merchant',
    entityId: 'merchant_sample_1',
    details: { businessName: 'Himalayan Organic Brews', status: 'verified' },
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
  },
  {
    id: 'log_seed_003',
    actorEmail: '1amiteshk@gmail.com',
    actorRole: 'super_admin',
    action: 'APPROVE_CAMPAIGN',
    entityType: 'advertisement',
    entityId: 'camp_sample_1',
    details: { campaignName: 'Organic Himalayan Apple Juice - Spring Campaign' },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
]

export async function recordAuditLog(params: {
  actorEmail: string
  actorId?: string | null
  actorRole: AdminRole | string
  action: string
  entityType: EntityType
  entityId?: string | null
  details: Record<string, unknown>
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  ipAddress?: string
}): Promise<AuditLog> {
  const newLog: AuditLog = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}`,
    actorId: params.actorId || null,
    actorEmail: params.actorEmail,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId || null,
    details: params.details,
    beforeState: params.beforeState || null,
    afterState: params.afterState || null,
    ipAddress: params.ipAddress || '127.0.0.1 (Local Session)',
    createdAt: new Date().toISOString(),
  }

  const logs = getLocalItem<AuditLog[]>(AUDIT_LOGS_KEY, SEED_AUDIT_LOGS)
  logs.unshift(newLog)
  // Retain recent 2000 logs
  if (logs.length > 2000) logs.pop()
  setLocalItem(AUDIT_LOGS_KEY, logs)

  if (isSupabaseConfigured) {
    try {
      await supabase.from('audit_logs' as any).insert({
        id: newLog.id,
        actor_id: newLog.actorId,
        actor_email: newLog.actorEmail,
        actor_role: newLog.actorRole,
        action: newLog.action,
        entity_type: newLog.entityType,
        entity_id: newLog.entityId,
        details: newLog.details,
        before_state: newLog.beforeState,
        after_state: newLog.afterState,
        ip_address: newLog.ipAddress,
      })
    } catch {
      // Ignored
    }
  }

  broadcastEvent(AUDIT_LOG_ADDED_EVENT, { log: newLog })
  return newLog
}

export async function getAuditLogs(filters?: {
  actorEmail?: string
  entityType?: string
  action?: string
  startDate?: string
  endDate?: string
  searchQuery?: string
}): Promise<AuditLog[]> {
  const logs = getLocalItem<AuditLog[]>(AUDIT_LOGS_KEY, SEED_AUDIT_LOGS)

  return logs.filter((log) => {
    if (filters?.actorEmail && log.actorEmail.toLowerCase() !== filters.actorEmail.toLowerCase()) {
      return false
    }
    if (filters?.entityType && filters.entityType !== 'all' && log.entityType !== filters.entityType) {
      return false
    }
    if (filters?.action && filters.action !== 'all' && log.action !== filters.action) {
      return false
    }
    if (filters?.startDate && new Date(log.createdAt).getTime() < new Date(filters.startDate).getTime()) {
      return false
    }
    if (filters?.endDate && new Date(log.createdAt).getTime() > new Date(filters.endDate).getTime()) {
      return false
    }
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase()
      const matchAction = log.action.toLowerCase().includes(q)
      const matchActor = log.actorEmail.toLowerCase().includes(q)
      const matchEntity = log.entityId?.toLowerCase().includes(q)
      const matchDetails = JSON.stringify(log.details).toLowerCase().includes(q)
      if (!matchAction && !matchActor && !matchEntity && !matchDetails) return false
    }
    return true
  })
}

export async function exportAuditLogsCsv(filters?: Parameters<typeof getAuditLogs>[0]): Promise<string> {
  const logs = await getAuditLogs(filters)
  const headers = ['Timestamp', 'Action', 'Actor Email', 'Role', 'Entity Type', 'Entity ID', 'Details']
  const rows = logs.map((l) => [
    `"${l.createdAt}"`,
    `"${l.action}"`,
    `"${l.actorEmail}"`,
    `"${l.actorRole}"`,
    `"${l.entityType}"`,
    `"${l.entityId || ''}"`,
    `"${JSON.stringify(l.details).replace(/"/g, '""')}"`,
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

// --------------------------------------------------------------------
// 4. ADMIN SUPPORT-VIEW / IMPERSONATION SESSION
// --------------------------------------------------------------------
export function getAdminSupportSession(): AdminSupportSession | null {
  try {
    const storage = getStorageInstance()
    const raw = storage.getItem(ADMIN_SUPPORT_SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function startAdminSupportSession(
  merchant: MerchantProfile,
  mode: 'read_only' | 'authorized_write' = 'read_only',
  actor: { email: string; id?: string; role?: string }
): Promise<AdminSupportSession> {
  const session: AdminSupportSession = {
    merchantId: merchant.id,
    merchantName: merchant.businessName,
    adminId: actor.id || 'admin_user',
    adminEmail: actor.email,
    adminRole: (actor.role as AdminRole) || 'super_admin',
    mode,
    startedAt: new Date().toISOString(),
  }

  setLocalItem(ADMIN_SUPPORT_SESSION_KEY, session)

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: 'START_ADMIN_SUPPORT_SESSION',
    entityType: 'support_session',
    entityId: merchant.id,
    details: {
      merchantId: merchant.id,
      businessName: merchant.businessName,
      mode,
    },
  })

  broadcastEvent(ADMIN_SUPPORT_SESSION_EVENT, { session })
  return session
}

export function endAdminSupportSession(): void {
  const existing = getAdminSupportSession()
  if (existing) {
    try {
      const storage = getStorageInstance()
      storage.removeItem(ADMIN_SUPPORT_SESSION_KEY)
    } catch {
      // Ignored
    }

    recordAuditLog({
      actorEmail: existing.adminEmail,
      actorId: existing.adminId,
      actorRole: existing.adminRole,
      action: 'END_ADMIN_SUPPORT_SESSION',
      entityType: 'support_session',
      entityId: existing.merchantId,
      details: {
        merchantId: existing.merchantId,
        merchantName: existing.merchantName,
        durationMinutes: Math.round(
          (Date.now() - new Date(existing.startedAt).getTime()) / 60000
        ),
      },
    })

    broadcastEvent(ADMIN_SUPPORT_SESSION_EVENT, { session: null })
  }
}

export function setSupportSessionMode(mode: 'read_only' | 'authorized_write'): void {
  const current = getAdminSupportSession()
  if (current) {
    current.mode = mode
    setLocalItem(ADMIN_SUPPORT_SESSION_KEY, current)
    broadcastEvent(ADMIN_SUPPORT_SESSION_EVENT, { session: current })
  }
}

// --------------------------------------------------------------------
// 5. USER MANAGEMENT SERVICE
// --------------------------------------------------------------------
const SEED_USERS: UserAccount[] = [
  {
    id: 'user_aarav_sharma',
    displayName: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    tripsCount: 3,
    magnetsCount: 5,
    totalSavedMinor: 8500000, // ₹ 85,000
    supportNotes: 'VIP frequent traveler. Collected Tokyo & Paris magnets.',
    reportedAbuse: false,
    lastActive: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'user_priya_patel',
    displayName: 'Priya Patel',
    email: 'priya.patel@example.com',
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 35).toISOString(),
    tripsCount: 2,
    magnetsCount: 3,
    totalSavedMinor: 4200000, // ₹ 42,000
    supportNotes: 'Planning Switzerland family itinerary.',
    reportedAbuse: false,
    lastActive: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'user_rohan_verma',
    displayName: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    accountStatus: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    tripsCount: 1,
    magnetsCount: 2,
    totalSavedMinor: 1500000, // ₹ 15,000
    supportNotes: null,
    reportedAbuse: false,
    lastActive: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'user_sneha_reddy',
    displayName: 'Sneha Reddy',
    email: 'sneha.reddy@example.com',
    accountStatus: 'suspended',
    createdAt: new Date(Date.now() - 3600000 * 24 * 90).toISOString(),
    tripsCount: 1,
    magnetsCount: 1,
    totalSavedMinor: 200000,
    supportNotes: 'Suspended due to chargeback inquiry. Under review.',
    reportedAbuse: true,
    lastActive: new Date(Date.now() - 3600000 * 24 * 15).toISOString(),
  },
]

export async function getAllUsers(filters?: {
  searchQuery?: string
  accountStatus?: string
}): Promise<UserAccount[]> {
  const users = getLocalItem<UserAccount[]>(USERS_STORE_KEY, SEED_USERS)

  // In Supabase mode, merge profiles from public.profiles
  if (isSupabaseConfigured) {
    try {
      const { data: dbProfiles } = await supabase.from('profiles').select('*')
      if (dbProfiles && dbProfiles.length > 0) {
        dbProfiles.forEach((p: any) => {
          if (!users.some((u) => u.id === p.id)) {
            users.unshift({
              id: p.id,
              displayName: p.display_name || 'Traveler',
              email: `${(p.display_name || 'user').toLowerCase().replace(/\s+/g, '')}@user.magnetos.in`,
              accountStatus: p.account_status || 'active',
              createdAt: p.created_at || new Date().toISOString(),
              tripsCount: 1,
              magnetsCount: 1,
              totalSavedMinor: 0,
              supportNotes: p.support_notes,
              reportedAbuse: false,
              lastActive: p.updated_at || p.created_at,
            })
          }
        })
      }
    } catch {
      // Ignored
    }
  }

  return users.filter((u) => {
    if (filters?.accountStatus && filters.accountStatus !== 'all' && u.accountStatus !== filters.accountStatus) {
      return false
    }
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase()
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      )
    }
    return true
  })
}

export async function getUserFullDetails(userId: string): Promise<{
  user: UserAccount | null
  trips: any[]
  savings: any[]
  checklistCount: number
}> {
  const users = await getAllUsers()
  const user = users.find((u) => u.id === userId) || null

  let trips: any[] = []
  let savings: any[] = []
  let checklistCount = 0

  if (isSupabaseConfigured) {
    try {
      const { data: tList } = await supabase.from('trips').select('*').eq('user_id', userId)
      if (tList) trips = tList
      const { data: sList } = await supabase.from('savings_transactions').select('*').eq('user_id', userId)
      if (sList) savings = sList
      const { data: cList } = await supabase.from('checklist_items').select('id').eq('user_id', userId)
      if (cList) checklistCount = cList.length
    } catch {
      // Fallback
    }
  }

  return { user, trips, savings, checklistCount }
}

export async function updateUserAccountStatus(
  userId: string,
  accountStatus: 'active' | 'suspended' | 'restricted',
  notes: string | undefined,
  actor: { email: string; id?: string; role?: string }
): Promise<UserAccount> {
  const users = getLocalItem<UserAccount[]>(USERS_STORE_KEY, SEED_USERS)
  const idx = users.findIndex((u) => u.id === userId)
  if (idx < 0) throw new Error('User not found')

  const original = users[idx]
  const updated: UserAccount = {
    ...original,
    accountStatus,
    supportNotes: notes !== undefined ? notes : original.supportNotes,
  }
  users[idx] = updated
  setLocalItem(USERS_STORE_KEY, users)

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('profiles')
        .update({ account_status: accountStatus, support_notes: updated.supportNotes } as any)
        .eq('id', userId)
    } catch {
      // Ignored
    }
  }

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: `USER_ACCOUNT_${accountStatus.toUpperCase()}`,
    entityType: 'user',
    entityId: userId,
    details: { previousStatus: original.accountStatus, nextStatus: accountStatus, notes },
    beforeState: { accountStatus: original.accountStatus },
    afterState: { accountStatus },
  })

  broadcastEvent(USERS_UPDATED_EVENT, { userId, accountStatus })
  return updated
}

export async function triggerUserPasswordReset(
  userId: string,
  email: string,
  actor: { email: string; id?: string; role?: string }
): Promise<{ success: boolean; message: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      })
      if (error) throw error
    } catch (e: any) {
      console.warn('Supabase password reset warning:', e.message)
    }
  }

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: 'DISPATCH_PASSWORD_RESET_WORKFLOW',
    entityType: 'user',
    entityId: userId,
    details: { email },
  })

  return {
    success: true,
    message: `Secure account recovery email dispatched to ${email}.`,
  }
}

// --------------------------------------------------------------------
// 6. MERCHANT MANAGEMENT EXTENSIONS
// --------------------------------------------------------------------
export async function updateMerchantAccountStatus(
  merchantId: string,
  accountStatus: 'active' | 'suspended' | 'restricted',
  reason: string | undefined,
  actor: { email: string; id?: string; role?: string }
): Promise<MerchantProfile> {
  const merchants = await getAllMerchants()
  const m = merchants.find((x) => x.id === merchantId)
  if (!m) throw new Error('Merchant not found')

  const originalStatus = m.accountStatus || 'active'
  m.accountStatus = accountStatus
  m.suspensionReason = reason || null

  const updated = await (await import('./advertisingService')).updateMerchantProfile(merchantId, {
    accountStatus,
    suspensionReason: reason || null,
  })

  // If merchant is suspended, enforce stopping their ads by adding to pausedMerchantIds
  if (accountStatus === 'suspended') {
    await toggleMerchantAds(merchantId, true, actor)
  }

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: `MERCHANT_STATUS_${accountStatus.toUpperCase()}`,
    entityType: 'merchant',
    entityId: merchantId,
    details: {
      businessName: m.businessName,
      previousStatus: originalStatus,
      accountStatus,
      reason,
    },
    beforeState: { accountStatus: originalStatus },
    afterState: { accountStatus, reason },
  })

  return updated
}

export async function verifyMerchant(
  merchantId: string,
  verificationStatus: 'verified' | 'rejected' | 'pending',
  actor: { email: string; id?: string; role?: string }
): Promise<MerchantProfile> {
  const updated = await (await import('./advertisingService')).updateMerchantProfile(merchantId, {
    verificationStatus,
  })

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: `MERCHANT_VERIFICATION_${verificationStatus.toUpperCase()}`,
    entityType: 'merchant',
    entityId: merchantId,
    details: { businessName: updated.businessName, verificationStatus },
  })

  return updated
}

export async function updateMerchantPricingPlan(
  merchantId: string,
  planId: string,
  discountPercentage: number,
  additionalDays: number,
  actor: { email: string; id?: string; role?: string }
): Promise<void> {
  const advService = await import('./advertisingService')
  const plans = await advService.getAdvertisingPlans()
  const targetPlan = plans.find((p) => p.id === planId)
  if (!targetPlan) throw new Error('Plan not found')

  await advService.purchaseSubscriptionWithSandboxPayment({
    merchantId,
    planId,
    paymentMethod: 'admin_custom_override',
    cardOrUpiRef: `DISCOUNT_${discountPercentage}%_DAYS_${additionalDays}`,
  })

  await advService.updateMerchantProfile(merchantId, {
    customDiscountPercentage: discountPercentage,
  })

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: 'ASSIGN_CUSTOM_SUBSCRIPTION_PLAN',
    entityType: 'subscription_plan',
    entityId: planId,
    details: {
      merchantId,
      planName: targetPlan.name,
      discountPercentage,
      additionalDays,
    },
  })
}

// --------------------------------------------------------------------
// 7. SUPPORT / MODERATION TICKETS
// --------------------------------------------------------------------
const SEED_TICKETS: SupportTicket[] = [
  {
    id: 'ticket_001',
    merchantId: 'merchant_sample_1',
    ticketType: 'moderation_review',
    subject: 'Request fast-track review for Holiday Eyeline Campaign',
    description: 'We have updated our banner creative to comply with 16:9 ratio and added https product link.',
    status: 'open',
    priority: 'high',
    internalNotes: 'Merchant resubmitted revised assets.',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'ticket_002',
    userId: 'user_sneha_reddy',
    ticketType: 'report_abuse',
    subject: 'Unrecognized advertising banner redirect report',
    description: 'User reported an external link destination opening unexpected new tabs.',
    status: 'in_progress',
    priority: 'medium',
    internalNotes: 'Under review by security team.',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
]

export async function getSupportTickets(filters?: {
  status?: string
  ticketType?: string
}): Promise<SupportTicket[]> {
  const tickets = getLocalItem<SupportTicket[]>(SUPPORT_TICKETS_KEY, SEED_TICKETS)
  return tickets.filter((t) => {
    if (filters?.status && filters.status !== 'all' && t.status !== filters.status) return false
    if (filters?.ticketType && filters.ticketType !== 'all' && t.ticketType !== filters.ticketType) return false
    return true
  })
}

export async function updateSupportTicket(
  ticketId: string,
  updates: Partial<SupportTicket>,
  actor: { email: string; id?: string; role?: string }
): Promise<SupportTicket> {
  const tickets = getLocalItem<SupportTicket[]>(SUPPORT_TICKETS_KEY, SEED_TICKETS)
  const idx = tickets.findIndex((t) => t.id === ticketId)
  if (idx < 0) throw new Error('Ticket not found')

  const original = tickets[idx]
  const updated: SupportTicket = {
    ...original,
    ...updates,
    updatedAt: new Date().toISOString(),
  }
  tickets[idx] = updated
  setLocalItem(SUPPORT_TICKETS_KEY, tickets)

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: `TICKET_${(updates.status || 'UPDATED').toUpperCase()}`,
    entityType: 'system',
    entityId: ticketId,
    details: { subject: original.subject, changes: updates },
  })

  broadcastEvent(SUPPORT_TICKETS_UPDATED_EVENT, { ticket: updated })
  return updated
}

// --------------------------------------------------------------------
// 8. BILLING, PAYMENTS & FINANCIAL SUMMARY
// --------------------------------------------------------------------
export async function getBillingSummary(dateFilter?: DateRangeFilter) {
  const adv = await import('./advertisingService')
  const merchants = await adv.getAllMerchants()
  const plans = await adv.getAdvertisingPlans()
  const rawPayments = (await adv.getMerchantPayments('all')) || []

  // Collect all transactions from storage
  const storage = getStorageInstance()
  const paymentsRaw = storage.getItem('magneto_advertising_payments_v1')
  const allPayments: PaymentTransaction[] = paymentsRaw ? JSON.parse(paymentsRaw) : []

  const grossSalesMinor = allPayments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + p.amountMinor, 0)

  const refundsMinor = allPayments
    .filter((p) => p.status === 'refunded')
    .reduce((sum, p) => sum + p.amountMinor, 0)

  const netRevenueMinor = grossSalesMinor - refundsMinor
  const estimatedTaxMinor = Math.round(netRevenueMinor * 0.18) // 18% GST

  // Group by plan
  const planRevenueMap = new Map<string, number>()
  allPayments
    .filter((p) => p.status === 'success')
    .forEach((p) => {
      const planName = (p.metadata?.planName as string) || 'Standard Advertising'
      planRevenueMap.set(planName, (planRevenueMap.get(planName) || 0) + p.amountMinor)
    })

  // Group by merchant
  const merchantRevenueMap = new Map<string, number>()
  allPayments
    .filter((p) => p.status === 'success')
    .forEach((p) => {
      merchantRevenueMap.set(p.merchantId, (merchantRevenueMap.get(p.merchantId) || 0) + p.amountMinor)
    })

  return {
    grossSalesMinor,
    refundsMinor,
    netRevenueMinor,
    estimatedTaxMinor,
    totalTransactions: allPayments.length,
    successfulTransactions: allPayments.filter((p) => p.status === 'success').length,
    planBreakdown: Array.from(planRevenueMap.entries()).map(([name, amountMinor]) => ({
      name,
      amountMinor,
    })),
    merchantBreakdown: Array.from(merchantRevenueMap.entries()).map(([merchantId, amountMinor]) => {
      const m = merchants.find((x) => x.id === merchantId)
      return {
        merchantId,
        merchantName: m?.businessName || merchantId,
        amountMinor,
      }
    }),
    transactions: allPayments,
  }
}

export async function issuePaymentRefund(
  paymentId: string,
  reason: string,
  actor: { email: string; id?: string; role?: string }
): Promise<PaymentTransaction> {
  const storage = getStorageInstance()
  const raw = storage.getItem('magneto_advertising_payments_v1')
  const payments: PaymentTransaction[] = raw ? JSON.parse(raw) : []
  const idx = payments.findIndex((p) => p.id === paymentId)
  if (idx < 0) throw new Error('Payment transaction not found')

  payments[idx].status = 'refunded'
  payments[idx].metadata = {
    ...payments[idx].metadata,
    refundReason: reason,
    refundedAt: new Date().toISOString(),
    refundedBy: actor.email,
  }
  setLocalItem('magneto_advertising_payments_v1', payments)

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: 'ISSUE_PAYMENT_REFUND',
    entityType: 'payment_refund',
    entityId: paymentId,
    details: {
      amountMinor: payments[idx].amountMinor,
      merchantId: payments[idx].merchantId,
      reason,
    },
    beforeState: { status: 'success' },
    afterState: { status: 'refunded' },
  })

  broadcastAdUpdate({ type: 'payment_refunded', paymentId })
  return payments[idx]
}

export async function exportFinancialReportCsv(): Promise<string> {
  const summary = await getBillingSummary()
  const headers = ['Transaction ID', 'Merchant ID', 'Amount (INR)', 'Currency', 'Gateway', 'Order ID', 'Status', 'Date']
  const rows = summary.transactions.map((t) => [
    `"${t.id}"`,
    `"${t.merchantId}"`,
    `"${(t.amountMinor / 100).toFixed(2)}"`,
    `"${t.currency}"`,
    `"${t.gateway}"`,
    `"${t.gatewayOrderId}"`,
    `"${t.status}"`,
    `"${t.createdAt}"`,
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

// --------------------------------------------------------------------
// 9. ADMIN USERS & RBAC ROLES MANAGEMENT
// --------------------------------------------------------------------
const SEED_ADMIN_USERS: AdminUser[] = [
  {
    id: 'admin_primary_owner',
    email: '1amiteshk@gmail.com',
    displayName: 'Amitesh K (Platform Owner)',
    role: 'super_admin',
    assignedAt: new Date(Date.now() - 3600000 * 24 * 180).toISOString(),
    lastLogin: new Date().toISOString(),
  },
  {
    id: 'admin_ops_lead',
    email: 'ops@magnetos.in',
    displayName: 'Operations Team Lead',
    role: 'operations_admin',
    assignedAt: new Date(Date.now() - 3600000 * 24 * 45).toISOString(),
    lastLogin: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'admin_ads_lead',
    email: 'ads@magnetos.in',
    displayName: 'Advertising Inventory Lead',
    role: 'advertising_manager',
    assignedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    lastLogin: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
]

export function getAdminUsersSync(): AdminUser[] {
  return getLocalItem<AdminUser[]>(ADMIN_USERS_KEY, SEED_ADMIN_USERS)
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return getAdminUsersSync()
}

export async function assignAdminUserRole(
  email: string,
  displayName: string,
  role: AdminRole,
  actor: { email: string; id?: string; role?: string }
): Promise<AdminUser> {
  const trimmed = email.trim().toLowerCase()
  const admins = getAdminUsersSync()
  const existingIdx = admins.findIndex((a) => a.email.toLowerCase() === trimmed)

  const newAdmin: AdminUser = {
    id: existingIdx >= 0 ? admins[existingIdx].id : `admin_${Date.now()}`,
    email: trimmed,
    displayName: displayName.trim() || trimmed.split('@')[0],
    role,
    assignedAt: new Date().toISOString(),
    lastLogin: existingIdx >= 0 ? admins[existingIdx].lastLogin : undefined,
  }

  if (existingIdx >= 0) {
    admins[existingIdx] = newAdmin
  } else {
    admins.push(newAdmin)
  }
  setLocalItem(ADMIN_USERS_KEY, admins)

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: 'ASSIGN_ADMIN_ROLE',
    entityType: 'role_permission',
    entityId: trimmed,
    details: { assignedRole: role, displayName },
  })

  return newAdmin
}

export async function revokeAdminUserRole(
  adminId: string,
  actor: { email: string; id?: string; role?: string }
): Promise<void> {
  const admins = getAdminUsersSync()
  const target = admins.find((a) => a.id === adminId)
  if (!target) throw new Error('Administrator not found')

  if (target.email === '1amiteshk@gmail.com') {
    throw new Error('Cannot revoke role from primary platform owner.')
  }

  const filtered = admins.filter((a) => a.id !== adminId)
  setLocalItem(ADMIN_USERS_KEY, filtered)

  await recordAuditLog({
    actorEmail: actor.email,
    actorId: actor.id,
    actorRole: actor.role || 'super_admin',
    action: 'REVOKE_ADMIN_ROLE',
    entityType: 'role_permission',
    entityId: target.email,
    details: { previousRole: target.role },
  })
}

// --------------------------------------------------------------------
// 10. REAL-TIME METRICS FOR SUPER ADMIN MAIN OVERVIEW
// --------------------------------------------------------------------
export async function getSuperAdminOverviewStats(dateFilter?: DateRangeFilter) {
  const [users, merchants, campaigns, plans, slots, billing, tickets] = await Promise.all([
    getAllUsers(),
    getAllMerchants(),
    getAllCampaigns(),
    getAdvertisingPlans(),
    getAdvertisingSlots(),
    getBillingSummary(dateFilter),
    getSupportTickets(),
  ])

  const settings = await getPlatformSettings()

  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.accountStatus === 'active').length
  const totalMerchants = merchants.length
  const verifiedMerchants = merchants.filter((m) => m.verificationStatus === 'verified').length
  const pendingMerchants = merchants.filter((m) => m.verificationStatus === 'pending').length

  const activeAds = campaigns.filter((c) => c.status === 'active').length
  const pausedAds = campaigns.filter((c) => c.status === 'paused').length
  const scheduledAds = campaigns.filter((c) => c.status === 'scheduled').length
  const rejectedAds = campaigns.filter((c) => c.status === 'rejected').length
  const pendingApprovalAds = campaigns.filter((c) => c.status === 'pending_approval').length

  // Read analytics events for impressions / clicks
  const storage = getStorageInstance()
  const rawEvents = storage.getItem('magneto_advertising_events_v1')
  const events = rawEvents ? JSON.parse(rawEvents) : []

  const totalImpressions = events.filter((e: any) => e.eventType === 'impression').length
  const totalClicks = events.filter((e: any) => e.eventType === 'click').length
  const platformCtr =
    totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0

  return {
    totalUsers,
    activeUsers,
    totalMerchants,
    verifiedMerchants,
    pendingMerchants,
    activeAds,
    pausedAds,
    scheduledAds,
    rejectedAds,
    pendingApprovalAds,
    totalSlots: slots.length,
    activeSlots: slots.filter((s) => s.isActive).length,
    totalPlans: plans.length,
    grossSalesMinor: billing.grossSalesMinor,
    netRevenueMinor: billing.netRevenueMinor,
    refundsMinor: billing.refundsMinor,
    totalImpressions,
    totalClicks,
    platformCtr,
    openTickets: tickets.filter((t) => t.status === 'open').length,
    globalAdvertisingEnabled: settings.globalAdvertisingEnabled,
    platformMaintenanceMode: settings.platformMaintenanceMode,
  }
}
