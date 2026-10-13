import React from 'react'
import type { TripWithStats } from '../../types/trip'
import { MagnetGraphic } from './MagnetGraphic'
import { Plus, Sparkles, Compass } from 'lucide-react'
import { formatINR } from '../../lib/utils'

interface VirtualFridgeProps {
  trips: TripWithStats[]
  onSelectTrip: (trip: TripWithStats) => void
  onAddDestination: () => void
  isLoading?: boolean
}

// Natural slight tilt angles to mimic real souvenir magnets on a physical fridge door
const ROTATIONS = ['rotate-[-2deg]', 'rotate-[1.5deg]', 'rotate-[-1deg]', 'rotate-[2.5deg]', 'rotate-[-1.5deg]', 'rotate-[1deg]']

export const VirtualFridge: React.FC<VirtualFridgeProps> = ({
  trips,
  onSelectTrip,
  onAddDestination,
  isLoading = false,
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Fridge Outer Frame & Body */}
      <div className="relative rounded-[2rem] sm:rounded-[2.5rem] p-3 sm:p-5 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 shadow-2xl border-4 border-slate-400/80">
        
        {/* Subtle Top Crown / Hinge Header */}
        <div className="flex justify-between items-center px-4 py-1 mb-2">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-500 border border-slate-300 shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-slate-500 border border-slate-300 shadow-inner" />
          </div>
          {/* Embossed Chrome Brand Wordmark */}
          <div className="text-slate-600/80 font-heading tracking-[0.25em] text-xs font-black uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
            MAGNETO • TRAVEL CO.
          </div>
          <div className="w-8 h-2 rounded-full bg-slate-400/70 border border-slate-200" />
        </div>

        {/* Stainless Steel Main Door Surface */}
        <div className="relative fridge-steel-finish rounded-3xl min-h-[540px] sm:min-h-[620px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden border border-white/60">
          
          {/* Subtle Brushed Steel Sheen Highlight Diagonal */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/15 to-transparent -translate-x-1/4 transform -skew-x-12" />

          {/* Vertical Metallic Handle (Right Side) */}
          <div className="hidden sm:block absolute right-4 top-24 bottom-24 w-4 rounded-full fridge-handle z-20 pointer-events-none">
            {/* Handle Mounting Brackets */}
            <div className="absolute -top-3 -left-1 w-6 h-5 rounded-md bg-slate-600 shadow" />
            <div className="absolute -bottom-3 -left-1 w-6 h-5 rounded-md bg-slate-600 shadow" />
          </div>

          {/* Top Fridge Door Header Controls */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-400/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-heading font-bold text-slate-800 text-lg sm:text-xl tracking-tight">
                  Virtual Refrigerator
                </h3>
              </div>
              <p className="text-slate-600 text-xs sm:text-sm font-medium mt-0.5">
                {trips.length > 0
                  ? `${trips.length} destination ${trips.length === 1 ? 'magnet' : 'magnets'} collected`
                  : 'Start placing souvenir magnets on your fridge'}
              </p>
            </div>

            <button
              onClick={onAddDestination}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#243447] to-[#1D2A3A] hover:from-[#1D2A3A] hover:to-[#111A24] text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:shadow-lg active:scale-95 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <Plus className="w-4 h-4 text-coral" />
              <span>Add Destination</span>
            </button>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="relative z-10 my-auto grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 justify-items-center py-12">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-44 h-52 bg-slate-300/60 animate-pulse rounded-2xl border-2 border-slate-300" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && trips.length === 0 && (
            <div className="relative z-10 my-auto text-center max-w-md mx-auto py-12 px-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-white/70 backdrop-blur-md border border-white flex items-center justify-center shadow-lg mb-5 text-[#3A8D8C]">
                <Compass className="w-10 h-10 animate-spin-slow" />
              </div>
              <h4 className="font-heading font-extrabold text-2xl text-slate-800 mb-2">
                Your next adventure starts here.
              </h4>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                Add your dream travel destinations to start collecting virtual souvenir magnets and watching your savings grow.
              </p>
              <button
                onClick={onAddDestination}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#E98267] hover:bg-[#d96d51] text-white font-heading font-bold text-sm rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Add Your First Destination</span>
              </button>
            </div>
          )}

          {/* Magnet Grid / Fridge Surface */}
          {!isLoading && trips.length > 0 && (
            <div className="relative z-10 my-auto py-6 sm:py-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 justify-items-center items-center">
              {trips.map((trip, idx) => {
                const rotation = ROTATIONS[idx % ROTATIONS.length]
                return (
                  <div
                    key={trip.id}
                    className={`flex flex-col items-center group transition-transform ${rotation}`}
                  >
                    <MagnetGraphic
                      magnetKey={trip.magnet_key}
                      destinationName={trip.destination_name}
                      state={trip.unlock_state}
                      progressPercentage={trip.progress_percentage}
                      onClick={() => onSelectTrip(trip)}
                    />
                    
                    {/* Destination name badge below magnet */}
                    <div className="mt-2 text-center">
                      <p className="font-heading font-bold text-xs sm:text-sm text-slate-800 group-hover:text-teal-700 transition-colors line-clamp-1 max-w-[150px]">
                        {trip.destination_name}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                        {formatINR(trip.total_saved_minor)} / {formatINR(trip.target_budget_minor)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Refrigerator Bottom Trim & Kickplate */}
          <div className="relative z-10 pt-4 mt-auto border-t border-slate-400/25 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Tactile Collectible Magnets</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Click any magnet to view details & deposit savings
            </span>
          </div>

        </div>

        {/* Fridge Heavy Base Stand */}
        <div className="flex justify-between px-8 -mt-1 pt-2">
          <div className="w-12 h-3.5 rounded-b-md bg-slate-700 shadow-md" />
          <div className="w-12 h-3.5 rounded-b-md bg-slate-700 shadow-md" />
        </div>

      </div>
    </div>
  )
}
