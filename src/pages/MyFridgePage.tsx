import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fridgeService, areSlugsEquivalent, DEFAULT_FRIDGE_ID } from '../services/fridgeService'
import { userMagnetService, type FridgeMagnetItem, DEFAULT_FEATURED_MAGNETS } from '../services/userMagnetService'
import type { FridgeModel, MagnetPlacement } from '../types/fridge'
import { FridgeWorkspace } from '../components/fridge/FridgeWorkspace'
import { SaveMoneyModal } from '../components/trips/SaveMoneyModal'
import {
  Heart,
  PiggyBank,
  Calendar,
  CheckCircle2,
  Compass,
  ArrowRight,
  Plus,
  Sparkles,
} from 'lucide-react'
import { budgetService } from '../services/budgetService'

interface DestinationDetail {
  id: string
  name: string
  country: string
  description: string
  bannerUrl: string
  targetBudgetMinor: number
  totalSavedMinor: number
  targetDate: string
  breakdown: {
    flights: number
    stay: number
    food: number
    transport: number
    activities: number
    other: number
  }
}

// Curated destinations with full financial profiles matching reference design
const FEATURED_DETAILS: Record<string, DestinationDetail> = {
  santorini: {
    id: 'santorini',
    name: 'Santorini, Greece',
    country: 'Greece',
    description:
      'A dream destination with stunning white buildings, blue domes and breathtaking sunsets over the Aegean Sea.',
    bannerUrl:
      'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 25000000,
    totalSavedMinor: 8000000,
    targetDate: '2026-08-15',
    breakdown: {
      flights: 60000,
      stay: 80000,
      food: 40000,
      transport: 20000,
      activities: 30000,
      other: 20000,
    },
  },
  japan: {
    id: 'japan',
    name: 'Tokyo & Kyoto, Japan',
    country: 'Japan',
    description:
      'Land of the rising sun with majestic Mount Fuji, ancient wooden shrines, neon cityscapes, and blooming cherry blossoms.',
    bannerUrl:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 20000000,
    totalSavedMinor: 12000000,
    targetDate: '2026-04-10',
    breakdown: {
      flights: 55000,
      stay: 65000,
      food: 35000,
      transport: 25000,
      activities: 12000,
      other: 8000,
    },
  },
  thailand: {
    id: 'thailand',
    name: 'Bangkok & Chiang Mai, Thailand',
    country: 'Thailand',
    description:
      'Golden Buddhist temples, vibrant floating night markets, lush jungle sanctuaries, and tranquil tropical islands.',
    bannerUrl:
      'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 15000000,
    totalSavedMinor: 6000000,
    targetDate: '2026-11-20',
    breakdown: {
      flights: 35000,
      stay: 45000,
      food: 25000,
      transport: 15000,
      activities: 18000,
      other: 12000,
    },
  },
  rome: {
    id: 'rome',
    name: 'Rome, Italy',
    country: 'Italy',
    description:
      'The Eternal City featuring the monumental Colosseum, Vatican museums, cobblestone piazzas, and authentic gelato.',
    bannerUrl:
      'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 18000000,
    totalSavedMinor: 18000000,
    targetDate: '2026-06-01',
    breakdown: {
      flights: 45000,
      stay: 55000,
      food: 30000,
      transport: 15000,
      activities: 20000,
      other: 15000,
    },
  },
  bali: {
    id: 'bali',
    name: 'Bali, Indonesia',
    country: 'Indonesia',
    description:
      'Island of the Gods with sacred sea temples, emerald rice terraces, surf beaches, and holistic mountain wellness retreats.',
    bannerUrl:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 12000000,
    totalSavedMinor: 12000000,
    targetDate: '2026-07-15',
    breakdown: {
      flights: 32000,
      stay: 40000,
      food: 20000,
      transport: 10000,
      activities: 12000,
      other: 6000,
    },
  },
  paris: {
    id: 'paris',
    name: 'Paris, France',
    country: 'France',
    description:
      'City of Light with the iconic Eiffel Tower, Louvre masterpieces, sidewalk cafés, and romantic cruises along the Seine.',
    bannerUrl:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 22000000,
    totalSavedMinor: 22000000,
    targetDate: '2025-05-18',
    breakdown: {
      flights: 50000,
      stay: 80000,
      food: 40000,
      transport: 18000,
      activities: 20000,
      other: 12000,
    },
  },
  'new-york': {
    id: 'new-york',
    name: 'New York City, USA',
    country: 'USA',
    description:
      'The bustling metropolis with the Statue of Liberty, Central Park, Broadway theaters, and soaring skyscraper skylines.',
    bannerUrl:
      'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 28000000,
    totalSavedMinor: 28000000,
    targetDate: '2025-10-05',
    breakdown: {
      flights: 70000,
      stay: 110000,
      food: 45000,
      transport: 20000,
      activities: 25000,
      other: 10000,
    },
  },
  goa: {
    id: 'goa',
    name: 'Goa, India',
    country: 'India',
    description:
      'Tropical sunshine beaches, Portuguese heritage churches, palm-fringed coastal backwaters, and vibrant sunset shacks.',
    bannerUrl:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 4000000,
    totalSavedMinor: 4000000,
    targetDate: '2025-12-25',
    breakdown: {
      flights: 10000,
      stay: 15000,
      food: 7000,
      transport: 3000,
      activities: 3000,
      other: 2000,
    },
  },
  ladakh: {
    id: 'ladakh',
    name: 'Ladakh, India',
    country: 'India',
    description:
      'High-altitude Himalayan desert with Pangong Tso lake, Buddhist monasteries, snow passes, and starry night skies.',
    bannerUrl:
      'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 6000000,
    totalSavedMinor: 6000000,
    targetDate: '2025-08-10',
    breakdown: {
      flights: 15000,
      stay: 20000,
      food: 10000,
      transport: 8000,
      activities: 4000,
      other: 3000,
    },
  },
  delhi: {
    id: 'delhi',
    name: 'India Gate, New Delhi',
    country: 'India',
    description:
      'The majestic all-India war memorial archway standing in the heart of Rajpath, symbolizing timeless valour and pride.',
    bannerUrl:
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 2500000,
    totalSavedMinor: 2500000,
    targetDate: '2025-11-15',
    breakdown: {
      flights: 8000,
      stay: 8000,
      food: 4000,
      transport: 2500,
      activities: 1500,
      other: 1000,
    },
  },
  'india-gate': {
    id: 'india-gate',
    name: 'India Gate, New Delhi',
    country: 'India',
    description:
      'The majestic all-India war memorial archway standing in the heart of Rajpath, symbolizing timeless valour and pride.',
    bannerUrl:
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 2500000,
    totalSavedMinor: 2500000,
    targetDate: '2025-11-15',
    breakdown: {
      flights: 8000,
      stay: 8000,
      food: 4000,
      transport: 2500,
      activities: 1500,
      other: 1000,
    },
  },
  'taj-mahal': {
    id: 'taj-mahal',
    name: 'Taj Mahal, Agra',
    country: 'India',
    description:
      'The ivory-white marble wonder of the world built on the southern banks of the Yamuna River, a testament to eternal devotion.',
    bannerUrl:
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 3000000,
    totalSavedMinor: 3000000,
    targetDate: '2025-12-10',
    breakdown: {
      flights: 10000,
      stay: 10000,
      food: 5000,
      transport: 2500,
      activities: 1500,
      other: 1000,
    },
  },
  'royal-elephant': {
    id: 'royal-elephant',
    name: 'Jaipur & Amber Fort',
    country: 'India',
    description:
      'The ceremonial splendour of the Pink City with royal elephant processions, majestic Amber hill palaces, and gemstone bazaars.',
    bannerUrl:
      'https://images.unsplash.com/photo-1603288940356-9b04456722ce?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 3500000,
    totalSavedMinor: 3500000,
    targetDate: '2026-01-20',
    breakdown: {
      flights: 10000,
      stay: 12000,
      food: 6000,
      transport: 3500,
      activities: 2000,
      other: 1500,
    },
  },
  london: {
    id: 'london',
    name: 'London, United Kingdom',
    country: 'United Kingdom',
    description:
      'Iconic red double-decker buses, Big Ben, Westminster Abbey, Buckingham Palace, and historic River Thames landmarks.',
    bannerUrl:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    targetBudgetMinor: 20000000,
    totalSavedMinor: 20000000,
    targetDate: '2026-05-12',
    breakdown: {
      flights: 50000,
      stay: 70000,
      food: 35000,
      transport: 20000,
      activities: 15000,
      other: 10000,
    },
  },
}

export const MyFridgePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Fridge Magnets
  const [userMagnets, setUserMagnets] = useState<FridgeMagnetItem[]>(() => {
    return userMagnetService.getUserFridgeMagnetsSync(user?.id || 'guest')
  })
  const [selectedSlug, setSelectedSlug] = useState<string>('santorini')
  const [isFavorite, setIsFavorite] = useState<boolean>(true)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)

  // Dynamic Savings amounts for selected destination (can be topped up)
  const [destinationOverrides, setDestinationOverrides] = useState<
    Record<string, { totalSavedMinor: number }>
  >({})

  // Active Fridge Model (Universal Studio Stainless 3D)
  const [activeModel, setActiveModel] = useState<FridgeModel>(() => {
    return fridgeService.getFridgeModelById(DEFAULT_FRIDGE_ID, user?.id)
  })

  // Placements on canvas
  const [placements, setPlacements] = useState<MagnetPlacement[]>([])
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null)

  // Load User Magnets or default starter collection & keep synced
  useEffect(() => {
    const uid = user?.id || 'guest'
    const load = async () => {
      const raw = userMagnetService.safeStorage.getItem(`magneto_fridge_${uid}`)
      let list: FridgeMagnetItem[]
      if (raw === null) {
        list = DEFAULT_FEATURED_MAGNETS
        setUserMagnets(list)
        await userMagnetService.saveUserFridgeMagnets(uid, list, 'MyFridgePage')
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
      if (detail?.source === 'MyFridgePage') return

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

  // Populate destinationOverrides whenever userMagnets update
  useEffect(() => {
    const overrides: Record<string, { totalSavedMinor: number }> = {}
    userMagnets.forEach((m) => {
      if (m.total_saved_minor !== undefined) {
        overrides[m.destination_slug.toLowerCase()] = {
          totalSavedMinor: m.total_saved_minor,
        }
      }
    })
    setDestinationOverrides((prev) => ({ ...overrides, ...prev }))
  }, [userMagnets])

  // Current Destination Details
  const currentDetail = useMemo(() => {
    const key = Object.keys(FEATURED_DETAILS).find((k) => areSlugsEquivalent(k, selectedSlug))
    const base = key ? FEATURED_DETAILS[key] : null
    const matchedMagnet = userMagnets.find((m) => areSlugsEquivalent(m.destination_slug, selectedSlug))

    const totalSavedMinor =
      destinationOverrides[selectedSlug]?.totalSavedMinor ??
      matchedMagnet?.total_saved_minor ??
      base?.totalSavedMinor ??
      8000000

    const targetBudgetMinor =
      matchedMagnet?.target_budget_minor ??
      base?.targetBudgetMinor ??
      15000000

    if (base) {
      return {
        ...base,
        totalSavedMinor,
        targetBudgetMinor,
      }
    }

    return {
      id: selectedSlug,
      name: matchedMagnet?.destination_name || 'Travel Destination',
      country: matchedMagnet?.country_name || 'World',
      description: 'Turn your travel dreams into destinations with your personalized collectible souvenir fridge.',
      bannerUrl: matchedMagnet?.asset_url || 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
      targetBudgetMinor,
      totalSavedMinor,
      targetDate: '2026-12-31',
      breakdown: {
        flights: Math.round((targetBudgetMinor / 100) * 0.35),
        stay: Math.round((targetBudgetMinor / 100) * 0.35),
        food: Math.round((targetBudgetMinor / 100) * 0.15),
        transport: Math.round((targetBudgetMinor / 100) * 0.08),
        activities: Math.round((targetBudgetMinor / 100) * 0.05),
        other: Math.round((targetBudgetMinor / 100) * 0.02),
      },
    }
  }, [selectedSlug, destinationOverrides, userMagnets])

  // Listen for budget updates
  const [budgetVersion, setBudgetVersion] = useState(0)
  useEffect(() => {
    const handleBudgetUpdate = () => {
      setBudgetVersion((v) => v + 1)
    }
    window.addEventListener('magneto_sync', handleBudgetUpdate)
    window.addEventListener('storage', handleBudgetUpdate)
    return () => {
      window.removeEventListener('magneto_sync', handleBudgetUpdate)
      window.removeEventListener('storage', handleBudgetUpdate)
    }
  }, [])

  const currentBudgetItems = useMemo(() => {
    return budgetService.getBudgetItems(selectedSlug, currentDetail.targetBudgetMinor)
  }, [selectedSlug, currentDetail.targetBudgetMinor, budgetVersion])

  const customTotalInr = useMemo(() => {
    return budgetService.calculateTotalCost(currentBudgetItems)
  }, [currentBudgetItems])

  // Math for savings
  const targetBudget = customTotalInr > 0 ? customTotalInr : currentDetail.targetBudgetMinor / 100
  const savedAmount = currentDetail.totalSavedMinor / 100
  const remainingAmount = Math.max(0, targetBudget - savedAmount)
  const progressPercent = Math.min(100, Math.round((savedAmount / targetBudget) * 100))

  // Days remaining calculation
  const targetDateObj = new Date(currentDetail.targetDate)
  const now = new Date()
  const diffTime = targetDateObj.getTime() - now.getTime()
  const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

  // Formula: Math.ceil((Total Budget - Amount Saved) / Remaining Days)
  const dailyTarget = remainingAmount > 0 ? Math.ceil(remainingAmount / daysRemaining) : 0


  // Handle savings top-up from modal
  const handleSaveMoneySuccess = async (depositMinor: number) => {
    const uid = user?.id || 'guest'
    const result = await userMagnetService.recordMagnetDeposit(
      uid,
      selectedSlug,
      depositMinor,
      {
        targetBudgetMinor: currentDetail.targetBudgetMinor,
        source: 'MyFridgePage',
      }
    )

    setDestinationOverrides((prev) => ({
      ...prev,
      [selectedSlug]: { totalSavedMinor: result.newTotalSavedMinor },
    }))

    const refreshedMagnets = userMagnetService.getUserFridgeMagnetsSync(uid)
    setUserMagnets(refreshedMagnets)
    const refreshedPlacements = fridgeService.getFridgePlacements(uid, activeModel.id, refreshedMagnets)
    setPlacements(refreshedPlacements)
  }

  // When a magnet on the fridge is clicked, select it in the inspector
  const handleSelectPlacement = (placementId: string | null) => {
    setSelectedPlacementId(placementId)
    if (!placementId) return

    const matchedPlacement = placements.find((p) => p.id === placementId)
    if (matchedPlacement) {
      const slug = matchedPlacement.magnetSlug.toLowerCase()
      setSelectedSlug(slug)
    }
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto flex flex-col lg:flex-row items-start justify-center gap-6 lg:gap-8 animate-in fade-in duration-200">
      
      {/* 
        ========================================================================
        1. DEDICATED REFRIGERATOR VIEWING AREA (LEFT: ~58-62% WIDTH)
        - Fixed-height viewing area fitting within the browser viewport (calc(100dvh - 100px))
        - Uses 58-62% of available screen width, leaving remaining space for right card
        - Subtle, clean background stage complementing existing design
        - Centred horizontally and vertically relative to this viewing area
        - OVERFLOW-VISIBLE so swinging doors and zoom magnification extend freely
          beyond viewing boundaries with ZERO clipping!
        ========================================================================
      */}
      <div className="w-full lg:w-[58%] xl:w-[62%] h-[500px] sm:h-[560px] lg:h-[calc(100dvh-100px)] lg:min-h-[540px] lg:max-h-[880px] lg:sticky lg:top-[76px] relative flex items-center justify-center overflow-visible select-none flex-shrink-0">
        
        {/* Subtle, clean gallery viewing stage background */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-slate-50/80 via-white/50 to-slate-50/80 border border-slate-200/70 shadow-xs pointer-events-none" />

        {/* Refrigerator 3D Workspace: Centred vertically and horizontally inside the dedicated viewing area */}
        <div className="relative z-10 w-full h-full flex items-center justify-center overflow-visible p-2 sm:p-4">
          <FridgeWorkspace
            userId={user?.id || 'guest'}
            currentModel={activeModel}
            magnets={userMagnets}
            placements={placements}
            selectedPlacementId={selectedPlacementId}
            onSelectPlacementId={handleSelectPlacement}
            onPlacementsChange={setPlacements}
            showControls={false}
            readOnly={true}
          />
        </div>
      </div>

      {/* 
        ========================================================================
        2. RIGHT COLUMN (~38-42% WIDTH):
        Trip & Destination Inspector Panel Matching reference design
        Scrollable independently on desktop if content exceeds viewport height.
        ========================================================================
      */}
      <div className="w-full lg:w-[42%] xl:w-[38%] max-w-lg mx-auto lg:max-w-none lg:mx-0 bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-200/90 flex flex-col gap-3.5 flex-shrink-0 lg:max-h-[calc(100dvh-100px)] lg:overflow-y-auto custom-scrollbar relative z-20">
        
        {/* Destination Hero Banner */}
        <div className="relative w-full h-36 sm:h-40 rounded-2xl overflow-hidden shadow-md group">
          <img
            src={currentDetail.bannerUrl}
            alt={currentDetail.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

          {/* Top Right Heart Favorite Button */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
            title="Favorite Destination"
          >
            <Heart
              className={`w-4 h-4 ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
              }`}
            />
          </button>
        </div>

        {/* Destination Name & Description */}
        <div>
          <h2 className="font-heading font-black text-xl text-slate-900 leading-tight">
            {currentDetail.name}
          </h2>
          <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5">
            {currentDetail.description}
          </p>
        </div>

        {/* Progress Bar & Amounts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-heading font-black">
            <span className="text-slate-900">
              ₹ {savedAmount.toLocaleString('en-IN')} of ₹ {targetBudget.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/60">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Two Highlight Cards: Save Today & Days Left */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Card 1: Save Today with 1-Click Button */}
          <div className="p-3.5 bg-rose-50/50 rounded-2xl border border-rose-200/70 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Save Today
                </span>
                <span className="font-heading font-black text-lg text-slate-900 leading-tight">
                  ₹ {dailyTarget.toLocaleString('en-IN')}
                </span>
                <span className="block text-[9px] text-slate-500 mt-0.5">
                  to stay on track
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>

            <button
              onClick={() => setIsSaveModalOpen(true)}
              className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Money</span>
            </button>
          </div>

          {/* Card 2: Days Left Countdown */}
          <div className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-200/70 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Target Date
                </span>
                <span className="font-heading font-black text-lg text-slate-900 leading-tight">
                  {daysRemaining}
                </span>
                <span className="block text-[9px] text-slate-500 mt-0.5">
                  Days Left
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-purple-200/60 text-[10px] font-semibold text-purple-900">
              Target: {targetDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

        </div>

        {/* Travel Progress Summary */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <h4 className="font-heading font-bold text-xs text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Travel Progress Summary</span>
          </h4>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block font-heading font-black text-slate-900 text-base leading-tight">
                  {userMagnets.length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate block">
                  Magnets Collected
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block font-heading font-black text-slate-900 text-base leading-tight">
                  {userMagnets.filter((m) => m.unlock_state === 'ready_to_go').length}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate block">
                  Trips Ready to Go
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button to Open Trip Planner */}
        <Link
          to="/plan-trip"
          className="mt-1 w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Open Trip Planner</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-slate-300" />
        </Link>

      </div>

      {/* Save Money / Deposit Modal */}
      <SaveMoneyModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        destinationName={currentDetail.name}
        totalBudgetMinor={currentDetail.targetBudgetMinor}
        totalSavedMinor={currentDetail.totalSavedMinor}
        daysRemaining={daysRemaining}
        onSaveAmount={handleSaveMoneySuccess}
      />

    </div>
  )
}
