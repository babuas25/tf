'use client'

import { ChevronDown, ChevronRight, Trash2, RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'

import SuperAdminFixer from '@/components/debug/SuperAdminFixer'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { UserManagementCompactSkeleton } from '@/components/ui/skeleton-loading'
import { type UserDocument, type RoleType } from '@/lib/firebase/firestore'
import { formatFirebaseTimestamp } from '@/lib/utils'
import { ROLES, ROLE_CATEGORIES } from '@/lib/utils/constants'

export default function SuperAdminUserManagement() {
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
  const lastLoadKeyRef = useRef<string>('')

  const roleOptions: RoleType[] = useMemo(
    () => [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.PARTNER, ROLES.AGENT, ROLES.USER],
    [],
  )
  const allCategories = useMemo(() => {
    const categories = new Set<string>()
    Object.values(ROLE_CATEGORIES).forEach((roleCategories) => {
      roleCategories.forEach((category) => categories.add(category))
    })
    return Array.from(categories)
  }, [])

  const isRoleType = (value: unknown): value is RoleType =>
    (roleOptions as readonly string[]).includes(value as string)

  const getNormalizedRole = (rawRole: string): RoleType | null => {
    const normalized = rawRole.trim().toLowerCase()
    const matchedRole = roleOptions.find((role) => role.toLowerCase() === normalized)
    return matchedRole ?? null
  }

  const toggleDropdown = (id: string) => {
    setOpenDropdowns((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.clear()
        next.add(id)
      }
      return next
    })
  }

  const closeAllDropdowns = () => {
    setOpenDropdowns(new Set())
  }

  type UsersResponse = {
    users: UserDocument[]
  }

  const isUsersResponse = (raw: unknown): raw is UsersResponse =>
    !!raw &&
    typeof raw === 'object' &&
    'users' in raw &&
    Array.isArray((raw as { users: unknown }).users)

  const loadUsers = async (force: boolean = false) => {
    const requestKey = `users:${currentUserRole ?? 'unknown'}`
    if (!force && lastLoadKeyRef.current === requestKey) return
    lastLoadKeyRef.current = requestKey

    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('fetch')
      const raw: unknown = await res.json()
      if (!isUsersResponse(raw)) {
        setUsers([])
        return
      }

      setUsers(raw.users)
    } catch (_e) {
      lastLoadKeyRef.current = ''
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'authenticated') return

    const hasAccess = currentUserRole === ROLES.SUPER_ADMIN || currentUserRole === ROLES.ADMIN
    if (!hasAccess) return

    void loadUsers()
  }, [status, currentUserRole])

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => roleFilter === 'All' || u.role === roleFilter)
      .filter((u) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        const name = (u.profile?.firstName ?? '') + ' ' + (u.profile?.lastName ?? '')
        return (
          u.email.toLowerCase().includes(q) ||
          name.toLowerCase().includes(q) ||
          (u.category?.toLowerCase() ?? '').includes(q)
        )
      })
  }, [users, roleFilter, search])

  const toggleUserExpansion = (uid: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) {
        next.delete(uid)
      } else {
        next.add(uid)
      }
      return next
    })
  }

  const handleRoleChange = async (targetUser: UserDocument, newRole: RoleType) => {
    const canManage =
      currentUserRole === ROLES.SUPER_ADMIN ||
      (currentUserRole === ROLES.ADMIN && targetUser.role !== ROLES.SUPER_ADMIN)
    if (!canManage) return

    try {
      setError(null)
      const res = await fetch('/api/admin/users/' + targetUser.uid, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error('Failed to update role')
      setUsers((prev) => prev.map((u) => (u.uid === targetUser.uid ? { ...u, role: newRole } : u)))
      closeAllDropdowns()
    } catch (_e) {
      setError('Failed to update role')
    }
  }

  const handleCategoryChange = async (targetUser: UserDocument, newCategory: string) => {
    const canManage =
      currentUserRole === ROLES.SUPER_ADMIN ||
      (currentUserRole === ROLES.ADMIN && targetUser.role !== ROLES.SUPER_ADMIN)
    if (!canManage) return

    try {
      setError(null)
      const res = await fetch('/api/admin/users/' + targetUser.uid, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory }),
      })
      if (!res.ok) throw new Error('Failed to update category')
      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, category: newCategory } : u)),
      )
      closeAllDropdowns()
    } catch (_e) {
      setError('Failed to update category')
    }
  }

  const handleStatusChange = async (targetUser: UserDocument, newStatus: boolean) => {
    const canManage =
      currentUserRole === ROLES.SUPER_ADMIN ||
      (currentUserRole === ROLES.ADMIN && targetUser.role !== ROLES.SUPER_ADMIN)
    if (!canManage) return

    try {
      setError(null)
      const res = await fetch('/api/admin/users/' + targetUser.uid, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === targetUser.uid
            ? {
                ...u,
                metadata: { ...u.metadata, isActive: newStatus } as UserDocument['metadata'],
              }
            : u,
        ),
      )
    } catch (_e) {
      setError('Failed to update status')
    }
  }

  const handleDeleteUser = async (targetUser: UserDocument) => {
    const canManage =
      currentUserRole === ROLES.SUPER_ADMIN ||
      (currentUserRole === ROLES.ADMIN &&
        (targetUser.role === ROLES.STAFF ||
          targetUser.role === ROLES.PARTNER ||
          targetUser.role === ROLES.AGENT))
    if (!canManage) {
      setError('You do not have permission to delete this user')
      return
    }

    if (
      !confirm(
        'Are you sure you want to delete user "' +
          targetUser.email +
          '"? This action cannot be undone.',
      )
    ) {
      return
    }

    try {
      setError(null)
      await fetch('/api/admin/users/' + targetUser.uid, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      setUsers((prev) => prev.filter((u) => u.uid !== targetUser.uid))
    } catch (_e) {
      setError('Failed to delete user')
    }
  }

  const startEditing = (targetUser: UserDocument) => {
    setEditingUser(targetUser.uid)
    setEditForm({
      profile: { ...targetUser.profile },
      ...(targetUser.category !== undefined ? { category: targetUser.category } : {}),
      metadata: { ...targetUser.metadata },
    })
  }

  const cancelEditing = () => {
    setEditingUser(null)
    setEditForm({})
  }

  const saveUserDetails = async (targetUser: UserDocument) => {
    const canManage =
      currentUserRole === ROLES.SUPER_ADMIN ||
      (currentUserRole === ROLES.ADMIN && targetUser.role !== ROLES.SUPER_ADMIN)
    if (!canManage) return

    try {
      setError(null)
      await fetch('/api/admin/users/' + targetUser.uid, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: editForm.profile,
          category: editForm.category,
          isActive: editForm.metadata?.isActive,
        }),
      })

      setUsers((prev) =>
        prev.map((u) => {
          if (u.uid === targetUser.uid) {
            const updatedUser: UserDocument = {
              ...u,
              profile: { ...u.profile, ...editForm.profile } as UserDocument['profile'],
              metadata: {
                ...u.metadata,
                isActive: editForm.metadata?.isActive ?? u.metadata?.isActive,
              } as UserDocument['metadata'],
            }

            if (editForm.category !== undefined) {
              updatedUser.category = editForm.category
            }

            return updatedUser
          }
          return u
        }),
      )

      cancelEditing()
    } catch (_e) {
      setError('Failed to update user details')
    }
  }

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
    const bgClass = checked
      ? 'bg-gradient-to-r from-green-500/80 to-emerald-500/80 backdrop-blur-sm border border-green-400/30'
      : 'bg-gradient-to-r from-gray-400/60 to-gray-500/60 backdrop-blur-sm border border-gray-400/30'

    const translateClass = checked ? 'translate-x-6' : 'translate-x-1'

    return (
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ' +
          bgClass
        }
      >
        <span
          className={
            'inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ' +
            translateClass
          }
        />
      </button>
    )
  }

  if (status === 'loading') {
    return (
      <div className="pt-2 px-2 md:px-3">
        <UserManagementCompactSkeleton />
      </div>
    )
  }

  const canManage = currentUserRole === ROLES.SUPER_ADMIN || currentUserRole === ROLES.ADMIN

  if (!canManage) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Access Denied</h1>
        <p className="text-sm text-muted-foreground">Only SuperAdmin and Admin can manage users.</p>
      </div>
    )
  }

  const spinClass = isLoading ? 'animate-spin' : ''

  if (isLoading && users.length === 0) {
    return (
      <div className="pt-2 px-2 md:px-3">
        <UserManagementCompactSkeleton />
      </div>
    )
  }

  return (
    <div className="pt-2 px-2 md:px-3 space-y-5">
      <div className="p-4 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                User Management
              </h1>
              <button
                onClick={() => void loadUsers(true)}
                disabled={isLoading}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 disabled:opacity-50"
                title="Refresh users data"
              >
                <RefreshCw className={'h-4 w-4 ' + spinClass} />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              View all users, their roles and categories. Update as needed.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative z-10">
            <input
              id="user-search"
              name="user-search"
              type="text"
              placeholder="Search by name, email, or category"
              className="h-9 w-full sm:w-64 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm px-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search users by name, email, or category"
            />
            <div className="w-full sm:w-32">
              <CustomDropdown
                id="role-filter"
                value={roleFilter}
                options={[
                  { value: 'All', label: 'All Roles' },
                  ...roleOptions.map((r) => ({ value: r, label: r })),
                ]}
                onChange={(value) => {
                  if (value === 'All' || isRoleType(value)) {
                    setRoleFilter(value)
                  }
                }}
                openDropdowns={openDropdowns}
                onToggleDropdown={toggleDropdown}
                onCloseAllDropdowns={closeAllDropdowns}
              />
            </div>
          </div>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && <SuperAdminFixer />}

      {error && (
        <div className="p-4 bg-red-500/20 backdrop-blur-md border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
        </div>
      )}

      <>
          <div className="hidden md:block overflow-x-auto rounded-xl border border-white/30 bg-white/20 backdrop-blur-md shadow-lg overflow-visible">
            <table className="min-w-full text-sm">
              <thead className="bg-[hsla(var(--primary)/0.10)] backdrop-blur-sm ring-1 ring-[hsl(var(--primary))/60]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100 w-8"></th>
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
                  <th className="text-left px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => {
                  const fullName =
                    (user.profile?.firstName ?? '') + ' ' + (user.profile?.lastName ?? '')
                  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN
                  const disableAdminActions = currentUserRole === ROLES.ADMIN && isSuperAdmin
                  const disableStatusChange = currentUserRole === ROLES.ADMIN && isSuperAdmin
                  const canDeleteUser =
                    currentUserRole === ROLES.SUPER_ADMIN ||
                    (currentUserRole === ROLES.ADMIN &&
                      (user.role === ROLES.STAFF ||
                        user.role === ROLES.PARTNER ||
                        user.role === ROLES.AGENT))

                  const normalizedRole = getNormalizedRole(user.role)
                  const availableCategories =
                    (normalizedRole ? ROLE_CATEGORIES[normalizedRole] : null) || allCategories
                  const isExpanded = expandedUsers.has(user.uid)
                  const isEditing = editingUser === user.uid

                  return (
                    <Fragment key={user.uid ?? user.email + '-' + idx}>
                      <tr className="border-t border-white/30 hover:bg-white/10 transition-colors">
                        <td className="px-2 py-3">
                          <button
                            onClick={() => toggleUserExpansion(user.uid)}
                            className="p-1 hover:bg-white/20 rounded transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400 group-hover:text-primary" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                          {fullName.trim() || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{user.email}</td>
                        <td className="px-4 py-3">
                          <div className="w-32">
                            <CustomDropdown
                              id={'desktop-role-' + user.uid}
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
                              id={'desktop-category-' + user.uid}
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
                              placeholder="Select Category"
                              openDropdowns={openDropdowns}
                              onToggleDropdown={toggleDropdown}
                              onCloseAllDropdowns={closeAllDropdowns}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <ToggleSwitch
                              id={'desktop-status-' + user.uid}
                              checked={user.metadata?.isActive ?? false}
                              onChange={(checked) => void handleStatusChange(user, checked)}
                              disabled={disableStatusChange}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            {canDeleteUser && (
                              <button
                                onClick={() => void handleDeleteUser(user)}
                                className="p-2 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 transition-colors duration-200"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-white/10">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  User Details
                                </h4>
                                {!isEditing && !disableAdminActions && (
                                  <button
                                    onClick={() => startEditing(user)}
                                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                                  >
                                    Edit Details
                                  </button>
                                )}
                              </div>

                              {isEditing ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        First Name
                                      </label>
                                      <input
                                        type="text"
                                        value={editForm.profile?.firstName || ''}
                                        onChange={(e) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            profile: {
                                              ...prev.profile,
                                              firstName: e.target.value,
                                              lastName: prev.profile?.lastName || '',
                                              gender: prev.profile?.gender || 'Other',
                                              dateOfBirth: prev.profile?.dateOfBirth || '',
                                              mobile: prev.profile?.mobile || '',
                                              avatar: prev.profile?.avatar || '',
                                            },
                                          }))
                                        }
                                        className="w-full h-8 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm px-2 text-sm text-gray-900 dark:text-gray-100"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Last Name
                                      </label>
                                      <input
                                        type="text"
                                        value={editForm.profile?.lastName || ''}
                                        onChange={(e) =>
                                          setEditForm((prev) => ({
                                            ...prev,
                                            profile: {
                                              ...prev.profile,
                                              lastName: e.target.value,
                                              firstName: prev.profile?.firstName || '',
                                              gender: prev.profile?.gender || 'Other',
                                              dateOfBirth: prev.profile?.dateOfBirth || '',
                                              mobile: prev.profile?.mobile || '',
                                              avatar: prev.profile?.avatar || '',
                                            },
                                          }))
                                        }
                                        className="w-full h-8 rounded-lg border border-white/30 bg-white/20 backdrop-blur-sm px-2 text-sm text-gray-900 dark:text-gray-100"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => void saveUserDetails(user)}
                                      className="px-4 py-2 bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                    >
                                      Save Changes
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="px-4 py-2 bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      Full Name:
                                    </span>
                                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                                      {fullName.trim() || 'Not provided'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      Email:
                                    </span>
                                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                                      {user.email}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      Created At:
                                    </span>
                                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                                      {formatFirebaseTimestamp(user.metadata?.createdAt)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                      Last Login:
                                    </span>
                                    <span className="ml-2 text-gray-900 dark:text-gray-100">
                                      {formatFirebaseTimestamp(user.metadata?.lastLoginAt)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
                {filteredUsers.length === 0 && !isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-gray-600 dark:text-gray-400"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && !isLoading && (
            <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg text-center">
              <p className="text-gray-600 dark:text-gray-400">No users found.</p>
            </div>
          )}
      </>
    </div>
  )
}
