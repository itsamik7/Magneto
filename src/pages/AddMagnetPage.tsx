import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { destinationService } from '../services/destinationService'
import { userMagnetService } from '../services/userMagnetService'
import type {
  DestinationWithMagnet,
  Continent,
  DestinationCategory,
} from '../types/destination'
import { MagnetGraphic } from '../components/fridge/MagnetGraphic'
import { MagnetPreviewModal } from '../components/magnets/MagnetPreviewModal'
import {
  Search,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Filter,
  Globe2,
  Compass,
  Plus,
  Eye,
  Check,
} from 'lucide-react'

const CONTINENTS: Continent[] = ['All', 'Asia', 'Europe', 'Americas', 'Africa', 'Oceania']

const CATEGORIES: DestinationCategory[] = [
  'All',
  'City',
  'Historical Site',
  'Cultural Heritage',
  'Natural Wonder',
  'Beach',
  'Mountain',
  'Island',
  'Adventure',
  'Wildlife',
]

export const AddMagnetPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [destinations, setDestinations] = useState<DestinationWithMagnet[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedContinent, setSelectedContinent] = useState<Continent>('All')
  const [selectedCategory, setSelectedCategory] = useState<DestinationCategory>('All')
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false)

  // Preview & Action states
  const [previewDestination, setPreviewDestination] = useState<DestinationWithMagnet | null>(null)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Load catalog
  const loadCatalog = async () => {
    setIsLoading(true)
    try {
      const data = await destinationService.getDestinations(
        {
          search: searchQuery,
          continent: selectedContinent,
          category: selectedCategory,
          featuredOnly: onlyFeatured,
        },
        user?.id
      )
      setDestinations(data)
    } catch (err) {
      console.error('Failed to load destinations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCatalog()
  }, [user?.id, selectedContinent, selectedCategory, onlyFeatured])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCatalog()
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle Add Magnet
  const handleAddMagnet = async (
    destination: DestinationWithMagnet,
    tripConfig?: {
      createTrip: boolean
      targetBudgetMinor: number
      startDate?: string
      endDate?: string
    }
  ) => {
    if (!user) {
      navigate('/login')
      return
    }

    setIsAdding(true)
    try {
      const res = await userMagnetService.addMagnetToFridge(user.id, destination, tripConfig)

      if (res.success) {
        setSuccessToast(res.message)
        setTimeout(() => setSuccessToast(null), 3500)

        // Mark destination as collected locally
        setDestinations((prev) =>
          prev.map((d) => (d.slug === destination.slug ? { ...d, is_collected: true } : d))
        )

        if (previewDestination?.slug === destination.slug) {
          setPreviewDestination({ ...previewDestination, is_collected: true })
        }
      } else {
        alert(res.message)
      }
    } catch (err) {
      console.error('Error adding magnet:', err)
      alert('Could not add magnet right now.')
    } finally {
      setIsAdding(false)
    }
  }

  // Count collected
  const collectedCount = useMemo(() => {
    return destinations.filter((d) => d.is_collected).length
  }, [destinations])

  // Top Featured destinations list
  const featuredDestinations = useMemo(() => {
    return destinations.filter((d) => d.is_featured).slice(0, 8)
  }, [destinations])

  return (
    <div className="space-y-8 pb-20">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-heading font-bold text-xs sm:text-sm">{successToast}</span>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#059669] mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Travel Fridge</span>
          </button>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#243447] tracking-tight flex items-center gap-2">
            <span>Souvenir Magnet Catalog</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#059669] border border-emerald-300 font-bold">
              100 Destinations
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
            Browse physical-looking travel souvenirs, explore landmark silhouettes, and pin your favorites to your fridge.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
            <span className="text-[#059669] font-black">{collectedCount}</span> collected
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#243447] hover:bg-slate-800 text-white font-heading font-bold text-xs rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <span>View My Fridge</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by destination, country, landmark (e.g. Taj Mahal, Eiffel, Bali, Colosseum, Fuji, Alps)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Continents Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 flex-shrink-0">
            <Globe2 className="w-3.5 h-3.5" />
            Region:
          </span>
          {CONTINENTS.map((cont) => (
            <button
              key={cont}
              onClick={() => setSelectedContinent(cont)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedContinent === cont
                  ? 'bg-[#243447] text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cont}
            </button>
          ))}
        </div>

        {/* Categories Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Type:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={() => setOnlyFeatured(!onlyFeatured)}
            className={`ml-auto px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
              onlyFeatured
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Featured Only</span>
          </button>
        </div>
      </div>

      {/* Featured Highlights Shelf (when viewing all without search) */}
      {!searchQuery && selectedContinent === 'All' && selectedCategory === 'All' && !onlyFeatured && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-black text-sm uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Iconic Collector Highlights</span>
            </h3>
            <span className="text-xs text-slate-500">World-famous collector staples</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
            {featuredDestinations.slice(0, 4).map((dest) => (
              <div
                key={dest.slug}
                onClick={() => setPreviewDestination(dest)}
                className="cursor-pointer group relative rounded-2xl bg-white border border-slate-200 p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
              >
                <div className="h-28 flex items-center justify-center my-1 group-hover:scale-105 transition-transform">
                  <MagnetGraphic
                    magnetKey={dest.slug}
                    assetUrl={dest.asset_url}
                    destinationName={dest.name}
                    size="sm"
                    isInteractive={false}
                  />
                </div>
                <div className="mt-2 w-full">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {dest.country_name}
                  </span>
                  <h4 className="font-heading font-black text-xs text-slate-800 truncate">
                    {dest.name}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Destination Magnet Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800 font-bold">{destinations.length}</strong> destinations
          </span>
          {collectedCount > 0 && (
            <span>
              <strong className="text-[#059669] font-bold">{collectedCount}</strong> added to fridge
            </span>
          )}
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-white border border-slate-200 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="w-full h-32 bg-slate-100 rounded-xl" />
                <div className="space-y-2 mt-3">
                  <div className="w-1/2 h-3 bg-slate-100 rounded" />
                  <div className="w-3/4 h-4 bg-slate-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && destinations.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-base text-slate-800">
              No matching destinations found
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn&apos;t find any destinations matching &quot;{searchQuery}&quot;. Try adjusting your search or clearing filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedContinent('All')
                setSelectedCategory('All')
                setOnlyFeatured(false)
              }}
              className="px-4 py-2 bg-[#243447] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-slate-800"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Destination Cards Grid */}
        {!isLoading && destinations.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {destinations.map((dest, idx) => {
              const floatVariant = ((idx % 3) + 1) as 1 | 2 | 3
              return (
                <div
                  key={dest.slug}
                  className="group relative rounded-2xl bg-white border border-slate-200 p-3.5 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 hover:border-emerald-300"
                >
                  {/* Top Badge: Country Flag & Type */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-2">
                    <span className="flex items-center gap-1 font-bold text-slate-700">
                      <span>{dest.flag_emoji || '✈️'}</span>
                      <span className="truncate max-w-[85px]">{dest.country_name}</span>
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-mono">
                      {dest.magnet_shape}
                    </span>
                  </div>

                  {/* Magnet Artwork Center Stage */}
                  <div
                    onClick={() => setPreviewDestination(dest)}
                    className="cursor-pointer py-2 flex items-center justify-center min-h-[140px] group-hover:scale-105 transition-transform"
                    title={`Click to preview ${dest.name}`}
                  >
                    <MagnetGraphic
                      magnetKey={dest.slug}
                      assetUrl={dest.asset_url}
                      destinationName={dest.name}
                      size="sm"
                      isInteractive={false}
                      floatVariant={floatVariant}
                    />
                  </div>

                  {/* Bottom Destination Details & Quick Action */}
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-2">
                    <div>
                      <h3
                        onClick={() => setPreviewDestination(dest)}
                        className="cursor-pointer font-heading font-black text-xs text-slate-800 truncate hover:text-[#059669] transition-colors"
                        title={dest.name}
                      >
                        {dest.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate">
                        {dest.landmark_names?.[0] || dest.destination_type}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {dest.is_collected ? (
                        <div className="w-full py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold text-center flex items-center justify-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          <span>On Fridge</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddMagnet(dest)}
                          disabled={isAdding}
                          className="w-full py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] active:scale-95 text-white text-[11px] font-heading font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add</span>
                        </button>
                      )}

                      <button
                        onClick={() => setPreviewDestination(dest)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Magnet Details"
                        aria-label={`View ${dest.name} details`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Magnet Preview Modal */}
      <MagnetPreviewModal
        destination={previewDestination}
        isOpen={!!previewDestination}
        onClose={() => setPreviewDestination(null)}
        onAddMagnet={handleAddMagnet}
        isAdding={isAdding}
        isCollected={!!previewDestination?.is_collected}
      />
    </div>
  )
}
