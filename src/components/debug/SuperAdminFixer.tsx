'use client'

import { useState } from 'react'
import { Settings, Shield, RefreshCw, Users, AlertCircle } from 'lucide-react'

interface User {
  uid: string
  email: string
  role: string
  category: string
  firstName: string
  lastName: string
  isActive: boolean
  isSuperAdminEmail: boolean
}

interface FixResult {
  success: boolean
  message?: string
  users?: User[]
  fixedUsers?: Array<{ uid: string; email: string; oldRole: string; newRole: string }>
  errors?: Array<{ uid: string; email: string; error: string }>
  superAdminEmails?: string[]
  totalUsers?: number
  currentSuperAdmins?: number
  shouldBeSuperAdmins?: number
}

export default function SuperAdminFixer() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FixResult | null>(null)
  const [selectedEmail, setSelectedEmail] = useState('')
  const [showTools, setShowTools] = useState(false)

  // Don't show in production
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fix-superadmin')
      const data = await response.json()
      if (data.success) {
        setUsers(data.users || [])
        setResult(data)
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch (_error) {
      setResult({ success: false, message: 'Failed to fetch users' })
    } finally {
      setLoading(false)
    }
  }

  const fixAllSuperAdmins = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fix-superadmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix-all-superadmins' }),
      })
      const data = await response.json()
      setResult(data)
      if (data.success) {
        await fetchUsers() // Refresh the user list
      }
    } catch (_error) {
      setResult({ success: false, message: 'Failed to fix SuperAdmin roles' })
    } finally {
      setLoading(false)
    }
  }

  const fixSpecificUser = async (email: string) => {
    if (!email.trim()) {
      setResult({ success: false, message: 'Please enter a valid email address' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/fix-superadmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix-specific-user', email: email.trim() }),
      })
      const data = await response.json()
      setResult(data)
      if (data.success) {
        await fetchUsers() // Refresh the user list
        setSelectedEmail('') // Clear the input
      }
    } catch (_error) {
      setResult({ success: false, message: 'Failed to fix user role' })
    } finally {
      setLoading(false)
    }
  }

  const checkConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fix-superadmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-config' }),
      })
      const data = await response.json()
      setResult(data)
    } catch (_error) {
      setResult({ success: false, message: 'Failed to check configuration' })
    } finally {
      setLoading(false)
    }
  }

  const shouldBeSuperAdmins = users.filter((u) => u.isSuperAdminEmail && u.role !== 'SuperAdmin')
  const hasIssues = shouldBeSuperAdmins.length > 0

  return (
    <div className="mb-6">
      {/* Admin Tools Toggle */}
      <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-md rounded-xl border border-orange-500/20 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Admin Tools</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                SuperAdmin role management and diagnostics
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {hasIssues && (
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-500/20 rounded-full">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                  {shouldBeSuperAdmins.length} role issue
                  {shouldBeSuperAdmins.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <button
              onClick={() => setShowTools(!showTools)}
              className="px-4 py-2 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors font-medium"
            >
              {showTools ? 'Hide Tools' : 'Show Tools'}
            </button>
          </div>
        </div>

        {/* Expanded Tools */}
        {showTools && (
          <div className="mt-6 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => {
                  void checkConfig()
                }}
                disabled={loading}
                className="flex items-center justify-center space-x-2 p-4 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-50 font-medium"
              >
                <Shield className="h-4 w-4" />
                <span>Check Config</span>
              </button>

              <button
                onClick={() => {
                  void fetchUsers()
                }}
                disabled={loading}
                className="flex items-center justify-center space-x-2 p-4 bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-500/30 transition-colors disabled:opacity-50 font-medium"
              >
                <Users className="h-4 w-4" />
                <span>Load Users</span>
              </button>

              {shouldBeSuperAdmins.length > 0 && (
                <button
                  onClick={() => {
                    void fixAllSuperAdmins()
                  }}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 p-4 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-500/30 transition-colors disabled:opacity-50 font-medium"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Fix All ({shouldBeSuperAdmins.length})</span>
                </button>
              )}

              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white/50 dark:bg-gray-800/50 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={() => {
                    void fixSpecificUser(selectedEmail)
                  }}
                  disabled={loading || !selectedEmail.trim()}
                  className="px-3 py-2 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  Fix
                </button>
              </div>
            </div>

            {/* Results Display */}
            {result && (
              <div className="space-y-4">
                {/* Status Message */}
                <div
                  className={`p-4 rounded-xl border ${
                    result.success
                      ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'
                      : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {result.success ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                    <span className="font-medium">
                      {result.message ||
                        (result.success ? 'Operation completed successfully' : 'Operation failed')}
                    </span>
                  </div>
                </div>

                {/* Statistics */}
                {(result.totalUsers !== undefined || result.currentSuperAdmins !== undefined) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {result.totalUsers !== undefined && (
                      <div className="p-3 bg-gray-500/10 rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {result.totalUsers}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                      </div>
                    )}
                    {result.currentSuperAdmins !== undefined && (
                      <div className="p-3 bg-green-500/10 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {result.currentSuperAdmins}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">SuperAdmins</div>
                      </div>
                    )}
                    {result.shouldBeSuperAdmins !== undefined && result.shouldBeSuperAdmins > 0 && (
                      <div className="p-3 bg-orange-500/10 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {result.shouldBeSuperAdmins}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Need Fix</div>
                      </div>
                    )}
                    {result.fixedUsers?.length && (
                      <div className="p-3 bg-blue-500/10 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {result.fixedUsers.length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Fixed</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Configuration Info */}
                {result.superAdminEmails && (
                  <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Configured SuperAdmin Emails
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.superAdminEmails.map((email, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
                        >
                          {email}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fixed Users */}
                {result.fixedUsers && result.fixedUsers.length > 0 && (
                  <div className="p-4 bg-green-500/5 rounded-xl border border-green-500/10">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Successfully Fixed Users
                    </h4>
                    <div className="space-y-2">
                      {result.fixedUsers.map((user, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white/20 dark:bg-white/5 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {user.email}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-600 dark:text-gray-400 rounded">
                              {user.oldRole}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="px-2 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded font-medium">
                              {user.newRole}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {result.errors && result.errors.length > 0 && (
                  <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Errors</h4>
                    <div className="space-y-2">
                      {result.errors.map((error, index) => (
                        <div key={index} className="p-3 bg-red-500/10 rounded-lg">
                          <div className="font-medium text-red-700 dark:text-red-300">
                            {error.email}
                          </div>
                          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                            {error.error}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Users with Issues Preview */}
                {shouldBeSuperAdmins.length > 0 && (
                  <div className="p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Users Who Should Be SuperAdmins
                    </h4>
                    <div className="space-y-2">
                      {shouldBeSuperAdmins.slice(0, 5).map((user, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white/20 dark:bg-white/5 rounded-lg"
                        >
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded text-sm">
                              Currently: {user.role}
                            </span>
                            <button
                              onClick={() => {
                                void fixSpecificUser(user.email)
                              }}
                              disabled={loading}
                              className="px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded hover:bg-green-500/30 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                              Fix Now
                            </button>
                          </div>
                        </div>
                      ))}
                      {shouldBeSuperAdmins.length > 5 && (
                        <div className="text-center text-sm text-gray-600 dark:text-gray-400 pt-2">
                          ... and {shouldBeSuperAdmins.length - 5} more users
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
