import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { tripService } from '../services/tripService'
import { userMagnetService, type FridgeMagnetItem } from '../services/userMagnetService'
import { fridgeService } from '../services/fridgeService'
import type { TripWithStats } from '../types/trip'
import type { FridgeModel, MagnetPlacement } from '../types/fridge'
import {
  SOUVENIR_MAGNETS_CATALOG,
  type SouvenirMagnetData,
} from '../data/photorealisticMagnets'
import { FridgeWorkspace } from '../components/fridge/FridgeWorkspace'
import {
  Search,
  SlidersHorizontal,
  Heart,
  Plus,
  Check,
  RotateCcw,
  RotateCw,
  ArrowUpToLine,
  ArrowDownToLine,
  Copy,
  Trash2,
  X,
  Compass,
  Sparkles,
  MapPin,
  Target,
  PiggyBank,
} from 'lucide-react'

const CATEGORIES = [
  'All',
  'India',
  'International',
  'Cities',
  'Monuments',
  'Nature',
  'Beaches',
  'Mountains',
  'Culture',
  'Food',
]

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Trips & user fridge magnets state
  const [trips, setTrips] = useState<TripWithStats[]>([])
  const [fridgeMagnets, setFridgeMagnets] = useState<FridgeMagnetItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Active Fridge Model
  const [activeModel, setActiveModel] = useState<FridgeModel>(() => {
    const id = fridgeService.getActiveFridgeId(user?.id || 'guest')
    return fridgeService.getFridgeModelById(id, user?.id)
  })

  // Selected Magnet in Left/Right Inspector
  const [selectedMagnetData, setSelectedMagnetData] = useState<SouvenirMagnetData>(
    SOUVENIR_MAGNETS_CATALOG[6] || SOUVENIR_MAGNETS_CATALOG[0] // Defaults to Goa Beach as in reference screenshot
  )

  // Selected Placement on Refrigerator Canvas
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null)
  const [placements, setPlacements] = useState<MagnetPlacement[]>([])

  // Left Collection Catalog Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['goa-beach', 'taj-mahal']))

  // Load Dashboard Data
  const loadDashboardData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const [tripsData, magnetsData] = await Promise.all([
        tripService.getUserTrips(user.id),
        userMagnetService.getUserFridgeMagnets(user.id),
      ])
      setTrips(tripsData)
      setFridgeMagnets(magnetsData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load fridge data'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  // Sync active model if user changes
  useEffect(() => {
    const id = fridgeService.getActiveFridgeId(user?.id || 'guest')
    setActiveModel(fridgeService.getFridgeModelById(id, user?.id))
  }, [user])

  // Map placements to user magnets
  const activePlacement = useMemo(() => {
    if (!selectedPlacementId) return null
    return placements.find((p) => p.id === selectedPlacementId) || null
  }, [placements, selectedPlacementId])

  // When a placement is selected on the fridge, update the selected magnet inspector
  useEffect(() => {
    if (activePlacement) {
      const matched = SOUVENIR_MAGNETS_CATALOG.find(
        (m) => m.id === activePlacement.magnetSlug || m.id === activePlacement.id
      )
      if (matched) {
        setSelectedMagnetData(matched)
      } else {
        setSelectedMagnetData({
          id: activePlacement.id,
          name: activePlacement.destinationName,
          destination: activePlacement.destinationName,
          region: 'International',
          category: 'Monuments',
          material: 'Souvenir Collectible Relief',
          imagePath: activePlacement.assetUrl,
          description: `Realistic souvenir travel magnet of ${activePlacement.destinationName}.`,
          tags: ['Travel', 'Collectible'],
        })
      }
    }
  }, [activePlacement])

  // Filter Catalog Magnets
  const filteredCatalog = useMemo(() => {
    return SOUVENIR_MAGNETS_CATALOG.filter((item) => {
      // Category filter
      if (selectedCategory === 'India' && item.region !== 'India') return false
      if (selectedCategory === 'International' && item.region !== 'International') return false
      if (
        selectedCategory !== 'All' &&
        selectedCategory !== 'India' &&
        selectedCategory !== 'International' &&
        item.category !== selectedCategory
      ) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(q)
        const matchesDest = item.destination.toLowerCase().includes(q)
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q))
        if (!matchesName && !matchesDest && !matchesTags) return false
      }

      return true
    })
  }, [selectedCategory, searchQuery])

  // Group filtered catalog into India and International
  const indiaMagnets = useMemo(() => {
    return filteredCatalog.filter((m) => m.region === 'India')
  }, [filteredCatalog])

  const internationalMagnets = useMemo(() => {
    return filteredCatalog.filter((m) => m.region === 'International')
  }, [filteredCatalog])

  // Check if a catalog item is placed on the fridge
  const isMagnetOnFridge = (magnetId: string) => {
    return (
      placements.some((p) => p.magnetSlug === magnetId || p.id === magnetId) ||
      fridgeMagnets.some((m) => m.destination_slug === magnetId || m.id === magnetId)
    )
  }

  // Toggle favorite
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Add magnet to fridge
  const handleAddMagnetToFridge = async (item: SouvenirMagnetData) => {
    const userId = user?.id || 'guest'

    // Add to user magnets
    await userMagnetService.addMagnetToFridge(userId, {
      id: item.id,
      slug: item.id,
      name: item.name,
      country_name: item.destination.split(',')[1]?.trim() || item.region,
      country_code: item.region === 'India' ? 'IN' : 'INT',
      continent: item.region === 'India' ? 'Asia' : 'Europe',
      asset_url: item.imagePath,
      magnet_shape: 'arch',
      flag_emoji: '✈️',
      city: item.destination.split(',')[0]?.trim() || item.name,
      region: item.region,
      destination_type: item.category,
      short_description: item.description,
      landmark_names: [item.name],
      tags: item.tags,
      popularity_score: 95,
      is_featured: item.isFeatured || false,
      dominant_colors: ['#2563EB', '#F59E0B'],
      art_preset: 'custom',
    })

    // Refresh user magnets
    const updatedUserMagnets = await userMagnetService.getUserFridgeMagnets(userId)
    setFridgeMagnets(updatedUserMagnets)

    // Calculate new placement position
    const currentPlacements = fridgeService.getFridgePlacements(
      userId,
      activeModel.id,
      updatedUserMagnets
    )

    // If not placed yet, create placement
    if (!currentPlacements.some((p) => p.id === item.id || p.magnetSlug === item.id)) {
      const nextY = 0.2 + (currentPlacements.length % 5) * 0.14
      const nextX = 0.2 + ((currentPlacements.length * 3) % 4) * 0.18
      const newPlacement: MagnetPlacement = {
        id: item.id,
        magnetSlug: item.id,
        destinationName: item.name,
        assetUrl: item.imagePath,
        x: Math.min(0.85, Math.max(0.15, nextX)),
        y: Math.min(0.85, Math.max(0.12, nextY)),
        scale: item.defaultScale || 1.0,
        rotation: ((currentPlacements.length * 11) % 15) - 7,
        zIndex: currentPlacements.length + 1,
      }
      const updated = [...currentPlacements, newPlacement]
      fridgeService.saveFridgePlacements(userId, activeModel.id, updated)
      setPlacements(updated)
      setSelectedPlacementId(newPlacement.id)
    } else {
      setSelectedPlacementId(item.id)
    }
  }

  // Inspector Adjustments for Selected Placement
  const handleUpdateActiveScale = (newScale: number) => {
    if (!activePlacement) return
    const clamped = Math.min(1.8, Math.max(0.5, Number(newScale.toFixed(2))))
    const updated = { ...activePlacement, scale: clamped }
    const next = placements.map((p) => (p.id === activePlacement.id ? updated : p))
    setPlacements(next)
    fridgeService.saveFridgePlacements(user?.id || 'guest', activeModel.id, next)
  }

  const handleUpdateActiveRotation = (delta: number) => {
    if (!activePlacement) return
    let newRot = activePlacement.rotation + delta
    if (newRot > 180) newRot -= 360
    if (newRot < -180) newRot += 360
    const updated = { ...activePlacement, rotation: newRot }
    const next = placements.map((p) => (p.id === activePlacement.id ? updated : p))
    setPlacements(next)
    fridgeService.saveFridgePlacements(user?.id || 'guest', activeModel.id, next)
  }

  const handleBringFront = () => {
    if (!activePlacement) return
    const maxZ = Math.max(0, ...placements.map((p) => p.zIndex))
    const updated = { ...activePlacement, zIndex: maxZ + 1 }
    const next = placements.map((p) => (p.id === activePlacement.id ? updated : p))
    setPlacements(next)
    fridgeService.saveFridgePlacements(user?.id || 'guest', activeModel.id, next)
  }

  const handleSendBack = () => {
    if (!activePlacement) return
    const minZ = Math.min(1, ...placements.map((p) => p.zIndex))
    const updated = { ...activePlacement, zIndex: Math.max(0, minZ - 1) }
    const next = placements.map((p) => (p.id === activePlacement.id ? updated : p))
    setPlacements(next)
    fridgeService.saveFridgePlacements(user?.id || 'guest', activeModel.id, next)
  }

  const handleDuplicate = () => {
    if (!activePlacement) return
    const newId = `${activePlacement.magnetSlug}-copy-${Date.now()}`
    const duplicated: MagnetPlacement = {
      ...activePlacement,
      id: newId,
      x: Math.min(0.85, activePlacement.x + 0.06),
      y: Math.min(0.85, activePlacement.y + 0.06),
      zIndex: placements.length + 1,
    }
    const next = [...placements, duplicated]
    setPlacements(next)
    fridgeService.saveFridgePlacements(user?.id || 'guest', activeModel.id, next)
    setSelectedPlacementId(newId)
  }

  const handleDeletePlacement = async () => {
    if (!activePlacement) return
    const next = placements.filter((p) => p.id !== activePlacement.id)
    setPlacements(next)
    fridgeService.saveFridgePlacements(user?.id || 'guest', activeModel.id, next)

    // Also remove from user magnets if base ID matches
    if (user) {
      await userMagnetService.removeMagnetFromFridge(user.id, activePlacement.magnetSlug)
      const updated = await userMagnetService.getUserFridgeMagnets(user.id)
      setFridgeMagnets(updated)
    }

    setSelectedPlacementId(null)
  }

  return (
    <div className="w-full space-y-6 pb-12">
      {/* 
        ============================================================
        TOP 3-COLUMN STUDIO LAYOUT (MATCHING REFERENCE EXACTLY)
        Left: Magnet Collection
        Center: Real Refrigerator Canvas
        Right: Selected Magnet Inspector
        ============================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-6 items-start">
        
        {/* =========================================================
            LEFT COLUMN: MAGNET COLLECTION CATALOGUE (lg:col-span-4 xl:col-span-4)
            ========================================================= */}
        <section className="lg:col-span-4 xl:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col max-h-[880px] overflow-hidden">
          {/* Header */}
          <div className="mb-3">
            <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight">
              Magnet Collection
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Discover beautiful souvenirs from around the world
            </p>
          </div>

          {/* Search Bar + Filter Button */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations, landmarks, countries..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setSelectedCategory('All')}
              className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
              title="Reset Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3 text-[11px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Scrollable Magnets Catalog Grid */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin">
            
            {/* India Section */}
            {indiaMagnets.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-heading font-black text-sm text-slate-900">
                    India
                  </h3>
                  <button
                    onClick={() => setSelectedCategory('India')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {indiaMagnets.map((item) => {
                    const isSelected = selectedMagnetData.id === item.id
                    const isPlaced = isMagnetOnFridge(item.id)
                    const isFav = favorites.has(item.id)

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedMagnetData(item)}
                        className={`group relative p-2 rounded-2xl border text-center cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => toggleFavorite(item.id, e)}
                          className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors z-10"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isFav ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                        </button>

                        {/* Crisp 3D Magnet Thumbnail */}
                        <div className="h-24 w-full flex items-center justify-center p-1.5 my-1">
                          <img
                            src={item.imagePath}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.22)] group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>

                        {/* Title & Location */}
                        <div className="mt-1">
                          <h4 className="font-heading font-bold text-[11px] text-slate-900 line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-[9px] text-slate-500 line-clamp-1">
                            {item.destination}
                          </p>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddMagnetToFridge(item)
                          }}
                          className={`mt-2 w-full py-1 rounded-lg font-heading font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${
                            isPlaced
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white shadow-xs'
                          }`}
                        >
                          {isPlaced ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* International Section */}
            {internationalMagnets.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-heading font-black text-sm text-slate-900">
                    International
                  </h3>
                  <button
                    onClick={() => setSelectedCategory('International')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {internationalMagnets.map((item) => {
                    const isSelected = selectedMagnetData.id === item.id
                    const isPlaced = isMagnetOnFridge(item.id)
                    const isFav = favorites.has(item.id)

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedMagnetData(item)}
                        className={`group relative p-2 rounded-2xl border text-center cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/60 border-blue-500 shadow-sm ring-1 ring-blue-500'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                        }`}
                      >
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => toggleFavorite(item.id, e)}
                          className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 transition-colors z-10"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              isFav ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                        </button>

                        {/* Crisp 3D Magnet Thumbnail */}
                        <div className="h-24 w-full flex items-center justify-center p-1.5 my-1">
                          <img
                            src={item.imagePath}
                            alt={item.name}
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.22)] group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>

                        {/* Title & Location */}
                        <div className="mt-1">
                          <h4 className="font-heading font-bold text-[11px] text-slate-900 line-clamp-1">
                            {item.name}
                          </h4>
                          <p className="text-[9px] text-slate-500 line-clamp-1">
                            {item.destination}
                          </p>
                        </div>

                        {/* Add Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddMagnetToFridge(item)
                          }}
                          className={`mt-2 w-full py-1 rounded-lg font-heading font-bold text-[10px] flex items-center justify-center gap-1 transition-all ${
                            isPlaced
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white shadow-xs'
                          }`}
                        >
                          {isPlaced ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* =========================================================
            CENTER COLUMN: THE PHOTOREALISTIC KITCHEN REFRIGERATOR (lg:col-span-5 xl:col-span-5)
            ========================================================= */}
        <section className="lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-center">
          <FridgeWorkspace
            userId={user?.id || 'guest'}
            currentModel={activeModel}
            magnets={fridgeMagnets}
            selectedPlacementId={selectedPlacementId}
            onSelectPlacementId={(id) => setSelectedPlacementId(id)}
            onPlacementsChange={(updated) => setPlacements(updated)}
            onChangeFridgeModel={(newModel) => setActiveModel(newModel)}
            onAddDestination={() => {
              if (selectedMagnetData) {
                handleAddMagnetToFridge(selectedMagnetData)
              }
            }}
            showControls={true}
          />
        </section>

        {/* =========================================================
            RIGHT COLUMN: SELECTED MAGNET INSPECTOR PANEL (lg:col-span-3 xl:col-span-3)
            ========================================================= */}
        <section className="lg:col-span-3 xl:col-span-3 bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col max-h-[880px] overflow-y-auto space-y-4">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-heading font-black text-base text-slate-900">
              Selected Magnet
            </h3>
            <button
              onClick={() => setSelectedPlacementId(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Large High-Fidelity Preview Box */}
          <div className="relative w-full h-52 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-center p-4 overflow-hidden">
            <button
              onClick={(e) => toggleFavorite(selectedMagnetData.id, e)}
              className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-colors z-10"
            >
              <Heart
                className={`w-4 h-4 ${
                  favorites.has(selectedMagnetData.id)
                    ? 'fill-rose-500 text-rose-500'
                    : ''
                }`}
              />
            </button>

            <img
              src={selectedMagnetData.imagePath}
              alt={selectedMagnetData.name}
              className="max-h-full max-w-full object-contain filter drop-shadow-[0_12px_20px_rgba(0,0,0,0.3)] transition-transform hover:scale-105"
            />
          </div>

          {/* Destination Title & Subtitle */}
          <div>
            <h4 className="font-heading font-black text-lg text-slate-900 leading-tight">
              {selectedMagnetData.name}
            </h4>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {selectedMagnetData.destination}
            </p>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            {selectedMagnetData.description}
          </p>

          {/* Category Tag Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {selectedMagnetData.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Size Slider Control */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Size</span>
              <span className="font-mono font-bold text-blue-600">
                {activePlacement
                  ? `${Math.round(activePlacement.scale * 100)}%`
                  : '100%'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleUpdateActiveScale(
                    (activePlacement?.scale || 1.0) - 0.1
                  )
                }
                disabled={!activePlacement}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-40"
              >
                -
              </button>

              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={activePlacement?.scale || 1.0}
                onChange={(e) =>
                  handleUpdateActiveScale(parseFloat(e.target.value))
                }
                disabled={!activePlacement}
                className="flex-1 accent-blue-600 cursor-pointer disabled:opacity-40"
              />

              <button
                onClick={() =>
                  handleUpdateActiveScale(
                    (activePlacement?.scale || 1.0) + 0.1
                  )
                }
                disabled={!activePlacement}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>

          {/* Rotate Controls */}
          <div className="space-y-1.5 pt-1">
            <span className="block text-xs font-bold text-slate-700">Rotate</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleUpdateActiveRotation(-15)}
                disabled={!activePlacement}
                className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>-15°</span>
              </button>
              <button
                onClick={() => handleUpdateActiveRotation(15)}
                disabled={!activePlacement}
                className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>+15°</span>
              </button>
            </div>
          </div>

          {/* Stacking Layers: Bring Front / Send Back */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleBringFront}
              disabled={!activePlacement}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <ArrowUpToLine className="w-3.5 h-3.5 text-blue-600" />
              <span>Bring Front</span>
            </button>
            <button
              onClick={handleSendBack}
              disabled={!activePlacement}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-slate-500" />
              <span>Send Back</span>
            </button>
          </div>

          {/* Duplicate & Delete Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleDuplicate}
              disabled={!activePlacement}
              className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={handleDeletePlacement}
              disabled={!activePlacement}
              className="py-1.5 px-2.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          {/* Primary Action Button: Add to Fridge */}
          <div className="pt-2">
            <button
              onClick={() => handleAddMagnetToFridge(selectedMagnetData)}
              className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-heading font-black text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isMagnetOnFridge(selectedMagnetData.id)
                  ? 'Add Another Copy to Fridge'
                  : 'Add to Fridge'}
              </span>
            </button>
          </div>

        </section>

      </div>
    </div>
  )
}
