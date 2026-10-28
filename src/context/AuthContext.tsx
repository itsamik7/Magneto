import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { MerchantProfile } from '../types/advertising'
import { getMerchantProfile, registerMerchantProfile } from '../services/advertisingService'
import { verifyUserAdminRole } from '../services/adminService'

export type ApplicationRole = 'normal' | 'merchant' | 'admin'

interface AuthContextType {
  user: User | null
  session: Session | null
  displayName: string | null
  merchantProfile: MerchantProfile | null
  userRole: ApplicationRole
  isLoading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null; user?: User | null }>
  signUpMerchant: (params: {
    businessName: string
    contactPerson: string
    businessEmail: string
    phoneNumber: string
    businessCategory: string
    businessWebsite?: string | null
    password?: string
    logoUrl?: string | null
  }) => Promise<{ error: string | null; profile?: MerchantProfile | null }>
  refreshMerchantProfile: () => Promise<MerchantProfile | null>
  signOut: () => Promise<void>
}

export function getAuthRedirectUrl(targetPath: string = '/dashboard'): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetPath)}`
  }
  return `https://magnetos.in/auth/callback?next=${encodeURIComponent(targetPath)}`
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null)
  const [userRole, setUserRole] = useState<ApplicationRole>('normal')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const extractDisplayName = (u: User | null | undefined): string | null => {
    if (!u) return null
    return (
      u.user_metadata?.full_name ||
      u.user_metadata?.name ||
      u.user_metadata?.display_name ||
      u.email?.split('@')[0] ||
      null
    )
  }

  // Load and determine application role
  const checkRoleAndProfile = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setMerchantProfile(null)
      setUserRole('normal')
      return
    }

    // 1. Check if Admin
    const adminCheck = await verifyUserAdminRole(currentUser)
    if (adminCheck.isAdmin) {
      setUserRole('admin')
      // Admins might also have a merchant profile for testing
      const merchant = await getMerchantProfile(currentUser.id)
      setMerchantProfile(merchant)
      return
    }

    // 2. Check if Merchant
    const merchant = await getMerchantProfile(currentUser.id)
    if (merchant) {
      setMerchantProfile(merchant)
      setUserRole('merchant')
      return
    }

    // 3. Normal User
    setMerchantProfile(null)
    setUserRole('normal')
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const storedDev = typeof window !== 'undefined' ? localStorage.getItem('magneto_dev_user') : null
      if (storedDev) {
        try {
          const parsed = JSON.parse(storedDev)
          setUser(parsed)
          setDisplayName(parsed.user_metadata?.full_name || parsed.email || 'Traveler')
          checkRoleAndProfile(parsed)
        } catch {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
      return
    }

    // 1. Fetch current session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        console.error('Error fetching session:', error)
      }
      if (currentSession) {
        setSession(currentSession)
        setUser(currentSession.user)
        setDisplayName(extractDisplayName(currentSession.user))
        checkRoleAndProfile(currentSession.user).finally(() => {
          setIsLoading(false)
        })
      } else if (typeof window !== 'undefined') {
        const storedDev = localStorage.getItem('magneto_dev_user')
        if (storedDev) {
          try {
            const parsed = JSON.parse(storedDev)
            setUser(parsed)
            setDisplayName(parsed.user_metadata?.full_name || parsed.email || 'Traveler')
            checkRoleAndProfile(parsed).finally(() => {
              setIsLoading(false)
            })
          } catch {
            setIsLoading(false)
          }
        } else {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
        setDisplayName(extractDisplayName(newSession.user))
        checkRoleAndProfile(newSession.user)
      } else {
        setSession(null)
        setUser(null)
        setDisplayName(null)
        setMerchantProfile(null)
        setUserRole('normal')
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkRoleAndProfile])

  const refreshMerchantProfile = async (): Promise<MerchantProfile | null> => {
    if (!user) return null
    const profile = await getMerchantProfile(user.id)
    setMerchantProfile(profile)
    if (profile && userRole !== 'admin') {
      setUserRole('merchant')
    }
    return profile
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Local dev simulated auth
      const dummyUser: User = {
        id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        app_metadata: {},
        user_metadata: { display_name: email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
      } as User
      if (typeof window !== 'undefined') {
        localStorage.setItem('magneto_dev_user', JSON.stringify(dummyUser))
      }
      setUser(dummyUser)
      setDisplayName(email.split('@')[0])
      await checkRoleAndProfile(dummyUser)
      return { error: null }
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && data.user) {
      setUser(data.user)
      setDisplayName(extractDisplayName(data.user))
      await checkRoleAndProfile(data.user)
    }
    return { error: error?.message ?? null }
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' }
    }
    let targetRedirect: string
    if (!redirectTo) {
      targetRedirect = getAuthRedirectUrl('/dashboard')
    } else if (redirectTo.startsWith('http://') || redirectTo.startsWith('https://')) {
      targetRedirect = redirectTo
    } else {
      targetRedirect = getAuthRedirectUrl(redirectTo)
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetRedirect,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured) {
      const dummyUser: User = {
        id: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        app_metadata: {},
        user_metadata: { display_name: name || email.split('@')[0] },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
      } as User
      if (typeof window !== 'undefined') {
        localStorage.setItem('magneto_dev_user', JSON.stringify(dummyUser))
      }
      setUser(dummyUser)
      setDisplayName(name || email.split('@')[0])
      await checkRoleAndProfile(dummyUser)
      return { error: null, user: dummyUser }
    }
    const emailRedirect = getAuthRedirectUrl('/dashboard')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: emailRedirect,
        data: {
          display_name: name || email.split('@')[0],
        },
      },
    })
    return { error: error?.message ?? null, user: data.user }
  }

  const signUpMerchant = async (params: {
    businessName: string
    contactPerson: string
    businessEmail: string
    phoneNumber: string
    businessCategory: string
    businessWebsite?: string | null
    password?: string
    logoUrl?: string | null
  }) => {
    let currentAuthUser = user

    // 1. If not authenticated, sign up or sign in the user
    if (!currentAuthUser) {
      if (!params.password) {
        return { error: 'Password is required to create a merchant account.' }
      }
      const signUpRes = await signUp(params.businessEmail, params.password, params.contactPerson)
      if (signUpRes.error) {
        return { error: signUpRes.error }
      }
      currentAuthUser = signUpRes.user || user
    }

    if (!currentAuthUser) {
      // In offline/dev environment
      const dummyId = `merchant_user_${Date.now()}`
      currentAuthUser = {
        id: dummyId,
        app_metadata: {},
        user_metadata: { display_name: params.contactPerson },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email: params.businessEmail,
      } as User
      setUser(currentAuthUser)
      if (typeof window !== 'undefined') {
        localStorage.setItem('magneto_dev_user', JSON.stringify(currentAuthUser))
      }
    }

    // 2. Register Merchant Profile
    const { profile, error: profileErr } = await registerMerchantProfile({
      userId: currentAuthUser.id,
      businessName: params.businessName,
      contactPerson: params.contactPerson,
      businessEmail: params.businessEmail,
      phoneNumber: params.phoneNumber,
      businessCategory: params.businessCategory,
      businessWebsite: params.businessWebsite,
      logoUrl: params.logoUrl,
    })

    if (profileErr) {
      return { error: profileErr }
    }

    setMerchantProfile(profile)
    setUserRole('merchant')
    return { error: null, profile }
  }

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('magneto_dev_user')
    }
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setSession(null)
    setDisplayName(null)
    setMerchantProfile(null)
    setUserRole('normal')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        displayName,
        merchantProfile,
        userRole,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signInWithGoogle,
        signUp,
        signUpMerchant,
        refreshMerchantProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
