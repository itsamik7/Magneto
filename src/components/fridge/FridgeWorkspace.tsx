import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { FridgeModel, MagnetPlacement } from '../../types/fridge'
import type { FridgeMagnetItem } from '../../services/userMagnetService'
import { fridgeService } from '../../services/fridgeService'
import { DraggableMagnet } from './DraggableMagnet'
import { FridgeModelModal } from './FridgeModelModal'
import { UniversalSteelFridge } from './UniversalSteelFridge'
import {
  Sparkles,
  LayoutGrid,
  Plus,
  Compass,
  SlidersHorizontal,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Rotate3d,
  Undo2,
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
  readOnly?: boolean
  onRemoveMagnet?: (placementIdOrSlug: string) => void
  onPlacementsChange?: (placements: MagnetPlacement[]) => void
  onDropMagnet?: (magnetData: any, dropCoords: { x: number; y: number }) => void
  placements?: MagnetPlacement[]
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
  readOnly = false,
  onRemoveMagnet,
  onPlacementsChange,
  onDropMagnet,
  placements: controlledPlacements,
}) => {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isModelModalOpen, setIsModelModalOpen] = useState(false)
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)
  const [placements, setPlacements] = useState<MagnetPlacement[]>(() => {
    return controlledPlacements && controlledPlacements.length > 0
      ? controlledPlacements
      : fridgeService.getFridgePlacements(userId, currentModel.id, magnets)
  })
  const placementsRef = useRef<MagnetPlacement[]>([])
  placementsRef.current = placements

  // Synchronize if parent passes controlled placements
  useEffect(() => {
    if (controlledPlacements !== undefined && controlledPlacements.length > 0) {
      setPlacements(controlledPlacements)
    }
  }, [controlledPlacements])

  // Active Model synchronization (guarantees immediate re-render when user selects a different fridge)
  const [activeModel, setActiveModel] = useState<FridgeModel>(currentModel)
  useEffect(() => {
    setActiveModel(currentModel)
  }, [currentModel])

  // 3D Turntable / Rotation Angle to inspect fridge exterior & illuminated interior
  const [fridgeYaw, setFridgeYaw] = useState<number>(0)

  // Zoom & Pan Engine for inspecting magnets in large view
  const [zoomLevel, setZoomLevel] = useState<number>(1.0)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  })

  // 3D Door Open/Close State
  const [isMainDoorOpen, setIsMainDoorOpen] = useState(false)
  const [isFreezerDoorOpen, setIsFreezerDoorOpen] = useState(false)

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(1.0, +(prev - 0.25).toFixed(2))
      if (next === 1.0) setPanOffset({ x: 0, y: 0 })
      return next
    })
  }

  const handleResetZoom = () => {
    setZoomLevel(1.0)
    setPanOffset({ x: 0, y: 0 })
  }

  const handleCycleZoomPreset = () => {
    setZoomLevel((prev) => {
      if (prev < 1.4) return 1.5
      if (prev < 1.9) return 2.0
      if (prev < 2.4) return 2.5
      setPanOffset({ x: 0, y: 0 })
      return 1.0
    })
  }

  const handleToggleMainDoor = () => setIsMainDoorOpen((prev) => !prev)
  const handleToggleFreezerDoor = () => setIsFreezerDoorOpen((prev) => !prev)
  const handleToggleAllDoors = () => {
    if (isMainDoorOpen || isFreezerDoorOpen) {
      setIsMainDoorOpen(false)
      setIsFreezerDoorOpen(false)
    } else {
      setIsMainDoorOpen(true)
      setIsFreezerDoorOpen(true)
    }
  }

  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1.0) return
    const target = e.target as HTMLElement
    if (target.closest('.group.select-none') || target.closest('button')) return

    setIsPanning(true)
    panStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPanX: panOffset.x,
      initialPanY: panOffset.y,
    }
  }

  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || zoomLevel <= 1.0) return
    const deltaX = e.clientX - panStartRef.current.startX
    const deltaY = e.clientY - panStartRef.current.startY

    const maxPanX = (zoomLevel - 1) * 220
    const maxPanY = (zoomLevel - 1) * 360

    const clampedX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.initialPanX + deltaX))
    const clampedY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.initialPanY + deltaY))

    setPanOffset({ x: clampedX, y: clampedY })
  }

  const handlePanMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
    }
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      if (e.deltaY < 0) {
        handleZoomIn()
      } else {
        handleZoomOut()
      }
    }
  }

  const selectedPlacementId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId
  const setSelectedPlacementId = (id: string | null) => {
    if (onSelectPlacementId) {
      onSelectPlacementId(id)
    } else {
      setInternalSelectedId(id)
    }
  }

  // Load / sync placements whenever model or magnets change, or on sync events
  useEffect(() => {
    const loaded = fridgeService.getFridgePlacements(
      userId,
      activeModel.id,
      magnets
    )
    setPlacements(loaded)
    if (onPlacementsChange) {
      onPlacementsChange(loaded)
    }

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail?.source === 'FridgeWorkspace') return

      const refreshed = fridgeService.getFridgePlacements(
        userId,
        activeModel.id,
        magnets
      )
      setPlacements(refreshed)
      if (onPlacementsChange) {
        onPlacementsChange(refreshed)
      }
    }

    window.addEventListener('magneto_sync', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('magneto_sync', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [userId, activeModel.id, magnets])

  // Deselect when clicking outside magnets
  const handleSurfaceClick = (e: React.MouseEvent) => {
    if (e.target === surfaceRef.current) {
      setSelectedPlacementId(null)
    }
  }

  // Handle HTML5 drag and drop of magnets onto fridge surface
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (readOnly) return
    e.preventDefault()
    setIsDragOver(false)

    const surface = surfaceRef.current
    if (!surface) return

    const rect = surface.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dropX = Math.min(0.95, Math.max(0.05, (e.clientX - rect.left) / rect.width))
    const dropY = Math.min(0.97, Math.max(0.03, (e.clientY - rect.top) / rect.height))

    let magnetData: any = null
    try {
      const json = e.dataTransfer.getData('application/json')
      if (json) magnetData = JSON.parse(json)
    } catch {
      // Fallback
    }

    if (!magnetData) {
      const textId = e.dataTransfer.getData('text/plain')
      if (textId) {
        magnetData = { id: textId }
      }
    }

    if (magnetData && onDropMagnet) {
      onDropMagnet(magnetData, { x: dropX, y: dropY })
    }
  }

  // Update a single magnet placement cleanly outside state updater
  const handleUpdatePlacement = useCallback(
    (updated: MagnetPlacement, isCommit: boolean = true) => {
      const next = placementsRef.current.map((p) => (p.id === updated.id ? updated : p))
      setPlacements(next)
      if (onPlacementsChange) {
        onPlacementsChange(next)
      }
      if (isCommit) {
        const nonOverlapping = fridgeService.resolveMagnetOverlaps(next)
        setPlacements(nonOverlapping)
        if (onPlacementsChange) {
          onPlacementsChange(nonOverlapping)
        }
        fridgeService.saveFridgePlacements(userId, activeModel.id, nonOverlapping, 'FridgeWorkspace')
      }
    },
    [userId, activeModel.id, onPlacementsChange]
  )

  // Bring selected magnet to front
  const handleBringToFront = useCallback(
    (id: string) => {
      const maxZ = Math.max(0, ...placementsRef.current.map((p) => p.zIndex))
      const next = placementsRef.current.map((p) => (p.id === id ? { ...p, zIndex: maxZ + 1 } : p))
      setPlacements(next)
      fridgeService.saveFridgePlacements(userId, activeModel.id, next, 'FridgeWorkspace')
      if (onPlacementsChange) {
        onPlacementsChange(next)
      }
    },
    [userId, activeModel.id, onPlacementsChange]
  )

  // Remove magnet from fridge placement
  const handleRemovePlacement = useCallback(
    (id: string) => {
      const toRemove = placementsRef.current.find((p) => p.id === id)
      const next = placementsRef.current.filter((p) => p.id !== id)
      setPlacements(next)
      fridgeService.saveFridgePlacements(userId, activeModel.id, next, 'FridgeWorkspace')
      if (onPlacementsChange) {
        onPlacementsChange(next)
      }
      if (selectedPlacementId === id) {
        setSelectedPlacementId(null)
      }
      if (onRemoveMagnet) {
        onRemoveMagnet(toRemove?.magnetSlug || id)
      }
    },
    [userId, activeModel.id, selectedPlacementId, onPlacementsChange, onRemoveMagnet]
  )

  // Auto-arrange all collected magnets
  const handleAutoArrange = () => {
    const arranged = fridgeService.autoArrangeAll(userId, activeModel.id, magnets)
    setPlacements(arranged)
    if (onPlacementsChange) onPlacementsChange(arranged)
  }

  const selectedPlacement = placements.find((p) => p.id === selectedPlacementId)
  const magneticRegion = activeModel.magneticRegion

  return (
    <div className="w-full flex flex-col items-center select-none">
      
      {/* Top Floating Utility Controls Bar: Model, Door Open/Close, 3D Turntable, Zoom & Arrange */}
      <div className="w-full max-w-2xl mb-3 flex items-center justify-between gap-2 px-1 text-xs flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Active Model Indicator & Switcher */}
          {showControls && (
            <button
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-xs border border-slate-200 font-medium transition-all hover:border-slate-300 cursor-pointer"
              title="Choose a different refrigerator model from catalogue"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-heading font-bold text-[11px] truncate max-w-[120px] sm:max-w-[170px]">
                {activeModel.name}
              </span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {/* Zoom & Viewport Controls Pill */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1.0}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCycleZoomPreset}
            className="px-2 py-0.5 rounded-md font-heading font-bold text-[10px] text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Click to cycle zoom: 100%, 150%, 200%, 250%"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 2.5}
            className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-35 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
            title="Zoom In to inspect magnets in large detail"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {zoomLevel > 1.0 && (
            <button
              onClick={handleResetZoom}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border-l border-slate-200 pl-1.5 cursor-pointer"
              title="Reset Zoom & Pan"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>

        {showControls && (
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
        )}
      </div>

      {/* 
        INTERACTIVE ZOOM & PAN VIEWPORT
        Allows smooth magnification of the fridge so magnets can be viewed in large detail!
      */}
      <div
        className={`relative w-full flex flex-col items-center justify-center ${
          zoomLevel > 1.0 ? 'overflow-hidden' : 'overflow-visible'
        } rounded-3xl p-2 sm:p-4 ${
          zoomLevel > 1.0 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handlePanMouseMove}
        onMouseUp={handlePanMouseUp}
        onMouseLeave={handlePanMouseUp}
        onWheel={handleWheel}
      >
        {/* Floating Pan Helper Pill (Visible when zoomed in) */}
        {zoomLevel > 1.0 && (
          <div className="absolute top-2 z-40 px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-heading font-semibold rounded-full shadow-md flex items-center gap-1.5 border border-white/20 pointer-events-none animate-in fade-in">
            <Move className="w-3 h-3 text-blue-400" />
            <span>Magnified View • Drag canvas to pan</span>
          </div>
        )}

        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'center center',
            transition: isPanning ? 'none' : 'transform 200ms cubic-bezier(0.2, 0.9, 0.3, 1)',
          }}
          className="relative w-full max-w-[360px] overflow-visible"
        >
          {/* Check whether active model is the Universal 3D Studio model or another catalog model */}
          {activeModel.id === 'universal-steel-studio' ? (
            <UniversalSteelFridge
              isDoorOpen={isMainDoorOpen}
              onToggleDoor={handleToggleAllDoors}
              isMainDoorOpen={isMainDoorOpen}
              isFreezerDoorOpen={isFreezerDoorOpen}
              onToggleMainDoor={handleToggleMainDoor}
              onToggleFreezerDoor={handleToggleFreezerDoor}
              magneticRegion={magneticRegion}
              surfaceRef={surfaceRef}
              aspectRatio={activeModel.aspectRatio}
              isDragOver={isDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onSurfaceClick={handleSurfaceClick}
              isEditable={!readOnly}
              yaw={fridgeYaw}
              onYawChange={setFridgeYaw}
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
                      className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-[10px] rounded-lg shadow-xs transition-transform hover:scale-105 cursor-pointer"
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
                const matchedMagnet = magnets.find(
                  (m) =>
                    m.id === placement.id ||
                    m.destination_slug.toLowerCase() === placement.magnetSlug.toLowerCase()
                )

                return (
                  <DraggableMagnet
                    key={placement.id}
                    placement={placement}
                    isSelected={isSelected}
                    surfaceRef={surfaceRef}
                    isEditable={!readOnly}
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
            </UniversalSteelFridge>
          ) : (
            /* Selected Catalog or Custom Uploaded Fridge Model with 3D Turntable Rotation */
            <div className="w-full flex flex-col items-center select-none">
              <div
                className="relative mx-auto select-none"
                style={{
                  width: '100%',
                  maxWidth: '360px',
                  aspectRatio: `${activeModel.aspectRatio}`,
                  maxHeight: '780px',
                  perspective: '1400px',
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${fridgeYaw}deg)`,
                  transition: 'transform 200ms cubic-bezier(0.2, 0.9, 0.3, 1)',
                }}
              >
              {/* Ground Contact Shadow under the 3D Appliance */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-16px',
                  left: '-10%',
                  right: '-10%',
                  height: '32px',
                  background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.28) 0%, rgba(15, 23, 42, 0.1) 45%, transparent 70%)',
                  pointerEvents: 'none',
                  zIndex: 1,
                }}
              />

              {/* 3D Left Cabinet Side Panel (folds into -Z depth behind the front face) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '-65px',
                  width: '65px',
                  transformOrigin: 'right center',
                  transform: 'rotateY(-90deg)',
                  backfaceVisibility: 'hidden',
                  zIndex: 5,
                }}
                className="border-r border-slate-300/80 bg-gradient-to-r from-slate-400 via-slate-300 to-slate-200 shadow-xl overflow-hidden pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-black/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/20 pointer-events-none" />
              </div>

              {/* 3D Right Cabinet Side Panel (folds into -Z depth behind the front face) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: '100%',
                  width: '65px',
                  transformOrigin: 'left center',
                  transform: 'rotateY(90deg)',
                  backfaceVisibility: 'hidden',
                  zIndex: 5,
                }}
                className="border-l border-slate-300/80 bg-gradient-to-l from-slate-400 via-slate-300 to-slate-200 shadow-xl overflow-hidden pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-l from-black/25 via-black/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/20 pointer-events-none" />
              </div>

              {/* 3D Top Cabinet Roof (folds into -Z depth behind the front top edge) */}
              <div
                style={{
                  position: 'absolute',
                  top: '-65px',
                  left: 0,
                  right: 0,
                  height: '65px',
                  transformOrigin: 'center bottom',
                  transform: 'rotateX(90deg)',
                  backfaceVisibility: 'hidden',
                  zIndex: 5,
                }}
                className="border-b border-slate-300/80 bg-gradient-to-t from-slate-200 via-slate-300 to-slate-400 shadow-inner overflow-hidden pointer-events-none"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-black/5 to-black/20 pointer-events-none" />
              </div>

              {/* Main Refrigerator Appliance Shell */}
              <div className="absolute inset-0 rounded-[2.2rem] shadow-[0_25px_60px_-15px_rgba(15,23,42,0.35),0_10px_20px_-8px_rgba(0,0,0,0.18)] border-2 border-slate-300 overflow-hidden bg-white">
                {/* Photorealistic Model Image Artwork */}
                <img
                  src={activeModel.imageUrl}
                  alt={activeModel.name}
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none rounded-[2.2rem]"
                />

                {/* Specular Ambient Sheen */}
                <div className="absolute inset-0 pointer-events-none rounded-[2.2rem] bg-gradient-to-tr from-transparent via-white/12 to-transparent -translate-x-1/4 transform -skew-x-12" />

                {/* Usable Front Magnetic Surface for this Model */}
                <div
                  ref={surfaceRef}
                  onClick={handleSurfaceClick}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  style={{
                    position: 'absolute',
                    top: `${magneticRegion.top * 100}%`,
                    left: `${magneticRegion.left * 100}%`,
                    width: `${magneticRegion.width * 100}%`,
                    height: `${magneticRegion.height * 100}%`,
                  }}
                  className={`relative select-none cursor-default transition-all duration-200 z-20 ${
                    isDragOver ? 'ring-4 ring-blue-500/50 bg-blue-500/10 rounded-2xl' : ''
                  }`}
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
                          className="mt-3 inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-[10px] rounded-lg shadow-xs transition-transform hover:scale-105 cursor-pointer"
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
                    const matchedMagnet = magnets.find(
                      (m) =>
                        m.id === placement.id ||
                        m.destination_slug.toLowerCase() === placement.magnetSlug.toLowerCase()
                    )

                    return (
                      <DraggableMagnet
                        key={placement.id}
                        placement={placement}
                        isSelected={isSelected}
                        surfaceRef={surfaceRef}
                        isEditable={!readOnly}
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
              </div>
            </div>

              {/* 3D Rotation Slider for Catalog Models */}
              <div className="w-full max-w-[360px] mt-4 px-4 py-3 bg-white/95 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs font-heading font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Rotate3d className="w-3.5 h-3.5 text-blue-600" />
                    <span>3D Angle Rotation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {fridgeYaw === 0 ? 'Front (0°)' : `${fridgeYaw > 0 ? '+' : ''}${fridgeYaw}°`}
                    </span>
                    {fridgeYaw !== 0 && (
                      <button
                        onClick={() => setFridgeYaw(0)}
                        className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-0.5 font-bold cursor-pointer transition-colors"
                        title="Reset angle to 0°"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">-60°</span>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    step="1"
                    value={fridgeYaw}
                    onChange={(e) => setFridgeYaw(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">+60°</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 text-[10px]">
                  <button
                    onClick={() => setFridgeYaw(-30)}
                    className={`py-1 px-1.5 rounded-lg text-center font-heading font-bold transition-all cursor-pointer ${
                      fridgeYaw === -30
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    Left (-30°)
                  </button>
                  <button
                    onClick={() => setFridgeYaw(0)}
                    className={`py-1 px-1.5 rounded-lg text-center font-heading font-bold transition-all cursor-pointer ${
                      fridgeYaw === 0
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    Front (0°)
                  </button>
                  <button
                    onClick={() => setFridgeYaw(30)}
                    className={`py-1 px-1.5 rounded-lg text-center font-heading font-bold transition-all cursor-pointer ${
                      fridgeYaw === 30
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    Right (+30°)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Selected Magnet Status Toast Overlay (Bottom Edge - Edit Mode Only) */}
          {!readOnly && selectedPlacement && (
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
                className="text-slate-400 hover:text-white px-1 font-bold text-[10px] cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Model Selection Modal */}
      <FridgeModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        currentModelId={activeModel.id}
        userId={userId}
        onSelectModel={(model) => {
          setActiveModel(model)
          if (onChangeFridgeModel) {
            onChangeFridgeModel(model)
          }
          fridgeService.setActiveFridgeId(userId, model.id)
        }}
      />
    </div>
  )
}
