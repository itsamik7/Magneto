import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { FridgeModel, MagnetPlacement } from '../../types/fridge'
import type { FridgeMagnetItem } from '../../services/userMagnetService'
import { fridgeService } from '../../services/fridgeService'
import { DraggableMagnet } from './DraggableMagnet'
import { FridgeModelModal } from './FridgeModelModal'
import {
  Sparkles,
  LayoutGrid,
  Plus,
  Compass,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react'

export interface FridgeWorkspaceProps {
  userId?: string
  currentModel: FridgeModel
  magnets: FridgeMagnetItem[]
  selectedPlacementId?: string | null
  onSelectPlacementId?: (id: string | null) => void
  onSelectMagnetItem?: (magnet: FridgeMagnetItem) => void
  onAddDestination?: () => void
  onChangeFridgeModel?: (model: FridgeModel) => void
  showControls?: boolean
  onPlacementsChange?: (placements: MagnetPlacement[]) => void
}

export const FridgeWorkspace: React.FC<FridgeWorkspaceProps> = ({
  userId = 'guest',
  currentModel,
  magnets = [],
  selectedPlacementId: controlledSelectedId,
  onSelectPlacementId,
  onSelectMagnetItem,
  onAddDestination,
  onChangeFridgeModel,
  showControls = true,
  onPlacementsChange,
}) => {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [isModelModalOpen, setIsModelModalOpen] = useState(false)
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [placements, setPlacements] = useState<MagnetPlacement[]>([])

  const selectedPlacementId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId
  const setSelectedPlacementId = (id: string | null) => {
    if (onSelectPlacementId) {
      onSelectPlacementId(id)
    } else {
      setInternalSelectedId(id)
    }
  }

  // Load / sync placements whenever model or magnets change
  useEffect(() => {
    const loaded = fridgeService.getFridgePlacements(
      userId,
      currentModel.id,
      magnets
    )
    setPlacements(loaded)
    if (onPlacementsChange) {
      onPlacementsChange(loaded)
    }
  }, [userId, currentModel.id, magnets])

  // Deselect when clicking outside magnets
  const handleSurfaceClick = (e: React.MouseEvent) => {
    if (e.target === surfaceRef.current) {
      setSelectedPlacementId(null)
    }
  }

  // Update a single magnet placement
  const handleUpdatePlacement = useCallback(
    (updated: MagnetPlacement) => {
      setPlacements((prev) => {
        const next = prev.map((p) => (p.id === updated.id ? updated : p))
        fridgeService.saveFridgePlacements(userId, currentModel.id, next)
        if (onPlacementsChange) onPlacementsChange(next)
        return next
      })
    },
    [userId, currentModel.id, onPlacementsChange]
  )

  // Bring selected magnet to front
  const handleBringToFront = useCallback(
    (id: string) => {
      setPlacements((prev) => {
        const maxZ = Math.max(0, ...prev.map((p) => p.zIndex))
        const next = prev.map((p) => (p.id === id ? { ...p, zIndex: maxZ + 1 } : p))
        fridgeService.saveFridgePlacements(userId, currentModel.id, next)
        if (onPlacementsChange) onPlacementsChange(next)
        return next
      })
    },
    [userId, currentModel.id, onPlacementsChange]
  )

  // Remove magnet from fridge placement
  const handleRemovePlacement = useCallback(
    (id: string) => {
      setPlacements((prev) => {
        const next = prev.filter((p) => p.id !== id)
        fridgeService.saveFridgePlacements(userId, currentModel.id, next)
        if (onPlacementsChange) onPlacementsChange(next)
        return next
      })
      if (selectedPlacementId === id) {
        setSelectedPlacementId(null)
      }
    },
    [userId, currentModel.id, selectedPlacementId, onPlacementsChange]
  )

  // Auto-arrange all collected magnets
  const handleAutoArrange = () => {
    const arranged = fridgeService.autoArrangeAll(userId, currentModel.id, magnets)
    setPlacements(arranged)
    if (onPlacementsChange) onPlacementsChange(arranged)
  }

  const selectedPlacement = placements.find((p) => p.id === selectedPlacementId)
  const magneticRegion = currentModel.magneticRegion

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* Top Floating Utility Controls Bar */}
      {showControls && (
        <div className="w-full max-w-md mb-2 flex items-center justify-between gap-2 px-1 text-xs">
          {/* Active Model Indicator & Switcher */}
          <button
            onClick={() => setIsModelModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-xs border border-slate-200 font-medium transition-all hover:border-slate-300"
            title="Choose a different refrigerator model"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-heading font-bold text-[11px] truncate max-w-[140px] sm:max-w-[180px]">
              {currentModel.name}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>

          <div className="flex items-center gap-1.5">
            {/* Auto Arrange Layout */}
            {magnets.length > 0 && (
              <button
                onClick={handleAutoArrange}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs border border-slate-200 font-heading font-bold text-[11px] transition-all hover:scale-105 active:scale-95"
                title="Automatically organize magnets evenly across the fridge"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Auto Arrange</span>
              </button>
            )}

            {/* Add Magnet Button */}
            {onAddDestination && (
              <button
                onClick={onAddDestination}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl shadow-xs font-heading font-bold text-[11px] transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Magnet</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 
        CRITICAL ARCHITECTURAL GUARANTEE:
        FIXED-DIMENSIONS REFRIGERATOR CONTAINER
        
        The container aspect ratio and max-height are strictly locked to the appliance.
        Adding 1 magnet, 11 magnets, or 100 magnets will NEVER change its dimensions,
        stretch the layout, or cause vertical overflow!
      */}
      <div
        className="relative mx-auto rounded-[2rem] sm:rounded-[2.4rem] shadow-[0_25px_60px_-15px_rgba(20,29,47,0.35),0_10px_20px_-8px_rgba(0,0,0,0.18)] border-[3px] border-slate-300/80 overflow-hidden bg-slate-100"
        style={{
          width: '100%',
          maxWidth: '430px',
          aspectRatio: `${currentModel.aspectRatio}`,
          maxHeight: '640px',
        }}
      >
        {/* Layer 1: Photorealistic Appliance Artwork */}
        <img
          src={currentModel.imageUrl}
          alt={currentModel.name}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
        />

        {/* Layer 2: Subtle Specular Lighting Sheen */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-1/4 transform -skew-x-12" />

        {/* Layer 3: Usable Front Magnetic Surface (Bounded Interaction Layer) */}
        <div
          ref={surfaceRef}
          onClick={handleSurfaceClick}
          style={{
            position: 'absolute',
            top: `${magneticRegion.top * 100}%`,
            left: `${magneticRegion.left * 100}%`,
            width: `${magneticRegion.width * 100}%`,
            height: `${magneticRegion.height * 100}%`,
          }}
          className="relative select-none cursor-default"
        >
          {/* Empty Fridge Invitation State */}
          {magnets.length === 0 && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 p-4 text-center bg-white/85 backdrop-blur-md rounded-2xl border border-white/80 shadow-md">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 shadow-xs">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <h4 className="font-heading font-black text-xs text-slate-800">
                Your Fridge is Ready!
              </h4>
              <p className="text-[10px] text-slate-600 mt-1 leading-snug">
                Click any souvenir magnet from the collection on the left to add it to your fridge.
              </p>
              {onAddDestination && (
                <button
                  onClick={onAddDestination}
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-[10px] rounded-lg shadow-xs transition-transform hover:scale-105"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Explore Magnets</span>
                </button>
              )}
            </div>
          )}

          {/* Render all Draggable, Resizable, Rotatable Magnets */}
          {placements.map((placement) => {
            const isSelected = placement.id === selectedPlacementId
            const matchedMagnet = magnets.find((m) => m.id === placement.id)

            return (
              <DraggableMagnet
                key={placement.id}
                placement={placement}
                isSelected={isSelected}
                surfaceRef={surfaceRef}
                onSelect={() => setSelectedPlacementId(placement.id)}
                onUpdatePlacement={handleUpdatePlacement}
                onRemove={() => handleRemovePlacement(placement.id)}
                onBringToFront={() => handleBringToFront(placement.id)}
                onClick={() => {
                  setSelectedPlacementId(placement.id)
                  if (matchedMagnet && onSelectMagnetItem) {
                    onSelectMagnetItem(matchedMagnet)
                  }
                }}
              />
            )
          })}
        </div>

        {/* Selected Magnet Status Toast Overlay (Bottom Edge) */}
        {selectedPlacement && (
          <div className="absolute bottom-2.5 inset-x-3 z-50 p-2 bg-slate-900/90 backdrop-blur-md border border-white/20 rounded-xl text-white flex items-center justify-between text-[10px] shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="min-w-0 pr-2">
              <p className="font-heading font-bold text-white truncate">
                {selectedPlacement.destinationName}
              </p>
              <p className="text-[9px] text-slate-300">
                Drag to place · Use right panel to scale, rotate & layer
              </p>
            </div>
            <button
              onClick={() => setSelectedPlacementId(null)}
              className="text-slate-400 hover:text-white px-1 font-bold text-[10px]"
            >
              Done
            </button>
          </div>
        )}

      </div>

      {/* Model Selection Modal */}
      <FridgeModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        currentModelId={currentModel.id}
        userId={userId}
        onSelectModel={(model) => {
          if (onChangeFridgeModel) {
            onChangeFridgeModel(model)
          }
          fridgeService.setActiveFridgeId(userId, model.id)
        }}
      />
    </div>
  )
}
