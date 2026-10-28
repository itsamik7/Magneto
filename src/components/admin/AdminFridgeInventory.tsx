import React, { useState, useEffect, useMemo } from 'react'
import {
  getAllAdminProducts,
  getLocalCachedProducts,
  createProduct,
  updateProduct,
  toggleProductActive,
  archiveProduct,
  unarchiveProduct,
  deleteProductPermanent,
  uploadProductImage,
  clearAllProducts,
  populateStockTemplates,
  FRIDGE_PRODUCTS_UPDATED_EVENT,
} from '../../services/fridgeProductService'
import type {
  FridgeProduct,
  FridgeShelf,
  StackingArrangement,
} from '../../types/fridgeProduct'
import {
  SHELF_DEFINITIONS,
  PRODUCT_CATEGORIES,
  APPROVED_ASSETS,
  COMPARTMENT_CAPACITIES,
} from '../../types/fridgeProduct'
import { UniversalSteelFridge } from '../fridge/UniversalSteelFridge'
import { Adaptive3DFridge } from '../fridge/Adaptive3DFridge'
import {
  Plus,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Layers,
  Sparkles,
  X,
  RotateCcw,
  Sliders,
  Compass,
  Check,
} from 'lucide-react'

export const AdminFridgeInventory: React.FC = () => {
  // Inventory state initialized synchronously from local cache
  const [products, setProducts] = useState<FridgeProduct[]>(() => getLocalCachedProducts())
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(() => getLocalCachedProducts().length === 0)
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedShelfFilter, setSelectedShelfFilter] = useState<string>('all')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all')

  // Modals & Panels state
  const [isAddMode, setIsAddMode] = useState(false)
  const [editingProduct, setEditingProduct] = useState<FridgeProduct | null>(null)
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<FridgeProduct | null>(null)

  // Form state for Add / Edit
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState<string>('Dairy')
  const [formShelf, setFormShelf] = useState<FridgeShelf>('middle_shelf')
  const [formPositionX, setFormPositionX] = useState<number>(50)
  const [formScale, setFormScale] = useState<number>(1.0)
  const [formQuantity, setFormQuantity] = useState('')
  const [formItemCount, setFormItemCount] = useState<number>(1)
  const [formArrangement, setFormArrangement] = useState<StackingArrangement>('single')
  const [formSpacing, setFormSpacing] = useState<number>(18)
  const [formRotation, setFormRotation] = useState<number>(0)
  const [formDescription, setFormDescription] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formImageUrl, setFormImageUrl] = useState<string>('/assets/products/milk-carton.png')
  const [formImageTab, setFormImageTab] = useState<'approved' | 'upload'>('approved')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Live Fridge Preview controls state
  const [previewCrisperOpen, setPreviewCrisperOpen] = useState(false)
  const [previewFreezerOpen, setPreviewFreezerOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor')

  const isEditorActive = isAddMode || editingProduct !== null

  const loadInventory = async (showLoadingState = false) => {
    if (showLoadingState) {
      setIsLoadingProducts(true)
    }
    try {
      const items = await getAllAdminProducts()
      setProducts(items)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed loading products'
      setFeedbackMessage({ type: 'error', text: msg })
    } finally {
      setIsLoadingProducts(false)
    }
  }

  useEffect(() => {
    loadInventory(products.length === 0)

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<FridgeProduct[]>
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setProducts(customEvent.detail)
      } else {
        loadInventory(false)
      }
    }

    window.addEventListener(FRIDGE_PRODUCTS_UPDATED_EVENT, handleUpdate as EventListener)
    return () => {
      window.removeEventListener(FRIDGE_PRODUCTS_UPDATED_EVENT, handleUpdate as EventListener)
    }
  }, [])

  // Auto-open fridge when selecting a shelf
  useEffect(() => {
    if (isEditorActive) {
      if (formShelf === 'crisper_drawer') {
        setPreviewCrisperOpen(true)
      } else if (formShelf === 'freezer') {
        setPreviewFreezerOpen(true)
      }

      const range = SHELF_DEFINITIONS[formShelf]?.horizontalRange || [14, 86]
      setFormPositionX((prev) => Math.max(range[0], Math.min(range[1], prev)))
    }
  }, [formShelf, isEditorActive])

  const handleMoveProduct = (productId: string, newShelf: FridgeShelf, newX: number) => {
    if (isEditorActive) {
      if (editingProduct?.id === productId || isAddMode) {
        setFormShelf(newShelf)
        setFormPositionX(newX)
        return
      }
    }
    const target = products.find((p) => p.id === productId)
    if (target) {
      openEditEditor(target)
      setFormShelf(newShelf)
      setFormPositionX(newX)
    }
  }

  const previewProducts = useMemo<FridgeProduct[]>(() => {
    if (!isEditorActive) {
      return products
    }

    if (editingProduct) {
      return products.map((p) => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: formName.trim() || 'Editing Product',
            category: formCategory,
            shelf: formShelf,
            positionX: formPositionX,
            displayScale: formScale,
            quantity: formQuantity.trim() || undefined,
            itemCount: formItemCount,
            arrangement: formArrangement,
            spacing: formSpacing,
            description: formDescription.trim() || undefined,
            imageUrl: formImageUrl,
            rotation: formRotation,
            isActive: formIsActive,
          }
        }
        return p
      })
    }

    const draftNew: FridgeProduct = {
      id: 'draft-new-product-preview-id',
      name: formName.trim() || 'New Item Preview',
      category: formCategory,
      shelf: formShelf,
      positionX: formPositionX,
      displayScale: formScale,
      quantity: formQuantity.trim() || undefined,
      itemCount: formItemCount,
      arrangement: formArrangement,
      spacing: formSpacing,
      rotation: formRotation,
      description: formDescription.trim() || undefined,
      imageUrl: formImageUrl,
      isActive: formIsActive,
      isArchived: false,
      displayOrder: products.length + 1,
    }

    return [...products, draftNew]
  }, [
    products,
    isEditorActive,
    editingProduct,
    formName,
    formCategory,
    formShelf,
    formPositionX,
    formScale,
    formQuantity,
    formItemCount,
    formArrangement,
    formSpacing,
    formRotation,
    formDescription,
    formImageUrl,
    formIsActive,
  ])

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = prod.name.toLowerCase().includes(q)
        const matchesDesc = prod.description?.toLowerCase().includes(q)
        const matchesCat = prod.category.toLowerCase().includes(q)
        if (!matchesName && !matchesDesc && !matchesCat) return false
      }
      if (selectedShelfFilter !== 'all' && prod.shelf !== selectedShelfFilter) {
        return false
      }
      if (selectedCategoryFilter !== 'all' && prod.category !== selectedCategoryFilter) {
        return false
      }
      if (statusFilter === 'active' && (!prod.isActive || prod.isArchived)) return false
      if (statusFilter === 'inactive' && (prod.isActive || prod.isArchived)) return false
      if (statusFilter === 'archived' && !prod.isArchived) return false

      return true
    })
  }, [products, searchQuery, selectedShelfFilter, selectedCategoryFilter, statusFilter])

  const metrics = useMemo(() => {
    const total = products.length
    const active = products.filter((p) => p.isActive && !p.isArchived).length
    const inactive = products.filter((p) => !p.isActive && !p.isArchived).length
    const archived = products.filter((p) => p.isArchived).length
    const cavityCount = products.filter(
      (p) => SHELF_DEFINITIONS[p.shelf]?.location === 'cavity' && p.isActive && !p.isArchived
    ).length
    const doorCount = products.filter(
      (p) => SHELF_DEFINITIONS[p.shelf]?.location === 'door' && p.isActive && !p.isArchived
    ).length

    return { total, active, inactive, archived, cavityCount, doorCount }
  }, [products])

  const openAddEditor = () => {
    setFormName('')
    setFormCategory('Dairy')
    setFormShelf('middle_shelf')
    setFormPositionX(50)
    setFormScale(1.0)
    setFormQuantity('1 Litre')
    setFormItemCount(1)
    setFormArrangement('single')
    setFormSpacing(18)
    setFormRotation(0)
    setFormDescription('')
    setFormIsActive(true)
    setFormImageUrl('/assets/products/milk-carton.png')
    setFormImageTab('approved')
    setFormError(null)
    setEditingProduct(null)
    setIsAddMode(true)
    setMobileTab('editor')
  }

  const openEditEditor = (prod: FridgeProduct) => {
    setEditingProduct(prod)
    setIsAddMode(false)
    setFormName(prod.name)
    setFormCategory(prod.category)
    setFormShelf(prod.shelf)
    setFormPositionX(prod.positionX)
    setFormScale(prod.displayScale)
    setFormQuantity(prod.quantity || '')
    setFormItemCount(prod.itemCount || 1)
    setFormArrangement(prod.arrangement || 'single')
    setFormSpacing(prod.spacing || 18)
    setFormRotation(prod.rotation ?? 0)
    setFormDescription(prod.description || '')
    setFormIsActive(prod.isActive)
    setFormImageUrl(prod.imageUrl)
    setFormImageTab(prod.imageUrl.startsWith('/assets/products') ? 'approved' : 'upload')
    setFormError(null)
    setMobileTab('editor')
  }

  const closeEditor = () => {
    setIsAddMode(false)
    setEditingProduct(null)
    setFormError(null)
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('Product name is required.')
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: formName.trim(),
          category: formCategory,
          shelf: formShelf,
          positionX: formPositionX,
          displayScale: formScale,
          quantity: formQuantity.trim() || undefined,
          itemCount: formItemCount,
          arrangement: formArrangement,
          spacing: formSpacing,
          rotation: formRotation,
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
          imageUrl: formImageUrl,
        })
        setFeedbackMessage({
          type: 'success',
          text: `"${formName}" updated and placed on refrigerator shelf.`,
        })
      } else {
        await createProduct({
          name: formName.trim(),
          category: formCategory,
          shelf: formShelf,
          positionX: formPositionX,
          displayScale: formScale,
          quantity: formQuantity.trim() || undefined,
          itemCount: formItemCount,
          arrangement: formArrangement,
          spacing: formSpacing,
          rotation: formRotation,
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
          isArchived: false,
          displayOrder: products.length + 1,
          imageUrl: formImageUrl,
        })
        setFeedbackMessage({
          type: 'success',
          text: `"${formName}" added and placed inside refrigerator.`,
        })
      }

      closeEditor()
      await loadInventory()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product.'
      setFormError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (prod: FridgeProduct) => {
    try {
      await toggleProductActive(prod.id, !prod.isActive)
      await loadInventory()
      setFeedbackMessage({
        type: 'info',
        text: `"${prod.name}" visibility set to ${!prod.isActive ? 'Active (Visible)' : 'Hidden'}.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed updating visibility'
      setFeedbackMessage({ type: 'error', text: msg })
    }
  }

  const handleToggleArchive = async (prod: FridgeProduct) => {
    try {
      if (prod.isArchived) {
        await unarchiveProduct(prod.id)
        setFeedbackMessage({ type: 'success', text: `Restored "${prod.name}" to inventory.` })
      } else {
        await archiveProduct(prod.id)
        setFeedbackMessage({ type: 'info', text: `Archived "${prod.name}". Product is hidden from fridge.` })
      }
      await loadInventory()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed archiving product'
      setFeedbackMessage({ type: 'error', text: msg })
    }
  }

  const handleExecuteDelete = async () => {
    if (!deleteConfirmProduct) return
    try {
      await deleteProductPermanent(deleteConfirmProduct.id)
      setFeedbackMessage({
        type: 'success',
        text: `Product "${deleteConfirmProduct.name}" permanently removed.`,
      })
      if (editingProduct?.id === deleteConfirmProduct.id) {
        closeEditor()
      }
      setDeleteConfirmProduct(null)
      await loadInventory()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product'
      setFeedbackMessage({ type: 'error', text: msg })
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('Empty the entire refrigerator? All product overlays will be removed.')) {
      await clearAllProducts()
      if (isEditorActive) closeEditor()
      await loadInventory()
      setFeedbackMessage({
        type: 'info',
        text: 'The refrigerator has been completely emptied. No products are inside.',
      })
    }
  }

  const handleLoadTemplates = async () => {
    if (window.confirm('Load the 12 photorealistic starter grocery templates into inventory?')) {
      await populateStockTemplates()
      await loadInventory()
      setFeedbackMessage({
        type: 'success',
        text: 'Loaded 12 photorealistic grocery items into inventory.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Items</p>
          <p className="font-heading font-black text-2xl text-slate-900 mt-1">{metrics.total}</p>
          <span className="text-[10px] text-slate-500">Products in database</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Active Visible</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="font-heading font-black text-2xl text-emerald-700 mt-1">{metrics.active}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Rendered in fridge</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hidden / Inactive</p>
          <p className="font-heading font-black text-2xl text-slate-600 mt-1">{metrics.inactive}</p>
          <span className="text-[10px] text-slate-400">Toggled off</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cavity Shelves</p>
          <p className="font-heading font-black text-2xl text-blue-600 mt-1">{metrics.cavityCount}</p>
          <span className="text-[10px] text-slate-500">Freezer &amp; glass shelves</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Door Storage</p>
          <p className="font-heading font-black text-2xl text-indigo-600 mt-1">{metrics.doorCount}</p>
          <span className="text-[10px] text-slate-500">Bins &amp; bottle racks</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Archived</p>
          <p className="font-heading font-black text-2xl text-slate-400 mt-1">{metrics.archived}</p>
          <span className="text-[10px] text-slate-400">Safe soft-deleted</span>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openAddEditor}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Refrigerator Product</span>
          </button>
          <button
            onClick={handleLoadTemplates}
            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Load 12 Starters</span>
          </button>
          <button
            onClick={handleClearAll}
            className="px-3 py-2 border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Fridge</span>
          </button>
        </div>

        <button
          onClick={() => loadInventory(true)}
          className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors self-start sm:self-center"
          title="Reload Inventory"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingProducts ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedbackMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dual Pane Layout: Editor/List (Left) + 3D Fridge Live Studio (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Product Editor Panel */}
          {isEditorActive ? (
            <div className="bg-white rounded-3xl border-2 border-indigo-500 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 font-bold">
                      {editingProduct ? 'EDITING PRODUCT' : 'NEW PRODUCT DRAFT'}
                    </span>
                    <h3 className="font-heading font-black text-base text-white mt-0.5">
                      {formName.trim() || (editingProduct ? 'Edit Interior Product' : 'Add New Refrigerator Product')}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeEditor}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="p-6 space-y-5">
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Organic Almond Milk"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Refrigerator Shelf / Compartment
                    </label>
                    <select
                      value={formShelf}
                      onChange={(e) => setFormShelf(e.target.value as FridgeShelf)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    >
                      {Object.entries(SHELF_DEFINITIONS).map(([shelfKey, def]) => (
                        <option key={shelfKey} value={shelfKey}>
                          {def.label} ({def.location === 'door' ? 'Door Shelf' : 'Main Cavity'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Horizontal Position ({formPositionX}%)
                    </label>
                    <input
                      type="range"
                      min={SHELF_DEFINITIONS[formShelf]?.horizontalRange[0] || 15}
                      max={SHELF_DEFINITIONS[formShelf]?.horizontalRange[1] || 85}
                      value={formPositionX}
                      onChange={(e) => setFormPositionX(Number(e.target.value))}
                      className="w-full accent-indigo-600 mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Scale ({formScale.toFixed(2)}x)
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.05"
                      value={formScale}
                      onChange={(e) => setFormScale(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 mt-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Units Count</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={formItemCount}
                      onChange={(e) => setFormItemCount(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Stacking Style</label>
                    <select
                      value={formArrangement}
                      onChange={(e) => setFormArrangement(e.target.value as StackingArrangement)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="single">Single Item</option>
                      <option value="row">Horizontal Row</option>
                      <option value="grid">Two-Tier Grid</option>
                    </select>
                  </div>
                </div>

                {/* Approved Images Asset Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                    Product Visual Texture
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                    {APPROVED_ASSETS.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => setFormImageUrl(asset.path)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          formImageUrl === asset.path
                            ? 'border-indigo-600 bg-white shadow-sm ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white/70 hover:border-slate-300'
                        }`}
                      >
                        <img src={asset.path} alt={asset.name} className="w-10 h-10 object-contain" />
                        <span className="text-[10px] text-slate-600 truncate max-w-full font-medium">
                          {asset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-800">Visible in Refrigerator</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={closeEditor}
                      className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Place in Fridge'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            /* Inventory Table */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3 bg-slate-50/50">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search product name, category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={selectedShelfFilter}
                    onChange={(e) => setSelectedShelfFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:w-36"
                  >
                    <option value="all">All Shelves</option>
                    {Object.entries(SHELF_DEFINITIONS).map(([key, def]) => (
                      <option key={key} value={key}>
                        {def.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 sm:w-28"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Hidden</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Layers className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-sm">No refrigerator products found.</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting search or shelf filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        <th className="py-2.5 px-4">Item</th>
                        <th className="py-2.5 px-4">Shelf &amp; Placement</th>
                        <th className="py-2.5 px-4">Category</th>
                        <th className="py-2.5 px-4">State</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {filteredProducts.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 p-1 flex items-center justify-center flex-shrink-0">
                                <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{prod.name}</span>
                                <span className="text-[11px] text-slate-400">{prod.quantity || '1 unit'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700 block">
                              {SHELF_DEFINITIONS[prod.shelf]?.label || prod.shelf}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              X: {prod.positionX}% • Scale: {prod.displayScale}x
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {prod.category}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            {prod.isArchived ? (
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Archived</span>
                            ) : prod.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Active
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                Hidden
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleToggleActive(prod)}
                                title={prod.isActive ? 'Hide product' : 'Make visible'}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                              >
                                {prod.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => openEditEditor(prod)}
                                title="Edit product"
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleArchive(prod)}
                                title={prod.isArchived ? 'Restore' : 'Archive'}
                                className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmProduct(prod)}
                                title="Delete"
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live 3D Fridge Preview */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4 sticky top-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-heading font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-600" />
                Live Fridge Interior Preview
              </h3>
              <p className="text-[11px] text-slate-500">Real-time preview of shelf placements & product positions</p>
            </div>

            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Interactive Studio
            </span>
          </div>

          {/* Fridge Canvas Preview */}
          <div className="relative min-h-[500px] flex items-center justify-center bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 rounded-2xl overflow-hidden p-4 border border-slate-200 shadow-inner">
            <div className="w-full max-w-[360px] flex items-center justify-center select-none">
              <Adaptive3DFridge
                products={previewProducts}
                highlightedProductId={editingProduct?.id || (isAddMode ? 'draft-new-product-preview-id' : undefined)}
                onSelectProduct={(p) => openEditEditor(p)}
                onMoveProduct={handleMoveProduct}
                isLeftDoorOpen={false}
                isRightDoorOpen={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Permanently Delete Product?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong>"{deleteConfirmProduct.name}"</strong>? This action cannot be
                undone.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
