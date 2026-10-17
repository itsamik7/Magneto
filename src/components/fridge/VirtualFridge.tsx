import React, { useState, useEffect } from 'react'
import type { TripWithStats } from '../../types/trip'
import type { FridgeMagnetItem } from '../../services/userMagnetService'
import type { FridgeModel } from '../../types/fridge'
import { fridgeService, DEFAULT_FRIDGE_ID } from '../../services/fridgeService'
import { FridgeWorkspace } from './FridgeWorkspace'

interface VirtualFridgeProps {
  userId?: string
  trips?: TripWithStats[]
  magnets?: FridgeMagnetItem[]
  onSelectTrip?: (trip: TripWithStats) => void
  onSelectMagnet?: (magnet: FridgeMagnetItem) => void
  onAddDestination: () => void
  isLoading?: boolean
  showControls?: boolean
  readOnly?: boolean
}

export const VirtualFridge: React.FC<VirtualFridgeProps> = ({
  userId = 'default_user',
  trips = [],
  magnets = [],
  onSelectTrip,
  onSelectMagnet,
  onAddDestination,
  isLoading = false,
  showControls = true,
  readOnly = true,
}) => {
  // Active fridge model (Universal Studio Stainless 3D)
  const [activeModel, setActiveModel] = useState<FridgeModel>(() => {
    return fridgeService.getFridgeModelById(DEFAULT_FRIDGE_ID, userId)
  })

  // Sync if userId changes
  useEffect(() => {
    setActiveModel(fridgeService.getFridgeModelById(DEFAULT_FRIDGE_ID, userId))
  }, [userId])

  // Derive display magnets: use magnets array if populated, or fallback to trips
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

  // Loading skeleton with fixed aspect ratio matching the fridge
  if (isLoading) {
    return (
      <div className="w-full flex justify-center select-none">
        <div
          className="relative mx-auto rounded-[2.5rem] bg-gradient-to-b from-slate-200 to-slate-300 shadow-xl border-4 border-slate-300 animate-pulse flex flex-col items-center justify-center p-6"
          style={{
            width: '100%',
            maxWidth: '380px',
            aspectRatio: `${activeModel.aspectRatio}`,
            maxHeight: '620px',
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-300/80 mb-4" />
          <div className="w-32 h-4 rounded-full bg-slate-300/80 mb-2" />
          <div className="w-24 h-3 rounded-full bg-slate-300/60" />
        </div>
      </div>
    )
  }

  return (
    <FridgeWorkspace
      userId={userId}
      currentModel={activeModel}
      magnets={displayItems}
      readOnly={readOnly}
      onSelectMagnetItem={(magnet) => {
        if (onSelectMagnet) {
          onSelectMagnet(magnet)
        } else if (onSelectTrip && magnet.trip_id) {
          const matchedTrip = trips.find((t) => t.id === magnet.trip_id)
          if (matchedTrip) {
            onSelectTrip(matchedTrip)
          }
        }
      }}
      onAddDestination={onAddDestination}
      showControls={showControls}
    />
  )
}
