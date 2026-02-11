'use client'

import { ChevronDown, ChevronRight, Trash2, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useState, useRef } from 'react'

import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { UserManagementPageSkeleton } from '@/components/ui/skeleton-loading'
import { PermissionCheckingSplash } from '@/components/ui/splash-screen'
import { type UserDocument, type RoleType } from '@/lib/firebase/firestore'
import { formatFirebaseTimestamp } from '@/lib/utils'
import { ROLES, ROLE_CATEGORIES, type CategoryType } from '@/lib/utils/constants'

interface ApiResponse {
  users: UserDocument[]
  pagination: {
    page: number
    total: number
    limit: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export default function AdminUserManagement() {
  const { data: session, status } = useSession()
  const currentUserRole = (session?.user as { role?: RoleType } | undefined)?.role

  const [users, setUsers] = useState<UserDocument[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [roleFilter, setRoleFilter] = useState<RoleType | 'All'>('All')
  const [search, setSearch] = useState<string>('')
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<UserDocument>>({})
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [hasNext, setHasNext] = useState<boolean>(false)
  const [hasPrev, setHasPrev] = useState<boolean>(false)

  // Request deduplication
  const loadingRef = useRef<AbortController | null>(null)

  const roleOptions: RoleType[] = useMemo(
    () => [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.PARTNER, ROLES.AGENT, ROLES.USER],
    [],
  )

  // Get all unique categories from all roles
  const allCategories: CategoryType[] = useMemo(() => {
    const categories = new Set<string>()
    Object.values(ROLE_CATEGORIES).forEach((roleCategories) => {
      roleCategories.forEach((category) => categories.add(category))
    })
    return Array.from(categories).sort()
  }, [])

  // Dropdown management functions
  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const closeAllDropdowns = () => {
    setOpenDropdowns(new Set())
  }

  // User expansion management
  const toggleUserExpansion = (userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  // Toggle Switch Component
  const ToggleSwitch = ({
    id: _id,
    checked,
    onChange,
    disabled = false,
  }: {
    id: string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
  }) => {
    return (
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          checked ? 'bg-blue-600 focus:ring-blue-500' : 'bg-gray-200 focus:ring-gray-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    )
  }

  const loadUsers = async (page: number = 1) => {
    // Cancel any existing request
    if (loadingRef.current) {
      loadingRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    loadingRef.current = controller

    try {
      setIsLoading(true)
      setError(null) // Clear previous errors

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(roleFilter !== 'All' && { role: roleFilter }),
        ...(search && { search }),
      })

      const res = await fetch(`/api/admin/users?${params}`, {
        signal: controller.signal,
        // Add cache headers to prevent unnecessary requests
        headers: {
          'Cache-Control': 'max-age=60', // Cache for 1 minute
        },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch users`)
      const json = (await res.json()) as ApiResponse

      // Check if request was aborted
      if (controller.signal.aborted) return

      setUsers(json.users)

      // Update pagination state
      if (json.pagination) {
        setCurrentPage(json.pagination.page)
        setTotalPages(Math.ceil(json.pagination.total / json.pagination.limit))
        setTotalUsers(json.pagination.total)
        setHasNext(json.pagination.hasNext)
        setHasPrev(json.pagination.hasPrev)
      }
    } catch (e) {
      // Don't show error if request was aborted
      if (e instanceof Error && e.name === 'AbortError') return

      console.error('Error loading users:', e)
      setError(e instanceof Error ? e.message : 'Failed to load users')
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
      loadingRef.current = null
    }
  }

  useEffect(() => {
    void loadUsers(1)

    // Cleanup on unmount
    return () => {
      if (loadingRef.current) {
        loadingRef.current.abort()
      }
    }
  }, [])

  // Refresh users data when session changes (after login)
  useEffect(() => {
    if (session) {
      void loadUsers(1)
    }
  }, [session])

  // Debounced search effect
  useEffect(() => {
    if (!session) return

    const timeoutId = setTimeout(
      () => {
        setCurrentPage(1)
        void loadUsers(1)
      },
      search ? 500 : 100,
    ) // 500ms debounce for search, 100ms for role filter

    return () => clearTimeout(timeoutId)
  }, [roleFilter, search, session])

  // Since filtering is now done server-side, we can use users directly
  const filteredUsers = users

  const isSessionLoading = status === 'loading'
  const canManage =
    !isSessionLoading && (currentUserRole === ROLES.SUPER_ADMIN || currentUserRole === ROLES.ADMIN)

  const handleRoleChange = async (targetUser: UserDocument, newRole: RoleType) => {
    if (!canManage) return
    if (!session?.user?.email) return

    // Admin cannot change SuperAdmin in any way
    if (currentUserRole === ROLES.ADMIN && targetUser.role === ROLES.SUPER_ADMIN) {
      setError(
        '❌ Admins cannot modify SuperAdmin users. Only SuperAdmins can manage SuperAdmin accounts.',
      )
      return
    }

    // Additionally, prevent Admin from setting anyone to SuperAdmin
    if (currentUserRole === ROLES.ADMIN && newRole === ROLES.SUPER_ADMIN) {
      setError(
        '❌ Admins cannot assign SuperAdmin role. Only existing SuperAdmins can promote users to SuperAdmin.',
      )
      return
    }

    try {
      setError(null)
      await fetch(`/api/admin/users/${targetUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      setUsers((prev) => prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: newRole } : u)))
    } catch (_e) {
      setError('Failed to update role')
    }
  }

  const handleCategoryChange = async (targetUser: UserDocument, newCategory: string) => {
    if (!canManage) return
    // Admin cannot update SuperAdmin's category
    if (currentUserRole === ROLES.ADMIN && targetUser.role === ROLES.SUPER_ADMIN) {
      setError(
        '❌ Admins cannot modify SuperAdmin categories. Only SuperAdmins can manage SuperAdmin accounts.',
      )
      return
    }
    try {
      setError(null)
      await fetch(`/api/admin/users/${targetUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      })
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, category: newCategory } : u)),
      )
    } catch (_e) {
      setError('Failed to update category')
    }
  }

  const handleStatusChange = async (targetUser: UserDocument, newStatus: boolean) => {
    if (!canManage) return
    if (currentUserRole === ROLES.ADMIN && targetUser.role === ROLES.SUPER_ADMIN) {
      setError(
        '❌ Admins cannot modify SuperAdmin status. Only SuperAdmins can manage SuperAdmin accounts.',
      )
      return
    }
    try {
      setError(null)
      await fetch(`/api/admin/users/${targetUser.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === targetUser.uid
            ? {
                ...u,
                metadata: {
                  ...u.metadata,
                  isActive: newStatus,
                },
              }
            : u,
        ),
      )
    } catch (_e) {
      setError('Failed to update status')
    }
  }

  const handleDeleteUser = async (targetUser: UserDocument) => {
    if (!canManage) return
    if (currentUserRole === ROLES.ADMIN && targetUser.role === ROLES.SUPER_ADMIN) {
      setError(
        '❌ Admins cannot delete SuperAdmin users. Only SuperAdmins can manage SuperAdmin accounts.',
      )
      return
    }
    if (confirm(`Are you sure you want to delete ${targetUser.email}?`)) {
      try {
        setError(null)
        await fetch(`/api/admin/users/${targetUser.uid}`, {
          method: 'DELETE',
        })
        setUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid))
      } catch (_e) {
        setError('Failed to delete user')
      }
    }
  }

  const startEditing = (user: UserDocument) => {
    setEditingUser(user.uid)
    setEditForm({
      profile: {
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        gender: user.profile?.gender || 'Other',
        dateOfBirth: user.profile?.dateOfBirth || '',
        mobile: user.profile?.mobile || '',
        avatar: user.profile?.avatar || '',
      },
    })
  }

  const cancelEditing = () => {
    setEditingUser(null)
    setEditForm({})
  }

  const saveEditing = async (user: UserDocument) => {
    if (!canManage) return
    if (currentUserRole === ROLES.ADMIN && user.role === ROLES.SUPER_ADMIN) {
      setError(
        '❌ Admins cannot edit SuperAdmin profiles. Only SuperAdmins can manage SuperAdmin accounts.',
      )
      return
    }
    try {
      setError(null)
      await fetch(`/api/admin/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: editForm.profile }),
      })
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === user.uid
            ? {
                ...u,
                profile: {
                  ...u.profile,
                  ...editForm.profile,
                },
              }
            : u,
        ),
      )
      setEditingUser(null)
      setEditForm({})
    } catch (_e) {
      setError('Failed to update user profile')
    }
  }

  if (isSessionLoading) {
    return <PermissionCheckingSplash />
  }

  if (!canManage) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground">Only SuperAdmin and Admin can manage users.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                User Management
              </h1>
              <button
                onClick={() => void loadUsers(currentPage)}
                disabled={isLoading}
                className="p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30 transition-colors duration-200 disabled:opacity-50"
                title="Refresh users data"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View all users, their roles and categories. Update as needed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Search by name, email, or category"
              className="h-9 w-full sm:w-64 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users by name, email, or category"
            />
            <div className="w-full sm:w-32">
              <CustomDropdown
                id="admin-role-filter"
                value={roleFilter}
                options={[
                  { value: 'All', label: 'All Roles' },
                  ...roleOptions.map((r) => ({ value: r, label: r })),
                ]}
                onChange={(value) => setRoleFilter(value as RoleType | 'All')}
                openDropdowns={openDropdowns}
                onToggleDropdown={toggleDropdown}
                onCloseAllDropdowns={closeAllDropdowns}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
        </div>
      )}

      {currentUserRole === ROLES.ADMIN && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Admin Notice:</strong> As an Admin, you cannot modify SuperAdmin users.
            SuperAdmin accounts can only be managed by other SuperAdmins.
          </div>
        </div>
      )}

      {isLoading && filteredUsers.length === 0 ? (
        <UserManagementPageSkeleton />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-white/30 bg-white/20 backdrop-blur-md shadow-lg relative">
            {isLoading && filteredUsers.length > 0 && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-lg shadow-lg">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Loading...</span>
                </div>
              </div>
            )}
            <table className="min-w-full text-sm">
              <thead className="bg-white/20 backdrop-blur-sm">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => {
                  const fullName =
                    `${user.profile?.firstName ?? ''} ${user.profile?.lastName ?? ''}`.trim()
                  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN
                  const disableAdminActions = currentUserRole === ROLES.ADMIN && isSuperAdmin
                  return (
                    <tr
                      key={user.uid ?? `${user.email}-${idx}`}
                      className={`border-t border-white/30 hover:bg-white/10 transition-colors ${disableAdminActions ? 'opacity-75' : ''}`}
                    >
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                        {fullName || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{user.email}</td>
                      <td className="px-4 py-3">
                        <div className="w-32">
                          <CustomDropdown
                            id={`admin-role-${user.uid}`}
                            value={user.role}
                            options={roleOptions.map((r) => ({ value: r, label: r }))}
                            onChange={(value) => void handleRoleChange(user, value as RoleType)}
                            disabled={disableAdminActions}
                            openDropdowns={openDropdowns}
                            onToggleDropdown={toggleDropdown}
                            onCloseAllDropdowns={closeAllDropdowns}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-40">
                          <CustomDropdown
                            id={`admin-category-${user.uid}`}
                            value={user.category ?? ''}
                            options={allCategories.map((cat) => ({ value: cat, label: cat }))}
                            onChange={(value) => void handleCategoryChange(user, value)}
                            disabled={disableAdminActions}
                            placeholder="Select category"
                            openDropdowns={openDropdowns}
                            onToggleDropdown={toggleDropdown}
                            onCloseAllDropdowns={closeAllDropdowns}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {user.metadata?.isActive ? 'Active' : 'Inactive'}
                      </td>
                    </tr>
                  )
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-600 dark:text-gray-400"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 overflow-visible relative z-0">
            {isLoading && filteredUsers.length > 0 && (
              <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                <div className="flex items-center space-x-2 bg-white/80 dark:bg-gray-800/80 px-4 py-2 rounded-lg shadow-lg">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Loading...</span>
                </div>
              </div>
            )}
            {filteredUsers.map((user, idx) => {
              const fullName =
                `${user.profile?.firstName ?? ''} ${user.profile?.lastName ?? ''}`.trim()
              const isSuperAdmin = user.role === ROLES.SUPER_ADMIN
              const disableAdminActions = currentUserRole === ROLES.ADMIN && isSuperAdmin
              const disableStatusChange = currentUserRole === ROLES.ADMIN && isSuperAdmin
              const canDeleteUser =
                currentUserRole === ROLES.SUPER_ADMIN ||
                (currentUserRole === ROLES.ADMIN &&
                  (user.role === 'Staff' || user.role === 'Partner' || user.role === 'Agent'))

              // Get categories available for this user's role
              const availableCategories = ROLE_CATEGORIES[user.role] || []

              const isExpanded = expandedUsers.has(user.uid)
              const isEditing = editingUser === user.uid

              return (
                <div
                  key={user.uid ?? `${user.email}-${idx}`}
                  className="group rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/15 overflow-visible relative z-0"
                >
                  {/* User Card Header */}
                  <div className="p-6">
                    {/* Header with Avatar and Actions */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                          {fullName
                            ? fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                            : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {fullName || 'Unnamed User'}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleUserExpansion(user.uid)}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors duration-200 group-hover:bg-white/30"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>

                    {/* Status Pills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 shadow-sm">
                        {user.role}
                      </span>
                      <span
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                          user.metadata?.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}
                      >
                        {user.metadata?.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {user.category && (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm">
                          {user.category}
                        </span>
                      )}
                    </div>

                    {/* Last Login Info */}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      <span className="font-medium">Last Login:</span>{' '}
                      {formatFirebaseTimestamp(user.metadata?.lastLoginAt)}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3 overflow-visible relative z-0">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                          Role
                        </label>
                        <CustomDropdown
                          id={`mobile-role-${user.uid}`}
                          value={user.role}
                          options={roleOptions.map((r) => ({ value: r, label: r }))}
                          onChange={(value) => void handleRoleChange(user, value as RoleType)}
                          disabled={disableAdminActions}
                          openDropdowns={openDropdowns}
                          onToggleDropdown={toggleDropdown}
                          onCloseAllDropdowns={closeAllDropdowns}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                          Category
                        </label>
                        <CustomDropdown
                          id={`mobile-category-${user.uid}`}
                          value={user.category ?? ''}
                          options={[
                            { value: '', label: 'Select Category' },
                            ...availableCategories.map((category) => ({
                              value: category,
                              label: category,
                            })),
                          ]}
                          onChange={(value) => void handleCategoryChange(user, value)}
                          disabled={disableAdminActions}
                          openDropdowns={openDropdowns}
                          onToggleDropdown={toggleDropdown}
                          onCloseAllDropdowns={closeAllDropdowns}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                          Status
                        </label>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {user.metadata?.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <ToggleSwitch
                            id={`mobile-status-${user.uid}`}
                            checked={user.metadata?.isActive ?? false}
                            onChange={(checked) => void handleStatusChange(user, checked)}
                            disabled={disableStatusChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-gradient-to-br from-white/5 to-white/10 border-t border-white/10 overflow-visible relative z-0">
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            User Details
                          </h4>
                          <div className="flex gap-2">
                            {canDeleteUser && (
                              <button
                                onClick={() => void handleDeleteUser(user)}
                                className="px-4 py-2 text-sm font-medium bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-200 hover:shadow-lg flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                              </button>
                            )}
                            {!isEditing && !disableAdminActions && (
                              <button
                                onClick={() => startEditing(user)}
                                className="px-4 py-2 text-sm font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all duration-200 hover:shadow-lg"
                              >
                                Edit Details
                              </button>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <div className="space-y-6 overflow-visible relative z-0">
                            <div className="grid grid-cols-1 gap-4 overflow-visible relative z-0">
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                  First Name
                                </label>
                                <input
                                  type="text"
                                  value={editForm.profile?.firstName || ''}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      profile: { ...prev.profile!, firstName: e.target.value },
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                  placeholder="Enter first name"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                  Last Name
                                </label>
                                <input
                                  type="text"
                                  value={editForm.profile?.lastName || ''}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      profile: { ...prev.profile!, lastName: e.target.value },
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                  placeholder="Enter last name"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                  Mobile
                                </label>
                                <input
                                  type="text"
                                  value={editForm.profile?.mobile || ''}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      profile: { ...prev.profile!, mobile: e.target.value },
                                    }))
                                  }
                                  className="w-full px-3 py-2 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                  placeholder="Enter mobile number"
                                />
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() => void saveEditing(user)}
                                className="px-4 py-2 text-sm font-medium bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-500/30 transition-all duration-200 hover:shadow-lg"
                              >
                                Save Changes
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="px-4 py-2 text-sm font-medium bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded-xl hover:bg-gray-500/30 transition-all duration-200 hover:shadow-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                  First Name
                                </label>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {user.profile?.firstName || 'Not provided'}
                                </span>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                  Last Name
                                </label>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {user.profile?.lastName || 'Not provided'}
                                </span>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                                  Mobile
                                </label>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {user.profile?.mobile || 'Not provided'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {filteredUsers.length === 0 && (
              <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg text-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">No users found.</div>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div
            className={`mt-6 transition-opacity duration-200 ${totalPages > 1 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isLoading ? (
                  <div className="h-5 w-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                ) : (
                  `Showing ${(currentPage - 1) * 20 + 1} to ${Math.min(currentPage * 20, totalUsers)} of ${totalUsers} users`
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => void loadUsers(currentPage - 1)}
                  disabled={!hasPrev || isLoading}
                  className="px-3 py-2 text-sm font-medium bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    if (pageNum > totalPages) return null

                    return (
                      <button
                        key={pageNum}
                        onClick={() => void loadUsers(pageNum)}
                        disabled={isLoading}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          pageNum === currentPage
                            ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                            : 'bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 hover:bg-white/30 dark:hover:bg-white/20'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => void loadUsers(currentPage + 1)}
                  disabled={!hasNext || isLoading}
                  className="px-3 py-2 text-sm font-medium bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
