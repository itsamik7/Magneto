import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  displayName: string | null
  isLoading: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInWithGoogle: (redirectTo?: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
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

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)
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
      } else if (typeof window !== 'undefined') {
        const storedDev = localStorage.getItem('magneto_dev_user')
        if (storedDev) {
          try {
            const parsed = JSON.parse(storedDev)
            setUser(parsed)
            setDisplayName(parsed.user_metadata?.full_name || parsed.email || 'Traveler')
          } catch {}
        }
      }
      setIsLoading(false)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession) {
        setSession(newSession)
        setUser(newSession.user)
        setDisplayName(extractDisplayName(newSession.user))
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signInWithGoogle = async (redirectTo?: string) => {
    if (!isSupabaseConfigured) {
      return { error: 'Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' }
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const targetRedirect = redirectTo || `${origin}/dashboard`
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
      return { error: 'Supabase credentials not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name || email.split('@')[0],
        },
      },
    })
    return { error: error?.message ?? null }
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
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        displayName,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signInWithGoogle,
        signUp,
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
