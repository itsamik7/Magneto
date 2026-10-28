import React, { useState, useEffect } from 'react'
import type { AdminRole, AdminUser } from '../../types/admin'
import { ADMIN_ROLE_PERMISSIONS } from '../../types/admin'
import {
  getAdminUsers,
  assignAdminUserRole,
  revokeAdminUserRole,
  checkAdminPermission,
} from '../../services/adminService'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Trash2,
  Check,
  X,
  Info,
  Clock,
  Mail,
  User as UserIcon,
  Copy,
  AlertCircle,
} from 'lucide-react'

interface AdminRolesManagementProps {
  currentAdminEmail: string
  currentAdminRole: string
}

export const AdminRolesManagement: React.FC<AdminRolesManagementProps> = ({
  currentAdminEmail,
  currentAdminRole,
}) => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newRole, setNewRole] = useState<AdminRole>('operations_admin')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [copiedSql, setCopiedSql] = useState(false)

  const canManageRoles = checkAdminPermission(currentAdminRole, 'canManageRoles')

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const data = await getAdminUsers()
      setAdminUsers(data)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    setSubmitting(true)
    setFeedback(null)
    try {
      await assignAdminUserRole(
        newEmail.trim(),
        newDisplayName.trim(),
        newRole,
        { email: currentAdminEmail, role: currentAdminRole }
      )
      setFeedback({
        type: 'success',
        message: `Role ${ADMIN_ROLE_PERMISSIONS[newRole].label} assigned to ${newEmail.trim()} successfully.`,
      })
      setModalOpen(false)
      setNewEmail('')
      setNewDisplayName('')
      await loadAdmins()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to assign role.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async (admin: AdminUser) => {
    if (admin.email === '1amiteshk@gmail.com') {
      alert('Cannot revoke role from primary platform owner.')
      return
    }

    if (!confirm(`Are you sure you want to revoke admin privileges from ${admin.email}?`)) {
      return
    }

    try {
      await revokeAdminUserRole(admin.id, {
        email: currentAdminEmail,
        role: currentAdminRole,
      })
      setFeedback({
        type: 'success',
        message: `Admin access for ${admin.email} has been revoked.`,
      })
      await loadAdmins()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to revoke role.' })
    }
  }

  const handleCopySql = () => {
    const sql = `-- Grant Super Admin role directly in Supabase SQL editor:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = '1amiteshk@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;`
    navigator.clipboard.writeText(sql)
    setCopiedSql(true)
    setTimeout(() => setCopiedSql(false), 2500)
  }

  const rolesList: AdminRole[] = [
    'super_admin',
    'operations_admin',
    'advertising_manager',
    'billing_manager',
    'support_agent',
  ]

  const permissionsList = [
    { key: 'canManageSettings', label: 'Platform Settings & Controls' },
    { key: 'canManageRoles', label: 'RBAC Roles Assignment' },
    { key: 'canManageAdvertisements', label: 'Campaign Moderation & Approvals' },
    { key: 'canGlobalPauseAds', label: 'Global Ads Kill Switch' },
    { key: 'canManagePlacements', label: 'Placements & Capacity' },
    { key: 'canManagePlansAndPricing', label: 'Pricing Plans & Safeguards' },
    { key: 'canManageMerchants', label: 'Merchant Directory & Actions' },
    { key: 'canImpersonateMerchants', label: 'Merchant Support-View Session' },
    { key: 'canManageUsers', label: 'User Directory & Moderation' },
    { key: 'canViewFinancialsAndRefund', label: 'Financial Ledger & Refunds' },
    { key: 'canViewAuditLogs', label: 'Audit Trail Inspection' },
    { key: 'canExportData', label: 'CSV Intelligence Exports' },
  ] as const

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            Admin Roles &amp; Permissions (RBAC)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Configure administrative staff accounts, granular privilege tiers, and access safeguards.
          </p>
        </div>

        {canManageRoles && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm shadow-indigo-200"
          >
            <UserPlus className="w-4 h-4" />
            Assign Admin Role
          </button>
        )}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!canManageRoles && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Read-Only RBAC View</p>
            <p className="text-amber-800 mt-0.5">
              Your administrative role ({currentAdminRole}) can inspect existing administrative permissions, but only
              Super Administrators can provision or alter role assignments.
            </p>
          </div>
        </div>
      )}

      {/* Admin Users Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-semibold text-slate-900">Provisioned Admin Accounts</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified administrators with active session privileges across Magnetos control systems.
            </p>
          </div>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100">
            {adminUsers.length} Admin{adminUsers.length === 1 ? '' : 's'} Active
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading administrator accounts...</div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                  <th className="py-3 px-6">Administrator</th>
                  <th className="py-3 px-6">Assigned Role</th>
                  <th className="py-3 px-6">Role Scope</th>
                  <th className="py-3 px-6">Provisioned Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {adminUsers.map((admin) => {
                  const perm = ADMIN_ROLE_PERMISSIONS[admin.role] || ADMIN_ROLE_PERMISSIONS.operations_admin
                  const isOwner = admin.email === '1amiteshk@gmail.com'

                  return (
                    <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm">
                            {admin.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              {admin.displayName}
                              {isOwner && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded uppercase tracking-wide">
                                  Owner
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {admin.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            admin.role === 'super_admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : admin.role === 'operations_admin'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : admin.role === 'advertising_manager'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : admin.role === 'billing_manager'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}
                        >
                          {perm.label}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs line-clamp-2">
                        {perm.description}
                      </td>

                      <td className="py-4 px-6 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(admin.assignedAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {canManageRoles && !isOwner ? (
                          <button
                            onClick={() => handleRevoke(admin)}
                            title="Revoke Administrator Role"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permission Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">Privilege &amp; Capability Matrix</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-reference of operational permissions mapped strictly to administrative responsibility tiers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                <th className="py-3 px-6">Operational Capability</th>
                {rolesList.map((r) => (
                  <th key={r} className="py-3 px-4 text-center">
                    <span className="block font-bold text-slate-800 normal-case text-xs">
                      {ADMIN_ROLE_PERMISSIONS[r].label.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-400 normal-case font-normal">
                      {ADMIN_ROLE_PERMISSIONS[r].label.split(' ').slice(1).join(' ')}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {permissionsList.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-6 font-medium text-slate-700">{perm.label}</td>
                  {rolesList.map((role) => {
                    const hasPerm = ADMIN_ROLE_PERMISSIONS[role][perm.key]
                    return (
                      <td key={role} className="py-3 px-4 text-center">
                        {hasPerm ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                            <Check className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 text-slate-300">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Provisioning Reference Snippet */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Info className="w-4 h-4" />
              Direct Supabase Database Provisioning
            </div>
            <p className="text-xs text-slate-400 mt-1">
              For security compliance, Super Admins can also be assigned directly in the database via the SQL Editor.
            </p>
          </div>
          <button
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors self-start sm:self-center"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedSql ? 'Copied SQL' : 'Copy SQL'}
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-emerald-400 overflow-x-auto border border-slate-800">
{`-- Grant Super Admin role directly in Supabase SQL editor:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = '1amiteshk@gmail.com'
ON CONFLICT (user_id, role) DO UPDATE SET role = EXCLUDED.role;`}
        </pre>
      </div>

      {/* Modal for Assigning Admin Role */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Assign Administrator Role
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignRole} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  User Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. staff@magnetos.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  The account holder must register or sign in using this identical email.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aditi Sharma"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assign Administrative Role *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {ADMIN_ROLE_PERMISSIONS[r].label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">{ADMIN_ROLE_PERMISSIONS[newRole].label}</p>
                  <p className="mt-0.5">{ADMIN_ROLE_PERMISSIONS[newRole].description}</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
