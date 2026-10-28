import type { User } from '@supabase/supabase-js'
import type { ApplicationRole } from '../context/AuthContext'
import type { MerchantProfile } from '../types/advertising'

export interface AdvertiseVisibilityParams {
  user: User | null
  userRole?: ApplicationRole | string | null
  merchantProfile?: MerchantProfile | null
}

/**
 * Governs the visibility of the "Advertise" button across the application.
 *
 * Rules:
 * 1. Before login (user is null): TRUE (visitors see the button on public pages).
 * 2. After normal user login (user exists, role is normal, no merchant profile): FALSE (completely hidden from dashboard and authenticated pages).
 * 3. Logged-in merchant (user exists, role is merchant or has profile): FALSE (they access "Merchant Portal" instead).
 * 4. Logged-in admin (user exists, role is admin): FALSE (they access "Admin Portal" instead).
 * 5. Logout (user returns to null): TRUE (visible again on the public landing page).
 */
export function shouldShowAdvertiseButton({
  user,
  userRole,
  merchantProfile,
}: AdvertiseVisibilityParams): boolean {
  // If user is a merchant or has a registered merchant profile, they see "Merchant Portal", not "Advertise"
  if (userRole === 'merchant' || merchantProfile) {
    return false
  }

  // If user is platform super admin, they see "Admin Portal", not "Advertise"
  if (userRole === 'admin') {
    return false
  }

  // Hide completely for any authenticated normal user
  if (user) {
    return false
  }

  // Display only to unauthenticated visitors
  return true
}
