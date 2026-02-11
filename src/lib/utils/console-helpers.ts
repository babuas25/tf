/**
 * Console Helper Utilities for Development
 * Use these functions in the browser console to debug and fix issues
 */

type UserSummary = {
  email: string
  role: string
  category: string
  firstName: string
  lastName: string
  isSuperAdminEmail: boolean
  isActive: boolean
}

type FixedUser = {
  uid: string
  email: string
  oldRole: string
  newRole: string
}

type ApiIssues = {
  missingRoles: UserSummary[]
  inactiveUsers: UserSummary[]
}

type FixSuperAdminApiResponse = {
  success: boolean
  error?: string | undefined
  message?: string | undefined
  users?: UserSummary[] | undefined
  fixedUsers?: FixedUser[] | undefined
  issues?: ApiIssues | undefined
  totalUsers?: number | undefined
  currentSuperAdmins?: number | undefined
  shouldBeSuperAdmins?: number | undefined
  superAdminEmails?: string[] | undefined
  environment?: string | undefined
  serverEnvSet?: boolean | undefined
  clientEnvSet?: boolean | undefined
}

// Make functions available globally in development
declare global {
  interface Window {
    fixSuperAdmins: () => Promise<void>
    checkUserRoles: () => Promise<void>
    fixSpecificUser: (email: string) => Promise<void>
    debugFirebase: () => Promise<void>
    runFirebaseTests?: () => Promise<unknown>
    showConsoleHelpers?: () => void
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

const readBoolean = (record: Record<string, unknown>, key: string): boolean | undefined => {
  const value = record[key]
  return typeof value === 'boolean' ? value : undefined
}

const readNumber = (record: Record<string, unknown>, key: string): number | undefined => {
  const value = record[key]
  return typeof value === 'number' ? value : undefined
}

const readArray = (record: Record<string, unknown>, key: string): unknown[] => {
  const value = record[key]
  return Array.isArray(value) ? value : []
}

const parseUserSummary = (value: unknown): UserSummary | null => {
  if (!isRecord(value)) return null

  return {
    email: readString(value, 'email') ?? '',
    role: readString(value, 'role') ?? '',
    category: readString(value, 'category') ?? '',
    firstName: readString(value, 'firstName') ?? '',
    lastName: readString(value, 'lastName') ?? '',
    isSuperAdminEmail: readBoolean(value, 'isSuperAdminEmail') ?? false,
    isActive: readBoolean(value, 'isActive') ?? true,
  }
}

const parseFixedUser = (value: unknown): FixedUser | null => {
  if (!isRecord(value)) return null

  return {
    uid: readString(value, 'uid') ?? '',
    email: readString(value, 'email') ?? '',
    oldRole: readString(value, 'oldRole') ?? '',
    newRole: readString(value, 'newRole') ?? '',
  }
}

const parseIssues = (value: unknown): ApiIssues | undefined => {
  if (!isRecord(value)) return undefined

  const missingRoles = readArray(value, 'missingRoles')
    .map(parseUserSummary)
    .filter((item): item is UserSummary => item !== null)
  const inactiveUsers = readArray(value, 'inactiveUsers')
    .map(parseUserSummary)
    .filter((item): item is UserSummary => item !== null)

  return {
    missingRoles,
    inactiveUsers,
  }
}

const parseFixApiResponse = (value: unknown): FixSuperAdminApiResponse => {
  if (!isRecord(value)) {
    return { success: false, message: 'Invalid API response' }
  }

  const users = readArray(value, 'users')
    .map(parseUserSummary)
    .filter((item): item is UserSummary => item !== null)
  const fixedUsers = readArray(value, 'fixedUsers')
    .map(parseFixedUser)
    .filter((item): item is FixedUser => item !== null)
  const superAdminEmails = readArray(value, 'superAdminEmails').filter(
    (item): item is string => typeof item === 'string',
  )

  return {
    success: readBoolean(value, 'success') ?? false,
    error: readString(value, 'error'),
    message: readString(value, 'message'),
    users: users.length > 0 ? users : undefined,
    fixedUsers: fixedUsers.length > 0 ? fixedUsers : undefined,
    issues: parseIssues(value.issues),
    totalUsers: readNumber(value, 'totalUsers'),
    currentSuperAdmins: readNumber(value, 'currentSuperAdmins'),
    shouldBeSuperAdmins: readNumber(value, 'shouldBeSuperAdmins'),
    superAdminEmails: superAdminEmails.length > 0 ? superAdminEmails : undefined,
    environment: readString(value, 'environment'),
    serverEnvSet: readBoolean(value, 'serverEnvSet'),
    clientEnvSet: readBoolean(value, 'clientEnvSet'),
  }
}

const parseResponse = async (response: Response): Promise<FixSuperAdminApiResponse> => {
  const payload: unknown = await response.json().catch(() => ({}))
  return parseFixApiResponse(payload)
}

/**
 * Fix all users who should be SuperAdmins but aren't
 */
export async function fixSuperAdmins() {
  if (typeof window === 'undefined') {
    console.error('This function can only be run in the browser')
    return
  }

  console.log('Fixing SuperAdmin roles...')

  try {
    const response = await fetch('/api/fix-superadmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fix-all-superadmins' }),
    })

    const result = await parseResponse(response)

    if (result.success) {
      console.log('SuperAdmin roles fixed successfully!')
      console.log('Results:', result)

      if ((result.fixedUsers?.length ?? 0) > 0) {
        console.table(result.fixedUsers)
      } else {
        console.log('No users needed role fixes')
      }
    } else {
      console.error('Failed to fix SuperAdmin roles:', result.error || result.message)
    }
  } catch (error) {
    console.error('Error calling fix-superadmin API:', error)
  }
}

/**
 * Check current user roles and configuration
 */
export async function checkUserRoles() {
  if (typeof window === 'undefined') {
    console.error('This function can only be run in the browser')
    return
  }

  console.log('Checking user roles and configuration...')

  try {
    const response = await fetch('/api/fix-superadmin')
    const result = await parseResponse(response)

    if (result.success) {
      console.log('Current Status:')
      console.log('- Total Users:', result.totalUsers)
      console.log('- Current SuperAdmins:', result.currentSuperAdmins)
      console.log('- Should be SuperAdmins:', result.shouldBeSuperAdmins)
      console.log('- SuperAdmin Emails Configured:', result.superAdminEmails)

      const missingRoles = result.issues?.missingRoles ?? []
      if (missingRoles.length > 0) {
        console.log("Users who should be SuperAdmins but aren't:")
        console.table(
          missingRoles.map((user) => ({
            email: user.email,
            currentRole: user.role,
            name: `${user.firstName} ${user.lastName}`.trim(),
          })),
        )
      }

      const allUsers = result.users ?? []
      if (allUsers.length > 0) {
        console.log('All Users:')
        console.table(
          allUsers.map((user) => ({
            email: user.email,
            role: user.role,
            category: user.category,
            name: `${user.firstName} ${user.lastName}`.trim(),
            shouldBeSuperAdmin: user.isSuperAdminEmail,
            isActive: user.isActive,
          })),
        )
      }
    } else {
      console.error('Failed to check user roles:', result.error || result.message)
    }
  } catch (error) {
    console.error('Error checking user roles:', error)
  }
}

/**
 * Fix a specific user's role by email
 */
export async function fixSpecificUser(email: string) {
  if (typeof window === 'undefined') {
    console.error('This function can only be run in the browser')
    return
  }

  if (!email) {
    console.error('Please provide an email address')
    console.log('Usage: fixSpecificUser("user@example.com")')
    return
  }

  const normalizedEmail = email.toLowerCase().trim()
  console.log(`Fixing role for user: ${normalizedEmail}`)

  try {
    const response = await fetch('/api/fix-superadmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fix-specific-user',
        email: normalizedEmail,
      }),
    })

    const result = await parseResponse(response)

    if (result.success) {
      console.log('User role fixed successfully!')
      console.log('Result:', result)
    } else {
      console.error('Failed to fix user role:', result.error || result.message)
    }
  } catch (error) {
    console.error('Error fixing user role:', error)
  }
}

/**
 * Debug Firebase connection and configuration
 */
export async function debugFirebase() {
  if (typeof window === 'undefined') {
    console.error('This function can only be run in the browser')
    return
  }

  console.log('Running Firebase diagnostics...')

  try {
    if (typeof window.runFirebaseTests === 'function') {
      console.log('Running Firebase tests...')
      await window.runFirebaseTests()
    } else {
      console.log('Firebase test functions not available')
    }

    const configResponse = await fetch('/api/fix-superadmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-config' }),
    })

    const configResult = await parseResponse(configResponse)

    if (configResult.success) {
      console.log('SuperAdmin Configuration:')
      console.log('- Configured emails:', configResult.superAdminEmails)
      console.log('- Environment:', configResult.environment)
      console.log('- Server env set:', configResult.serverEnvSet)
      console.log('- Client env set:', configResult.clientEnvSet)
    }
  } catch (error) {
    console.error('Error running Firebase diagnostics:', error)
  }
}

/**
 * Show available console helper functions
 */
export function showConsoleHelpers() {
  console.log('Available Console Helper Functions:')
  console.log('')
  console.log('1. checkUserRoles() - Check all user roles and configuration')
  console.log('2. fixSuperAdmins() - Fix all SuperAdmin role assignments')
  console.log('3. fixSpecificUser("email@example.com") - Fix specific user role')
  console.log('4. debugFirebase() - Run Firebase diagnostics')
  console.log('')
  console.log('Example usage:')
  console.log('  checkUserRoles()')
  console.log('  fixSpecificUser("tripfeelsbd@gmail.com")')
  console.log('  fixSuperAdmins()')
  console.log('')
  console.log('Tip: These functions only work in development mode')
}

// Auto-register functions globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.fixSuperAdmins = fixSuperAdmins
  window.checkUserRoles = checkUserRoles
  window.fixSpecificUser = fixSpecificUser
  window.debugFirebase = debugFirebase

  console.log('Console helpers loaded! Type showConsoleHelpers() to see available functions')

  window.showConsoleHelpers = showConsoleHelpers
}

// Default export for manual imports
export default {
  fixSuperAdmins,
  checkUserRoles,
  fixSpecificUser,
  debugFirebase,
  showConsoleHelpers,
}
