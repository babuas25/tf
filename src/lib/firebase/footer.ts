import { doc, getDoc } from 'firebase/firestore'

import { db } from './config'

export type FooterSettings = {
  social?: {
    facebook?: string | null
    instagram?: string | null
    community?: string | null
  }
  privacyContent?: string | null
  termsContent?: string | null
  updatedAt?: unknown
  updatedBy?: string | null
}

const COLLECTION = 'footer'
const DOC_ID = 'global'

export async function getFooterSettings(): Promise<FooterSettings | null> {
  try {
    const ref = doc(db, COLLECTION, DOC_ID)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return snap.data() as FooterSettings
  } catch (e) {
    console.error('getFooterSettings error:', e)
    return null
  }
}
