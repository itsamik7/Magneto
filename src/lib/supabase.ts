import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || ''

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project-id')
)

// Fallback dummy client if credentials are missing, so code doesn't crash on boot
// but strictly informs the user before any call is made.
export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (createClient<Database>(
      'https://placeholder-magneto.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    ))

export function checkSupabaseReady(): { ready: boolean; error?: string } {
  if (!isSupabaseConfigured) {
    return {
      ready: false,
      error: 'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
    }
  }
  return { ready: true }
}
