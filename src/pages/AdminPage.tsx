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
  resetToDefaultProducts,
  clearAllProducts,
  populateStockTemplates,
  FRIDGE_PRODUCTS_UPDATED_EVENT,
} from '../services/fridgeProductService'
import type {
  FridgeProduct,
  FridgeShelf,
  ProductCategory,
  ApprovedAsset,
} from '../types/fridgeProduct'
import {
  SHELF_DEFINITIONS,
  PRODUCT_CATEGORIES,
  APPROVED_ASSETS,
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
} from 'lucide-react'

export const AdminPage: React.FC = () => {
  const { user, isConfigured } = useAuth()
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

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<FridgeProduct | null>(null)
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<FridgeProduct | null>(null)
  const [isLivePreviewOpen, setIsLivePreviewOpen] = useState(false)

  // Form state for Add / Edit
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState<string>('Dairy')
  const [formShelf, setFormShelf] = useState<FridgeShelf>('middle_shelf')
  const [formPositionX, setFormPositionX] = useState<number>(50)
  const [formScale, setFormScale] = useState<number>(1.0)
  const [formQuantity, setFormQuantity] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formImageUrl, setFormImageUrl] = useState<string>('/assets/products/milk-carton.png')
  const [formImageTab, setFormImageTab] = useState<'approved' | 'upload'>('approved')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

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

  // Open Add Product Modal
  const openAddModal = () => {
    setFormName('')
    setFormCategory('Dairy')
    setFormShelf('middle_shelf')
    setFormPositionX(50)
    setFormScale(1.0)
    setFormQuantity('1 Unit')
    setFormDescription('')
    setFormIsActive(true)
    setFormImageUrl('/assets/products/milk-carton.png')
    setFormImageTab('approved')
    setFormError(null)
    setEditingProduct(null)
    setIsAddModalOpen(true)
  }

  // Open Edit Product Modal
  const openEditModal = (prod: FridgeProduct) => {
    setEditingProduct(prod)
    setFormName(prod.name)
    setFormCategory(prod.category)
    setFormShelf(prod.shelf)
    setFormPositionX(prod.positionX)
    setFormScale(prod.displayScale)
    setFormQuantity(prod.quantity || '')
    setFormDescription(prod.description || '')
    setFormIsActive(prod.isActive)
    setFormImageUrl(prod.imageUrl)
    setFormImageTab(prod.imageUrl.startsWith('/assets/products') ? 'approved' : 'upload')
    setFormError(null)
    setIsAddModalOpen(true)
  }

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFormError(null)
    try {
      const uploadedUrl = await uploadProductImage(file)
      setFormImageUrl(uploadedUrl)
      setFeedbackMessage({ type: 'info', text: 'Product image successfully processed!' })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error uploading image'
      setFormError(msg)
    }
  }

  // Submit Add or Edit
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
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
          imageUrl: formImageUrl,
        })
        setFeedbackMessage({
          type: 'success',
          text: `"${formName}" has been updated successfully.`,
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
          description: formDescription.trim() || undefined,
          isActive: formIsActive,
          isArchived: false,
          displayOrder: products.length + 1,
          imageUrl: formImageUrl,
        })
        setFeedbackMessage({
          type: 'success',
          text: `"${formName}" has been placed into the refrigerator inventory.`,
        })
      }

      setIsAddModalOpen(false)
      await loadInventory()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product.'
      setFormError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle Visibility directly
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
      setDeleteConfirmProduct(null)
      await loadInventory()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete product'
      setFeedbackMessage({ type: 'error', text: msg })
    }
  }

  // Clear all products to make the fridge 100% empty
  const handleClearAll = async () => {
    if (
      window.confirm(
        'Empty the entire refrigerator? All product overlays will be removed.'
      )
    ) {
      await clearAllProducts()
      await loadInventory()
      setFeedbackMessage({
        type: 'info',
        text: 'The refrigerator has been completely emptied. No products are inside.',
      })
    }
  }

  // Optional: Load starter templates
  const handleLoadTemplates = async () => {
    if (
      window.confirm(
        'Load the 12 starter grocery templates into inventory?'
      )
    ) {
      await populateStockTemplates()
      await loadInventory()
      setFeedbackMessage({
        type: 'success',
        text: 'Loaded 12 grocery templates into inventory.',
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
            <p className="mt-1 text-[11px] text-amber-800">
              Ordinary user accounts cannot access the refrigerator inventory controls.
              Administrator roles are strictly provisioned through PostgreSQL Row Level Security.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleAdminSignOut}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs shadow-md transition-transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out & Switch Account</span>
            </button>
            <button
              onClick={() => setIsSetupGuideOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              View Admin Provisioning Guide
            </button>
          </div>
        </div>

        {isSetupGuideOpen && renderSetupGuideModal()}
      </div>
    )
  }

  // --------------------------------------------------------------------------
  // STATE D: Fully Authorized Administrator -> Complete Admin Dashboard
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6 pb-16">
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
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Magneto Admin — Refrigerator Inventory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
              Manage all groceries, chilled beverages, dairy products, and food containers visible
              inside the virtual 3D refrigerator cavity and door-side storage bins.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsLivePreviewOpen(!isLivePreviewOpen)}
              className={`px-4 py-2.5 rounded-xl font-heading font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                isLivePreviewOpen
                  ? 'bg-blue-600 text-white shadow-blue-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <DoorOpen className="w-4 h-4" />
              <span>{isLivePreviewOpen ? 'Hide Live Fridge' : 'Live Fridge Preview'}</span>
            </button>

            <button
              onClick={openAddModal}
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
              className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
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

      {/* Split view if Live Preview is toggled */}
      <div className={`grid gap-6 ${isLivePreviewOpen ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Main Products Catalogue Table / Cards */}
        <div className={`bg-white rounded-3xl border border-slate-200 shadow-sm p-6 ${isLivePreviewOpen ? 'lg:col-span-8' : ''}`}>
          {/* Controls Bar: Search & Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, category, or description..."
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
              {/* Shelf Filter */}
              <select
                value={selectedShelfFilter}
                onChange={(e) => setSelectedShelfFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Shelves (8 Compartments)</option>
                <optgroup label="Cabinet Cavity">
                  <option value="freezer">Top Freezer Compartment</option>
                  <option value="top_shelf">Upper Fresh Food Shelf</option>
                  <option value="middle_shelf">Middle Fresh Food Shelf</option>
                  <option value="bottom_shelf">Lower Fresh Food Shelf</option>
                  <option value="crisper_drawer">Crisper Humidity Drawer</option>
                </optgroup>
                <optgroup label="Door-Side Storage">
                  <option value="door_bin_top">Door Top Dairy Bin</option>
                  <option value="door_bin_middle">Door Middle Condiment Bin</option>
                  <option value="door_bin_bottom">Door Bottom Beverage Bin</option>
                </optgroup>
              </select>

              {/* Category Filter */}
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

              {/* Status Filter */}
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
                <span>Empty Fridge</span>
              </button>

              <button
                onClick={handleLoadTemplates}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                title="Load 12 starter grocery templates"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Load Groceries</span>
              </button>
            </div>
          </div>

          {/* Products List Table */}
          {isLoadingProducts ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading refrigerator inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-black text-sm text-slate-800">
                No matching products found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing your search query or shelf filters, or click "Add Product" to create one.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedShelfFilter('all')
                  setSelectedCategoryFilter('all')
                  setStatusFilter('all')
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Shelf Placement</th>
                    <th className="py-3 px-3 text-center">Horizontal X</th>
                    <th className="py-3 px-3 text-center">Scale</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => {
                    const shelfDef = SHELF_DEFINITIONS[prod.shelf] || SHELF_DEFINITIONS.middle_shelf
                    return (
                      <tr
                        key={prod.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          prod.isArchived ? 'opacity-50 bg-slate-50/40' : ''
                        }`}
                      >
                        {/* Image & Name */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="font-heading font-bold text-slate-900 text-xs">
                                {prod.name}
                              </p>
                              {prod.quantity && (
                                <p className="text-[10px] font-semibold text-blue-600">
                                  {prod.quantity}
                                </p>
                              )}
                              {prod.description && (
                                <p className="text-[10px] text-slate-400 truncate max-w-xs">
                                  {prod.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px]">
                            {prod.category}
                          </span>
                        </td>

                        {/* Shelf Placement */}
                        <td className="py-3 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  shelfDef.location === 'cavity' ? 'bg-blue-500' : 'bg-indigo-500'
                                }`}
                              />
                              <span className="font-bold text-slate-800 text-[11px]">
                                {shelfDef.label}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Location: {shelfDef.location === 'cavity' ? 'Cabinet Cavity' : 'Door Storage'}
                            </span>
                          </div>
                        </td>

                        {/* Horizontal X */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-slate-600 font-bold">
                            {prod.positionX}%
                          </span>
                        </td>

                        {/* Scale */}
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-slate-600 font-bold">
                            {prod.displayScale}x
                          </span>
                        </td>

                        {/* Status Toggle */}
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
                              title="Click to toggle visibility in public refrigerator"
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
                              onClick={() => openEditModal(prod)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Product"
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

        {/* Live Refrigerator Preview Panel */}
        {isLivePreviewOpen && (
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-blue-600" />
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Live Fridge Preview
                </h3>
              </div>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                Real-Time Sync
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              This preview uses the exact same 3D refrigerator component rendered on the public
              page. Tap the door or handle to see products positioned in the cavity and door bins!
            </p>

            <div className="pt-2 flex justify-center overflow-visible">
              <UniversalSteelFridge
                isDoorOpen={true}
                yaw={-45}
                magneticRegion={{ top: 0.1, left: 0.1, width: 0.8, height: 0.8 }}
                surfaceRef={{ current: null }}
                products={products}
              >
                <div />
              </UniversalSteelFridge>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* ADD / EDIT PRODUCT MODAL */}
      {/* ---------------------------------------------------------------------- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base">
                  {editingProduct ? 'Edit Interior Product' : 'Add New Refrigerator Product'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingProduct
                    ? 'Modify placement, quantity, scale, or image properties'
                    : 'Place a new grocery or beverage item inside the refrigerator'}
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4 flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shelf Compartment & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Shelf Compartment *
                  </label>
                  <select
                    value={formShelf}
                    onChange={(e) => setFormShelf(e.target.value as FridgeShelf)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <optgroup label="Cabinet Cavity">
                      <option value="freezer">Top Freezer Compartment</option>
                      <option value="top_shelf">Upper Fresh Food Shelf</option>
                      <option value="middle_shelf">Middle Fresh Food Shelf</option>
                      <option value="bottom_shelf">Lower Fresh Food Shelf</option>
                      <option value="crisper_drawer">Crisper Humidity Drawer</option>
                    </optgroup>
                    <optgroup label="Door-Side Storage">
                      <option value="door_bin_top">Door Top Dairy Bin</option>
                      <option value="door_bin_middle">Door Middle Condiment Bin</option>
                      <option value="door_bin_bottom">Door Bottom Beverage Bin</option>
                    </optgroup>
                  </select>
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
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Horizontal Position X & Scale Sliders */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Position on Shelf (Horizontal X)
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {formPositionX}%
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="88"
                  value={formPositionX}
                  onChange={(e) => setFormPositionX(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>← Left Side</span>
                  <span>Center</span>
                  <span>Right Side →</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Display Scale
                  </span>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
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
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Organic notes, farm origin, or culinary pairing..."
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
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      formImageTab === 'approved' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Select Approved Asset
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormImageTab('upload')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      formImageTab === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Upload Custom Image
                  </button>
                </div>

                {formImageTab === 'approved' ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-2xl">
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
                          }}
                          className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <img
                            src={asset.path}
                            alt={asset.name}
                            className="w-10 h-10 object-contain"
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
              <div className="flex items-center gap-2 pt-2">
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

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-black text-xs shadow-md transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingProduct ? 'Save Changes' : 'Place in Fridge'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              className="text-slate-400 hover:text-white p-1 rounded-lg"
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
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-bold text-xs"
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
