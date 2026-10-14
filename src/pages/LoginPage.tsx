import React, { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '../lib/validation'
import { useAuth } from '../context/AuthContext'
import { LogIn, AlertCircle, KeyRound, Mail } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const { user, signIn, isConfigured } = useAuth()
  const navigate = useNavigate()
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null)
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setAuthError(error)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#243447] text-white flex items-center justify-center shadow-md">
            <LogIn className="w-6 h-6 text-coral" />
          </div>
          <h2 className="font-heading font-black text-2xl text-[#243447]">
            Welcome back to Magneto
          </h2>
          <p className="text-xs text-slate-500">
            Sign in to access your personal travel fridge and savings goals.
          </p>
        </div>

        {/* Warning if Supabase unconfigured */}
        {!isConfigured && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>
              Supabase credentials are missing. Please add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file.
            </span>
          </div>
        )}

        {/* Auth error alert */}
        {authError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-sm text-slate-900 bg-white"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-sm text-slate-900 bg-white"
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[#243447] hover:bg-slate-800 text-white font-heading font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In to My Fridge'}
          </button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Don&apos;t have a travel fridge yet? </span>
          <Link to="/signup" className="font-bold text-[#E98267] hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}
