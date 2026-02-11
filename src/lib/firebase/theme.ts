import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore'

import { db } from './config'

export type ThemeDocument = {
  bgStyle: 'solid' | 'gradient' | 'animated'
  solidColor: string
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  colorTheme: string
  mode?: 'light' | 'dark'
  updatedAt?: unknown
  updatedBy?: string
}

const COLLECTION = 'themes'
const DOC_ID = 'global'

export async function getTheme(): Promise<ThemeDocument | null> {
  const ref = doc(db, COLLECTION, DOC_ID)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return snap.data() as ThemeDocument
}

export async function saveTheme(theme: ThemeDocument, updatedBy?: string) {
  const ref = doc(db, COLLECTION, DOC_ID)
  await setDoc(
    ref,
    { ...theme, updatedAt: serverTimestamp(), updatedBy: updatedBy ?? null },
    { merge: true },
  )
}

export function subscribeTheme(callback: (doc: ThemeDocument | null) => void) {
  const ref = doc(db, COLLECTION, DOC_ID)
  const unsub = onSnapshot(
    ref,
    (snap) => {
      callback(snap.exists() ? (snap.data() as ThemeDocument) : null)
    },
    () => {
      callback(null)
    },
  )
  return unsub
}
