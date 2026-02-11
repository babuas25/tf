import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

import { serverEnv } from '@/lib/env.server'

import type { ServiceAccount } from 'firebase-admin/app'

const firebaseAdminConfig = {
  projectId: serverEnv.FIREBASE_PROJECT_ID,
  clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
  privateKey: serverEnv.FIREBASE_PRIVATE_KEY,
}

// Initialize Firebase Admin
// Build a strongly-typed ServiceAccount for typing, using dev-safe fallbacks.
const serviceAccount: ServiceAccount = {
  projectId: firebaseAdminConfig.projectId || '',
  clientEmail: firebaseAdminConfig.clientEmail || '',
  privateKey: firebaseAdminConfig.privateKey || '',
}

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
        ...(serverEnv.FIREBASE_PROJECT_ID ? { projectId: serverEnv.FIREBASE_PROJECT_ID } : {}),
      })
    : getApp()

export const adminAuth = getAuth(app)
export const adminDb = getFirestore(app)
export default app
