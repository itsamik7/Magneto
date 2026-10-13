import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { VirtualFridge } from '../components/fridge/VirtualFridge'
import type { TripWithStats } from '../types/trip'
import { Sparkles, Compass, PiggyBank, CheckSquare, ArrowRight } from 'lucide-react'

// Demo magnets on landing page to showcase the realistic fridge visual centerpiece
const DEMO_TRIPS: TripWithStats[] = [
  {
    id: 'demo-1',
    user_id: 'demo',
    destination_name: 'Kyoto & Tokyo, Japan',
    magnet_key: 'japan',
    start_date: '2027-04-01',
    end_date: '2027-04-12',
    target_budget_minor: 12000000, // 1,20,000 INR
    currency: 'INR',
    notes: 'Spring blossom pilgrimage with visits to Fushimi Inari and Akihabara.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_saved_minor: 12000000,
    amount_remaining_minor: 0,
    progress_percentage: 100,
    unlock_state: 'ready_to_go',
    deposit_count: 5,
  },
  {
    id: 'demo-2',
    user_id: 'demo',
    destination_name: 'Paris, France',
    magnet_key: 'paris',
    start_date: '2027-09-10',
    end_date: '2027-09-20',
    target_budget_minor: 9500000, // 95,000 INR
    currency: 'INR',
    notes: 'Eiffel Tower, Louvre, and croissant cafe mornings.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_saved_minor: 4750000, // 47,500 INR
    amount_remaining_minor: 4750000,
    progress_percentage: 50,
    unlock_state: 'saving',
    deposit_count: 3,
  },
  {
    id: 'demo-3',
    user_id: 'demo',
    destination_name: 'Goa Coast, India',
    magnet_key: 'goa',
    start_date: '2026-12-15',
    end_date: '2026-12-22',
    target_budget_minor: 3000000, // 30,000 INR
    currency: 'INR',
    notes: 'Winter beach escape and sunset shacks.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_saved_minor: 0,
    amount_remaining_minor: 3000000,
    progress_percentage: 0,
    unlock_state: 'dreaming',
    deposit_count: 0,
  },
]

export const LandingPage: React.FC = () => {
  const { user } = useAuth()

  // Redirect authenticated users directly to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 px-4 sm:px-6 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-bold tracking-wide shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-coral" />
          <span>Turn your travel dreams into destinations.</span>
        </div>

        <h1 className="font-heading font-black text-4xl sm:text-6xl text-[#243447] tracking-tight leading-[1.15]">
          Collect dream destinations as <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#243447] via-[#3A8D8C] to-[#E98267]">
            virtual refrigerator magnets.
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
          Collect the places you dream of visiting, save money toward each adventure in INR, watch your magnets unlock into reality, and plan your itineraries with confidence.
        </p>

        {/* CTA Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#E98267] hover:bg-[#d96d51] text-white font-heading font-bold text-base rounded-2xl shadow-xl shadow-[#E98267]/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>Build My Travel Fridge</span>
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-heading font-bold text-base rounded-2xl border border-slate-300 shadow-sm transition-all hover:border-slate-400"
          >
            <span>Log In</span>
          </Link>
        </div>

        {/* Refrigerator Centerpiece Visual Showcase */}
        <div className="pt-10">
          <VirtualFridge
            trips={DEMO_TRIPS}
            onSelectTrip={() => {}}
            onAddDestination={() => {}}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#243447]">
            How Magneto Works
          </h2>
          <p className="text-slate-500 text-sm max-w-lg mx-auto">
            From dreaming of a getaway to boarding your flight, every step is rewarding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-sm space-y-3 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-[#3A8D8C] flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-800">
              Add your dream destinations
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pick a collectible destination souvenir magnet—Paris, Japan, Goa, Swiss Alps, and more—and set your target budget in INR.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-sm space-y-3 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-coral/10 border border-coral/30 text-[#E98267] flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-800">
              Save money toward each trip
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Record user-declared savings deposits. Magneto tracks precise totals in minor paise units with zero floating-point rounding errors.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#E5E2DC] shadow-sm space-y-3 relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-300 text-[#243447] flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-heading font-bold text-lg text-slate-800">
              Unlock & plan your journey
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Magnets automatically graduate from Dreaming to Saving to Ready to Go! Organize your day-by-day itinerary and departure checklist.
            </p>
          </div>
        </div>
      </section>

      {/* Core Benefits */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        <div className="p-8 sm:p-12 rounded-[2.5rem] bg-[#243447] text-white shadow-2xl space-y-8">
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
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base">Collectible Magnets</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Realistic enamel, metal, and lacquer souvenir artwork on your brushed stainless fridge.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-coral/20 text-coral flex items-center justify-center">
                <PiggyBank className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base">Precise Savings Engine</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Built-in INR progress meters, deposit history, and automatic state unlock transitions.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base">Itinerary & Checklist</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Everything in one place: schedule activities, packing lists, passport checks, and flight bookings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 max-w-3xl mx-auto text-center space-y-6">
        <h2 className="font-heading font-black text-3xl sm:text-4xl text-[#243447]">
          Your next adventure starts here.
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Create your account today and stick your first dream destination to your fridge.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#E98267] hover:bg-[#d96d51] text-white font-heading font-extrabold text-base rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          <span>Create My Travel Fridge</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  )
}
