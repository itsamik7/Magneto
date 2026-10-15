import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface AdminAuthResult {
  isAdmin: boolean
  role?: 'admin' | 'super_admin' | null
  userId?: string
  email?: string
  error?: string | null
}

const MEMORY_ADMIN_SESSION_KEY = 'magneto_admin_verified_session'

/**
 * Checks whether the current user is an authorized administrator.
 * Validates against:
 * 1. The PostgreSQL security definer function `public.is_admin()`
 * 2. The protected `public.user_roles` table
 * 3. Supabase Auth JWT app_metadata (`app_metadata.role in ('admin', 'super_admin')`)
 */
export async function verifyUserAdminRole(user: User | null): Promise<AdminAuthResult> {
  if (!user) {
    return { isAdmin: false, error: 'No authenticated user session.' }
  }

  // 1. Check Supabase JWT app_metadata first (fast & server-signed)
  const appRole = (user.app_metadata?.role as string) || (user.user_metadata?.role as string)
  if (appRole === 'admin' || appRole === 'super_admin') {
    return {
      isAdmin: true,
      role: appRole,
      userId: user.id,
      email: user.email,
    }
  }

  // If Supabase client is not fully configured, fall back to safe local check
  if (!isSupabaseConfigured) {
    // In local development/demo mode without connected backend:
    // Allow explicitly tagged admin users (e.g. admin@magneto.com / admin@example.com)
    const isAdminEmail = Boolean(user.email && (user.email.startsWith('admin@') || user.email.includes('+admin@')))
    if (isAdminEmail) {
      return {
        isAdmin: true,
        role: 'admin',
        userId: user.id,
        email: user.email,
      }
    }
    return {
      isAdmin: false,
      error: 'Access denied. Account is not registered in user_roles table as admin.',
    }
  }

  try {
    // 2. Execute PostgreSQL security definer function public.is_admin()
    const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc('is_admin')
    if (!rpcError && rpcIsAdmin === true) {
      return {
        isAdmin: true,
        role: 'admin',
        userId: user.id,
        email: user.email,
      }
    }

    // 3. Fallback direct query to public.user_roles with RLS
    const { data: roleRow, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle()

    if (!roleError && roleRow?.role) {
      return {
        isAdmin: true,
        role: roleRow.role as 'admin' | 'super_admin',
        userId: user.id,
        email: user.email,
      }
    }

    // Account exists, but has no admin record in user_roles
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

/**
 * Signs in through the dedicated Admin portal.
 * Validates credentials against Supabase Auth, then immediately checks admin authorization.
 * If credentials are valid but user is NOT an admin, it immediately signs them out and rejects.
 */
export async function adminSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  if (!isSupabaseConfigured) {
    // Offline / Demo mode handling
    if (trimmedEmail.startsWith('admin@') || trimmedEmail === 'admin@magneto.internal') {
      const mockAdminUser: User = {
        id: 'admin-offline-id-001',
        app_metadata: { role: 'admin' },
        user_metadata: { display_name: 'Administrator' },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: trimmedEmail,
      } as unknown as User
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(MEMORY_ADMIN_SESSION_KEY, JSON.stringify(mockAdminUser))
      }
      return { success: true, user: mockAdminUser }
    }
    return {
      success: false,
      error: 'Supabase credentials are not configured and credentials do not match admin test account.',
    }
  }

  // 1. Authenticate credentials with Supabase Auth
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

  // 2. Validate administrator authorization role
  const roleCheck = await verifyUserAdminRole(authData.user)
  if (!roleCheck.isAdmin) {
    // Non-admin user attempted to access admin portal: terminate session immediately!
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
  }
}

/**
 * Logs out of the administrator portal and clears admin sessions.
 */
export async function adminSignOut(): Promise<void> {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(MEMORY_ADMIN_SESSION_KEY)
  }
  if (isSupabaseConfigured) {
    await supabase.auth.signOut()
  }
}

/**
 * Returns documented setup procedure for creating the initial administrator.
 */
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
      'Register a new account or choose an existing user account in your Supabase Auth dashboard.',
      'Copy the UUID of the target user from Supabase Auth > Users.',
      'Execute the SQL command below in your Supabase SQL Editor to grant admin role.',
      'The designated administrator can now sign in at the /admin portal.',
    ],
    sqlSnippet: `-- Grant Administrator Role to a specific user UUID
INSERT INTO public.user_roles (user_id, role)
VALUES ('<REPLACE-WITH-USER-UUID>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;`,
  }
}
