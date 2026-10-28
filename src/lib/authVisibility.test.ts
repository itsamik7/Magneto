import { describe, it, expect } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { shouldShowAdvertiseButton } from './authVisibility'
import type { MerchantProfile } from '../types/advertising'

describe('shouldShowAdvertiseButton', () => {
  const mockNormalUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: { name: 'Traveler' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'traveler@magnetos.in',
  } as User

  const mockMerchantUser: User = {
    id: 'merchant-456',
    app_metadata: {},
    user_metadata: { name: 'Brand Owner' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'merchant@brand.com',
  } as User

  const mockAdminUser: User = {
    id: 'admin-789',
    app_metadata: {},
    user_metadata: { name: 'Super Admin' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'admin@magnetos.in',
  } as User

  const mockMerchantProfile: MerchantProfile = {
    id: 'merchant-456',
    userId: 'merchant-456',
    businessName: 'Acme Travel Gear',
    contactPerson: 'Jane Doe',
    businessEmail: 'contact@acme.com',
    phoneNumber: '+91 9876543210',
    businessCategory: 'Outdoor & Adventure Gear',
    verificationStatus: 'verified',
    accountStatus: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it('1. Before login: displays the Advertise button to unauthenticated visitors', () => {
    const isVisible = shouldShowAdvertiseButton({
      user: null,
      userRole: 'normal',
      merchantProfile: null,
    })
    expect(isVisible).toBe(true)
  })

  it('1b. Before login with default/undefined state: displays the Advertise button', () => {
    const isVisible = shouldShowAdvertiseButton({
      user: null,
    })
    expect(isVisible).toBe(true)
  })

  it('2. After normal user login: hides the Advertise button completely', () => {
    const isVisible = shouldShowAdvertiseButton({
      user: mockNormalUser,
      userRole: 'normal',
      merchantProfile: null,
    })
    expect(isVisible).toBe(false)
  })

  it('3. Logged-in merchant: hides the Advertise button (shows Merchant Portal instead)', () => {
    const isVisibleWithRole = shouldShowAdvertiseButton({
      user: mockMerchantUser,
      userRole: 'merchant',
      merchantProfile: null,
    })
    expect(isVisibleWithRole).toBe(false)

    const isVisibleWithProfile = shouldShowAdvertiseButton({
      user: mockMerchantUser,
      userRole: 'normal',
      merchantProfile: mockMerchantProfile,
    })
    expect(isVisibleWithProfile).toBe(false)
  })

  it('4. Logged-in admin: hides the Advertise button (shows Admin Portal instead)', () => {
    const isVisible = shouldShowAdvertiseButton({
      user: mockAdminUser,
      userRole: 'admin',
      merchantProfile: null,
    })
    expect(isVisible).toBe(false)
  })

  it('5. Logout: displays the Advertise button again when user logs out and state returns to null', () => {
    // Simulated state while logged in
    let currentUser: User | null = mockNormalUser
    expect(shouldShowAdvertiseButton({ user: currentUser, userRole: 'normal', merchantProfile: null })).toBe(false)

    // User triggers logout -> auth state cleared to null
    currentUser = null
    expect(shouldShowAdvertiseButton({ user: currentUser, userRole: 'normal', merchantProfile: null })).toBe(true)
  })
})
