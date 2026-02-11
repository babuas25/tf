import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'

import { clientEnv } from '@/lib/env.client'

// Firebase configuration
const firebaseConfig = {
  apiKey: clientEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: clientEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: clientEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: clientEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: clientEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: clientEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
  ...(clientEnv.NEXT_PUBLIC_MEASUREMENT_ID
    ? { measurementId: clientEnv.NEXT_PUBLIC_MEASUREMENT_ID }
    : {}),
}

// Validate Firebase config
function validateFirebaseConfig() {
  const required = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ]

  const missing = required.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig])

  if (missing.length > 0) {
    console.error('Missing Firebase configuration:', missing)
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}`)
  }
}

// Initialize Firebase app with error handling
let app: FirebaseApp
try {
  validateFirebaseConfig()
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  console.log('✅ Firebase app initialized successfully')
} catch (error) {
  console.error('❌ Firebase initialization error:', error)
  throw new Error('Failed to initialize Firebase app')
}

// Initialize Auth with error handling and retry logic
let auth: Auth
let authEmulatorConnected = false
try {
  auth = getAuth(app)

  // Connect to emulator in development if needed
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Only connect to emulator if explicitly configured
    const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true'
    if (useEmulator && !authEmulatorConnected) {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
        authEmulatorConnected = true
        console.log('🔧 Connected to Firebase Auth emulator')
      } catch (emulatorError) {
        console.warn('⚠️ Failed to connect to Auth emulator:', emulatorError)
      }
    }
  }

  console.log('✅ Firebase Auth initialized successfully')
} catch (error) {
  console.error('❌ Firebase Auth initialization error:', error)
  throw new Error('Failed to initialize Firebase Auth')
}

// Initialize Firestore with error handling and connection settings
let db: Firestore
let firestoreEmulatorConnected = false
try {
  db = getFirestore(app)

  // Connect to emulator in development if needed
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === 'true'
    if (useEmulator && !firestoreEmulatorConnected) {
      try {
        connectFirestoreEmulator(db, 'localhost', 8080)
        firestoreEmulatorConnected = true
        console.log('🔧 Connected to Firestore emulator')
      } catch (emulatorError) {
        console.warn('⚠️ Failed to connect to Firestore emulator:', emulatorError)
      }
    }
  }

  console.log('✅ Firestore initialized successfully')
} catch (error) {
  console.error('❌ Firestore initialization error:', error)
  throw new Error('Failed to initialize Firestore')
}

// Connection monitoring for client-side
if (typeof window !== 'undefined') {
  // Monitor online/offline status
  window.addEventListener('online', () => {
    console.log('🌐 Network connection restored')
  })

  window.addEventListener('offline', () => {
    console.warn('🚫 Network connection lost')
  })

  // Monitor auth state changes with error handling
  auth.onAuthStateChanged(
    (user) => {
      if (user) {
        console.log('👤 User authenticated:', user.uid)
      } else {
        console.log('👤 User signed out')
      }
    },
    (error) => {
      console.error('❌ Auth state change error:', error)
    },
  )
}

export { auth, db }
export default app

// Export configuration for debugging
export const firebaseConfigDebug = {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId,
  initialized: !!app,
  authInitialized: !!auth,
  dbInitialized: !!db,
  authEmulatorConnected,
  firestoreEmulatorConnected,
}
