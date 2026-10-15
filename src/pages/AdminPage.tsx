import React, { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  verifyUserAdminRole,
  adminSignIn,
  adminSignOut,
  getAdminSetupInstructions,
} from '../services/adminService'
import {
  getAllAdminProducts,
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
} from '../services/fridgeProductService'
import type {
  FridgeProduct,
  FridgeShelf,
  ProductCategory,
  ApprovedAsset,
  StackingArrangement,
} from '../types/fridgeProduct'
import {
  SHELF_DEFINITIONS,
  PRODUCT_CATEGORIES,
  APPROVED_ASSETS,
  COMPARTMENT_CAPACITIES,
} from '../types/fridgeProduct'
import { UniversalSteelFridge } from '../components/fridge/UniversalSteelFridge'
import {
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Plus,
  Edit2,
  Trash2,
  Archive,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Layers,
  Sparkles,
  ChevronRight,
  X,
  HelpCircle,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Maximize2,
  DoorOpen,
  DoorClosed,
  Compass,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Monitor,
  Eye as ViewIcon,
  CheckCircle,
  Snowflake,
  Droplets,
} from 'lucide-react'

export const AdminPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Authorization state
  const [isAdminChecking, setIsAdminChecking] = useState<boolean>(true)
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean>(false)
  const [adminRole, setAdminRole] = useState<'admin' | 'super_admin' | null>(null)

  // Admin login form state (for unauthenticated visitors)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Setup guide modal
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false)
  const [copiedSql, setCopiedSql] = useState(false)

  // Inventory state
  const [products, setProducts] = useState<FridgeProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
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
  const [formDescription, setFormDescription] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formImageUrl, setFormImageUrl] = useState<string>('/assets/products/milk-carton.png')
  const [formImageTab, setFormImageTab] = useState<'approved' | 'upload'>('approved')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Live Fridge Preview controls state
  const [previewDoorOpen, setPreviewDoorOpen] = useState(true)
  const [previewCrisperOpen, setPreviewCrisperOpen] = useState(false)
  const [previewFreezerOpen, setPreviewFreezerOpen] = useState(false)
  const [previewYaw, setPreviewYaw] = useState(-25)
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview'>('editor')

  const isEditorActive = isAddMode || editingProduct !== null

  // 1. Verify Admin Role on Mount / Auth state changes
  useEffect(() => {
    let active = true
    setIsAdminChecking(true)

    verifyUserAdminRole(user).then((res) => {
      if (!active) return
      setIsAuthorizedAdmin(res.isAdmin)
      setAdminRole(res.role ?? null)
      setIsAdminChecking(false)
    })

    return () => {
      active = false
    }
  }, [user])

  // 2. Fetch products once authorized
  const loadInventory = async () => {
    setIsLoadingProducts(true)
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
    if (isAuthorizedAdmin) {
      loadInventory()

      const handleUpdate = () => loadInventory()
      if (typeof window !== 'undefined') {
        window.addEventListener(FRIDGE_PRODUCTS_UPDATED_EVENT, handleUpdate)
      }
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener(FRIDGE_PRODUCTS_UPDATED_EVENT, handleUpdate)
        }
      }
    }
  }, [isAuthorizedAdmin])

  // 3. Auto-orient the 3D fridge and auto-open compartments when selecting a shelf
  useEffect(() => {
    if (isEditorActive) {
      const loc = SHELF_DEFINITIONS[formShelf]?.location
      if (loc === 'door') {
        setPreviewDoorOpen(true)
        setPreviewYaw(-55)
      } else {
        setPreviewDoorOpen(true)
        setPreviewYaw(-20)
      }

      if (formShelf === 'crisper_drawer') {
        setPreviewCrisperOpen(true)
      } else if (formShelf === 'freezer') {
        setPreviewFreezerOpen(true)
      }

      const range = SHELF_DEFINITIONS[formShelf]?.horizontalRange || [14, 86]
      setFormPositionX((prev) => Math.max(range[0], Math.min(range[1], prev)))
    }
  }, [formShelf, isEditorActive])

  // Drag-and-drop live shelf snap mover handler
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

  // 4. Real-time dynamic preview products calculation
  // Reflects slider movements, shelf changes, image asset updates, scale, multi-units, and visibility immediately!
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
            isActive: formIsActive,
          }
        }
        return p
      })
    }

    // Adding a new product draft
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
    formDescription,
    formImageUrl,
    formIsActive,
  ])

  // Handle Admin Login submission
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setIsLoggingIn(true)

    try {
      const result = await adminSignIn(loginEmail, loginPassword)
      if (result.success && result.user) {
        const verifyRes = await verifyUserAdminRole(result.user)
        setIsAuthorizedAdmin(verifyRes.isAdmin)
        setAdminRole(verifyRes.role ?? null)
        if (!verifyRes.isAdmin) {
          setLoginError(
            verifyRes.error ||
              'Access denied: This user account does not possess administrator credentials in user_roles.'
          )
        }
      } else {
        setLoginError(result.error || 'Authentication failed. Please verify credentials.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in error'
      setLoginError(msg)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle Admin Sign Out
  const handleAdminSignOut = async () => {
    await adminSignOut()
    setIsAuthorizedAdmin(false)
    setAdminRole(null)
    setProducts([])
    navigate('/')
  }

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesName = prod.name.toLowerCase().includes(q)
        const matchesDesc = prod.description?.toLowerCase().includes(q)
        const matchesCat = prod.category.toLowerCase().includes(q)
        if (!matchesName && !matchesDesc && !matchesCat) return false
      }
      // Shelf filter
      if (selectedShelfFilter !== 'all' && prod.shelf !== selectedShelfFilter) {
        return false
      }
      // Category filter
      if (selectedCategoryFilter !== 'all' && prod.category !== selectedCategoryFilter) {
        return false
      }
      // Status filter
      if (statusFilter === 'active' && (!prod.isActive || prod.isArchived)) return false
      if (statusFilter === 'inactive' && (prod.isActive || prod.isArchived)) return false
      if (statusFilter === 'archived' && !prod.isArchived) return false

      return true
    })
  }, [products, searchQuery, selectedShelfFilter, selectedCategoryFilter, statusFilter])

  // Metrics
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

  // Open Add Product Editor
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
    setFormDescription('')
    setFormIsActive(true)
    setFormImageUrl('/assets/products/milk-carton.png')
    setFormImageTab('approved')
    setFormError(null)
    setEditingProduct(null)
    setIsAddMode(true)
    setMobileTab('editor')
  }

  // Open Edit Product Editor
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
    setFormDescription(prod.description || '')
    setFormIsActive(prod.isActive)
    setFormImageUrl(prod.imageUrl)
    setFormImageTab(prod.imageUrl.startsWith('/assets/products') ? 'approved' : 'upload')
    setFormError(null)
    setMobileTab('editor')
  }

  // Close / Cancel Editor
  const closeEditor = () => {
    setIsAddMode(false)
    setEditingProduct(null)
    setFormError(null)
  }

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFormError(null)
    try {
      const uploadedUrl = await uploadProductImage(file)
      setFormImageUrl(uploadedUrl)
      setFeedbackMessage({ type: 'info', text: 'Product image updated in live preview!' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error uploading image'
      setFormError(msg)
    }
  }

  // Submit Add or Edit (Persists to database)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formName.trim()) {
      setFormError('Product name is required.')
      return
    }
    if (!formImageUrl) {
      setFormError('Product image is required. Please select an approved asset or upload one.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingProduct) {
        // Edit existing
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
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
          imageUrl: formImageUrl,
        })
        setFeedbackMessage({
          type: 'success',
          text: `"${formName}" updated and persisted to database.`,
        })
      } else {
        // Create new
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
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
          isArchived: false,
          displayOrder: products.length + 1,
          imageUrl: formImageUrl,
        })
        setFeedbackMessage({
          type: 'success',
          text: `"${formName}" saved to database and placed inside refrigerator.`,
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

  // Toggle Visibility directly from table
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

  // Archive / Unarchive
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

  // Permanent Delete
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

  // Clear all products to make the fridge 100% empty
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

  // Optional: Load starter templates
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

  // Copy SQL Snippet helper
  const handleCopySql = () => {
    const guide = getAdminSetupInstructions()
    navigator.clipboard.writeText(guide.sqlSnippet)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2000)
  }

  // --------------------------------------------------------------------------
  // STATE A: Loading checking admin status
  // --------------------------------------------------------------------------
  if (isAdminChecking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center animate-pulse mb-4">
          <ShieldCheck className="w-6 h-6 text-slate-400" />
        </div>
        <h2 className="font-heading font-black text-lg text-slate-800">
          Verifying Administrator Privileges
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Validating authorization role and security definer status with Supabase backend...
        </p>
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // STATE B: Unauthenticated visitor -> Dedicated Admin Login Portal
  // --------------------------------------------------------------------------
  if (!user && !isAuthorizedAdmin) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 text-white text-center relative">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-3 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="font-heading font-black text-2xl tracking-tight">
              Magneto Admin
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Protected Refrigerator Inventory Management Portal
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-[10px] font-bold text-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Role-Based Access Control • RLS Enforced</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="p-8 space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="leading-snug">{loginError}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@magneto.app"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Secure Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-sm rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating Role...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Admin Console</span>
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setIsSetupGuideOpen(true)}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Admin Setup Guide</span>
              </button>
              <Link to="/" className="hover:text-slate-800 transition-colors">
                Return to Home
              </Link>
            </div>
          </form>
        </div>

        {/* Setup Guide Modal */}
        {isSetupGuideOpen && renderSetupGuideModal()}
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // STATE C: Authenticated User, but NON-ADMIN -> 403 Access Denied
  // --------------------------------------------------------------------------
  if (user && !isAuthorizedAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-rose-200 shadow-2xl p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              HTTP 403 Forbidden
            </span>
            <h1 className="font-heading font-black text-2xl text-slate-900">
              Administrator Access Denied
            </h1>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
            You are signed in as <strong className="text-slate-800">{user.email}</strong>, but this
            account does not possess an assigned administrator role in the{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">public.user_roles</code> table.
          </p>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left">
            <p className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>Security Precaution</span>
            </p>
            <p className="mt-1 text-[11px] text-amber-800 leading-relaxed">
              To grant this account administrative access, execute the authorization grant in your
              Supabase SQL Editor as documented in the setup guide.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsSetupGuideOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>View Setup Instructions</span>
            </button>

            <button
              onClick={handleAdminSignOut}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-bold text-xs"
            >
              Sign Out
            </button>
          </div>
        </div>

        {isSetupGuideOpen && renderSetupGuideModal()}
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // STATE D: Fully Authorized Administrator -> Complete Admin Studio Dashboard
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Heading */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-100 text-blue-800 font-mono text-xs font-black">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>{adminRole === 'super_admin' ? 'SUPER ADMIN' : 'ADMINISTRATOR'}</span>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-600">
                Logged in as <strong className="text-slate-900">{user?.email || 'admin'}</strong>
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Fridge Studio Active</span>
              </span>
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Magneto Admin — Refrigerator Inventory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Arrange and manage all interior groceries, beverages, and dairy products.
              Adjust placement, scale, and shelves with <strong>instant real-time 3D feedback</strong> alongside the editor!
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={openAddEditor}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-black text-xs shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Product</span>
            </button>

            <button
              onClick={handleAdminSignOut}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Sign Out of Admin Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMessage && (
          <div
            className={`mt-6 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 ${
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
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

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
          <span className="text-[10px] text-slate-500">Freezer & glass shelves</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Door Storage</p>
          <p className="font-heading font-black text-2xl text-indigo-600 mt-1">{metrics.doorCount}</p>
          <span className="text-[10px] text-slate-500">Bins & bottle racks</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Archived</p>
          <p className="font-heading font-black text-2xl text-slate-400 mt-1">{metrics.archived}</p>
          <span className="text-[10px] text-slate-400">Safe soft-deleted</span>
        </div>
      </div>

      {/* Mobile Responsive Segmented Tab Switcher */}
      <div className="lg:hidden flex items-center bg-slate-200/80 p-1 rounded-2xl border border-slate-200">
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex-1 py-2 text-xs font-heading font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'editor'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isEditorActive ? 'Editing Controls' : 'Inventory Table'}</span>
        </button>

        <button
          onClick={() => setMobileTab('preview')}
          className={`flex-1 py-2 text-xs font-heading font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'preview'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5" />
          <span>Live 3D Fridge Preview ({metrics.active})</span>
        </button>
      </div>

      {/* 
        ========================================================================
        DUAL-PANE STUDIO LAYOUT:
        Left Column: Active Product Editor OR Inventory Management Table
        Right Column: Real-time Live Fridge Preview Studio (Always Visible on Desktop!)
        ========================================================================
      */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editor & Inventory */}
        <div
          className={`lg:col-span-7 xl:col-span-7 space-y-6 ${
            mobileTab === 'preview' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Active Product Editor Panel (When Add or Edit is triggered) */}
          {isEditorActive ? (
            <div className="bg-white rounded-3xl border-2 border-blue-500 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              {/* Editor Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 font-bold">
                        {editingProduct ? 'EDITING PRODUCT' : 'NEW PRODUCT DRAFT'}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[10px] text-emerald-300 font-semibold hidden sm:inline">
                        Live 3D Sync Active
                      </span>
                    </div>
                    <h3 className="font-heading font-black text-base text-white mt-0.5">
                      {formName.trim() || (editingProduct ? 'Edit Interior Product' : 'Add New Refrigerator Product')}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileTab('preview')}
                    className="lg:hidden px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1"
                  >
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>View in Fridge</span>
                  </button>

                  <button
                    onClick={closeEditor}
                    className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    title="Cancel and close editor"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Live arrangement banner */}
              <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="text-[11px] font-medium">
                    Move sliders, swap shelves, or change scale. The refrigerator preview on the right updates <strong>in real time</strong>!
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md hidden sm:inline">
                  Shelf: {SHELF_DEFINITIONS[formShelf]?.label.split(' ')[0]} • X: {formPositionX}%
                </span>
              </div>

              {/* Editor Form */}
              <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Product Name & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Organic Almond Milk"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Shelf & Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Target Shelf Compartment *
                    </label>
                    <select
                      value={formShelf}
                      onChange={(e) => setFormShelf(e.target.value as FridgeShelf)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <optgroup label="Cabinet Cavity (Glass Shelves & Crisper)">
                        <option value="freezer">Top Freezer Compartment (Sub-Zero)</option>
                        <option value="top_shelf">Upper Fresh Food Shelf (Tempered Glass)</option>
                        <option value="middle_shelf">Middle Fresh Food Shelf (Tempered Glass)</option>
                        <option value="bottom_shelf">Lower Fresh Food Shelf (Heavy Items)</option>
                        <option value="crisper_drawer">Crisper Humidity Drawer (Fruits & Veggies)</option>
                      </optgroup>
                      <optgroup label="Door-Side Storage (Acrylic Bins & Racks)">
                        <option value="door_bin_top">Door Top Dairy Bin (Covered)</option>
                        <option value="door_bin_middle">Door Middle Condiment Rack (Jars & Sauces)</option>
                        <option value="door_bin_bottom">Door Bottom Beverage Bin (Tall Bottles)</option>
                      </optgroup>
                    </select>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Location: <strong className="text-slate-700">{SHELF_DEFINITIONS[formShelf]?.location === 'door' ? 'Door Storage Bin' : 'Interior Glass Cavity'}</strong>
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Quantity / Display Info
                    </label>
                    <input
                      type="text"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(e.target.value)}
                      placeholder="e.g. 1 Litre, Pack of 6, 250g Jar"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Displayed on mouse hover tooltip inside the fridge
                    </span>
                  </div>
                </div>

                {/* Real-time Position & Scale Sliders */}
                <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-600" />
                        <span>Position on Shelf (Horizontal X)</span>
                      </span>
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                        {formPositionX}%
                      </span>
                    </div>
                    {(() => {
                      const [shelfMinX, shelfMaxX] =
                        SHELF_DEFINITIONS[formShelf]?.horizontalRange || [14, 86]
                      return (
                        <>
                          <input
                            type="range"
                            min={shelfMinX}
                            max={shelfMaxX}
                            value={formPositionX}
                            onChange={(e) => setFormPositionX(Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 px-1">
                            <span>← Left Edge ({shelfMinX}%)</span>
                            <span className="text-slate-500">
                              Center ({Math.round((shelfMinX + shelfMaxX) / 2)}%)
                            </span>
                            <span>Right Edge ({shelfMaxX}%) →</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  <div className="pt-3 border-t border-slate-200/70">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Display Scale Multiplier</span>
                      </span>
                      <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                        {formScale}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.8"
                      step="0.05"
                      value={formScale}
                      onChange={(e) => setFormScale(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1 px-1">
                      <span>Compact (0.5x)</span>
                      <span className="text-slate-500">Normal (1.0x)</span>
                      <span>Large (1.8x)</span>
                    </div>
                  </div>
                </div>

                {/* Compartment Capacity Gauge & Warning */}
                {(() => {
                  const shelfCap = COMPARTMENT_CAPACITIES[formShelf]
                  const shelfUnitsExcludingCurrent = products
                    .filter(
                      (p) =>
                        p.shelf === formShelf &&
                        p.isActive &&
                        !p.isArchived &&
                        p.id !== editingProduct?.id
                    )
                    .reduce((sum, p) => sum + (p.itemCount || 1), 0)
                  const totalProjectedShelfUnits = shelfUnitsExcludingCurrent + formItemCount
                  const isOverCapacity = totalProjectedShelfUnits > shelfCap.maxUnits
                  const capacityPercent = Math.min(
                    100,
                    Math.round((totalProjectedShelfUnits / shelfCap.maxUnits) * 100)
                  )

                  return (
                    <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span>Compartment Capacity ({shelfCap.description})</span>
                        </span>
                        <span
                          className={`font-mono text-[11px] font-black px-2 py-0.5 rounded-md ${
                            isOverCapacity
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : capacityPercent >= 75
                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {totalProjectedShelfUnits} / {shelfCap.maxUnits} units ({capacityPercent}%)
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isOverCapacity
                              ? 'bg-rose-500'
                              : capacityPercent >= 75
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>

                      {isOverCapacity && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Capacity Alert: </span>
                            This compartment comfortably accommodates <strong>{shelfCap.maxUnits} units</strong>. With this product, total load is <strong>{totalProjectedShelfUnits} units</strong>. Items may crowd or overlap.
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* Stacking & Multi-Unit Arrangement Engine */}
                <div className="p-4 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 rounded-2xl border border-blue-200/80 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Product Stacking & Multi-Units</span>
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        Add duplicate physical units and configure spatial arrangement
                      </p>
                    </div>
                    <span className="font-mono text-xs font-black text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-2xs">
                      {formItemCount} {formItemCount === 1 ? 'Unit' : 'Units'}
                    </span>
                  </div>

                  {/* Quantity Unit Count */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-600">
                        Physical Unit Count:
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setFormItemCount(num)}
                            className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                              formItemCount === num
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {num}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="12"
                      value={formItemCount}
                      onChange={(e) => setFormItemCount(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
                    />
                  </div>

                  {/* Arrangement Style Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1.5">
                      Arrangement Style:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        {
                          id: 'single' as StackingArrangement,
                          label: 'Single Unit',
                          desc: '1 standalone item',
                        },
                        {
                          id: 'row' as StackingArrangement,
                          label: 'Horizontal Row',
                          desc: 'Side-by-side lineup',
                        },
                        {
                          id: 'depth' as StackingArrangement,
                          label: 'Staggered Depth',
                          desc: 'Front & back rows',
                        },
                        {
                          id: 'grid' as StackingArrangement,
                          label: '2D Grid Matrix',
                          desc: 'Compact block',
                        },
                        {
                          id: 'stack' as StackingArrangement,
                          label: 'Vertical Stack',
                          desc: 'Stacked on top',
                        },
                      ].map((style) => {
                        const isSelected = formArrangement === style.id
                        const isRecommended = COMPARTMENT_CAPACITIES[formShelf]?.recommendedArrangements.includes(style.id)

                        return (
                          <button
                            key={style.id}
                            type="button"
                            onClick={() => setFormArrangement(style.id)}
                            className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                                : 'bg-white/70 border-slate-200/80 hover:bg-white hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-extrabold text-slate-800">
                                {style.label}
                              </span>
                              {isRecommended && (
                                <span className="text-[7px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                                  Ideal
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-slate-500 block mt-0.5">
                              {style.desc}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Spacing Slider (active when multi-unit) */}
                  {formItemCount > 1 && formArrangement !== 'single' && (
                    <div className="pt-2 border-t border-blue-200/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-slate-700">
                          Unit Spacing Gap:
                        </span>
                        <span className="font-mono text-[10px] font-black text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                          {formSpacing}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="45"
                        value={formSpacing}
                        onChange={(e) => setFormSpacing(Number(e.target.value))}
                        className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                      />
                      <div className="flex justify-between text-[9px] text-slate-400 font-bold mt-0.5 px-0.5">
                        <span>Tight (10px)</span>
                        <span>Standard (18px)</span>
                        <span>Spaced (45px)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description (Optional) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Organic notes, farm origin, or pairing details..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Product Image Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Product Image Asset *
                  </label>

                  {/* Tabs: Approved Assets vs Custom Upload */}
                  <div className="flex rounded-xl bg-slate-100 p-1 mb-3">
                    <button
                      type="button"
                      onClick={() => setFormImageTab('approved')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        formImageTab === 'approved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Select Photorealistic Studio Asset
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormImageTab('upload')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        formImageTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Upload Custom Image
                    </button>
                  </div>

                  {formImageTab === 'approved' ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-52 overflow-y-auto p-1.5 border border-slate-200 rounded-2xl bg-slate-50/50">
                      {APPROVED_ASSETS.map((asset) => {
                        const isSelected = formImageUrl === asset.path
                        return (
                          <button
                            key={asset.id}
                            type="button"
                            onClick={() => {
                              setFormImageUrl(asset.path)
                              if (!formName) setFormName(asset.name)
                              if (!formQuantity) setFormQuantity(asset.defaultQuantity)
                              setFormShelf(asset.suggestedShelf)
                              setFormCategory(asset.category)
                              if (asset.defaultItemCount) setFormItemCount(asset.defaultItemCount)
                              if (asset.defaultArrangement) setFormArrangement(asset.defaultArrangement)
                              if (asset.defaultSpacing) setFormSpacing(asset.defaultSpacing)
                            }}
                            className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer bg-white ${
                              isSelected
                                ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-50/50 shadow-xs'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <img
                              src={asset.path}
                              alt={asset.name}
                              className="w-10 h-10 object-contain drop-shadow-xs"
                            />
                            <span className="text-[9px] font-bold text-slate-700 truncate w-full">
                              {asset.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center space-y-2 hover:border-blue-400 transition-colors">
                      <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">
                        Upload image from your computer
                      </p>
                      <p className="text-[10px] text-slate-400">
                        PNG, JPG, WebP, or SVG up to 5MB. Transparent backgrounds look best.
                      </p>
                      <label className="inline-block px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs cursor-pointer shadow-xs">
                        <span>Browse Files</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>

                      {formImageUrl && (
                        <div className="pt-2 flex items-center justify-center gap-2">
                          <span className="text-[10px] text-slate-500">Selected image preview:</span>
                          <div className="w-10 h-10 rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                            <img
                              src={formImageUrl}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Active Visibility Checkbox */}
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="formIsActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="formIsActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Immediately visible in public refrigerator interior
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel / Discard Draft
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>{editingProduct ? 'Save Changes' : 'Place in Fridge & Save'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Main Products Catalogue Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-heading font-black text-lg text-slate-900">
                  Interior Products Catalogue
                </h2>
                <p className="text-xs text-slate-500">
                  {products.length} products registered • {metrics.active} visible in refrigerator
                </p>
              </div>

              {!isEditorActive && (
                <button
                  onClick={openAddEditor}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              )}
            </div>

            {/* Compartment Capacity Navigation Bar */}
            <div className="space-y-2 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Compartment Capacity Overview</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Click a compartment to filter inventory
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setSelectedShelfFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedShelfFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Compartments ({products.filter((p) => p.isActive && !p.isArchived).length})
                </button>

                {(
                  [
                    'freezer',
                    'top_shelf',
                    'middle_shelf',
                    'bottom_shelf',
                    'crisper_drawer',
                    'door_bin_top',
                    'door_bin_middle',
                    'door_bin_bottom',
                  ] as FridgeShelf[]
                ).map((shelfKey) => {
                  const shelfDef = SHELF_DEFINITIONS[shelfKey]
                  const shelfCap = COMPARTMENT_CAPACITIES[shelfKey]
                  const activeShelfProds = products.filter(
                    (p) => p.shelf === shelfKey && p.isActive && !p.isArchived
                  )
                  const totalUnits = activeShelfProds.reduce(
                    (sum, p) => sum + (p.itemCount || 1),
                    0
                  )
                  const isSelected = selectedShelfFilter === shelfKey
                  const isOver = totalUnits > shelfCap.maxUnits

                  return (
                    <button
                      key={shelfKey}
                      type="button"
                      onClick={() => setSelectedShelfFilter(shelfKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : isOver
                          ? 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                          : totalUnits >= shelfCap.maxUnits * 0.75
                          ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{shelfDef.label}</span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md ${
                          isSelected
                            ? 'bg-blue-700 text-white'
                            : isOver
                            ? 'bg-rose-200 text-rose-900 font-black'
                            : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {totalUnits}/{shelfCap.maxUnits}
                      </span>
                      {isOver && <span title="Exceeds Recommended Capacity">⚠️</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Controls Bar: Search & Filter Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, category..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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

              {/* Filter Dropdowns */}
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={selectedShelfFilter}
                  onChange={(e) => setSelectedShelfFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Shelves</option>
                  <optgroup label="Cabinet Cavity">
                    <option value="freezer">Top Freezer</option>
                    <option value="top_shelf">Upper Shelf</option>
                    <option value="middle_shelf">Middle Shelf</option>
                    <option value="bottom_shelf">Lower Shelf</option>
                    <option value="crisper_drawer">Crisper Drawer</option>
                  </optgroup>
                  <optgroup label="Door Storage">
                    <option value="door_bin_top">Door Top Bin</option>
                    <option value="door_bin_middle">Door Middle Bin</option>
                    <option value="door_bin_bottom">Door Bottom Bin</option>
                  </optgroup>
                </select>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active (Visible)</option>
                  <option value="inactive">Hidden (Disabled)</option>
                  <option value="archived">Archived</option>
                </select>

                <button
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Empty the entire refrigerator"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Empty Fridge</span>
                </button>

                <button
                  onClick={handleLoadTemplates}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Load 12 photorealistic starter templates"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline">Load Groceries</span>
                </button>
              </div>
            </div>

            {/* Products List Table */}
            {isLoadingProducts ? (
              <div className="py-16 text-center">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Loading refrigerator inventory...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-black text-sm text-slate-800">
                  No matching products found
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The refrigerator is currently empty or matches no filters. Click "Add Product" or "Load Groceries" to add items!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Shelf Compartment</th>
                      <th className="py-2.5 px-3 text-center">Units / Layout</th>
                      <th className="py-2.5 px-3 text-center">Pos X</th>
                      <th className="py-2.5 px-3 text-center">Scale</th>
                      <th className="py-2.5 px-3 text-center">Visibility</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((prod) => {
                      const shelfDef = SHELF_DEFINITIONS[prod.shelf]
                      const isCurrentlyEdited = editingProduct?.id === prod.id

                      return (
                        <tr
                          key={prod.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isCurrentlyEdited ? 'bg-blue-50/60 font-semibold' : ''
                          }`}
                        >
                          {/* Image & Name */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 p-1 flex-shrink-0 flex items-center justify-center shadow-2xs">
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{prod.name}</p>
                                {prod.quantity && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    {prod.quantity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-3 text-slate-600 font-medium">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-700">
                              {prod.category}
                            </span>
                          </td>

                          {/* Shelf */}
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                shelfDef?.location === 'cavity'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                              }`}
                            >
                              <span>{shelfDef?.label || prod.shelf}</span>
                            </span>
                          </td>

                          {/* Units / Layout */}
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                              <Layers className="w-2.5 h-2.5 text-blue-600" />
                              <span>{prod.itemCount || 1}x</span>
                              <span className="text-slate-500 font-medium capitalize">
                                ({prod.arrangement || 'single'})
                              </span>
                            </span>
                          </td>

                          {/* Position X */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 text-[11px]">
                            {prod.positionX}%
                          </td>

                          {/* Scale */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 text-[11px]">
                            {prod.displayScale}x
                          </td>

                          {/* Visibility Toggle */}
                          <td className="py-3 px-3 text-center">
                            {prod.isArchived ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold">
                                Archived
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleActive(prod)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  prod.isActive
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                                title="Click to toggle visibility in live refrigerator"
                              >
                                {prod.isActive ? (
                                  <>
                                    <Eye className="w-3 h-3 text-emerald-600" />
                                    <span>Active</span>
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="w-3 h-3 text-slate-400" />
                                    <span>Hidden</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditEditor(prod)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Product in Live Studio"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleArchive(prod)}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                  prod.isArchived
                                    ? 'text-emerald-600 hover:bg-emerald-50'
                                    : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                }`}
                                title={prod.isArchived ? 'Restore to Active Inventory' : 'Archive Product'}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setDeleteConfirmProduct(prod)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete Permanently"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 
          ========================================================================
          Right Column: LIVE REFRIGERATOR PREVIEW STUDIO
          Always visible side-by-side with editing controls on Desktop!
          Sticky scrolling ensures the preview remains directly in front of the admin!
          ========================================================================
        */}
        <div
          className={`lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6 space-y-4 ${
            mobileTab === 'editor' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-5 space-y-4">
            {/* Live Preview Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                  <DoorOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm text-slate-900 leading-tight">
                    Live Fridge Preview
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-700">
                      Real-Time Sync Active
                    </span>
                  </div>
                </div>
              </div>

              {/* Door Open / Closed Button */}
              <button
                onClick={() => setPreviewDoorOpen(!previewDoorOpen)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  previewDoorOpen
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {previewDoorOpen ? (
                  <>
                    <DoorClosed className="w-3.5 h-3.5" />
                    <span>Close Door</span>
                  </>
                ) : (
                  <>
                    <DoorOpen className="w-3.5 h-3.5" />
                    <span>Open Door</span>
                  </>
                )}
              </button>
            </div>

            {/* Perspective View Switcher Pills */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl text-[11px] font-bold text-slate-600">
              <button
                onClick={() => {
                  setPreviewDoorOpen(true)
                  setPreviewYaw(-20)
                }}
                className={`flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                  previewDoorOpen && previewYaw > -40
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Cavity Shelves
              </button>

              <button
                onClick={() => {
                  setPreviewDoorOpen(true)
                  setPreviewYaw(-55)
                }}
                className={`flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                  previewDoorOpen && previewYaw <= -40
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Door Storage Bins
              </button>

              <button
                onClick={() => {
                  setPreviewDoorOpen(false)
                  setPreviewYaw(0)
                }}
                className={`flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                  !previewDoorOpen ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Closed Front
              </button>
            </div>

            {/* Compartment Inspection Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewCrisperOpen(!previewCrisperOpen)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  previewCrisperOpen
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Slide Crisper Drawer In/Out"
              >
                <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                <span>Crisper: {previewCrisperOpen ? 'Extended ▲' : 'Closed ▼'}</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewFreezerOpen(!previewFreezerOpen)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  previewFreezerOpen
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300 shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="Open/Close Sub-Zero Freezer"
              >
                <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
                <span>Freezer: {previewFreezerOpen ? 'Open ▲' : 'Closed ▼'}</span>
              </button>
            </div>

            {/* Orbit Yaw Angle Slider */}
            <div className="flex items-center gap-3 px-1">
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
                3D Orbit Angle:
              </span>
              <input
                type="range"
                min="-60"
                max="60"
                value={previewYaw}
                onChange={(e) => setPreviewYaw(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <span className="font-mono text-[10px] font-black text-slate-700 w-8 text-right">
                {previewYaw}°
              </span>
              <button
                onClick={() => setPreviewYaw(-25)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Reset angle to default"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Currently Editing Focus Indicator */}
            {isEditorActive && (
              <div className="p-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="text-[11px] font-bold">
                    Target: {SHELF_DEFINITIONS[formShelf]?.label}
                  </span>
                </div>
                <span className="font-mono text-[11px] font-black text-blue-700">
                  X: {formPositionX}% • {formItemCount}x {formArrangement}
                </span>
              </div>
            )}

            {/* 3D Refrigerator Stage */}
            <div className="pt-2 flex justify-center overflow-visible select-none min-h-[440px]">
              <UniversalSteelFridge
                isDoorOpen={previewDoorOpen}
                isCrisperOpen={previewCrisperOpen}
                onToggleCrisper={() => setPreviewCrisperOpen((v) => !v)}
                isFreezerOpen={previewFreezerOpen}
                onToggleFreezer={() => setPreviewFreezerOpen((v) => !v)}
                yaw={previewYaw}
                magneticRegion={{ top: 0.1, left: 0.1, width: 0.8, height: 0.8 }}
                surfaceRef={{ current: null }}
                products={previewProducts}
                highlightedProductId={editingProduct?.id || (isAddMode ? 'draft-new-product-preview-id' : undefined)}
                onSelectProduct={(prod) => openEditEditor(prod)}
                onMoveProduct={handleMoveProduct}
              >
                <div />
              </UniversalSteelFridge>
            </div>

            {/* Interactive hint footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>💡 Click any product in the fridge to edit it</span>
              </span>

              {mobileTab === 'preview' && (
                <button
                  onClick={() => setMobileTab('editor')}
                  className="lg:hidden text-blue-600 font-bold hover:underline"
                >
                  ← Back to Editing Form
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-heading font-black text-lg text-slate-900">
                Permanently Delete Product?
              </h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to remove <strong className="text-slate-800">"{deleteConfirmProduct.name}"</strong>?
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-[11px] text-amber-800">
              <p className="font-bold">Recommendation:</p>
              <p>
                Consider using <strong>Archive</strong> instead of permanent deletion. Archiving hides
                the product from the refrigerator while maintaining data integrity.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold text-xs shadow-md cursor-pointer"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* SETUP GUIDE MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {isSetupGuideOpen && renderSetupGuideModal()}
    </div>
  )

  function renderSetupGuideModal() {
    const guide = getAdminSetupInstructions()
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
        <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h3 className="font-heading font-black text-base">{guide.title}</h3>
            </div>
            <button
              onClick={() => setIsSetupGuideOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600">
            <p className="leading-relaxed">{guide.description}</p>

            <div className="space-y-2">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Step-by-Step Instructions:
              </p>
              <ol className="list-decimal pl-5 space-y-1.5 leading-snug">
                {guide.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  PostgreSQL Grant Command:
                </span>
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-2xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                {guide.sqlSnippet}
              </pre>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
              Migration file location:{' '}
              <code className="text-slate-800 font-bold font-mono">
                supabase/migrations/20261015000000_admin_and_fridge_products.sql
              </code>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsSetupGuideOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
