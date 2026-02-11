/**
 * Firebase Connection Utility
 * Handles connection retries, error recovery, and connection monitoring
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  AuthError,
} from 'firebase/auth'
import {
  getDoc,
  setDoc,
  updateDoc,
  DocumentReference,
  FirestoreError,
  enableNetwork,
  WithFieldValue,
  DocumentData,
} from 'firebase/firestore'

import { auth, db } from './config'

// Connection status
export class ConnectionMonitor {
  private static instance: ConnectionMonitor
  private isOnline = navigator?.onLine ?? true
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private connectionCallbacks: Array<(online: boolean) => void> = []

  private constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
    }
  }

  public static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor()
    }
    return ConnectionMonitor.instance
  }

  private handleOnline() {
    console.log('🌐 Network connection restored')
    this.isOnline = true
    this.reconnectAttempts = 0
    void this.attemptReconnect()
    this.notifyCallbacks(true)
  }

  private handleOffline() {
    console.warn('🚫 Network connection lost')
    this.isOnline = false
    this.notifyCallbacks(false)
  }

  private async attemptReconnect() {
    try {
      await enableNetwork(db)
      console.log('✅ Firestore reconnected')
    } catch (error) {
      console.warn('⚠️ Failed to reconnect Firestore:', error)
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => {
          void this.attemptReconnect()
        }, this.reconnectDelay * this.reconnectAttempts)
      }
    }
  }

  private notifyCallbacks(online: boolean) {
    this.connectionCallbacks.forEach((callback) => callback(online))
  }

  public onConnectionChange(callback: (online: boolean) => void) {
    this.connectionCallbacks.push(callback)
    return () => {
      const index = this.connectionCallbacks.indexOf(callback)
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1)
      }
    }
  }

  public getConnectionStatus(): boolean {
    return this.isOnline
  }
}

// Retry utility function
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000,
  operationName = 'Firebase operation',
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation()
      if (attempt > 1) {
        console.log(`✅ ${operationName} succeeded after ${attempt} attempts`)
      }
      return result
    } catch (error) {
      lastError = error as Error
      console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxAttempts}):`, error)

      // Don't retry for certain types of errors
      if (error instanceof Error) {
        const authError = error as AuthError
        const firestoreError = error as FirestoreError

        // Don't retry auth errors that won't resolve with retry
        if (authError.code) {
          const nonRetryableAuthCodes = [
            'auth/user-not-found',
            'auth/wrong-password',
            'auth/invalid-email',
            'auth/email-already-in-use',
            'auth/weak-password',
            'auth/invalid-credential',
          ]
          if (nonRetryableAuthCodes.includes(authError.code)) {
            throw error
          }
        }

        // Don't retry certain Firestore errors
        if (firestoreError.code) {
          const nonRetryableFirestoreCodes = [
            'permission-denied',
            'not-found',
            'already-exists',
            'invalid-argument',
          ]
          if (nonRetryableFirestoreCodes.includes(firestoreError.code)) {
            throw error
          }
        }
      }

      if (attempt < maxAttempts) {
        const delay = delayMs * Math.pow(2, attempt - 1) // Exponential backoff
        console.log(`🔄 Retrying ${operationName} in ${delay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  console.error(`❌ ${operationName} failed after ${maxAttempts} attempts`)
  throw lastError || new Error(`Operation failed after ${maxAttempts} attempts`)
}

// Enhanced auth functions with retry logic
export const authWithRetry = {
  async signIn(email: string, password: string): Promise<User> {
    return withRetry(
      async () => {
        const result = await signInWithEmailAndPassword(auth, email, password)
        return result.user
      },
      3,
      1000,
      'Sign in',
    )
  },

  async signUp(email: string, password: string): Promise<User> {
    return withRetry(
      async () => {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        return result.user
      },
      3,
      1000,
      'Sign up',
    )
  },

  async signOut(): Promise<void> {
    return withRetry(
      async () => {
        await signOut(auth)
      },
      3,
      1000,
      'Sign out',
    )
  },
}

// Enhanced Firestore functions with retry logic
export const firestoreWithRetry = {
  async getDocument<T>(docRef: DocumentReference): Promise<T | null> {
    return withRetry(
      async () => {
        const docSnap = await getDoc(docRef)
        return docSnap.exists() ? (docSnap.data() as T) : null
      },
      3,
      1000,
      'Get document',
    )
  },

  async setDocument<T extends WithFieldValue<DocumentData>>(
    docRef: DocumentReference,
    data: T,
  ): Promise<void> {
    return withRetry(
      async () => {
        await setDoc(docRef, data)
      },
      3,
      1000,
      'Set document',
    )
  },

  async updateDocument(docRef: DocumentReference, data: Record<string, unknown>): Promise<void> {
    return withRetry(
      async () => {
        await updateDoc(docRef, data)
      },
      3,
      1000,
      'Update document',
    )
  },
}

// Error handler utility
export function handleFirebaseError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'An unexpected error occurred. Please try again.'
  }

  const authError = error as AuthError
  const firestoreError = error as FirestoreError

  // Handle Auth errors
  if (authError.code) {
    switch (authError.code) {
      case 'auth/user-not-found':
        return 'No account found with this email. Please check your email or create an account.'
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.'
      case 'auth/invalid-email':
        return 'Invalid email address. Please check your email and try again.'
      case 'auth/email-already-in-use':
        return 'An account with this email already exists. Please sign in instead.'
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.'
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please check your email and password.'
      default:
        console.error('Unhandled auth error:', authError)
        return 'Authentication failed. Please try again.'
    }
  }

  // Handle Firestore errors
  if (firestoreError.code) {
    switch (firestoreError.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action.'
      case 'not-found':
        return 'The requested data was not found.'
      case 'already-exists':
        return 'This data already exists.'
      case 'resource-exhausted':
        return 'Service is temporarily unavailable. Please try again later.'
      case 'deadline-exceeded':
      case 'unavailable':
        return 'Service is temporarily unavailable. Please try again.'
      case 'unauthenticated':
        return 'You must be signed in to perform this action.'
      default:
        console.error('Unhandled Firestore error:', firestoreError)
        return 'Database error. Please try again.'
    }
  }

  // Generic error
  console.error('Unhandled error:', error)
  return 'An unexpected error occurred. Please try again.'
}

// Initialize connection monitor
export const connectionMonitor = ConnectionMonitor.getInstance()
