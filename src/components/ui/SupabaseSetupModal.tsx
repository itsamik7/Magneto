import React, { useState } from 'react'
import { Modal } from './Modal'
import { Check, Copy, ExternalLink, Database, KeyRound, Terminal } from 'lucide-react'

interface SupabaseSetupModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({ isOpen, onClose }) => {
  const [copiedEnv, setCopiedEnv] = useState(false)

  const envSample = `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key`

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envSample)
    setCopiedEnv(true)
    setTimeout(() => setCopiedEnv(false), 2000)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase Database & Auth Setup Guide"
      description="Connect your Supabase project to enable real user authentication, trips, savings, and planning."
      maxWidth="xl"
    >
      <div className="space-y-6 text-sm text-slate-700">
        {/* Why this is required */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
          <p className="font-semibold mb-1">🔒 Genuine Row Level Security & Persistence</p>
          <p>
            Magneto never mocks database calls or simulates fake logins. All data (trips, paise savings, itineraries, tasks) belongs strictly to your authenticated Supabase user profile.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#243447] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-heading font-bold text-slate-900">Create a Free Supabase Project</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Visit{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-700 font-semibold underline inline-flex items-center gap-0.5"
                >
                  supabase.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                and click &quot;New Project&quot;.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#243447] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-teal-600" />
                Run the Database Migration Scripts
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 mb-2">
                In your Supabase Dashboard, open the <strong>SQL Editor</strong>, and run these two migration scripts:
              </p>
              <div className="space-y-1.5 font-mono text-xs">
                <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl flex items-center justify-between">
                  <span>1. supabase/migrations/20261013000000_init_magneto.sql</span>
                </div>
                <div className="p-2.5 bg-slate-900 text-emerald-300 rounded-xl flex items-center justify-between">
                  <span>2. supabase/migrations/20261013000001_destination_catalog.sql</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Script 1 creates core profiles, trips, and savings. Script 2 creates the 100-destination catalog, countries, magnet assets, and user fridge collections with strict RLS policies.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#243447] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              3
            </div>
            <div className="w-full">
              <h4 className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" />
                Add Credentials to your local <code>.env</code> file
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 mb-2">
                Go to <strong>Project Settings → API</strong> in Supabase, and copy your Project URL & Anon Public Key into <code>.env</code>:
              </p>
              <div className="relative p-3 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs">
                <pre className="whitespace-pre-wrap">{envSample}</pre>
                <button
                  onClick={handleCopyEnv}
                  className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                >
                  {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEnv ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-[#243447] text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-600" />
                Restart Vite Dev Server
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Run <code>npm run dev</code>. The banner will turn green and you can immediately create trips and deposit savings!
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#243447] hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow transition-all"
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </Modal>
  )
}
