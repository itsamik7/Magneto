import React, { useState, useEffect, useMemo } from 'react'
import type { UserAccount } from '../../types/admin'
import {
  getAllUsers,
  getUserFullDetails,
  updateUserAccountStatus,
  triggerUserPasswordReset,
  recordAuditLog,
  USERS_UPDATED_EVENT,
} from '../../services/adminService'
import {
  Users,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RotateCcw,
  Compass,
  DollarSign,
  Calendar,
  Layers,
  X,
  FileText,
  Mail,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react'

interface AdminUserManagementProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  currentAdminEmail,
  currentAdminRole,
}) => {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)

  // User inspection modal / drawer
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null)
  const [userDetails, setUserDetails] = useState<{
    trips: any[]
    savings: any[]
    checklistCount: number
  } | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Status edit modal
  const [editingStatusUser, setEditingStatusUser] = useState<UserAccount | null>(null)
  const [newStatus, setNewStatus] = useState<'active' | 'suspended' | 'restricted'>('active')
  const [statusReason, setStatusReason] = useState('')

  // Support note editor
  const [supportNoteInput, setSupportNoteInput] = useState('')

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const loadUsersList = async () => {
    try {
      const uList = await getAllUsers({ searchQuery, accountStatus: statusFilter })
      setUsers(uList)
    } catch (e: any) {
      console.error('Failed to load users:', e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsersList()
    const handleUpdate = () => loadUsersList()
    window.addEventListener(USERS_UPDATED_EVENT, handleUpdate)
    return () => window.removeEventListener(USERS_UPDATED_EVENT, handleUpdate)
  }, [searchQuery, statusFilter])

  // Open User Inspection Drawer
  const handleInspectUser = async (u: UserAccount) => {
    setSelectedUser(u)
    setSupportNoteInput(u.supportNotes || '')
    setIsLoadingDetails(true)
    try {
      const details = await getUserFullDetails(u.id)
      setUserDetails(details)
    } catch {
      setUserDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Handle Account Status Change
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStatusUser) return

    try {
      await updateUserAccountStatus(
        editingStatusUser.id,
        newStatus,
        statusReason.trim() || undefined,
        { email: currentAdminEmail, role: currentAdminRole }
      )
      setToast({
        type: 'success',
        text: `User account "${editingStatusUser.displayName}" status updated to ${newStatus.toUpperCase()}.`,
      })
      setEditingStatusUser(null)
      setStatusReason('')
      if (selectedUser?.id === editingStatusUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, accountStatus: newStatus } : null))
      }
      loadUsersList()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to update user status' })
    }
  }

  // Handle Password Reset Trigger
  const handlePasswordReset = async (u: UserAccount) => {
    if (window.confirm(`Dispatch password reset link to ${u.email}?`)) {
      try {
        const res = await triggerUserPasswordReset(u.id, u.email, {
          email: currentAdminEmail,
          role: currentAdminRole,
        })
        setToast({ type: 'success', text: res.message })
      } catch (err: any) {
        setToast({ type: 'error', text: err.message })
      }
    }
  }

  // Save Support Note directly from Drawer
  const handleSaveSupportNote = async () => {
    if (!selectedUser) return
    try {
      await updateUserAccountStatus(
        selectedUser.id,
        selectedUser.accountStatus,
        supportNoteInput.trim(),
        { email: currentAdminEmail, role: currentAdminRole }
      )
      setSelectedUser((prev) => (prev ? { ...prev, supportNotes: supportNoteInput.trim() } : null))
      setToast({ type: 'success', text: 'Support note saved for user.' })
      loadUsersList()
    } catch (err: any) {
      setToast({ type: 'error', text: err.message })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{toast.text}</span>
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
            User Accounts Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Directory of registered Magnetos travelers, travel fridges, target budgets, and account status controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            {users.length} Users Listed
          </span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or user ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500">Account Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-900 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="suspended">Suspended</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User & Contact</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Virtual Fridge & Trips</th>
                <th className="py-3 px-4">Total Saved</th>
                <th className="py-3 px-4">Member Since</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-heading font-black text-xs shadow-xs flex-shrink-0">
                        {u.displayName[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <span className="font-heading font-black text-slate-900 block truncate">
                          {u.displayName}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {u.email}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 block">ID: {u.id}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                        u.accountStatus === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : u.accountStatus === 'suspended'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {u.accountStatus}
                    </span>
                    {u.reportedAbuse && (
                      <span className="block text-[9px] text-rose-600 font-bold mt-0.5">
                        ⚠️ Abuse Report Attached
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    <span className="font-bold block">{u.tripsCount} Planned Trip(s)</span>
                    <span className="text-[10px] text-slate-500">{u.magnetsCount} Fridge Souvenir Magnet(s)</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-heading font-black text-slate-900 block">
                      ₹ {(u.totalSavedMinor / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400">Total verified savings</span>
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleInspectUser(u)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Inspect User Fridge & Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingStatusUser(u)
                          setNewStatus(u.accountStatus)
                          setStatusReason(u.supportNotes || '')
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        Status
                      </button>

                      <button
                        onClick={() => handlePasswordReset(u)}
                        className="p-1 text-slate-400 hover:text-blue-600 rounded-lg"
                        title="Send Password Reset"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 
        ========================================================================
        USER INSPECTION MODAL DRAWER
        ========================================================================
      */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-heading font-black text-sm shadow-xs">
                  {selectedUser.displayName[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900">
                    {selectedUser.displayName}
                  </h3>
                  <span className="text-xs text-slate-500">{selectedUser.email} • ID: {selectedUser.id}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Account Status Badge & Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Status</span>
                <span
                  className={`text-xs font-mono font-bold uppercase ${
                    selectedUser.accountStatus === 'active'
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {selectedUser.accountStatus}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Trips Created</span>
                <span className="text-xs font-bold text-slate-900">
                  {selectedUser.tripsCount} Planned Trips
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Fridge Savings</span>
                <span className="text-xs font-bold text-emerald-700">
                  ₹ {(selectedUser.totalSavedMinor / 100).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Travel Trips Details Section */}
            <div>
              <h4 className="font-heading font-black text-xs uppercase tracking-wider text-slate-500 mb-2">
                Travel Itineraries & Savings Progress
              </h4>
              {isLoadingDetails ? (
                <div className="p-4 text-center text-xs text-slate-500">Loading trip data...</div>
              ) : userDetails?.trips && userDetails.trips.length > 0 ? (
                <div className="space-y-2">
                  {userDetails.trips.map((t: any) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-heading font-black text-slate-900 block">
                          {t.destination_name}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Magnet Key: {t.magnet_key} • Target: ₹ {((t.target_budget_minor || 0) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {t.start_date ? `${t.start_date} to ${t.end_date}` : 'Flexible Dates'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 text-center">
                  User currently has {selectedUser.tripsCount} destination(s) placed on their refrigerator.
                </div>
              )}
            </div>

            {/* Administrative Support Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                Internal Administrative & Support Notes
              </label>
              <textarea
                rows={3}
                value={supportNoteInput}
                onChange={(e) => setSupportNoteInput(e.target.value)}
                placeholder="Add confidential moderation or customer support context..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveSupportNote}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-heading font-bold text-xs cursor-pointer shadow-xs"
                >
                  Save Internal Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        STATUS EDIT MODAL
        ========================================================================
      */}
      {editingStatusUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <form
            onSubmit={handleSaveStatus}
            className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-slate-900">
                Update Account Status: {editingStatusUser.displayName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingStatusUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Account Status *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900"
              >
                <option value="active">Active (Full Access)</option>
                <option value="suspended">Suspended (Login Blocked)</option>
                <option value="restricted">Restricted (Read-Only Mode)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason / Internal Notes
              </label>
              <textarea
                rows={2}
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for suspension or restriction..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingStatusUser(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Save Account Status
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
