import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore'

import { db } from './config'

export type SlideDocument = {
  id?: string
  src: string
  alt?: string
  createdAt?: unknown
}

const COLLECTION = 'auth_slides'

export async function listSlides(): Promise<SlideDocument[]> {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SlideDocument, 'id'>) }))
}

export async function addSlide(src: string, alt?: string) {
  if (!src) throw new Error('src required')
  const ref = await addDoc(collection(db, COLLECTION), {
    src,
    alt: alt ?? '',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateSlide(id: string, data: Partial<SlideDocument>) {
  await updateDoc(doc(db, COLLECTION, id), data)
}

export async function deleteSlide(id: string) {
  await deleteDoc(doc(db, COLLECTION, id))
}
