import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fridgeService, areSlugsEquivalent } from '../services/fridgeService'
import { userMagnetService, type FridgeMagnetItem, DEFAULT_FEATURED_MAGNETS } from '../services/userMagnetService'
import type { FridgeModel, MagnetPlacement } from '../types/fridge'
import { FridgeWorkspace } from '../components/fridge/FridgeWorkspace'
import { SaveMoneyModal } from '../components/trips/SaveMoneyModal'
import {
  Heart,
  PiggyBank,
  Calendar,
  CheckCircle2,
  Check,
  Plane,
  Building2,
  Utensils,
  Car,
  Star,
  FileText,
  SlidersHorizontal,
  Plus,
  Sparkles,
} from 'lucide-react'

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

const DEFAULT_CHECKLIST = [
  { id: 'visa', text: 'Apply for visa', completed: false },
  { id: 'flights', text: 'Book flights', completed: false },
  { id: 'stay', text: 'Book accommodation', completed: false },
  { id: 'itinerary', text: 'Plan day-wise itinerary', completed: false },
  { id: 'insurance', text: 'Check travel insurance', completed: false },
  { id: 'documents', text: 'Prepare travel documents', completed: false },
]

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

  // Travel Checklist per destination
  const [checklists, setChecklists] = useState<
    Record<string, typeof DEFAULT_CHECKLIST>
  >(() => {
    try {
      const raw = localStorage.getItem('magneto_checklists')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  // Active Fridge Model
  const [activeModel, setActiveModel] = useState<FridgeModel>(() => {
    const id = fridgeService.getActiveFridgeId(user?.id || 'guest')
    return fridgeService.getFridgeModelById(id, user?.id)
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
      const activeId = fridgeService.getActiveFridgeId(uid)
      setActiveModel(fridgeService.getFridgeModelById(activeId, user?.id))
      const loadedPlacements = fridgeService.getFridgePlacements(uid, activeId, list)
      setPlacements(loadedPlacements)
    }
    load()

    const handleSync = (e: Event) => {
      const detail = (e as CustomEvent)?.detail
      if (detail?.source === 'MyFridgePage') return

      const activeId = fridgeService.getActiveFridgeId(uid)
      setActiveModel(fridgeService.getFridgeModelById(activeId, user?.id))
      const syncMagnets = userMagnetService.getUserFridgeMagnetsSync(uid)
      setUserMagnets(syncMagnets)
      const syncPlacements = fridgeService.getFridgePlacements(uid, activeId, syncMagnets)
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

  // Math for savings
  const targetBudget = currentDetail.targetBudgetMinor / 100
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

  // Checklist for current destination
  const currentChecklist = useMemo(() => {
    return checklists[selectedSlug] || DEFAULT_CHECKLIST
  }, [checklists, selectedSlug])

  const completedChecklistCount = currentChecklist.filter((c) => c.completed).length

  const handleToggleChecklist = (id: string) => {
    const updated = currentChecklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    )
    const next = { ...checklists, [selectedSlug]: updated }
    setChecklists(next)
    try {
      localStorage.setItem('magneto_checklists', JSON.stringify(next))
    } catch {
      // Ignore
    }
  }

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
    <div className="w-full max-w-[1720px] mx-auto flex flex-col xl:flex-row items-center xl:items-start justify-center gap-6 lg:gap-8 pb-2 sm:pb-4 animate-in fade-in duration-200 min-h-[calc(100vh-140px)]">
      
      {/* 
        LEFT HERO REFRIGERATOR STAGE (THE WHITE SPACE):
        Occupies all the available white space to the left of the destination card.
        The Refrigerator is centered in the exact middle of this white space
        so that [Left Margin to Fridge] == [Fridge to Trip Card].
      */}
      <div className="flex-1 w-full min-w-0 flex items-center justify-center relative min-h-0 sm:min-h-[580px] pt-6 sm:pt-8 pb-2 overflow-visible bg-transparent">
        {/* Center: The Photorealistic Refrigerator */}
        <div className="relative z-10 w-full flex flex-col items-center overflow-visible">
          <FridgeWorkspace
            userId={user?.id || 'guest'}
            currentModel={activeModel}
            magnets={userMagnets}
            placements={placements}
            selectedPlacementId={selectedPlacementId}
            onSelectPlacementId={handleSelectPlacement}
            onChangeFridgeModel={setActiveModel}
            onPlacementsChange={setPlacements}
            showControls={false}
            readOnly={true}
          />
        </div>
      </div>

      {/* 
        RIGHT COLUMN:
        Trip & Destination Inspector Panel Matching media_1791901625472_ea35fd75.jpg
      */}
      <div className="w-full xl:w-[380px] 2xl:w-[400px] bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-slate-200/90 flex flex-col gap-3.5 flex-shrink-0">
        
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

        {/* Itemized Trip Breakdown (Estimated) */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-xs text-slate-800">
              Trip Breakdown (Estimated)
            </h4>
            <Link
              to="/plan-trip"
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
            >
              Edit in Planner →
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Plane className="w-3.5 h-3.5 text-blue-600" />
                <span>Flights</span>
              </span>
              <span className="font-medium">₹ {currentDetail.breakdown.flights.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Stay (7 nights)</span>
              </span>
              <span className="font-medium">₹ {currentDetail.breakdown.stay.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Utensils className="w-3.5 h-3.5 text-amber-600" />
                <span>Food & Drinks</span>
              </span>
              <span className="font-medium">₹ {currentDetail.breakdown.food.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-emerald-600" />
                <span>Local Transport</span>
              </span>
              <span className="font-medium">₹ {currentDetail.breakdown.transport.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-yellow-500" />
                <span>Activities & Tours</span>
              </span>
              <span className="font-medium">₹ {currentDetail.breakdown.activities.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>Other (Visa, Insurance etc.)</span>
              </span>
              <span className="font-medium">₹ {currentDetail.breakdown.other.toLocaleString('en-IN')}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-heading font-black text-slate-900 text-sm">
              <span>Total Estimated</span>
              <span>₹ {targetBudget.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Travel Checklist (Interactive) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <h4 className="font-heading font-bold text-xs text-slate-800">
              Travel Checklist
            </h4>
            <span className="text-[11px] font-bold text-slate-500">
              {completedChecklistCount}/{currentChecklist.length}
            </span>
          </div>

          <div className="space-y-1.5">
            {currentChecklist.map((item) => (
              <label
                key={item.id}
                onClick={() => handleToggleChecklist(item.id)}
                className={`flex items-center gap-2.5 p-2 rounded-xl text-xs cursor-pointer select-none transition-colors ${
                  item.completed
                    ? 'bg-emerald-50/80 text-emerald-900 line-through'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${
                    item.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="font-medium text-[11px]">{item.text}</span>
              </label>
            ))}
          </div>
        </div>

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
