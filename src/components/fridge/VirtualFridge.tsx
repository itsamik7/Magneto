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
  showControls?: boolean
}

// Gentle natural souvenir magnet tilts
const ROTATIONS = [
  '-rotate-1',
  'rotate-1',
  '-rotate-2',
  'rotate-1.5',
  '-rotate-1.5',
  'rotate-2',
]

export const VirtualFridge: React.FC<VirtualFridgeProps> = ({
  trips,
  onSelectTrip,
  onAddDestination,
  isLoading = false,
  showControls = true,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto">
      {/* 
        Sleek, Tall, Rounded Brushed Stainless Steel Refrigerator 
        Matching the Reference Image Design
      */}
      <div className="relative rounded-[2.5rem] p-2.5 sm:p-3.5 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 shadow-[0_25px_60px_-15px_rgba(40,45,55,0.45),0_10px_20px_-5px_rgba(0,0,0,0.25)] border-[3px] border-slate-300">
        
        {/* Stainless Steel Main Door Surface */}
        <div className="relative rounded-[2.2rem] min-h-[580px] sm:min-h-[640px] p-6 sm:p-8 flex flex-col justify-between overflow-hidden fridge-steel-finish border border-white/70">
          
          {/* Brushed Steel Diagonal Sheen Layer */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-1/3 transform -skew-x-12" />

          {/* Vertical Chrome Cylindrical Bar Handle on Right (as in screenshot) */}
          <div className="absolute right-3.5 sm:right-4 top-20 bottom-20 w-3.5 sm:w-4 rounded-full fridge-handle z-20 pointer-events-none shadow-[2px_6px_12px_rgba(0,0,0,0.35)]">
            {/* Top and Bottom Mounting Brackets */}
            <div className="absolute -top-3 -left-1 w-5.5 sm:w-6 h-4 sm:h-5 rounded-md bg-gradient-to-r from-slate-600 to-slate-400 shadow-sm" />
            <div className="absolute -bottom-3 -left-1 w-5.5 sm:w-6 h-4 sm:h-5 rounded-md bg-gradient-to-r from-slate-600 to-slate-400 shadow-sm" />
          </div>

          {/* Optional Controls Bar */}
          {showControls && (
            <div className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-400/30 mr-6">
              <div>
                <span className="font-heading font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Travel Fridge
                </span>
                <p className="text-[11px] text-slate-600 font-medium">
                  {trips.length > 0 ? `${trips.length} magnets collected` : 'Your personal souvenir board'}
                </p>
              </div>

              <button
                onClick={onAddDestination}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Magnet</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="relative z-10 my-auto grid grid-cols-2 gap-6 justify-items-center py-12 mr-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-36 h-44 bg-slate-300/60 animate-pulse rounded-2xl border-2 border-slate-300" />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && trips.length === 0 && (
            <div className="relative z-10 my-auto text-center max-w-xs mx-auto py-12 px-4 mr-6">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-white/80 backdrop-blur-md border border-white flex items-center justify-center shadow-lg mb-4 text-[#059669]">
                <Compass className="w-8 h-8 animate-spin-slow" />
              </div>
              <h4 className="font-heading font-extrabold text-lg text-slate-800 mb-1.5">
                Your fridge is ready!
              </h4>
              <p className="text-slate-600 text-xs mb-5 leading-relaxed">
                Start collecting real-looking destination magnets and save your way toward departure.
              </p>
              <button
                onClick={onAddDestination}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-heading font-bold text-xs rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add Your First Destination</span>
              </button>
            </div>
          )}

          {/* Active Magnets Grid on Stainless Steel Door Surface */}
          {!isLoading && trips.length > 0 && (
            <div className="relative z-10 my-auto py-6 grid grid-cols-2 gap-y-6 sm:gap-y-8 gap-x-4 sm:gap-x-6 justify-items-center items-center mr-6">
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

                    {/* Small Caption */}
                    <div className="mt-1.5 text-center">
                      <p className="font-heading font-bold text-[11px] text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1 max-w-[120px]">
                        {trip.destination_name}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-600">
                        {formatINR(trip.total_saved_minor)} / {formatINR(trip.target_budget_minor)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom Brushed Chrome Trim */}
          <div className="relative z-10 pt-3 mt-auto border-t border-slate-400/20 flex items-center justify-between text-[10px] text-slate-500 font-medium mr-6">
            <span>Realistic Souvenir Magnets</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Tap to view & deposit
            </span>
          </div>

        </div>

        {/* Realistic Fridge Feet */}
        <div className="flex justify-between px-8 -mt-1 pt-1.5">
          <div className="w-10 h-3 rounded-b-md bg-slate-700 shadow-md" />
          <div className="w-10 h-3 rounded-b-md bg-slate-700 shadow-md" />
        </div>

      </div>
    </div>
  )
}
