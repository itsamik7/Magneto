import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Compass, AlertCircle, ArrowRight } from 'lucide-react'

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    let isSubscribed = true

    // 1. Check URL parameters and hash fragments for errors or relay targets
    const hash = typeof window !== 'undefined' && window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : ''
    const hashParams = new URLSearchParams(hash)
    const errorDesc = searchParams.get('error_description') || hashParams.get('error_description')
    const error = searchParams.get('error') || hashParams.get('error')

    if (errorDesc || error) {
      const friendly = errorDesc
        ? errorDesc.replace(/\+/g, ' ')
        : 'Authentication was cancelled or encountered an error. Please try logging in again.'
      setErrorMsg(friendly)
      return
    }

    // 2. Handle Relay Target (if request hopped through production proxy back to localhost)
    const relay = searchParams.get('relay')
    if (relay) {
      try {
        const relayUrl = new URL(relay)
        if (
          relayUrl.hostname === 'localhost' ||
          relayUrl.hostname === '127.0.0.1' ||
          relayUrl.hostname.endsWith('.local')
        ) {
          // Carry over hash and query parameters to the local development instance
          relayUrl.hash = window.location.hash
          const forwardParams = new URLSearchParams(window.location.search)
          forwardParams.delete('relay')
          const forwardSearch = forwardParams.toString()
          if (forwardSearch) {
            relayUrl.search = forwardSearch
          }
          window.location.replace(relayUrl.toString())
          return
        }
      } catch (err) {
        console.warn('Failed to parse auth relay URL:', err)
      }
    }

    // 3. Process Session Resolution
    const destination = searchParams.get('next') || '/dashboard'

    const checkSessionAndRedirect = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          if (isSubscribed) setErrorMsg(sessionError.message)
          return
        }

        if (session && isSubscribed) {
          navigate(destination, { replace: true })
        }
      } catch (err) {
        if (isSubscribed) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to finalize session')
        }
      }
    }

    checkSessionAndRedirect()

    // 4. Listen for auth change (handles token exchange completion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || session) && isSubscribed) {
        navigate(destination, { replace: true })
      }
    })

    // 5. Fallback safety timeout if no session resolves after 6 seconds
    const timeoutTimer = setTimeout(() => {
      if (isSubscribed) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session) {
            navigate(destination, { replace: true })
          } else {
            setErrorMsg('Authentication session took too long to complete. Please try signing in again.')
          }
        })
      }
    }, 6000)

    return () => {
      isSubscribed = false
      subscription.unsubscribe()
      clearTimeout(timeoutTimer)
    }
  }, [navigate, searchParams])

  if (errorMsg) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-heading font-black text-xl text-slate-900">
            Sign-In Unsuccessful
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {errorMsg}
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <span>Back to Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center shadow-xs">
        <Compass className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
      <div className="space-y-1">
        <h3 className="font-heading font-black text-slate-900 text-base">
          Verifying Credentials
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Finalizing secure authorization and loading your fridge...
        </p>
      </div>
    </div>
  )
}
