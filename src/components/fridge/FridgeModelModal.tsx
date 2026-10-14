import React, { useState, useMemo } from 'react'
import type { FridgeModel, FridgeStyle, FridgeCountryCategory } from '../../types/fridge'
import { fridgeService } from '../../services/fridgeService'
import {
  X,
  Search,
  Check,
  Upload,
  Camera,
  Sparkles,
  SlidersHorizontal,
  Info,
} from 'lucide-react'

interface FridgeModelModalProps {
  isOpen: boolean
  onClose: () => void
  currentModelId: string
  userId?: string
  onSelectModel: (model: FridgeModel) => void
}

const STYLES: { label: string; value: FridgeStyle | 'All' }[] = [
  { label: 'All Styles', value: 'All' },
  { label: 'Double Door', value: 'Double-door' },
  { label: 'Top Freezer', value: 'Top-freezer' },
  { label: 'Bottom Freezer', value: 'Bottom-freezer' },
  { label: 'Side-by-Side', value: 'Side-by-side' },
  { label: 'French Door', value: 'French-door' },
  { label: 'Multi-Door', value: 'Multi-door' },
  { label: 'Single Door', value: 'Single-door' },
  { label: 'Retro Style', value: 'Retro-style' },
  { label: 'Compact / Mini', value: 'Compact' },
]

export const FridgeModelModal: React.FC<FridgeModelModalProps> = ({
  isOpen,
  onClose,
  currentModelId,
  userId,
  onSelectModel,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'upload'>('catalog')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState<FridgeCountryCategory>('All')
  const [selectedStyle, setSelectedStyle] = useState<FridgeStyle | 'All'>('All')
  const [previewModelId, setPreviewModelId] = useState<string>(currentModelId)

  // Custom upload state
  const [customName, setCustomName] = useState('')
  const [customBrand, setCustomBrand] = useState('My Brand')
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null)
  const [customAspectRatio, setCustomAspectRatio] = useState<number>(0.58)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Load models
  const allModels = useMemo(() => {
    return fridgeService.getFridgeModels(userId)
  }, [userId, activeTab])

  // Filtered models
  const filteredModels = useMemo(() => {
    return allModels.filter((model) => {
      // Category filter
      if (selectedCountry === 'Indian' && model.countryCategory !== 'Indian') return false
      if (selectedCountry === 'International' && model.countryCategory !== 'International') return false

      // Style filter
      if (selectedStyle !== 'All' && model.style !== selectedStyle) return false

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesName = model.name.toLowerCase().includes(query)
        const matchesBrand = model.brand.toLowerCase().includes(query)
        const matchesFinish = model.finish.toLowerCase().includes(query)
        if (!matchesName && !matchesBrand && !matchesFinish) return false
      }

      return true
    })
  }, [allModels, selectedCountry, selectedStyle, searchQuery])

  const previewModel = useMemo(() => {
    return (
      allModels.find((m) => m.id === previewModelId) ||
      allModels.find((m) => m.id === currentModelId) ||
      allModels[0]
    )
  }, [allModels, previewModelId, currentModelId])

  if (!isOpen) return null

  // Handle custom image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setUploadError('Please choose a valid PNG or JPEG image.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size exceeds 10MB limit. Please choose a smaller photo.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setCustomImagePreview(dataUrl)

      // Compute aspect ratio from natural image dimensions
      const img = new Image()
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          const ratio = Number((img.naturalWidth / img.naturalHeight).toFixed(2))
          setCustomAspectRatio(ratio)
        }
      }
      img.src = dataUrl

      if (!customName) {
        setCustomName(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
    reader.onerror = () => {
      setUploadError('Failed to read image file.')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveCustomFridge = () => {
    if (!customImagePreview) {
      setUploadError('Please select or drag a fridge photo first.')
      return
    }

    const id = `custom-${Date.now()}`
    const newFridge: FridgeModel = {
      id,
      name: customName.trim() || 'My Custom Refrigerator',
      brand: customBrand.trim() || 'Custom',
      style: 'Double-door',
      finish: 'Personal Refrigerator Photo',
      colorHex: '#334155',
      countryCategory: 'Indian',
      imageUrl: customImagePreview,
      aspectRatio: customAspectRatio,
      magneticRegion: {
        top: 0.06,
        left: 0.06,
        width: 0.88,
        height: 0.88,
      },
      description: 'Custom photo of your real refrigerator.',
      features: ['Personal Photo', 'Custom Magnetic Region'],
      isCustom: true,
    }

    if (userId) {
      fridgeService.saveCustomFridge(userId, newFridge)
    }

    onSelectModel(newFridge)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-white border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-50 text-[#059669]">
                <SlidersHorizontal className="w-5 h-5" />
              </span>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#243447]">
                Choose Your Refrigerator
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select a realistic appliance model from Indian & International brands, or upload your own.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50/80 border-b border-[#E8E5DF] text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-1.5 font-heading font-bold rounded-xl transition-all ${
                activeTab === 'catalog'
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Fridge Catalog ({allModels.length} Models)
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 font-heading font-bold rounded-xl transition-all ${
                activeTab === 'upload'
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Use My Own Fridge (Photo Upload)</span>
            </button>
          </div>

          {activeTab === 'catalog' && (
            <div className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1">
              {(['All', 'Indian', 'International'] as FridgeCountryCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCountry(cat)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    selectedCountry === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat === 'All' ? 'All Brands' : `${cat} Brands`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        {activeTab === 'catalog' ? (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {/* Search & Style Filter Bar */}
            <div className="p-4 space-y-3 bg-white border-b border-[#E8E5DF]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by brand (LG, Samsung, Whirlpool, Bosch, Sub-Zero, Godrej, Haier) or model..."
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Style Pills Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                {STYLES.map((st) => (
                  <button
                    key={st.value}
                    onClick={() => setSelectedStyle(st.value)}
                    className={`px-3 py-1 rounded-xl font-medium whitespace-nowrap transition-colors ${
                      selectedStyle === st.value
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Models Grid (Full Width) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {filteredModels.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-500">
                  <p className="font-heading font-bold text-sm text-slate-700">No refrigerator models matched your search</p>
                  <p className="text-xs mt-1">Try clearing filters or search terms.</p>
                </div>
              ) : (
                filteredModels.map((model) => {
                  const isCurrent = model.id === currentModelId
                  const isSelected = model.id === previewModel.id

                  return (
                    <div
                      key={model.id}
                      onClick={() => setPreviewModelId(model.id)}
                      className={`group relative p-3.5 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50/60 border-emerald-500 shadow-md ring-2 ring-emerald-500/80'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Top Brand & Style Header */}
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="font-heading font-bold text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {model.brand}
                        </span>
                        <span className="text-[10px] font-medium text-slate-500 truncate">
                          {model.style}
                        </span>
                      </div>

                      {/* Centered Appliance Thumbnail */}
                      <div className="h-40 w-full flex items-center justify-center p-2 my-1 bg-gradient-to-b from-slate-100/40 to-slate-200/30 rounded-xl overflow-hidden">
                        <img
                          src={model.imageUrl}
                          alt={model.name}
                          className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Model Name & Finish */}
                      <div className="mt-2">
                        <h4 className="font-heading font-bold text-xs text-slate-900 line-clamp-1">
                          {model.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          {model.finish}
                        </p>
                      </div>

                      {/* Selected / Current Badge */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        {isCurrent ? (
                          <span className="text-emerald-700 font-bold flex items-center gap-1 text-[10px]">
                            <Check className="w-3 h-3" /> Current
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">
                            {model.countryCategory}
                          </span>
                        )}

                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 group-hover:border-slate-400'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Bottom Action / Confirmation Bar */}
            <div className="p-4 bg-white border-t border-[#E8E5DF] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center p-1 border border-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src={previewModel.imageUrl}
                    alt={previewModel.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span>{previewModel.brand} {previewModel.name}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {previewModel.style}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {previewModel.finish} • Aspect ratio {previewModel.aspectRatio}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onSelectModel(previewModel)
                    onClose()
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm My Fridge</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* "Use My Own Fridge" Upload Tab */
          <div className="flex-1 p-6 md:p-8 overflow-y-auto max-w-2xl mx-auto w-full space-y-6">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-[#059669] flex items-center justify-center mb-2">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-black text-xl text-slate-900">
                Upload Your Own Refrigerator
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Snap a straight, front-facing photo of your real kitchen fridge and turn it into your virtual travel canvas.
              </p>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {uploadError}
              </div>
            )}

            {/* Dropzone / File Picker */}
            <div className="relative border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-6 text-center bg-white transition-colors cursor-pointer group">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />

              {customImagePreview ? (
                <div className="space-y-3">
                  <div className="h-56 max-w-xs mx-auto rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center p-2 shadow-sm border border-slate-200">
                    <img
                      src={customImagePreview}
                      alt="Custom Refrigerator Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-emerald-700 font-bold">
                    Click or drag another image to replace
                  </p>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-heading font-bold text-sm text-slate-800">
                      Click to browse or drop fridge photo here
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Supports JPG, PNG, WebP up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Fridge Name & Brand */}
            {customImagePreview && (
              <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fridge Name / Nickname
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. My Kitchen Fridge"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Brand (Optional)
                    </label>
                    <input
                      type="text"
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="e.g. Samsung / LG / Godrej"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                  <span>
                    Your uploaded fridge image is preserved locally. Magnets will be placed freely across the front door area.
                  </span>
                </div>

                <button
                  onClick={handleSaveCustomFridge}
                  className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-white font-heading font-black text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-[1.01]"
                >
                  Save & Apply My Fridge
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
