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
  const [isPinching, setIsPinching] = useState(false)
  const panStartRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number }>({
    startX: 0,
    startY: 0,
    initialPanX: 0,
    initialPanY: 0,
  })

  // Viewport container ref for native non-passive touch & wheel pinch gestures
  const viewportRef = useRef<HTMLDivElement>(null)
  const zoomLevelRef = useRef(zoomLevel)
  const initialPinchDistRef = useRef<number | null>(null)
  const initialPinchZoomRef = useRef<number>(1.0)
  const lastTapRef = useRef<number>(0)

  // Keep zoomLevelRef in sync for non-passive event listeners
  useEffect(() => {
    zoomLevelRef.current = zoomLevel
  }, [zoomLevel])

  // 3D Door Open/Close State
  const [isMainDoorOpen, setIsMainDoorOpen] = useState(false)
  const [isFreezerDoorOpen, setIsFreezerDoorOpen] = useState(false)

  const handleResetZoom = () => {
    setZoomLevel(1.0)
    setPanOffset({ x: 0, y: 0 })
  }

  // Double-click to zoom in/out (desktop mouse/trackpad)
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.group.select-none') || target.closest('button') || target.closest('input')) return
    if (zoomLevel > 1.0) {
      handleResetZoom()
    } else {
      setZoomLevel(1.6)
    }
  }

  // Native non-passive Touch & Wheel listeners for 2-finger expand/collapse gesture
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        setIsPinching(true)
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        initialPinchDistRef.current = dist
        initialPinchZoomRef.current = zoomLevelRef.current
      } else if (e.touches.length === 1) {
        // Double-tap gesture detection on mobile/touch
        const now = Date.now()
        if (now - lastTapRef.current < 320) {
          const target = e.target as HTMLElement
          if (!target.closest('.group.select-none') && !target.closest('button') && !target.closest('input')) {
            if (zoomLevelRef.current > 1.0) {
              setZoomLevel(1.0)
              setPanOffset({ x: 0, y: 0 })
            } else {
              setZoomLevel(1.6)
            }
          }
        }
        lastTapRef.current = now

        // If zoomed in, single touch can pan canvas
        if (zoomLevelRef.current > 1.0) {
          const target = e.target as HTMLElement
          if (!target.closest('.group.select-none') && !target.closest('button') && !target.closest('input')) {
            panStartRef.current = {
              startX: e.touches[0].clientX,
              startY: e.touches[0].clientY,
              initialPanX: panOffset.x,
              initialPanY: panOffset.y,
            }
            setIsPanning(true)
          }
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDistRef.current && initialPinchDistRef.current > 0) {
        e.preventDefault()
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY)
        const ratio = currentDist / initialPinchDistRef.current
        const nextZoom = Math.min(2.5, Math.max(1.0, +(initialPinchZoomRef.current * ratio).toFixed(2)))
        setZoomLevel(nextZoom)
        if (nextZoom === 1.0) {
          setPanOffset({ x: 0, y: 0 })
        }
      } else if (e.touches.length === 1 && zoomLevelRef.current > 1.0 && isPanning) {
        const deltaX = e.touches[0].clientX - panStartRef.current.startX
        const deltaY = e.touches[0].clientY - panStartRef.current.startY
        const maxPanX = (zoomLevelRef.current - 1) * 220
        const maxPanY = (zoomLevelRef.current - 1) * 360
        const clampedX = Math.max(-maxPanX, Math.min(maxPanX, panStartRef.current.initialPanX + deltaX))
        const clampedY = Math.max(-maxPanY, Math.min(maxPanY, panStartRef.current.initialPanY + deltaY))
        setPanOffset({ x: clampedX, y: clampedY })
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        setIsPinching(false)
        initialPinchDistRef.current = null
      }
      if (e.touches.length === 0) {
        setIsPanning(false)
      }
    }

    // Native continuous trackpad pinch & wheel zoom
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const zoomDelta = -e.deltaY * 0.008
        setZoomLevel((prev) => {
          const next = Math.min(2.5, Math.max(1.0, +(prev + zoomDelta).toFixed(2)))
          if (next === 1.0) {
            setPanOffset({ x: 0, y: 0 })
          }
          return next
        })
      }
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('wheel', onWheel)
    }
  }, [panOffset, isPanning])

  const handleToggleMainDoor = () => {
    setIsMainDoorOpen((prev) => {
      const next = !prev
      setFridgeYaw(next ? -45 : 0)
      return next
    })
  }

  const handleToggleFreezerDoor = () => {
    setIsFreezerDoorOpen((prev) => {
      const next = !prev
      setFridgeYaw(next ? -45 : 0)
      return next
    })
  }

  const handleToggleAllDoors = () => {
    if (isMainDoorOpen || isFreezerDoorOpen) {
      setIsMainDoorOpen(false)
      setIsFreezerDoorOpen(false)
      setFridgeYaw(0)
    } else {
      setIsMainDoorOpen(true)
      setIsFreezerDoorOpen(true)
      setFridgeYaw(-45)
    }
  }

  const handlePanMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1.0) return
    const target = e.target as HTMLElement
    if (target.closest('.group.select-none') || target.closest('button') || target.closest('input')) return

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
      
      {/* Top Floating Utility Controls Bar: Model & Auto-Arrange (Only rendered when showControls is true) */}
      {showControls && (
        <div className="w-full max-w-2xl mb-1.5 flex items-center justify-between gap-2 px-1 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Active Model Indicator & Switcher */}
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
          </div>

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
        INTERACTIVE ZOOM & PAN VIEWPORT
        Free-flow unclipped canvas allowing smooth magnification & natural two-finger expand/collapse
      */}
      <div
        ref={viewportRef}
        onDoubleClick={handleDoubleClick}
        className={`relative w-full flex flex-col items-center justify-center overflow-visible p-0 ${
          zoomLevel > 1.0 ? (isPanning ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        style={{
          touchAction: zoomLevel > 1.0 ? 'none' : 'pan-y',
        }}
        onMouseDown={handlePanMouseDown}
        onMouseMove={handlePanMouseMove}
        onMouseUp={handlePanMouseUp}
        onMouseLeave={handlePanMouseUp}
      >
        {/* Floating Zoom Feedback Pill (Visible only when magnified > 100%) */}
        {zoomLevel > 1.0 && (
          <div className="absolute top-1 z-40 px-3 py-1 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-heading font-semibold rounded-full shadow-md flex items-center gap-2 border border-white/20 animate-in fade-in">
            <Move className="w-3 h-3 text-blue-400" />
            <span>{Math.round(zoomLevel * 100)}% • Pinch or double-tap to reset</span>
            <button
              onClick={handleResetZoom}
              className="p-0.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              title="Reset Zoom"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-2.5 h-2.5 text-slate-300 hover:text-white" />
            </button>
          </div>
        )}

        <div
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
            transformOrigin: 'center center',
            transition: isPanning || isPinching ? 'none' : 'transform 200ms cubic-bezier(0.2, 0.9, 0.3, 1)',
          }}
          className="relative w-full max-w-[310px] overflow-visible"
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
                  maxWidth: 'min(310px, 30vw)',
                  aspectRatio: `${activeModel.aspectRatio}`,
                  maxHeight: 'min(58vh, 560px)',
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
              <div className="w-full max-w-[310px] mt-2.5 px-3 py-2 bg-white/95 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-heading font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <Rotate3d className="w-3.5 h-3.5 text-blue-600" />
                    <span>3D Angle Rotation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
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

                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-medium text-slate-400 shrink-0">-60°</span>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    step="1"
                    value={fridgeYaw}
                    onChange={(e) => setFridgeYaw(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden"
                  />
                  <span className="text-[9px] font-medium text-slate-400 shrink-0">+60°</span>
                </div>

                <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100 text-[9px] sm:text-[10px]">
                  <button
                    onClick={() => setFridgeYaw(-30)}
                    className={`py-0.5 sm:py-1 px-1 rounded-md text-center font-heading font-bold transition-all cursor-pointer ${
                      fridgeYaw === -30
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    Left (-30°)
                  </button>
                  <button
                    onClick={() => setFridgeYaw(0)}
                    className={`py-0.5 sm:py-1 px-1 rounded-md text-center font-heading font-bold transition-all cursor-pointer ${
                      fridgeYaw === 0
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    Front (0°)
                  </button>
                  <button
                    onClick={() => setFridgeYaw(30)}
                    className={`py-0.5 sm:py-1 px-1 rounded-md text-center font-heading font-bold transition-all cursor-pointer ${
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
