/**
 * Console Helper Utilities for Development
 * Use these functions in the browser console to debug and fix issues
 */

// Make functions available globally in development
declare global {
  interface Window {
    fixSuperAdmins: () => Promise<void>
    checkUserRoles: () => Promise<void>
    fixSpecificUser: (email: string) => Promise<void>
    debugFirebase: () => Promise<void>
  }
}

/**
 * Fix all users who should be SuperAdmins but aren't
 */
export async function fixSuperAdmins() {
  if (typeof window === 'undefined') {
    console.error('This function can only be run in the browser')
    return
  }

  console.log('🔧 Fixing SuperAdmin roles...')

  try {
    const response = await fetch('/api/fix-superadmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fix-all-superadmins' })
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ SuperAdmin roles fixed successfully!')
      console.log('📊 Results:', result)

      if (result.fixedUsers?.length > 0) {
        console.table(result.fixedUsers)
      } else {
        console.log('ℹ️ No users needed role fixes')
      }
    } else {
      console.error('❌ Failed to fix SuperAdmin roles:', result.error || result.message)
    }
  } catch (error) {
    console.error('❌ Error calling fix-superadmin API:', error)
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

  console.log('🔍 Checking user roles and configuration...')

  try {
    const response = await fetch('/api/fix-superadmin')
    const result = await response.json()

    if (result.success) {
      console.log('📋 Current Status:')
      console.log('- Total Users:', result.totalUsers)
      console.log('- Current SuperAdmins:', result.currentSuperAdmins)
      console.log('- Should be SuperAdmins:', result.shouldBeSuperAdmins)
      console.log('- SuperAdmin Emails Configured:', result.superAdminEmails)

      if (result.issues?.missingRoles?.length > 0) {
        console.log('⚠️ Users who should be SuperAdmins but aren\'t:')
        console.table(result.issues.missingRoles.map((u: any) => ({
          email: u.email,
          currentRole: u.role,
          name: `${u.firstName} ${u.lastName}`.trim()
        })))
      }

      if (result.users?.length > 0) {
        console.log('👥 All Users:')
        console.table(result.users.map((u: any) => ({
          email: u.email,
          role: u.role,
          category: u.category,
          name: `${u.firstName} ${u.lastName}`.trim(),
          shouldBeSuperAdmin: u.isSuperAdminEmail,
          isActive: u.isActive
        })))
      }
    } else {
      console.error('❌ Failed to check user roles:', result.error)
    }
  } catch (error) {
    console.error('❌ Error checking user roles:', error)
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
    console.error('❌ Please provide an email address')
    console.log('Usage: fixSpecificUser("user@example.com")')
    return
  }

  console.log(`🔧 Fixing role for user: ${email}`)

  try {
    const response = await fetch('/api/fix-superadmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fix-specific-user',
        email: email.toLowerCase().trim()
      })
    })

    const result = await response.json()

    if (result.success) {
      console.log('✅ User role fixed successfully!')
      console.log('📊 Result:', result)
    } else {
      console.error('❌ Failed to fix user role:', result.error || result.message)
    }
  } catch (error) {
    console.error('❌ Error fixing user role:', error)
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

  console.log('🔧 Running Firebase diagnostics...')

  try {
    // Check if Firebase debug functions are available
    if (typeof (window as any).runFirebaseTests === 'function') {
      console.log('🧪 Running Firebase tests...')
      await (window as any).runFirebaseTests()
    } else {
      console.log('ℹ️ Firebase test functions not available')
    }

    // Check SuperAdmin configuration
    const configResponse = await fetch('/api/fix-superadmin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-config' })
    })

    const configResult = await configResponse.json()

    if (configResult.success) {
      console.log('⚙️ SuperAdmin Configuration:')
      console.log('- Configured emails:', configResult.superAdminEmails)
      console.log('- Environment:', configResult.environment)
      console.log('- Server env set:', configResult.serverEnvSet)
      console.log('- Client env set:', configResult.clientEnvSet)
    }

  } catch (error) {
    console.error('❌ Error running Firebase diagnostics:', error)
  }
}

/**
 * Show available console helper functions
 */
export function showConsoleHelpers() {
  console.log('🔧 Available Console Helper Functions:')
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
  console.log('💡 Tip: These functions only work in development mode')
}

// Auto-register functions globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.fixSuperAdmins = fixSuperAdmins
  window.checkUserRoles = checkUserRoles
  window.fixSpecificUser = fixSpecificUser
  window.debugFirebase = debugFirebase

  // Show available functions
  console.log('🔧 Console helpers loaded! Type showConsoleHelpers() to see available functions')

  // Make showConsoleHelpers available globally
  ;(window as any).showConsoleHelpers = showConsoleHelpers
}

// Default export for manual imports
export default {
  fixSuperAdmins,
  checkUserRoles,
  fixSpecificUser,
  debugFirebase,
  showConsoleHelpers
}
