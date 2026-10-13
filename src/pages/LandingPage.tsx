import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { VirtualFridge } from '../components/fridge/VirtualFridge'
import type { TripWithStats } from '../types/trip'
import { Sparkles, MapPin, PiggyBank, ArrowRight } from 'lucide-react'

// Demo magnets showcasing the 6 reference destinations from the screenshot
const DEMO_TRIPS: TripWithStats[] = [
  {
    id: 'demo-paris',
    user_id: 'demo',
    destination_name: 'Paris, France',
    magnet_key: 'paris',
    start_date: '2027-09-10',
    end_date: '2027-09-20',
    target_budget_minor: 9500000,
    currency: 'INR',
    notes: 'Sunset Eiffel tower, Louvre, cafe mornings.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_saved_minor: 4750000,
    amount_remaining_minor: 4750000,
    progress_percentage: 50,
    unlock_state: 'saving',
    deposit_count: 3,
  },
  {
    id: 'demo-japan',
    user_id: 'demo',
    destination_name: 'Kyoto & Tokyo, Japan',
    magnet_key: 'japan',
    start_date: '2027-04-01',
    end_date: '2027-04-12',
    target_budget_minor: 12000000,
    currency: 'INR',
    notes: 'Mount Fuji, cherry blossom season, pagodas.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_saved_minor: 12000000,
    amount_remaining_minor: 0,
    progress_percentage: 100,
    unlock_state: 'ready_to_go',
    deposit_count: 5,
  },
  {
    id: 'demo-london',
    user_id: 'demo',
    destination_name: 'London, UK',
    magnet_key: 'london',
    start_date: '2027-07-05',
    end_date: '2027-07-15',
    target_budget_minor: 8000000,
    currency: 'INR',
    notes: 'Big Ben, West End theatre, red buses.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_saved_minor: 2400000,
    amount_remaining_minor: 5600000,
    progress_percentage: 30,
    unlock_state: 'saving',
    deposit_count: 2,
  },
  {
    id: 'demo-switzerland',
    user_id: 'demo',
    destination_name: 'Swiss Alps',
    magnet_key: 'switzerland',
    start_date: '2027-08-10',
    end_date: '2027-08-20',
    target_budget_minor: 11000000,
    currency: 'INR',
    notes: 'Alpine peaks, chalets, turquoise lakes.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_saved_minor: 0,
    amount_remaining_minor: 11000000,
    progress_percentage: 0,
    unlock_state: 'dreaming',
    deposit_count: 0,
  },
  {
    id: 'demo-bali',
    user_id: 'demo',
    destination_name: 'Bali, Indonesia',
    magnet_key: 'bali',
    start_date: '2026-11-12',
    end_date: '2026-11-20',
    target_budget_minor: 4500000,
    currency: 'INR',
    notes: 'Candi Bentar gate, tropical beaches, waterfalls.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_saved_minor: 1500000,
    amount_remaining_minor: 3000000,
    progress_percentage: 33,
    unlock_state: 'saving',
    deposit_count: 1,
  },
  {
    id: 'demo-singapore',
    user_id: 'demo',
    destination_name: 'Singapore',
    magnet_key: 'singapore',
    start_date: '2026-12-24',
    end_date: '2026-12-30',
    target_budget_minor: 6000000,
    currency: 'INR',
    notes: 'Marina Bay Sands, Merlion, Gardens by the Bay.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_saved_minor: 6000000,
    amount_remaining_minor: 0,
    progress_percentage: 100,
    unlock_state: 'ready_to_go',
    deposit_count: 4,
  },
]

export const LandingPage: React.FC = () => {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 
        Hero Section (Split Layout Matching Reference Image):
        Left: Headline, description, feature pills, Google / Email CTA
        Right: Sleek vertical refrigerator with realistic souvenir magnets
      */}
      <section className="pt-6 sm:pt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center max-w-6xl mx-auto">
        
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-7 text-left">
          
          {/* Brand Logo & Cursive Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#059669] text-white flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-white fill-none stroke-[2]">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20M12 2a14.5 14.5 0 0 1 0 20M2 12h20" />
              </svg>
            </div>
            <div>
              <span className="font-heading font-black text-2xl text-[#1E293B] tracking-tight">
                Magneto
              </span>
              <p className="text-xs font-semibold text-[#059669] italic -mt-1 font-serif">
                Collect. Save. Explore.
              </p>
            </div>
          </div>

          {/* Bold Headline Matching Screenshot */}
          <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-[#1E293B] tracking-tight leading-[1.12]">
            Your travel dreams, <br />
            <span className="text-[#059669]">one magnet</span> at a <br />
            time.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
            Collect the places you dream of visiting as real-looking fridge magnets, set a budget, and watch your collection glow as you save your way there.
          </p>

          {/* Feature Pills (From Screenshot) */}
          <div className="flex flex-wrap gap-2.5 pt-1">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E2DCCE] text-xs font-semibold text-slate-700 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-[#059669]" />
              <span>Collect destinations</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E2DCCE] text-xs font-semibold text-slate-700 shadow-sm">
              <PiggyBank className="w-3.5 h-3.5 text-[#059669]" />
              <span>Save toward trips</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E2DCCE] text-xs font-semibold text-slate-700 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
              <span>Unlock & remember</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-3 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-heading font-bold text-sm sm:text-base rounded-2xl border border-slate-300 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                {/* Google G Logo */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>Continue to My Travel Fridge</span>
              </Link>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-heading font-bold text-sm sm:text-base rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Free to start · Your fridge is saved to your account.
            </p>
          </div>

        </div>

        {/* Right Column: Refrigerator Centerpiece */}
        <div className="lg:col-span-5 flex justify-center">
          <VirtualFridge
            trips={DEMO_TRIPS}
            onSelectTrip={() => {}}
            onAddDestination={() => {}}
            showControls={false}
          />
        </div>

      </section>

      {/* Core Features & Experience Section */}
      <section className="max-w-5xl mx-auto space-y-8 px-4">
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-[#1E293B] text-white shadow-2xl space-y-8">
          <div className="max-w-xl space-y-3">
            <h2 className="font-heading font-black text-2xl sm:text-4xl leading-tight">
              A travel planner that feels like a tangible souvenir board.
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Say goodbye to boring spreadsheets and messy notes apps. Magneto turns saving for travel into a visual ritual.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-700">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base">Collectible Magnets</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Realistic die-cut souvenir artwork with drop shadows and enamel textures on brushed steel.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <PiggyBank className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base">Precise Savings Engine</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                INR progress meters, deposit ledger, and automatic Dreaming $\rightarrow$ Saving $\rightarrow$ Ready to Go state transitions.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-teal-400/20 text-teal-300 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base">Itinerary & Checklist</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Organize your day tours, flight bookings, hotel reservations, packing lists, and passport deadlines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center space-y-4 max-w-lg mx-auto px-4">
        <h3 className="font-heading font-black text-2xl sm:text-3xl text-slate-900">
          Your next adventure starts here.
        </h3>
        <p className="text-xs sm:text-sm text-slate-600">
          Create your account today and stick your first dream destination to your fridge.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-heading font-bold text-sm rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create My Travel Fridge</span>
        </Link>
      </section>
    </div>
  )
}
