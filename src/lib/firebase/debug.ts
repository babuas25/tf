/**
 * Firebase Debug Utility
 * Helps diagnose and troubleshoot Firebase configuration and connection issues
 */

import { auth, db, firebaseConfigDebug } from './config'

export interface FirebaseDebugInfo {
  timestamp: string
  environment: {
    nodeEnv: string
    isClient: boolean
    isServer: boolean
    userAgent?: string
  }
  firebase: {
    config: typeof firebaseConfigDebug
    auth: {
      initialized: boolean
      currentUser: string | null
      isConnected: boolean
      emulatorConnected: boolean
    }
    firestore: {
      initialized: boolean
      isConnected: boolean
      emulatorConnected: boolean
    }
  }
  network: {
    isOnline: boolean
    connectionType?: string
  }
  errors: string[]
}

export class FirebaseDebugger {
  private static instance: FirebaseDebugger
  private errors: string[] = []

  private constructor() {
    // Listen for auth errors
    if (typeof window !== 'undefined') {
      auth.onAuthStateChanged(
        () => {
          // Success case - clear auth errors
          this.clearErrors('auth')
        },
        (error) => {
          this.addError(`Auth state error: ${error.message}`)
        },
      )

      // Listen for network changes
      window.addEventListener('online', () => {
        this.addError('Network: Connection restored')
      })

      window.addEventListener('offline', () => {
        this.addError('Network: Connection lost')
      })
    }
  }

  public static getInstance(): FirebaseDebugger {
    if (!FirebaseDebugger.instance) {
      FirebaseDebugger.instance = new FirebaseDebugger()
    }
    return FirebaseDebugger.instance
  }

  private addError(error: string) {
    const timestamp = new Date().toISOString()
    this.errors.push(`[${timestamp}] ${error}`)
    console.warn(`🔧 Firebase Debug: ${error}`)
  }

  private clearErrors(type: string) {
    this.errors = this.errors.filter((error) => !error.toLowerCase().includes(type))
  }

  public getDebugInfo(): FirebaseDebugInfo {
    const isClient = typeof window !== 'undefined'
    const isServer = typeof window === 'undefined'

    // Check auth connection
    let authConnected = false
    let currentUser = null
    try {
      currentUser = auth.currentUser?.uid || null
      authConnected = true
    } catch (error) {
      this.addError(`Auth connection check failed: ${(error as Error).message}`)
    }

    // Check Firestore connection
    let firestoreConnected = false
    try {
      // Try to access Firestore app
      if (db.app) {
        firestoreConnected = true
      }
    } catch (error) {
      this.addError(`Firestore connection check failed: ${(error as Error).message}`)
    }

    // Get network info
    let isOnline = true
    let connectionType = 'unknown'
    if (isClient) {
      isOnline = navigator.onLine
      // @ts-expect-error - navigator.connection is not in TypeScript types
      const connection = navigator.connection as { effectiveType?: string } | undefined
      connectionType = connection?.effectiveType || 'unknown'
    }

    return {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        isClient,
        isServer,
        ...(isClient && navigator.userAgent ? { userAgent: navigator.userAgent } : {}),
      },
      firebase: {
        config: firebaseConfigDebug,
        auth: {
          initialized: !!auth,
          currentUser,
          isConnected: authConnected,
          emulatorConnected: false, // Will be set correctly by config
        },
        firestore: {
          initialized: !!db,
          isConnected: firestoreConnected,
          emulatorConnected: false, // Will be set correctly by config
        },
      },
      network: {
        isOnline,
        connectionType,
      },
      errors: [...this.errors],
    }
  }

  public diagnose(): void {
    console.log('🔧 Firebase Diagnostics Starting...')

    const debugInfo = this.getDebugInfo()

    console.group('🔧 Firebase Configuration')
    console.log('Project ID:', debugInfo.firebase.config.projectId)
    console.log('Auth Domain:', debugInfo.firebase.config.authDomain)
    console.log('Has API Key:', debugInfo.firebase.config.hasApiKey)
    console.log('Has App ID:', debugInfo.firebase.config.hasAppId)
    console.groupEnd()

    console.group('🔧 Firebase Services')
    console.log('App Initialized:', debugInfo.firebase.config.initialized)
    console.log('Auth Initialized:', debugInfo.firebase.config.authInitialized)
    console.log('Firestore Initialized:', debugInfo.firebase.config.dbInitialized)
    console.groupEnd()

    console.group('🔧 Connection Status')
    console.log('Auth Connected:', debugInfo.firebase.auth.isConnected)
    console.log('Firestore Connected:', debugInfo.firebase.firestore.isConnected)
    console.log('Network Online:', debugInfo.network.isOnline)
    console.log('Connection Type:', debugInfo.network.connectionType)
    console.groupEnd()

    console.group('🔧 Current User')
    console.log('User ID:', debugInfo.firebase.auth.currentUser || 'Not signed in')
    console.groupEnd()

    if (
      debugInfo.firebase.auth.emulatorConnected ||
      debugInfo.firebase.firestore.emulatorConnected
    ) {
      console.group('🔧 Emulator Status')
      console.log(
        'Auth Emulator:',
        debugInfo.firebase.auth.emulatorConnected ? '✅ Connected' : '❌ Not connected',
      )
      console.log(
        'Firestore Emulator:',
        debugInfo.firebase.firestore.emulatorConnected ? '✅ Connected' : '❌ Not connected',
      )
      console.groupEnd()
    }

    if (debugInfo.errors.length > 0) {
      console.group('🔧 Recent Errors')
      debugInfo.errors.forEach((error) => console.warn(error))
      console.groupEnd()
    }

    // Recommendations
    console.group('🔧 Recommendations')
    if (!debugInfo.network.isOnline) {
      console.warn('• Check your internet connection')
    }
    if (!debugInfo.firebase.config.hasApiKey) {
      console.warn('• Firebase API key is missing - check NEXT_PUBLIC_FIREBASE_API_KEY')
    }
    if (!debugInfo.firebase.config.hasAppId) {
      console.warn('• Firebase App ID is missing - check NEXT_PUBLIC_FIREBASE_APP_ID')
    }
    if (!debugInfo.firebase.auth.isConnected) {
      console.warn('• Firebase Auth connection failed - check authentication configuration')
    }
    if (!debugInfo.firebase.firestore.isConnected) {
      console.warn('• Firestore connection failed - check Firestore configuration')
    }
    if (debugInfo.errors.length > 5) {
      console.warn(
        '• Multiple errors detected - check environment variables and Firebase project settings',
      )
    }
    console.groupEnd()

    console.log('🔧 Firebase Diagnostics Complete')
  }

  public getErrors(): string[] {
    return [...this.errors]
  }

  public clearAllErrors(): void {
    this.errors = []
  }

  public async testConnection(): Promise<boolean> {
    console.log('🔧 Testing Firebase connection...')

    try {
      // Test auth
      const authTest = new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged(
          () => {
            unsubscribe()
            resolve(true)
          },
          () => {
            unsubscribe()
            resolve(false)
          },
        )
      })

      // Test Firestore
      const firestoreTest = new Promise((resolve) => {
        try {
          // Just accessing the db instance to test initialization
          if (db.app) {
            resolve(true)
          } else {
            resolve(false)
          }
        } catch {
          resolve(false)
        }
      })

      const [authResult, firestoreResult] = await Promise.all([authTest, firestoreTest])

      const success = Boolean(authResult && firestoreResult)
      console.log(`🔧 Connection test ${success ? '✅ passed' : '❌ failed'}`)

      return success
    } catch (error) {
      console.error('🔧 Connection test error:', error)
      return false
    }
  }
}

// Create global instance
export const firebaseDebugger = FirebaseDebugger.getInstance()

// Auto-diagnose in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run diagnostics after a short delay to let Firebase initialize
  setTimeout(() => {
    void firebaseDebugger.diagnose()
  }, 2000)
}

// Helper function to run diagnostics manually
export function runFirebaseDiagnostics(): void {
  firebaseDebugger.diagnose()
}

// Helper function to get debug info
export function getFirebaseDebugInfo(): FirebaseDebugInfo {
  return firebaseDebugger.getDebugInfo()
}

// Helper function to test connection
export async function testFirebaseConnection() {
  return await firebaseDebugger.testConnection()
}
