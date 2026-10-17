import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fridgeService, areSlugsEquivalent, DEFAULT_FRIDGE_ID } from '../services/fridgeService'
import { userMagnetService, type FridgeMagnetItem, DEFAULT_FEATURED_MAGNETS } from '../services/userMagnetService'
import { SOUVENIR_MAGNETS_CATALOG, type SouvenirMagnetData } from '../data/photorealisticMagnets'
import type { FridgeModel, MagnetPlacement } from '../types/fridge'
import { FridgeWorkspace } from '../components/fridge/FridgeWorkspace'
import { SaveMoneyModal } from '../components/trips/SaveMoneyModal'
import {
  Heart,
  Plus,
  Check,
  Compass,
  Sparkles,
  Calendar,
  PiggyBank,
  Plane,
  Building2,
  Utensils,
  Car,
  Star,
  FileText,
  ShoppingBag,
  LayoutGrid,
  Globe2,
  Mountain,
  Sun,
  Landmark,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import { budgetService, type BudgetItem } from '../services/budgetService'

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
  const [activeFilterPill, setActiveFilterPill] = useState('All')
  const [activeCategoryTile, setActiveCategoryTile] = useState('All')
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['santorini', 'paris', 'goa-beach']))

  // User Fridge Model & Magnets (Universal Studio Stainless 3D)
  const [activeModel, setActiveModel] = useState<FridgeModel>(() => {
    return fridgeService.getFridgeModelById(DEFAULT_FRIDGE_ID, user?.id)
  })
  const [userMagnets, setUserMagnets] = useState<FridgeMagnetItem[]>(() => {
    return userMagnetService.getUserFridgeMagnetsSync(user?.id || 'guest')
  })
  const [placements, setPlacements] = useState<MagnetPlacement[]>(() => {
    const uid = user?.id || 'guest'
    return fridgeService.getFridgePlacements(uid, DEFAULT_FRIDGE_ID)
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

  // Mobile View Switcher ('fridge' | 'catalog' | 'trip')
  const [mobileActiveView, setMobileActiveView] = useState<'fridge' | 'catalog' | 'trip'>('fridge')

  // Budget Plan State
  const [isEditingBudget, setIsEditingBudget] = useState(false)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(() => {
    return budgetService.getBudgetItems('santorini')
  })
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')
  const [isAddingExpense, setIsAddingExpense] = useState(false)

  // Update budget items when destination changes
  useEffect(() => {
    setBudgetItems(budgetService.getBudgetItems(selectedDestinationSlug))
    setIsEditingBudget(false)
    setIsAddingExpense(false)
  }, [selectedDestinationSlug])

  // Sync budget updates from external events
  useEffect(() => {
    const handleBudgetSync = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail?.source === 'budgetService' && areSlugsEquivalent(detail?.slug, selectedDestinationSlug)) {
        if (detail?.items) {
          setBudgetItems(detail.items)
        } else {
          setBudgetItems(budgetService.getBudgetItems(selectedDestinationSlug))
        }
      }
    }
    window.addEventListener('magneto_sync', handleBudgetSync)
    return () => window.removeEventListener('magneto_sync', handleBudgetSync)
  }, [selectedDestinationSlug])

  // Matching magnet for the selected destination
  const matchedMagnet = useMemo(() => {
    return (
      userMagnets.find((m) => areSlugsEquivalent(m.destination_slug, selectedDestinationSlug)) ||
      placements.find((p) => areSlugsEquivalent(p.magnetSlug, selectedDestinationSlug))
    )
  }, [userMagnets, placements, selectedDestinationSlug])

  const [savedAmountOverrides, setSavedAmountOverrides] = useState<Record<string, number>>({})

  // Dynamic Savings amounts for current trip derived from matched magnet or destination
  const savedAmount = useMemo(() => {
    const slug = selectedDestinationSlug.toLowerCase()
    if (savedAmountOverrides[slug] !== undefined) {
      return savedAmountOverrides[slug]
    }
    if (matchedMagnet) {
      if ('totalSavedMinor' in matchedMagnet && matchedMagnet.totalSavedMinor !== undefined) {
        return matchedMagnet.totalSavedMinor / 100
      }
      if ('total_saved_minor' in matchedMagnet && matchedMagnet.total_saved_minor !== undefined) {
        return matchedMagnet.total_saved_minor / 100
      }
    }
    return areSlugsEquivalent(selectedDestinationSlug, 'santorini') ? 80000 : 0
  }, [matchedMagnet, selectedDestinationSlug, savedAmountOverrides])

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
      let list: FridgeMagnetItem[]
      if (raw === null) {
        list = DEFAULT_FEATURED_MAGNETS
        setUserMagnets(list)
        await userMagnetService.saveUserFridgeMagnets(uid, list, 'PlanTripPage')
      } else {
        list = await userMagnetService.getUserFridgeMagnets(uid)
        setUserMagnets(list)
      }
      setActiveModel(fridgeService.getFridgeModelById(DEFAULT_FRIDGE_ID, user?.id))
      const loadedPlacements = fridgeService.getFridgePlacements(uid, DEFAULT_FRIDGE_ID, list)
      setPlacements(loadedPlacements)
    }
    load()

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail?.source === 'PlanTripPage') return

      setActiveModel(fridgeService.getFridgeModelById(DEFAULT_FRIDGE_ID, user?.id))
      const syncMagnets = userMagnetService.getUserFridgeMagnetsSync(uid)
      setUserMagnets(syncMagnets)
      const syncPlacements = fridgeService.getFridgePlacements(uid, DEFAULT_FRIDGE_ID, syncMagnets)
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
  }, [activeFilterPill, activeCategoryTile])

  // Current Destination Inspector Item
  const currentCatalogItem = useMemo(() => {
    return (
      SOUVENIR_MAGNETS_CATALOG.find(
        (item) => areSlugsEquivalent(item.id, selectedDestinationSlug)
      ) || SOUVENIR_MAGNETS_CATALOG[0]
    )
  }, [selectedDestinationSlug])

  const isCurrentOnFridge =
    userMagnets.some((m) => areSlugsEquivalent(m.destination_slug, currentCatalogItem.id)) ||
    placements.some((p) => areSlugsEquivalent(p.magnetSlug, currentCatalogItem.id))

  // Budget calculations
  const totalEstimatedCost = useMemo(() => {
    return budgetService.calculateTotalCost(budgetItems)
  }, [budgetItems])
  const remainingBudget = Math.max(0, totalEstimatedCost - savedAmount)
  const percentSaved = Math.min(100, Math.round((savedAmount / Math.max(1, totalEstimatedCost)) * 100))

  // Days left calculation
  const startD = new Date(startDate)
  const now = new Date()
  const daysLeft = Math.max(1, Math.ceil((startD.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  const dailySavingsRequired = remainingBudget > 0 ? Math.ceil(remainingBudget / daysLeft) : 0

  // Budget Item Actions
  const handleUpdateBudgetItem = (id: string, updates: Partial<BudgetItem>) => {
    const updated = budgetItems.map((item) => {
      if (item.id === id) {
        return { ...item, ...updates }
      }
      return item
    })
    setBudgetItems(updated)
    budgetService.saveBudgetItems(selectedDestinationSlug, updated)
  }

  const handleDeleteBudgetItem = (id: string) => {
    const updated = budgetItems.filter((item) => item.id !== id)
    setBudgetItems(updated)
    budgetService.saveBudgetItems(selectedDestinationSlug, updated)
  }

  const handleAddBudgetItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmedName = newExpenseName.trim()
    const numAmount = parseInt(newExpenseAmount.replace(/[^0-9]/g, ''), 10) || 0
    if (!trimmedName) return

    const newItem: BudgetItem = {
      id: `item-${Date.now()}`,
      name: trimmedName,
      amount: numAmount,
      category: 'other',
    }

    const updated = [...budgetItems, newItem]
    setBudgetItems(updated)
    budgetService.saveBudgetItems(selectedDestinationSlug, updated)
    setNewExpenseName('')
    setNewExpenseAmount('')
    setIsAddingExpense(false)
  }

  const handleResetBudget = () => {
    const restored = budgetService.resetBudgetItems(selectedDestinationSlug)
    setBudgetItems(restored)
  }

  const renderBudgetItemIcon = (item: BudgetItem) => {
    const lower = (item.name + ' ' + (item.category || '')).toLowerCase()
    if (lower.includes('flight') || lower.includes('air') || lower.includes('fly') || lower.includes('plane') || lower.includes('ticket')) {
      return <Plane className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
    }
    if (lower.includes('stay') || lower.includes('hotel') || lower.includes('resort') || lower.includes('villa') || lower.includes('room') || lower.includes('airbnb') || lower.includes('hostel')) {
      return <Building2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
    }
    if (lower.includes('food') || lower.includes('drink') || lower.includes('meal') || lower.includes('dining') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('snack') || lower.includes('lunch') || lower.includes('dinner')) {
      return <Utensils className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
    }
    if (lower.includes('transport') || lower.includes('car') || lower.includes('cab') || lower.includes('taxi') || lower.includes('train') || lower.includes('metro') || lower.includes('bus') || lower.includes('ferry') || lower.includes('bike')) {
      return <Car className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
    }
    if (lower.includes('activit') || lower.includes('tour') || lower.includes('sight') || lower.includes('museum') || lower.includes('safari') || lower.includes('cruise') || lower.includes('excursion') || lower.includes('scuba') || lower.includes('water sports')) {
      return <Star className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
    }
    if (lower.includes('shop') || lower.includes('souvenir') || lower.includes('gift') || lower.includes('market') || lower.includes('cloth')) {
      return <ShoppingBag className="w-3.5 h-3.5 text-pink-500 flex-shrink-0" />
    }
    return <FileText className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
  }

  // Add Magnet to Fridge action
  const handleAddMagnetToFridge = async (magnet: SouvenirMagnetData) => {
    const uid = user?.id || 'guest'
    const cleanSlug = magnet.id.toLowerCase()
    const canonicalId = `magnet-${cleanSlug}`

    // Check if already on fridge (using areSlugsEquivalent)
    const existingIndex = placements.findIndex(
      (p) => areSlugsEquivalent(p.magnetSlug, cleanSlug) || areSlugsEquivalent(p.id, canonicalId)
    )
    if (existingIndex >= 0) {
      setSelectedPlacementId(placements[existingIndex].id)
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
    newPlacement.magnetSlug = cleanSlug

    const nextMagnets = [...userMagnets, newMagnetItem]
    const nextPlacements = fridgeService.resolveMagnetOverlaps([...placements, newPlacement])

    setUserMagnets(nextMagnets)
    setPlacements(nextPlacements)
    setSelectedPlacementId(canonicalId)
    setSelectedDestinationSlug(cleanSlug)

    fridgeService.saveFridgePlacements(uid, activeModel.id, nextPlacements, 'PlanTripPage')
    await userMagnetService.saveUserFridgeMagnets(uid, nextMagnets, 'PlanTripPage')

    setSaveSuccessMessage(`${magnet.name} added to fridge!`)
    setTimeout(() => setSaveSuccessMessage(null), 2500)
  }

  // Handle dropping a magnet from left discovery catalog directly onto the fridge surface
  const handleDropMagnet = async (rawItem: any, coords: { x: number; y: number }) => {
    const cleanSlug = (rawItem.id || rawItem.slug || '').toLowerCase()
    if (!cleanSlug) return

    const catalogItem =
      SOUVENIR_MAGNETS_CATALOG.find((m) => areSlugsEquivalent(m.id, cleanSlug)) || rawItem

    const uid = user?.id || 'guest'
    const canonicalId = `magnet-${cleanSlug}`

    const existingPlacementIndex = placements.findIndex(
      (p) => areSlugsEquivalent(p.magnetSlug, cleanSlug) || areSlugsEquivalent(p.id, canonicalId)
    )

    if (existingPlacementIndex >= 0) {
      // Reposition already placed magnet to exact drop coordinates
      const candidatePlacements = placements.map((p, idx) =>
        idx === existingPlacementIndex ? { ...p, x: coords.x, y: coords.y } : p
      )
      const nextPlacements = fridgeService.resolveMagnetOverlaps(candidatePlacements)
      setPlacements(nextPlacements)
      setSelectedPlacementId(nextPlacements[existingPlacementIndex].id)
      setSelectedDestinationSlug(cleanSlug)
      fridgeService.saveFridgePlacements(uid, activeModel.id, nextPlacements, 'PlanTripPage')
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
    const nextPlacements = fridgeService.resolveMagnetOverlaps([...placements, newPlacement])

    setUserMagnets(nextMagnets)
    setPlacements(nextPlacements)
    setSelectedPlacementId(canonicalId)
    setSelectedDestinationSlug(cleanSlug)

    fridgeService.saveFridgePlacements(uid, activeModel.id, nextPlacements, 'PlanTripPage')
    await userMagnetService.saveUserFridgeMagnets(uid, nextMagnets, 'PlanTripPage')

    setSaveSuccessMessage(`${catalogItem.name} placed on fridge!`)
    setTimeout(() => setSaveSuccessMessage(null), 2500)
    setMobileActiveView('fridge')
  }

  // Delete / Remove Magnet from Fridge
  const handleDeleteMagnet = async (idOrSlug: string) => {
    const uid = user?.id
    if (!uid || uid === 'guest' || uid === 'default_user') {
      console.warn('[PlanTripPage] Blocked unauthorized magnet deletion attempt by unauthenticated user')
      return
    }
    const cleanSlug = idOrSlug.toLowerCase().replace(/^magnet-/, '')
    const canonicalId = `magnet-${cleanSlug}`

    const nextMagnets = userMagnets.filter(
      (m) =>
        m.id !== idOrSlug &&
        m.id !== canonicalId &&
        !areSlugsEquivalent(m.destination_slug, cleanSlug)
    )
    const nextPlacements = placements.filter(
      (p) =>
        p.id !== idOrSlug &&
        p.id !== canonicalId &&
        !areSlugsEquivalent(p.magnetSlug, cleanSlug)
    )

    setUserMagnets(nextMagnets)
    setPlacements(nextPlacements)

    if (
      selectedPlacementId === idOrSlug ||
      selectedPlacementId === canonicalId ||
      areSlugsEquivalent(selectedDestinationSlug, cleanSlug)
    ) {
      const fallback = nextPlacements[0]
      setSelectedPlacementId(fallback?.id || null)
      if (fallback) {
        setSelectedDestinationSlug(fallback.magnetSlug)
      }
    }

    fridgeService.saveFridgePlacements(uid, activeModel.id, nextPlacements, 'PlanTripPage')
    await userMagnetService.saveUserFridgeMagnets(uid, nextMagnets, 'PlanTripPage')

    setSaveSuccessMessage('Magnet removed from fridge.')
    setTimeout(() => setSaveSuccessMessage(null), 2500)
  }

  // Switch Refrigerator Model

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
  const handleSaveMoneySuccess = async (depositMinor: number) => {
    const uid = user?.id || 'guest'
    const cleanSlug = selectedDestinationSlug.toLowerCase()
    const result = await userMagnetService.recordMagnetDeposit(
      uid,
      cleanSlug,
      depositMinor,
      {
        targetBudgetMinor: totalEstimatedCost * 100,
        source: 'PlanTripPage',
      }
    )

    setSavedAmountOverrides((prev) => ({
      ...prev,
      [cleanSlug]: result.newTotalSavedMinor / 100,
    }))

    // Reload latest magnets & placements immediately
    const refreshedMagnets = userMagnetService.getUserFridgeMagnetsSync(uid)
    setUserMagnets(refreshedMagnets)
    const refreshedPlacements = fridgeService.getFridgePlacements(uid, activeModel.id, refreshedMagnets)
    setPlacements(refreshedPlacements)

    setSaveSuccessMessage(`₹ ${(depositMinor / 100).toLocaleString('en-IN')} deposited for ${currentCatalogItem.name}!`)
    setTimeout(() => setSaveSuccessMessage(null), 3000)
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
        MOBILE VIEW SEGMENTED CONTROLLER (Visible only on < xl viewports)
        Allows mobile phone users to instantly switch between Fridge, Catalog, and Trip Plan
      */}
      <div className="xl:hidden w-full flex items-center justify-center p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 mb-1">
        <button
          onClick={() => setMobileActiveView('fridge')}
          className={`flex-1 py-2 text-xs font-heading font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileActiveView === 'fridge'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="4" y="2" width="16" height="20" rx="3" strokeWidth="2" />
            <path strokeWidth="2" d="M4 10h16M8 6v2M8 14v4" />
          </svg>
          <span>Fridge</span>
        </button>

        <button
          onClick={() => setMobileActiveView('catalog')}
          className={`flex-1 py-2 text-xs font-heading font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileActiveView === 'catalog'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Magnets</span>
        </button>

        <button
          onClick={() => setMobileActiveView('trip')}
          className={`flex-1 py-2 text-xs font-heading font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            mobileActiveView === 'trip'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Trip Plan</span>
        </button>
      </div>

      {/* 
        COLUMN 1 (LEFT):
        "Add a Magnet" Discovery Catalog Matching media_1791901625496_a5fd76dc.jpg
      */}
      <div className={`w-full max-w-lg mx-auto xl:max-w-none xl:mx-0 xl:w-[350px] bg-white rounded-3xl p-4 sm:p-5 shadow-lg border border-slate-200/90 flex-col h-[520px] xl:h-[760px] flex-shrink-0 overflow-hidden ${
        mobileActiveView === 'catalog' ? 'flex' : 'hidden xl:flex'
      }`}>
        
        {/* Title & Subtitle */}
        <div className="mb-3">
          <h2 className="font-heading font-black text-lg text-slate-900 leading-tight">
            Add a Magnet
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Discover destinations and start planning your next trip.
          </p>
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
              userMagnets.some((m) => areSlugsEquivalent(m.destination_slug, item.id)) ||
              placements.some((p) => areSlugsEquivalent(p.magnetSlug, item.id))

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
                      (pl) => areSlugsEquivalent(pl.magnetSlug, item.id)
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
                            (pl) => areSlugsEquivalent(pl.magnetSlug, item.id)
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
        Free-Flow Editable Fridge Workspace (Centered vertically with respect to the left & right side panels)
      */}
      <div className={`flex-1 w-full flex-col items-center justify-center min-h-0 sm:min-h-[520px] xl:min-h-[760px] xl:h-[760px] relative p-0 overflow-visible bg-transparent ${
        mobileActiveView === 'fridge' ? 'flex' : 'hidden xl:flex'
      }`}>
        
        {/* Center Fridge Workspace with Draggable Magnets - shifted down to sit in the exact visual center */}
        <div className="relative z-10 w-full flex flex-col items-center justify-center my-auto pt-4 sm:pt-6 xl:pt-10">
          <FridgeWorkspace
            userId={user?.id || 'guest'}
            currentModel={activeModel}
            magnets={userMagnets}
            placements={placements}
            selectedPlacementId={selectedPlacementId}
            onSelectPlacementId={setSelectedPlacementId}
            onSelectMagnetItem={(magnet) => {
              setSelectedDestinationSlug(magnet.destination_slug)
            }}
            onRemoveMagnet={handleDeleteMagnet}
            onPlacementsChange={(next) => {
              setPlacements(next)
            }}
            onDropMagnet={handleDropMagnet}
            onAddDestination={() => setMobileActiveView('catalog')}
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
      <div className={`w-full max-w-lg mx-auto xl:max-w-none xl:mx-0 xl:w-[420px] bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-200/90 flex-col h-[520px] xl:h-[760px] flex-shrink-0 overflow-y-auto scrollbar-thin ${
        mobileActiveView === 'trip' ? 'flex' : 'hidden xl:flex'
      }`}>
        
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
                <div className="flex items-center gap-2">
                  {isEditingBudget && (
                    <button
                      type="button"
                      onClick={handleResetBudget}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
                      title="Reset to default breakdown"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingBudget(!isEditingBudget)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                      isEditingBudget
                        ? 'bg-blue-600 text-white shadow-xs hover:bg-blue-700'
                        : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                    }`}
                  >
                    {isEditingBudget ? 'Done ✓' : 'Edit'}
                  </button>
                </div>
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
                {budgetItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-1.5 group">
                    {isEditingBudget ? (
                      // EDIT MODE ROW:
                      <div className="flex items-center gap-1.5 w-full bg-white p-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        {renderBudgetItemIcon(item)}
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateBudgetItem(item.id, { name: e.target.value })}
                          className="flex-1 min-w-0 text-xs font-medium text-slate-800 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                          placeholder="Expense title"
                        />
                        <div className="flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={item.amount === 0 ? '' : item.amount}
                            onChange={(e) =>
                              handleUpdateBudgetItem(item.id, {
                                amount: Math.max(0, parseInt(e.target.value, 10) || 0),
                              })
                            }
                            className="w-16 text-right text-xs font-bold text-slate-900 bg-transparent border-0 focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteBudgetItem(item.id)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete this expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      // VIEW MODE ROW:
                      <div className="flex items-center justify-between w-full py-0.5 text-slate-600 hover:text-slate-900">
                        <span className="flex items-center gap-1.5 truncate pr-2">
                          {renderBudgetItemIcon(item)}
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="font-semibold text-slate-800 whitespace-nowrap">
                          ₹ {item.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* ADD NEW EXPENSE ROW */}
                {isEditingBudget || isAddingExpense ? (
                  <form
                    onSubmit={handleAddBudgetItem}
                    className="mt-2.5 p-2 bg-blue-50/70 rounded-xl border border-blue-200/80 space-y-2"
                  >
                    <div className="text-[10px] font-bold text-blue-900 flex items-center justify-between">
                      <span>+ Add Custom Expense</span>
                      {!isEditingBudget && (
                        <button
                          type="button"
                          onClick={() => setIsAddingExpense(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newExpenseName}
                        onChange={(e) => setNewExpenseName(e.target.value)}
                        placeholder="e.g. Visa, Scuba, Shopping..."
                        className="flex-1 min-w-0 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <div className="flex items-center gap-0.5 bg-white border border-slate-300 rounded-lg px-2 py-1 w-24">
                        <span className="text-[10px] text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={newExpenseAmount}
                          onChange={(e) => setNewExpenseAmount(e.target.value)}
                          placeholder="Amount"
                          className="w-full text-right text-xs font-bold text-slate-900 bg-transparent border-0 focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!newExpenseName.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center shadow-xs"
                        title="Add Expense"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingExpense(true)
                        setIsEditingBudget(true)
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline py-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Custom Expense</span>
                    </button>
                    <span className="text-[10px] text-slate-400">
                      {budgetItems.length} items
                    </span>
                  </div>
                )}
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

    </div>
  )
}
