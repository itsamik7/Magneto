import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fridgeService } from '../services/fridgeService'
import { userMagnetService, type FridgeMagnetItem, DEFAULT_FEATURED_MAGNETS } from '../services/userMagnetService'
import { SOUVENIR_MAGNETS_CATALOG, type SouvenirMagnetData } from '../data/photorealisticMagnets'
import type { FridgeModel, MagnetPlacement } from '../types/fridge'
import { FridgeWorkspace } from '../components/fridge/FridgeWorkspace'
import { SaveMoneyModal } from '../components/trips/SaveMoneyModal'
import {
  Search,
  SlidersHorizontal,
  Heart,
  Plus,
  Check,
  Compass,
  Sparkles,
  Calendar,
  PiggyBank,
  Edit2,
  Plane,
  Building2,
  Utensils,
  Car,
  Star,
  FileText,
  LayoutGrid,
  Globe2,
  Mountain,
  Sun,
  Landmark,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { FridgeModelModal } from '../components/fridge/FridgeModelModal'

const FILTER_PILLS = ['All', 'Countries', 'Cities', 'Nature', 'Monuments']

const CATEGORY_TILES = [
  { id: 'All', label: 'All', icon: LayoutGrid },
  { id: 'Popular', label: 'Popular', icon: Heart },
  { id: 'India', label: 'India', icon: Landmark },
  { id: 'International', label: 'International', icon: Globe2 },
  { id: 'Mountains', label: 'Mountains', icon: Mountain },
  { id: 'Beaches', label: 'Beaches', icon: Sun },
  { id: 'Culture', label: 'Culture', icon: Sparkles },
  { id: 'Food', label: 'Food', icon: Utensils },
]

export const PlanTripPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Left Discovery Catalog Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilterPill, setActiveFilterPill] = useState('All')
  const [activeCategoryTile, setActiveCategoryTile] = useState('All')
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['santorini', 'paris', 'goa-beach']))

  // User Fridge Model & Magnets
  const [activeModel, setActiveModel] = useState<FridgeModel>(() => {
    const id = fridgeService.getActiveFridgeId(user?.id || 'guest')
    return fridgeService.getFridgeModelById(id, user?.id)
  })
  const [isModelModalOpen, setIsModelModalOpen] = useState(false)
  const [userMagnets, setUserMagnets] = useState<FridgeMagnetItem[]>(() => {
    return userMagnetService.getUserFridgeMagnetsSync(user?.id || 'guest')
  })
  const [placements, setPlacements] = useState<MagnetPlacement[]>(() => {
    const uid = user?.id || 'guest'
    const id = fridgeService.getActiveFridgeId(uid)
    return fridgeService.getFridgePlacements(uid, id)
  })
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>('magnet-santorini')

  // Right Trip Editor State
  const [selectedDestinationSlug, setSelectedDestinationSlug] = useState<string>('santorini')
  const [activeTab, setActiveTab] = useState<'Trip Plan' | 'Savings' | 'Checklist' | 'Notes'>('Trip Plan')
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  // Trip Dates Editor
  const [startDate, setStartDate] = useState('2026-05-12')
  const [endDate, setEndDate] = useState('2026-05-20')
  const [isEditingDates, setIsEditingDates] = useState(false)

  // Budget Breakdown Editor
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [itemizedBreakdown, setItemizedBreakdown] = useState({
    flights: 60000,
    stay: 80000,
    food: 40000,
    transport: 20000,
    activities: 30000,
    other: 20000,
  })

  // Dynamic Savings amounts for current trip
  const [savedAmount, setSavedAmount] = useState<number>(80000)

  // Checklist
  const [checklistItems, setChecklistItems] = useState([
    { id: '1', text: 'Apply for Schengen visa', done: true },
    { id: '2', text: 'Book round-trip flight tickets', done: true },
    { id: '3', text: 'Reserve cliffside caldera hotel in Oia', done: false },
    { id: '4', text: 'Sunset catamaran cruise booking', done: false },
    { id: '5', text: 'Pack summer linen & polarized sunglasses', done: false },
    { id: '6', text: 'Buy international travel eSIM', done: false },
  ])
  const [newChecklistText, setNewChecklistText] = useState('')

  // Trip Notes
  const [tripNotes, setTripNotes] = useState(
    'Dream Greek Island holiday: Oia sunsets, blue domed churches, caldera boat tour, and authentic seafood tavernas by Ammoudi Bay.'
  )

  // Load User Magnets or default collection & sync across pages
  useEffect(() => {
    const uid = user?.id || 'guest'
    const load = async () => {
      const raw = userMagnetService.safeStorage.getItem(`magneto_fridge_${uid}`)
      if (raw === null) {
        setUserMagnets(DEFAULT_FEATURED_MAGNETS)
        await userMagnetService.saveUserFridgeMagnets(uid, DEFAULT_FEATURED_MAGNETS)
      } else {
        const list = await userMagnetService.getUserFridgeMagnets(uid)
        setUserMagnets(list)
      }
      const activeId = fridgeService.getActiveFridgeId(uid)
      setActiveModel(fridgeService.getFridgeModelById(activeId, user?.id))
    }
    load()

    const handleSync = () => {
      const activeId = fridgeService.getActiveFridgeId(uid)
      setActiveModel(fridgeService.getFridgeModelById(activeId, user?.id))
      const syncMagnets = userMagnetService.getUserFridgeMagnetsSync(uid)
      setUserMagnets(syncMagnets)
      const syncPlacements = fridgeService.getFridgePlacements(uid, activeId)
      setPlacements(syncPlacements)
    }

    window.addEventListener('magneto_sync', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('magneto_sync', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [user])

  // Filter Catalog Magnets
  const filteredCatalog = useMemo(() => {
    return SOUVENIR_MAGNETS_CATALOG.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = item.name.toLowerCase().includes(q)
        const matchesDest = item.destination.toLowerCase().includes(q)
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(q))
        if (!matchesName && !matchesDest && !matchesTags) return false
      }

      // Filter Pill
      if (activeFilterPill !== 'All') {
        if (activeFilterPill === 'Countries' && !item.tags.includes('Country')) return true
        if (activeFilterPill === 'Cities' && item.category !== 'Cities') return false
        if (activeFilterPill === 'Nature' && item.category !== 'Nature') return false
        if (activeFilterPill === 'Monuments' && item.category !== 'Monuments') return false
      }

      // Category Tile
      if (activeCategoryTile !== 'All') {
        if (activeCategoryTile === 'India' && item.region !== 'India') return false
        if (activeCategoryTile === 'International' && item.region !== 'International') return false
        if (activeCategoryTile === 'Popular' && !item.isFeatured) return false
        if (activeCategoryTile === 'Mountains' && item.category !== 'Mountains') return false
        if (activeCategoryTile === 'Beaches' && item.category !== 'Beaches') return false
        if (activeCategoryTile === 'Culture' && item.category !== 'Culture') return false
        if (activeCategoryTile === 'Food' && item.category !== 'Food') return false
      }

      return true
    })
  }, [searchQuery, activeFilterPill, activeCategoryTile])

  // Current Destination Inspector Item
  const currentCatalogItem = useMemo(() => {
    return (
      SOUVENIR_MAGNETS_CATALOG.find(
        (item) => item.id.toLowerCase() === selectedDestinationSlug.toLowerCase()
      ) || SOUVENIR_MAGNETS_CATALOG[0]
    )
  }, [selectedDestinationSlug])

  const isCurrentOnFridge =
    userMagnets.some((m) => m.destination_slug.toLowerCase() === currentCatalogItem.id.toLowerCase()) ||
    placements.some((p) => p.magnetSlug.toLowerCase() === currentCatalogItem.id.toLowerCase())

  // Budget calculations
  const totalEstimatedCost = Object.values(itemizedBreakdown).reduce((a, b) => a + b, 0)
  const remainingBudget = Math.max(0, totalEstimatedCost - savedAmount)
  const percentSaved = Math.min(100, Math.round((savedAmount / Math.max(1, totalEstimatedCost)) * 100))

  // Days left calculation
  const startD = new Date(startDate)
  const now = new Date()
  const daysLeft = Math.max(1, Math.ceil((startD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const dailySavingsRequired = remainingBudget > 0 ? Math.ceil(remainingBudget / daysLeft) : 0

  // Add Magnet to Fridge action
  const handleAddMagnetToFridge = async (magnet: SouvenirMagnetData) => {
    const uid = user?.id || 'guest'
    const cleanSlug = magnet.id.toLowerCase()
    const canonicalId = `magnet-${cleanSlug}`

    // Check if already on fridge
    const alreadyExists = userMagnets.some(
      (m) => m.destination_slug.toLowerCase() === cleanSlug || m.id === canonicalId
    )
    if (alreadyExists) {
      setSelectedPlacementId(canonicalId)
      setSelectedDestinationSlug(cleanSlug)
      return
    }

    const newMagnetItem: FridgeMagnetItem = {
      id: canonicalId,
      destination_slug: cleanSlug,
      destination_name: magnet.name,
      country_name: magnet.destination.split(',')[1]?.trim() || magnet.region,
      continent: magnet.region === 'India' ? 'Asia' : 'Europe',
      asset_url: magnet.imagePath,
      magnet_shape: 'arch',
      acquired_at: new Date().toISOString(),
      unlock_state: 'saving',
      progress_percentage: 0,
      total_saved_minor: 0,
      target_budget_minor: 15000000,
    }

    // Generate placement with smart positioning
    const [newPlacement] = fridgeService.generateAutoLayout([newMagnetItem], placements.length, placements)
    newPlacement.id = canonicalId

    const nextMagnets = [...userMagnets, newMagnetItem]
    const nextPlacements = [...placements, newPlacement]

    setUserMagnets(nextMagnets)
    setPlacements(nextPlacements)
    setSelectedPlacementId(canonicalId)
    setSelectedDestinationSlug(cleanSlug)

    await userMagnetService.saveUserFridgeMagnets(uid, nextMagnets)
    fridgeService.saveFridgePlacements(uid, activeModel.id, nextPlacements)

    setSaveSuccessMessage(`${magnet.name} added to fridge!`)
    setTimeout(() => setSaveSuccessMessage(null), 2500)
  }

  // Handle dropping a magnet from left discovery catalog directly onto the fridge surface
  const handleDropMagnet = async (rawItem: any, coords: { x: number; y: number }) => {
    const cleanSlug = (rawItem.id || rawItem.slug || '').toLowerCase()
    if (!cleanSlug) return

    const catalogItem =
      SOUVENIR_MAGNETS_CATALOG.find((m) => m.id.toLowerCase() === cleanSlug) || rawItem

    const uid = user?.id || 'guest'
    const canonicalId = `magnet-${cleanSlug}`

    const existingPlacementIndex = placements.findIndex(
      (p) => p.magnetSlug.toLowerCase() === cleanSlug || p.id === canonicalId
    )

    if (existingPlacementIndex >= 0) {
      // Reposition already placed magnet to exact drop coordinates
      const nextPlacements = placements.map((p, idx) =>
        idx === existingPlacementIndex ? { ...p, x: coords.x, y: coords.y } : p
      )
      setPlacements(nextPlacements)
      setSelectedPlacementId(canonicalId)
      setSelectedDestinationSlug(cleanSlug)
      fridgeService.saveFridgePlacements(uid, activeModel.id, nextPlacements)
      setSaveSuccessMessage(`${catalogItem.name || cleanSlug} repositioned on fridge!`)
      setTimeout(() => setSaveSuccessMessage(null), 2500)
      return
    }

    // Add new magnet placed at exact drop coordinates
    const newMagnetItem: FridgeMagnetItem = {
      id: canonicalId,
      destination_slug: cleanSlug,
      destination_name: catalogItem.name || cleanSlug,
      country_name: catalogItem.destination?.split(',')[1]?.trim() || catalogItem.region || 'World',
      continent: catalogItem.region === 'India' ? 'Asia' : 'Europe',
      asset_url: catalogItem.imagePath || `/magnets/destinations/${cleanSlug}.png`,
      magnet_shape: 'arch',
      acquired_at: new Date().toISOString(),
      unlock_state: 'saving',
      progress_percentage: 0,
      total_saved_minor: 0,
      target_budget_minor: 15000000,
    }

    const newPlacement: MagnetPlacement = {
      id: canonicalId,
      magnetSlug: cleanSlug,
      destinationName: catalogItem.name || cleanSlug,
      assetUrl: catalogItem.imagePath || `/magnets/destinations/${cleanSlug}.png`,
      x: coords.x,
      y: coords.y,
      scale: 1.0,
      rotation: 0,
      zIndex: placements.length + 1,
      unlockState: 'saving',
      progressPercentage: 0,
      totalSavedMinor: 0,
      targetBudgetMinor: 15000000,
    }

    const nextMagnets = [...userMagnets, newMagnetItem]
    const nextPlacements = [...placements, newPlacement]

    setUserMagnets(nextMagnets)
    setPlacements(nextPlacements)
    setSelectedPlacementId(canonicalId)
    setSelectedDestinationSlug(cleanSlug)

    await userMagnetService.saveUserFridgeMagnets(uid, nextMagnets)
    fridgeService.saveFridgePlacements(uid, activeModel.id, nextPlacements)

    setSaveSuccessMessage(`${catalogItem.name} placed on fridge!`)
    setTimeout(() => setSaveSuccessMessage(null), 2500)
  }

  // Delete / Remove Magnet from Fridge
  const handleDeleteMagnet = async (idOrSlug: string) => {
    const uid = user?.id || 'guest'
    const cleanSlug = idOrSlug.toLowerCase().replace(/^magnet-/, '')
    const canonicalId = `magnet-${cleanSlug}`

    const nextMagnets = userMagnets.filter(
      (m) =>
        m.id !== idOrSlug &&
        m.id !== canonicalId &&
        m.destination_slug.toLowerCase() !== cleanSlug
    )
    const nextPlacements = placements.filter(
      (p) =>
        p.id !== idOrSlug &&
        p.id !== canonicalId &&
        p.magnetSlug.toLowerCase() !== cleanSlug
    )

    setUserMagnets(nextMagnets)
    setPlacements(nextPlacements)

    if (
      selectedPlacementId === idOrSlug ||
      selectedPlacementId === canonicalId ||
      selectedDestinationSlug === cleanSlug
    ) {
      const fallback = nextPlacements[0]
      setSelectedPlacementId(fallback?.id || null)
      if (fallback) {
        setSelectedDestinationSlug(fallback.magnetSlug)
      }
    }

    await userMagnetService.saveUserFridgeMagnets(uid, nextMagnets)
    fridgeService.saveFridgePlacements(uid, activeModel.id, nextPlacements)

    setSaveSuccessMessage('Magnet removed from fridge.')
    setTimeout(() => setSaveSuccessMessage(null), 2500)
  }

  // Auto-arrange all magnets cleanly on the fridge
  const handleAutoArrange = () => {
    const uid = user?.id || 'guest'
    const arranged = fridgeService.autoArrangeAll(uid, activeModel.id, userMagnets)
    setPlacements(arranged)
    fridgeService.saveFridgePlacements(uid, activeModel.id, arranged)
    setSaveSuccessMessage('Magnets auto-arranged!')
    setTimeout(() => setSaveSuccessMessage(null), 2500)
  }

  // Switch Refrigerator Model
  const handleSelectFridgeModel = (newModel: FridgeModel) => {
    setActiveModel(newModel)
    const uid = user?.id || 'guest'
    fridgeService.setActiveFridgeId(uid, newModel.id)

    // Adapt existing magnet positions so magnets remain inside the new fridge's bounds
    const adapted = fridgeService.adaptPlacementsToModel(placements, newModel)
    setPlacements(adapted)
    fridgeService.saveFridgePlacements(uid, newModel.id, adapted)
    setIsModelModalOpen(false)

    setSaveSuccessMessage(`Switched to ${newModel.name}`)
    setTimeout(() => setSaveSuccessMessage(null), 2500)
  }

  // Handle Save Fridge Action
  const handleSaveFridge = async () => {
    const uid = user?.id || 'guest'
    fridgeService.saveFridgePlacements(uid, activeModel.id, placements)
    await userMagnetService.saveUserFridgeMagnets(uid, userMagnets)
    setSaveSuccessMessage('Fridge layout & trip plans saved!')
    setTimeout(() => setSaveSuccessMessage(null), 3000)
  }

  // Handle Checklist Add
  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChecklistText.trim()) return
    setChecklistItems([
      ...checklistItems,
      { id: Date.now().toString(), text: newChecklistText.trim(), done: false },
    ])
    setNewChecklistText('')
  }

  // Handle Save Money modal success
  const handleSaveMoneySuccess = (depositMinor: number) => {
    setSavedAmount((prev) => prev + depositMinor / 100)
  }

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="w-full flex flex-col xl:flex-row items-start justify-between gap-5 pb-12 animate-in fade-in duration-200">
      
      {/* 
        COLUMN 1 (LEFT):
        "Add a Magnet" Discovery Catalog Matching media_1791901625496_a5fd76dc.jpg
      */}
      <div className="w-full xl:w-[350px] bg-white rounded-3xl p-5 shadow-lg border border-slate-200/90 flex flex-col h-[760px] flex-shrink-0 overflow-hidden">
        
        {/* Title & Subtitle */}
        <div className="mb-3">
          <h2 className="font-heading font-black text-lg text-slate-900 leading-tight">
            Add a Magnet
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Discover destinations and start planning your next trip.
          </p>
        </div>

        {/* Search Bar with Filter Icon */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations, countries, magnets..."
            className="w-full pl-8 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          <SlidersHorizontal className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-slate-600" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none mb-3 text-[11px]">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill}
              onClick={() => setActiveFilterPill(pill)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-colors ${
                activeFilterPill === pill
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* 8 Category Tiles (2 rows x 4 columns) */}
        <div className="grid grid-cols-4 gap-2 mb-3.5">
          {CATEGORY_TILES.map((cat) => {
            const Icon = cat.icon
            const isActive = activeCategoryTile === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryTile(cat.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span className="text-[10px] font-bold leading-none">{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* 3-Column Grid of Magnet Cards (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin grid grid-cols-3 gap-2.5">
          {filteredCatalog.map((item) => {
            const isFav = favorites.has(item.id)
            const isAdded =
              userMagnets.some((m) => m.destination_slug.toLowerCase() === item.id.toLowerCase()) ||
              placements.some((p) => p.magnetSlug.toLowerCase() === item.id.toLowerCase())

            return (
              <div
                key={item.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/json', JSON.stringify(item))
                  e.dataTransfer.setData('text/plain', item.id)
                  e.dataTransfer.effectAllowed = 'copy'
                }}
                className="group relative p-2 bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between cursor-grab active:cursor-grabbing select-none"
              >
                {/* Heart Button */}
                <button
                  onClick={(e) => toggleFavorite(item.id, e)}
                  className="absolute top-1.5 right-1.5 text-slate-300 hover:text-rose-500 transition-colors z-10"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      isFav ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                </button>

                {/* Magnet Thumbnail */}
                <div
                  onClick={() => {
                    setSelectedDestinationSlug(item.id)
                    const p = placements.find(
                      (pl) => pl.magnetSlug.toLowerCase() === item.id.toLowerCase()
                    )
                    if (p) setSelectedPlacementId(p.id)
                  }}
                  className="h-16 w-full flex items-center justify-center p-1 my-1 cursor-pointer"
                >
                  <img
                    src={item.imagePath}
                    alt={item.name}
                    draggable={false}
                    className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform pointer-events-none"
                  />
                </div>

                {/* Info & Add / Remove Button */}
                <div className="mt-1">
                  <h4 className="font-heading font-black text-[11px] text-slate-900 truncate">
                    {item.name}
                  </h4>
                  <p className="text-[9px] text-slate-500 truncate -mt-0.5">
                    {item.destination.split(',')[1]?.trim() || item.region}
                  </p>

                  {isAdded ? (
                    <div className="mt-1.5 flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedDestinationSlug(item.id)
                          const p = placements.find(
                            (pl) => pl.magnetSlug.toLowerCase() === item.id.toLowerCase()
                          )
                          if (p) setSelectedPlacementId(p.id)
                        }}
                        className="flex-1 py-1 text-[10px] font-heading font-bold rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center justify-center gap-0.5 hover:bg-emerald-100 transition-colors"
                        title="Magnet is on fridge. Click to inspect"
                      >
                        <Check className="w-2.5 h-2.5" />
                        <span>On Fridge</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteMagnet(item.id)
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors"
                        title="Remove magnet from fridge"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddMagnetToFridge(item)}
                      className="mt-1.5 w-full py-1 text-[10px] font-heading font-bold rounded-lg border transition-all flex items-center justify-center gap-0.5 bg-white hover:bg-blue-50 text-blue-600 border-blue-200 shadow-xs hover:border-blue-400 active:scale-95"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* 
        COLUMN 2 (CENTER):
        Editable Fridge Workspace with Edit Controls & Dotted Slots
      */}
      <div className="flex-1 w-full flex flex-col items-center justify-between min-h-[760px] relative rounded-3xl p-5 overflow-hidden bg-gradient-to-b from-[#F2EFE9] to-[#E5E0D6] shadow-inner border border-[#DCD6C9]">
        
        {/* Top Controls Bar: Fridge Selection, Auto Arrange, and Edit Mode Pill */}
        <div className="w-full flex items-center justify-between mb-3 z-20 px-1 gap-2 flex-wrap">
          {/* Fridge Model Switcher Button */}
          <button
            onClick={() => setIsModelModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-xl shadow-xs border border-slate-200 font-medium transition-all hover:border-slate-300 active:scale-95 text-xs"
            title="Switch refrigerator model"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span className="font-heading font-bold text-xs truncate max-w-[130px] sm:max-w-[180px]">
              {activeModel.name}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>

          <div className="flex items-center gap-2">
            {/* Auto Arrange Layout Button */}
            <button
              onClick={handleAutoArrange}
              disabled={userMagnets.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs border border-slate-200 font-heading font-bold text-xs transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              title="Automatically organize magnets evenly across the fridge"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
              <span>Auto Arrange</span>
            </button>

            {/* Auto-Saved Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-heading font-bold text-xs rounded-xl shadow-xs border border-emerald-200">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>Auto-Saved</span>
            </div>

            {/* Edit Mode Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 font-heading font-bold text-xs rounded-xl shadow-xs border border-blue-200">
              <Edit2 className="w-3 h-3 text-blue-600" />
              <span>Edit Mode</span>
            </div>
          </div>
        </div>

        {/* Center Fridge Workspace with Draggable Magnets */}
        <div className="relative z-10 w-full flex flex-col items-center">
          <FridgeWorkspace
            userId={user?.id || 'guest'}
            currentModel={activeModel}
            magnets={userMagnets}
            selectedPlacementId={selectedPlacementId}
            onSelectPlacementId={setSelectedPlacementId}
            onSelectMagnetItem={(magnet) => {
              setSelectedDestinationSlug(magnet.destination_slug)
            }}
            onChangeFridgeModel={handleSelectFridgeModel}
            onRemoveMagnet={handleDeleteMagnet}
            onPlacementsChange={(next) => {
              setPlacements(next)
            }}
            onDropMagnet={handleDropMagnet}
            showControls={false}
            readOnly={false}
          />
        </div>

        {/* Toast Notification */}
        {saveSuccessMessage && (
          <div className="absolute top-4 inset-x-0 mx-auto w-max z-50 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

      </div>

      {/* 
        COLUMN 3 (RIGHT):
        4-Tab Trip Editor Inspector Matching media_1791901625496_a5fd76dc.jpg
      */}
      <div className="w-full xl:w-[420px] bg-white rounded-3xl p-5 shadow-xl border border-slate-200/90 flex flex-col h-[760px] flex-shrink-0 overflow-y-auto scrollbar-thin">
        
        {/* Destination Magnet Hero Display */}
        <div className="relative w-full h-44 flex-shrink-0 rounded-2xl overflow-hidden shadow-md group mb-3.5 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-700 flex items-center justify-center p-4">
          <img
            src={currentCatalogItem.imagePath}
            alt={currentCatalogItem.name}
            className="max-h-32 max-w-32 object-contain filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 relative z-10"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

          {/* Top Right Heart Favorite Button */}
          <button
            onClick={(e) => toggleFavorite(currentCatalogItem.id, e)}
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md transition-transform hover:scale-110 z-10"
            title="Favorite Destination"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                favorites.has(currentCatalogItem.id) ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>
        </div>

        {/* Header Title & Tags */}
        <div className="flex items-center gap-2 mb-1.5">
          <h3 className="font-heading font-black text-lg text-slate-900">
            {currentCatalogItem.name}
          </h3>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            {currentCatalogItem.region}
          </span>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed mb-2.5">
          {currentCatalogItem.description}
        </p>

        {/* Fridge Status & Action Bar (Add or Remove Magnet) */}
        <div className="mb-3">
          {isCurrentOnFridge ? (
            <button
              onClick={() => handleDeleteMagnet(currentCatalogItem.id)}
              className="w-full py-1.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
              title="Remove this magnet from your fridge"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Remove from Fridge</span>
            </button>
          ) : (
            <button
              onClick={() => handleAddMagnetToFridge(currentCatalogItem)}
              className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors active:scale-95"
              title="Add this magnet to your fridge"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Magnet to Fridge</span>
            </button>
          )}
        </div>

        {/* 4 Tabs: Trip Plan | Savings | Checklist | Notes */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
          {(['Trip Plan', 'Savings', 'Checklist', 'Notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 rounded-lg transition-all text-center text-[11px] ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-xs font-heading font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 1: TRIP PLAN */}
        {activeTab === 'Trip Plan' && (
          <div className="space-y-4">
            
            {/* Trip Dates Card */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-slate-800">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Trip Dates</span>
                </div>
                <button
                  onClick={() => setIsEditingDates(!isEditingDates)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                >
                  {isEditingDates ? 'Done' : 'Edit'}
                </button>
              </div>

              {isEditingDates ? (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold block mb-0.5">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold">Start Date</span>
                      <span className="font-bold text-slate-900">
                        {new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-400 font-bold">→</span>
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <span className="text-[9px] text-slate-400 block font-semibold">End Date</span>
                      <span className="font-bold text-slate-900">
                        {new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            {/* Budget Plan Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-slate-800">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Budget Plan</span>
                </div>
                <button
                  onClick={() => setIsEditingBudget(!isEditingBudget)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                >
                  {isEditingBudget ? 'Done' : 'Edit'}
                </button>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Total Estimated Cost</span>
                <div className="font-heading font-black text-lg text-slate-900 leading-tight">
                  <span>₹ {totalEstimatedCost.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden my-2">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${percentSaved}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-3">
                <span>₹ {savedAmount.toLocaleString('en-IN')} saved</span>
                <span>₹ {remainingBudget.toLocaleString('en-IN')} remaining</span>
              </div>

              {/* Itemized List */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Plane className="w-3.5 h-3.5 text-blue-600" />
                    <span>Flights</span>
                  </span>
                  <span>₹ {itemizedBreakdown.flights.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Stay (7 nights)</span>
                  </span>
                  <span>₹ {itemizedBreakdown.stay.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-amber-600" />
                    <span>Food & Drinks</span>
                  </span>
                  <span>₹ {itemizedBreakdown.food.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Local Transport</span>
                  </span>
                  <span>₹ {itemizedBreakdown.transport.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Activities & Tours</span>
                  </span>
                  <span>₹ {itemizedBreakdown.activities.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>Other (Visa, Insurance etc.)</span>
                  </span>
                  <span>₹ {itemizedBreakdown.other.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Savings Plan Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-heading font-bold text-slate-800">
                  <PiggyBank className="w-3.5 h-3.5 text-blue-600" />
                  <span>Savings Plan</span>
                </div>
                <button
                  onClick={() => setIsSaveModalOpen(true)}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 font-semibold block">Daily Savings Required</span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="font-heading font-black text-lg text-slate-900">
                    ₹ {dailySavingsRequired.toLocaleString('en-IN')} / day
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    {daysLeft} days left
                  </span>
                </div>
              </div>

              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-2">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${percentSaved}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-3">
                <span>₹ {savedAmount.toLocaleString('en-IN')}</span>
                <span>₹ {totalEstimatedCost.toLocaleString('en-IN')}</span>
              </div>

              <button
                onClick={() => setIsSaveModalOpen(true)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-[1.01] active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Money</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: SAVINGS */}
        {activeTab === 'Savings' && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Total Saved</span>
              <h3 className="font-heading font-black text-2xl mt-0.5">
                ₹ {savedAmount.toLocaleString('en-IN')}
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                Target: ₹ {totalEstimatedCost.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">Remaining to Save:</span>
                <span className="font-bold text-slate-900">₹ {remainingBudget.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">Departure Date:</span>
                <span className="font-bold text-slate-900">{startDate}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="font-semibold">Calculated Daily Target:</span>
                <span className="font-black text-emerald-600">₹ {dailySavingsRequired.toLocaleString('en-IN')} / day</span>
              </div>
            </div>

            <button
              onClick={() => setIsSaveModalOpen(true)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Record Savings Deposit</span>
            </button>
          </div>
        )}

        {/* TAB 3: CHECKLIST */}
        {activeTab === 'Checklist' && (
          <div className="space-y-3">
            <form onSubmit={handleAddChecklistItem} className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder="Add new checklist item..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
              >
                Add
              </button>
            </form>

            <div className="space-y-1.5">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() =>
                    setChecklistItems((prev) =>
                      prev.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                    )
                  }
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    item.done
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 line-through'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                        item.done
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {item.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-xs font-medium">{item.text}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setChecklistItems((prev) => prev.filter((c) => c.id !== item.id))
                    }}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: NOTES */}
        {activeTab === 'Notes' && (
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Trip Itinerary & Packing Notes
            </label>
            <textarea
              rows={8}
              value={tripNotes}
              onChange={(e) => setTripNotes(e.target.value)}
              placeholder="Write day-by-day plans, flight reservation codes, restaurant recommendations..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-medium text-slate-800"
            />
            <p className="text-[10px] text-slate-500">
              Notes are automatically saved locally and synchronized with your trip.
            </p>
          </div>
        )}

      </div>

      {/* Save Money / Deposit Modal */}
      <SaveMoneyModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        destinationName="Santorini, Greece"
        totalBudgetMinor={totalEstimatedCost * 100}
        totalSavedMinor={savedAmount * 100}
        daysRemaining={daysLeft}
        onSaveAmount={handleSaveMoneySuccess}
      />

      {/* Refrigerator Model Selection Modal */}
      <FridgeModelModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        currentModelId={activeModel.id}
        userId={user?.id || 'guest'}
        onSelectModel={handleSelectFridgeModel}
      />

    </div>
  )
}
