import React from 'react'
import type { TripWithStats } from '../../types/trip'
import type { FridgeMagnetItem } from '../../services/userMagnetService'
import { MagnetGraphic } from './MagnetGraphic'
import { Plus, Sparkles, Compass } from 'lucide-react'
import { formatINR } from '../../lib/utils'

interface VirtualFridgeProps {
  trips?: TripWithStats[]
  magnets?: FridgeMagnetItem[]
  onSelectTrip?: (trip: TripWithStats) => void
  onSelectMagnet?: (magnet: FridgeMagnetItem) => void
  onAddDestination: () => void
  isLoading?: boolean
  showControls?: boolean
}

export const VirtualFridge: React.FC<VirtualFridgeProps> = ({
  trips = [],
  magnets = [],
  onSelectTrip,
  onSelectMagnet,
  onAddDestination,
  isLoading = false,
  showControls = true,
}) => {
  // Determine display items: use magnets if available, else derive from trips
  const displayItems: FridgeMagnetItem[] =
    magnets.length > 0
      ? magnets
      : trips.map((t) => ({
          id: t.id,
          destination_slug: t.magnet_key,
          destination_name: t.destination_name,
          country_name: '',
          continent: '',
          asset_url: `/magnets/${t.magnet_key}.png`,
          magnet_shape: 'arch',
          acquired_at: t.created_at,
          trip_id: t.id,
          target_budget_minor: t.target_budget_minor,
          total_saved_minor: t.total_saved_minor,
          progress_percentage: t.progress_percentage,
          unlock_state: t.unlock_state,
        }))

  return (
    <div className="w-full max-w-md mx-auto select-none">
      {/* 
        The Floating Brushed Stainless-Steel Refrigerator Door
        Matching the Reference Image Exactly
      */}
      <div className="relative rounded-[2.2rem] sm:rounded-[2.5rem] p-2 sm:p-2.5 bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 shadow-[0_35px_70px_-15px_rgba(45,35,22,0.4),0_15px_30px_-8px_rgba(0,0,0,0.25)] border-[2.5px] border-slate-300/80">
        
        {/* Main Stainless-Steel Door Surface */}
        <div className="relative rounded-[2rem] sm:rounded-[2.2rem] min-h-[520px] sm:min-h-[560px] p-5 sm:p-6 flex flex-col justify-between overflow-hidden fridge-steel-finish border border-white/70">
          
          {/* Subtle Horizontal Freezer / Fridge Split Seam */}
          <div className="absolute top-[28%] inset-x-0 h-[1.5px] bg-slate-400/40 border-b border-white/50 pointer-events-none" />

          {/* Diagonal Specular Sheen Reflection Layer */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-1/3 transform -skew-x-12" />

          {/* Vertical Cylindrical Chrome Bar Handle on Right Edge */}
          <div className="absolute right-3 top-24 bottom-24 w-3 sm:w-3.5 rounded-full fridge-handle z-30 pointer-events-none shadow-[2px_6px_12px_rgba(0,0,0,0.38)]">
            {/* Top and Bottom Mounting Chrome Brackets */}
            <div className="absolute -top-2.5 -left-1 w-5 h-4 rounded bg-gradient-to-r from-slate-600 to-slate-400 shadow-sm" />
            <div className="absolute -bottom-2.5 -left-1 w-5 h-4 rounded bg-gradient-to-r from-slate-600 to-slate-400 shadow-sm" />
          </div>

          {/* Controls Bar (when on dashboard) */}
          {showControls && (
            <div className="relative z-20 flex items-center justify-between pb-3 mb-2 border-b border-slate-400/30 mr-5">
              <div>
                <span className="font-heading font-black text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  My Travel Fridge
                </span>
                <p className="text-[10px] text-slate-600 font-medium">
                  {displayItems.length > 0
                    ? `${displayItems.length} souvenir magnet${displayItems.length === 1 ? '' : 's'} collected`
                    : 'Your souvenir collection'}
                </p>
              </div>

              <button
                onClick={onAddDestination}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-[11px] font-bold rounded-xl shadow transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-3 h-3" />
                <span>Add Magnet</span>
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="relative z-10 my-auto grid grid-cols-2 gap-4 justify-items-center py-10 mr-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="w-28 h-32 bg-slate-300/60 animate-pulse rounded-2xl border border-slate-300"
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && displayItems.length === 0 && (
            <div className="relative z-10 my-auto text-center max-w-xs mx-auto py-12 px-4 mr-5">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-white/80 backdrop-blur-md border border-white flex items-center justify-center shadow mb-3 text-[#059669]">
                <Compass className="w-7 h-7 animate-spin-slow" />
              </div>
              <h4 className="font-heading font-black text-base text-slate-800 mb-1">
                Your fridge is empty!
              </h4>
              <p className="text-slate-600 text-xs mb-4 leading-relaxed">
                Explore the global souvenir catalog to collect physical travel magnets and track savings.
              </p>
              <button
                onClick={onAddDestination}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white font-heading font-bold text-xs rounded-xl shadow transition-all hover:scale-105"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Browse Magnet Catalog</span>
              </button>
            </div>
          )}

          {/* Magnets Laid Out on Door Surface (2 Columns) */}
          {!isLoading && displayItems.length > 0 && (
            <div className="relative z-10 my-auto py-2 grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-5 sm:gap-y-6 justify-items-center items-center mr-5">
              {displayItems.map((item, idx) => {
                const variant = ((idx % 3) + 1) as 1 | 2 | 3
                return (
                  <div
                    key={item.id}
                    className="flex flex-col items-center group"
                  >
                    <MagnetGraphic
                      magnetKey={item.destination_slug}
                      assetUrl={item.asset_url}
                      destinationName={item.destination_name}
                      state={item.unlock_state || 'dreaming'}
                      progressPercentage={item.progress_percentage || 0}
                      floatVariant={variant}
                      onClick={() => {
                        if (onSelectMagnet) {
                          onSelectMagnet(item)
                        } else if (onSelectTrip && item.trip_id) {
                          const trip = trips.find((t) => t.id === item.trip_id)
                          if (trip) onSelectTrip(trip)
                        }
                      }}
                    />

                    {/* Small Subtitle on Dashboard */}
                    {showControls && (
                      <div className="mt-1 text-center">
                        <p className="font-heading font-bold text-[10px] text-slate-800 group-hover:text-emerald-700 transition-colors line-clamp-1 max-w-[110px]">
                          {item.destination_name}
                        </p>
                        {item.target_budget_minor && item.target_budget_minor > 0 ? (
                          <p className="text-[9px] font-semibold text-slate-600">
                            {formatINR(item.total_saved_minor || 0)} / {formatINR(item.target_budget_minor)}
                          </p>
                        ) : (
                          <p className="text-[9px] font-medium text-slate-500">
                            Souvenir Collectible
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Bottom Brushed Metal Trim */}
          <div className="relative z-10 pt-2 mt-auto border-t border-slate-400/20 flex items-center justify-between text-[10px] text-slate-500 font-medium mr-5">
            <span>Collectible Souvenir Magnets</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Interactive
            </span>
          </div>

        </div>

      </div>
    </div>
  )
}
