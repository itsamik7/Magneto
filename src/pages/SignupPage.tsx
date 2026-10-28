import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signupSchema, type SignupFormData } from '../lib/validation'
import { useAuth } from '../context/AuthContext'
import {
  UserPlus,
  AlertCircle,
  KeyRound,
  Mail,
  User,
  Sparkles,
  Store,
  Building,
  Phone,
  Globe,
  Tag,
  ArrowRight,
  Upload,
} from 'lucide-react'

// Zod Schema for Merchant Registration
const merchantSignupSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  contactPerson: z.string().min(2, 'Contact person name must be at least 2 characters'),
  businessEmail: z.string().email('Please enter a valid business email address'),
  phoneNumber: z.string().min(8, 'Please enter a valid phone number'),
  businessCategory: z.string().min(1, 'Please select a business category'),
  businessWebsite: z.string().url('Please enter a valid website URL starting with https://').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password confirmation must be at least 6 characters'),
  logoUrl: z.string().optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type MerchantSignupFormData = z.infer<typeof merchantSignupSchema>

const BUSINESS_CATEGORIES = [
  'Food & Beverage',
  'Travel & Hospitality',
  'Luggage & Travel Accessories',
  'Outdoor & Adventure Gear',
  'Hotels & Resorts',
  'Airlines & Transit',
  'Souvenirs & Crafts',
  'Retail & Fashion',
  'Technology & Electronics',
  'Other',
]

export const SignupPage: React.FC = () => {
  const { user, signUp, signUpMerchant, signInWithGoogle, merchantProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const initialType = searchParams.get('type') === 'merchant' ? 'merchant' : 'personal'
  const [accountType, setAccountType] = useState<'personal' | 'merchant'>(initialType)

  const [authError, setAuthError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  const handleAccountTypeChange = (type: 'personal' | 'merchant') => {
    setAccountType(type)
    setSearchParams({ type })
    setAuthError(null)
    setSuccessMsg(null)
  }

  // Personal Form Hook
  const {
    register: registerPersonal,
    handleSubmit: handleSubmitPersonal,
    formState: { errors: personalErrors, isSubmitting: isPersonalSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  // Merchant Form Hook
  const {
    register: registerMerchant,
    handleSubmit: handleSubmitMerchant,
    formState: { errors: merchantErrors, isSubmitting: isMerchantSubmitting },
  } = useForm<MerchantSignupFormData>({
    resolver: zodResolver(merchantSignupSchema),
    defaultValues: {
      businessName: '',
      contactPerson: '',
      businessEmail: '',
      phoneNumber: '',
      businessCategory: 'Food & Beverage',
      businessWebsite: '',
      password: '',
      confirmPassword: '',
      logoUrl: '',
    },
  })

  // Redirect if already logged in and has relevant role
  useEffect(() => {
    if (user) {
      if (accountType === 'merchant') {
        if (merchantProfile) {
          navigate('/merchant/dashboard', { replace: true })
        }
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }, [user, accountType, merchantProfile, navigate])

  const handleGoogleSignUp = async () => {
    setAuthError(null)
    setIsGoogleSubmitting(true)
    try {
      const target = accountType === 'merchant' ? '/merchant/dashboard' : '/dashboard'
      const { error } = await signInWithGoogle(target)
      if (error) setAuthError(error)
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Google sign up failed')
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  const onSubmitPersonal = async (data: SignupFormData) => {
    setAuthError(null)
    setSuccessMsg(null)
    const { error } = await signUp(data.email, data.password, data.displayName)
    if (error) {
      setAuthError(error)
    } else {
      setSuccessMsg('Personal account created successfully! Opening your travel fridge...')
      setTimeout(() => {
        navigate('/dashboard')
      }, 1000)
    }
  }

  const onSubmitMerchant = async (data: MerchantSignupFormData) => {
    setAuthError(null)
    setSuccessMsg(null)
    const { error, profile } = await signUpMerchant({
      businessName: data.businessName,
      contactPerson: data.contactPerson,
      businessEmail: data.businessEmail,
      phoneNumber: data.phoneNumber,
      businessCategory: data.businessCategory,
      businessWebsite: data.businessWebsite || null,
      password: data.password,
      logoUrl: data.logoUrl || null,
    })

    if (error) {
      setAuthError(error)
    } else if (profile) {
      setSuccessMsg('Merchant account verified and registered! Redirecting to Merchant Dashboard...')
      setTimeout(() => {
        navigate('/merchant/dashboard')
      }, 1000)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
        
        {/* Account-type switch: Personal Account | Merchant / Advertiser */}
        <div className="w-full p-1 bg-slate-100 rounded-2xl flex items-center border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => handleAccountTypeChange('personal')}
            className={`flex-1 py-2 text-xs font-heading font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              accountType === 'personal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal Account</span>
          </button>
          <button
            type="button"
            onClick={() => handleAccountTypeChange('merchant')}
            className={`flex-1 py-2 text-xs font-heading font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              accountType === 'merchant'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Merchant / Advertiser</span>
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <div
            className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center shadow-md transition-colors ${
              accountType === 'merchant' ? 'bg-blue-600 text-white' : 'bg-[#E98267] text-white'
            }`}
          >
            {accountType === 'merchant' ? (
              <Store className="w-6 h-6 text-white" />
            ) : (
              <UserPlus className="w-6 h-6 text-white" />
            )}
          </div>
          <h2 className="font-heading font-black text-2xl text-[#243447]">
            {accountType === 'merchant'
              ? 'Register Your Merchant Account'
              : 'Build Your Travel Fridge'}
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {accountType === 'merchant'
              ? "Promote your brand through sponsored magnet placements on travelers' virtual fridge doors."
              : 'Start collecting souvenir magnets and saving toward your trips.'}
          </p>
        </div>

        {/* Auth error alert */}
        {authError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* PERSONAL ACCOUNT REGISTRATION FORM */}
        {/* ================================================================= */}
        {accountType === 'personal' && (
          <>
            {/* Google Sign Up */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={isGoogleSubmitting || isPersonalSubmitting}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-heading font-bold text-sm rounded-xl border border-slate-300/80 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleSubmitting ? 'Signing up with Google...' : 'Continue with Google'}</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                Or sign up with email
              </span>
            </div>

            <form onSubmit={handleSubmitPersonal(onSubmitPersonal)} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    {...registerPersonal('displayName')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-sm text-slate-900 bg-white"
                  />
                </div>
                {personalErrors.displayName && (
                  <p className="text-xs text-rose-500 mt-1">{personalErrors.displayName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    {...registerPersonal('email')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-sm text-slate-900 bg-white"
                  />
                </div>
                {personalErrors.email && (
                  <p className="text-xs text-rose-500 mt-1">{personalErrors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    {...registerPersonal('password')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-sm text-slate-900 bg-white"
                  />
                </div>
                {personalErrors.password && (
                  <p className="text-xs text-rose-500 mt-1">{personalErrors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="Re-enter password"
                    {...registerPersonal('confirmPassword')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#3A8D8C] text-sm text-slate-900 bg-white"
                  />
                </div>
                {personalErrors.confirmPassword && (
                  <p className="text-xs text-rose-500 mt-1">{personalErrors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isPersonalSubmitting}
                className="w-full py-3 bg-[#E98267] hover:bg-[#d96d51] text-white font-heading font-bold text-sm rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPersonalSubmitting ? 'Creating fridge...' : 'Create My Travel Fridge'}
              </button>
            </form>
          </>
        )}

        {/* ================================================================= */}
        {/* MERCHANT / ADVERTISER DEDICATED REGISTRATION FORM */}
        {/* ================================================================= */}
        {accountType === 'merchant' && (
          <form onSubmit={handleSubmitMerchant(onSubmitMerchant)} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business / Brand Name *
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Kinnaur Alpine Organics"
                    {...registerMerchant('businessName')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                  />
                </div>
                {merchantErrors.businessName && (
                  <p className="text-xs text-rose-500 mt-1">{merchantErrors.businessName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Contact Person *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="e.g. Aditi Sharma"
                    {...registerMerchant('contactPerson')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                  />
                </div>
                {merchantErrors.contactPerson && (
                  <p className="text-xs text-rose-500 mt-1">{merchantErrors.contactPerson.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    placeholder="ads@yourbrand.com"
                    {...registerMerchant('businessEmail')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                  />
                </div>
                {merchantErrors.businessEmail && (
                  <p className="text-xs text-rose-500 mt-1">{merchantErrors.businessEmail.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    {...registerMerchant('phoneNumber')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                  />
                </div>
                {merchantErrors.phoneNumber && (
                  <p className="text-xs text-rose-500 mt-1">{merchantErrors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Business Category *
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <select
                    {...registerMerchant('businessCategory')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                  >
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                {merchantErrors.businessCategory && (
                  <p className="text-xs text-rose-500 mt-1">{merchantErrors.businessCategory.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Website URL (Optional)
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="url"
                    placeholder="https://yourbrand.com"
                    {...registerMerchant('businessWebsite')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                  />
                </div>
                {merchantErrors.businessWebsite && (
                  <p className="text-xs text-rose-500 mt-1">{merchantErrors.businessWebsite.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Brand Logo URL (Optional)
              </label>
              <div className="relative">
                <Upload className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="url"
                  placeholder="https://yourbrand.com/logo.png"
                  {...registerMerchant('logoUrl')}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Secure Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    {...registerMerchant('password')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                  />
                </div>
                {merchantErrors.password && (
                  <p className="text-xs text-rose-500 mt-1">{merchantErrors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    {...registerMerchant('confirmPassword')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm text-slate-900 bg-white"
                  />
                </div>
                {merchantErrors.confirmPassword && (
                  <p className="text-xs text-rose-500 mt-1">{merchantErrors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isMerchantSubmitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isMerchantSubmitting ? (
                'Registering Merchant Account...'
              ) : (
                <>
                  <span>Create Merchant Account & Launch Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Already registered? </span>
          <Link
            to={accountType === 'merchant' ? '/login?type=merchant' : '/login'}
            className={`font-bold hover:underline ${
              accountType === 'merchant' ? 'text-blue-600' : 'text-[#3A8D8C]'
            }`}
          >
            Sign In to {accountType === 'merchant' ? 'Merchant Portal' : 'My Fridge'}
          </Link>
        </div>
      </div>
    </div>
  )
}
