import React, { useState, useEffect } from 'react'
import type {
  AdvertisingPlan,
  AdvertisingSlot,
  AdvertisingCreative,
  AdvertisingCampaign,
  MerchantSubscription,
} from '../../types/advertising'
import {
  createCampaign,
  addCreativeAsset,
  getAdvertisingSlots,
  checkSlotAvailability,
} from '../../services/advertisingService'
import { MerchantLivePreview } from './MerchantLivePreview'
import {
  X,
  Check,
  Sparkles,
  UploadCloud,
  Eye,
  ExternalLink,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

interface CampaignCreationModalProps {
  merchantId: string
  plans: AdvertisingPlan[]
  subscriptions: MerchantSubscription[]
  creatives: AdvertisingCreative[]
  isOpen: boolean
  onClose: () => void
  onSuccess: (campaign: AdvertisingCampaign) => void
  onOpenCheckout: (plan: AdvertisingPlan) => void
  initialPlanId?: string
}

export const CampaignCreationModal: React.FC<CampaignCreationModalProps> = ({
  merchantId,
  plans,
  subscriptions,
  creatives,
  isOpen,
  onClose,
  onSuccess,
  onOpenCheckout,
  initialPlanId,
}) => {
  // Step 1: Plan & Slot Selection, Step 2: Creative & Campaign Details, Step 3: Fridge Preview & Confirmation
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Magnet Plans (filter to fridge_magnet)
  const magnetPlans = plans.filter((p) => p.placementId === 'fridge_magnet' && p.isActive)
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialPlanId || magnetPlans[0]?.id || ''
  )

  // Available Fridge Door Slots
  const [slots, setSlots] = useState<AdvertisingSlot[]>([])
  const [selectedSlotId, setSelectedSlotId] = useState<string>('slot_magnet_door_top_right')
  const [slotConflictWarning, setSlotConflictWarning] = useState<string | null>(null)

  // Creative & Brand Fields
  const [campaignName, setCampaignName] = useState<string>('')
  const [brandName, setBrandName] = useState<string>('')
  const [productName, setProductName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [destinationUrl, setDestinationUrl] = useState<string>('https://')
  const [ctaText, setCtaText] = useState<string>('Shop Now')
  const [creativeUrl, setCreativeUrl] = useState<string>(
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80'
  )
  const [selectedCreativeId, setSelectedCreativeId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Load Magnet Slots
  useEffect(() => {
    let active = true
    getAdvertisingSlots('fridge_magnet').then((loadedSlots) => {
      if (active && loadedSlots.length > 0) {
        setSlots(loadedSlots)
        if (!selectedSlotId) {
          setSelectedSlotId(loadedSlots[0].id)
        }
      }
    })
    return () => {
      active = false
    }
  }, [selectedSlotId])

  // Update selected plan if initialPlanId is passed
  useEffect(() => {
    if (initialPlanId) {
      setSelectedPlanId(initialPlanId)
    }
  }, [initialPlanId])

  const selectedPlan = magnetPlans.find((p) => p.id === selectedPlanId) || magnetPlans[0]
  const selectedSlot = slots.find((s) => s.id === selectedSlotId) || slots[0]

  // Check active subscription for magnet placement
  const activeSubscription = subscriptions.find(
    (s) =>
      s.status === 'active' &&
      (s.planId === selectedPlanId || s.plan?.placementId === 'fridge_magnet')
  )

  // Compute End Date from Plan Duration
  const calculateEndDate = (start: string, duration: number) => {
    const d = new Date(start)
    d.setDate(d.getDate() + (duration || 30))
    return d.toISOString().split('T')[0]
  }

  const computedEndDate = calculateEndDate(startDate, selectedPlan?.durationDays || 30)

  // Check Slot Availability whenever slot or dates change
  useEffect(() => {
    if (!selectedSlotId || !startDate || !computedEndDate) return
    let active = true

    checkSlotAvailability(selectedSlotId, startDate, computedEndDate).then((res) => {
      if (!active) return
      if (!res.isAvailable) {
        setSlotConflictWarning(res.reason || 'This slot is already reserved for overlapping dates.')
      } else {
        setSlotConflictWarning(null)
      }
    })

    return () => {
      active = false
    }
  }, [selectedSlotId, startDate, computedEndDate])

  if (!isOpen) return null

  // Quick Artwork Upload Simulator / Local Asset Select
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (PNG, JPEG, WebP).')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 10MB limit.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setCreativeUrl(objectUrl)

    try {
      const asset = await addCreativeAsset({
        merchantId,
        name: file.name,
        creativeType: 'image',
        placementCategory: 'fridge_magnet',
        fileUrl: objectUrl,
        fileSizeBytes: file.size,
        mimeType: file.type,
      })
      setSelectedCreativeId(asset.id)
      setErrorMsg(null)
    } catch {
      // Ignored
    }
  }

  const handleSelectExistingCreative = (c: AdvertisingCreative) => {
    setSelectedCreativeId(c.id)
    setCreativeUrl(c.fileUrl)
  }

  const handleNext = () => {
    setErrorMsg(null)

    if (currentStep === 1) {
      if (!selectedPlanId) {
        setErrorMsg('Please select a magnet advertising plan.')
        return
      }
      if (!selectedSlotId) {
        setErrorMsg('Please select a virtual fridge door slot.')
        return
      }
      if (slotConflictWarning) {
        setErrorMsg('Selected slot has a booking conflict. Please choose another door slot or date.')
        return
      }
      setCurrentStep(2)
      return
    }

    if (currentStep === 2) {
      if (!campaignName.trim()) {
        setErrorMsg('Please enter a campaign name.')
        return
      }
      if (!brandName.trim()) {
        setErrorMsg('Please enter your brand name.')
        return
      }
      if (!productName.trim()) {
        setErrorMsg('Please enter the product or offer name.')
        return
      }
      if (!creativeUrl.trim()) {
        setErrorMsg('Please provide magnet artwork or product image.')
        return
      }
      if (!destinationUrl.trim() || !destinationUrl.startsWith('http')) {
        setErrorMsg('Please enter a valid destination URL starting with https:// or http://')
        return
      }
      setCurrentStep(3)
      return
    }
  }

  const handleFinalSubmit = async () => {
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      // Create campaign
      const created = await createCampaign({
        merchantId,
        subscriptionId: activeSubscription?.id || null,
        placementId: 'fridge_magnet',
        slotId: selectedSlot?.id || null,
        name: campaignName.trim(),
        brandName: brandName.trim(),
        productName: productName.trim(),
        description: description.trim() || null,
        destinationUrl: destinationUrl.trim(),
        ctaText: ctaText.trim() || 'Shop Now',
        creativeId: selectedCreativeId || null,
        creativeUrl: creativeUrl.trim(),
        positionX: selectedSlot?.defaultPositionX ?? 72,
        positionY: selectedSlot?.defaultPositionY ?? 22,
        displayScale: selectedSlot?.defaultDisplayScale ?? 1.05,
        startDate,
        endDate: computedEndDate,
        isPaid: Boolean(activeSubscription),
        submitForApproval: true,
      })

      onSuccess(created)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit magnet campaign'
      setErrorMsg(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-300/30 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg leading-tight">
                Create Virtual Fridge Magnet Advertisement
              </h3>
              <p className="text-xs text-slate-300">
                Configure your sponsored travel magnet to display across consumer fridges
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-heading font-bold text-slate-600 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              1
            </span>
            <span className={currentStep === 1 ? 'text-blue-600 font-black' : ''}>
              Plan & Door Placement
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </span>
            <span className={currentStep === 2 ? 'text-blue-600 font-black' : ''}>
              Magnet Creative & Details
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </span>
            <span className={currentStep === 3 ? 'text-blue-600 font-black' : ''}>
              Fridge Preview & Submit
            </span>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* STEP 1: Plan & Placement */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-heading font-black text-slate-800 uppercase tracking-wider mb-2">
                  1. Select Magnet Advertising Plan
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {magnetPlans.map((plan) => {
                    const isSelected = plan.id === selectedPlanId
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-600">
                              {plan.durationDays} Days Duration
                            </span>
                            <h4 className="font-heading font-black text-sm text-slate-900 mt-0.5">
                              {plan.name}
                            </h4>
                          </div>
                          <span className="font-heading font-black text-base text-slate-900">
                            ₹{(plan.priceInrMinor / 100).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <ul className="mt-3 space-y-1 text-[11px] text-slate-600">
                          {plan.features.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>

                {/* Subscription status feedback */}
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  {activeSubscription ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>You have an active subscription covering this campaign!</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-slate-600 text-[11px]">
                        Need to purchase or renew a subscription plan?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedPlan) onOpenCheckout(selectedPlan)
                        }}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Subscribe & Pay (₹{((selectedPlan?.priceInrMinor ?? 299900) / 100).toLocaleString('en-IN')})
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Door Slot Selection */}
              <div>
                <label className="block text-xs font-heading font-black text-slate-800 uppercase tracking-wider mb-2">
                  2. Select Virtual Fridge Door Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {slots.map((slot) => {
                    const isSelected = slot.id === selectedSlotId
                    return (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              X: {slot.defaultPositionX}% • Y: {slot.defaultPositionY}%
                            </span>
                            {slot.isExclusive && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold">
                                Exclusive
                              </span>
                            )}
                          </div>
                          <h5 className="font-heading font-black text-xs text-slate-900 mt-1">
                            {slot.name}
                          </h5>
                          <p className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">
                            {slot.locationDescription}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {slotConflictWarning && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                    <span>{slotConflictWarning}</span>
                  </div>
                )}
              </div>

              {/* Start Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                    Campaign Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                    Calculated Expiry Date ({selectedPlan?.durationDays || 30} days)
                  </label>
                  <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                    {computedEndDate}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Magnet Creative & Details */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Summer Travel Souvenir Promotion"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Samsonite Luggage / Airbnb"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                    Product / Offer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ultra-Light Polycarbonate Suitcase"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                    Call To Action Button Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shop Now, Explore, Book Trip"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                  Destination URL (Safe click-through destination) *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    placeholder="https://brand.com/special-offer"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-blue-500"
                  />
                  <ExternalLink className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Users who click your magnet will be securely redirected to this URL in a new tab.
                </p>
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 mb-1">
                  Promotional Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Short, punchy copy highlighting exclusive discounts or features for travelers."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Artwork / Image Upload */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-heading font-black text-slate-800 uppercase tracking-wider">
                  Magnet Artwork Creative (Square 1:1 Recommended)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-slate-300 shadow-sm flex items-center justify-center flex-shrink-0">
                    {creativeUrl ? (
                      <img src={creativeUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UploadCloud className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      placeholder="Creative Image URL or upload below"
                      value={creativeUrl}
                      onChange={(e) => setCreativeUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-heading font-bold rounded-xl transition-colors cursor-pointer border border-blue-200">
                      <UploadCloud className="w-4 h-4" />
                      <span>Upload Image File (PNG, JPEG, WebP)</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Existing Creatives library quick select */}
                {creatives.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Or select from Creative Library:
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {creatives.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectExistingCreative(c)}
                          className={`w-12 h-12 rounded-xl overflow-hidden border-2 cursor-pointer transition-all flex-shrink-0 ${
                            c.id === selectedCreativeId ? 'border-blue-600 scale-105' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <img src={c.fileUrl} alt={c.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Live Refrigerator Preview & Final Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Your advertisement will be submitted for Super Admin review. Once approved and payment is confirmed, it goes live immediately.
                  </span>
                </div>
              </div>

              {/* Live Preview on Static Virtual Fridge */}
              <MerchantLivePreview
                draftCampaign={{
                  name: campaignName,
                  brandName,
                  productName,
                  description,
                  destinationUrl,
                  ctaText,
                  creativeUrl,
                  slotId: selectedSlot?.id,
                  positionX: selectedSlot?.defaultPositionX,
                  positionY: selectedSlot?.defaultPositionY,
                  displayScale: selectedSlot?.defaultDisplayScale,
                }}
              />
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => s - 1)}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-heading font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-heading font-black text-xs rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Campaign...' : 'Submit Advertisement for Approval'}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
