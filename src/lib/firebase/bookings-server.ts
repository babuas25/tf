/**
 * Server-only Firestore operations for bookings.
 * Use from API routes only (uses Firebase Admin).
 * Uses Firestore namespace API (adminDb.collection().doc()) for compatibility with Next.js bundler.
 */
import { adminDb } from '@/lib/firebase/admin'
import type { BookingRecord } from '@/types/booking'

const COLLECTION = 'bookings'

/** Use orderReference as document id for idempotent upserts. */
function docId(referenceNo: string): string {
  return referenceNo.trim()
}

export async function saveBooking(record: BookingRecord): Promise<void> {
  const id = docId(record.referenceNo)
  const ref = adminDb.collection(COLLECTION).doc(id)
  const data = {
    ...record,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  }
  await ref.set(data, { merge: true })
}

export async function getBookingByReference(referenceNo: string): Promise<BookingRecord | null> {
  const ref = adminDb.collection(COLLECTION).doc(docId(referenceNo))
  const snap = await ref.get()
  if (!snap.exists) return null
  return { ...(snap.data() as BookingRecord), id: snap.id }
}

export async function listBookings(limitCount = 200): Promise<BookingRecord[]> {
  const coll = adminDb.collection(COLLECTION)
  try {
    const snapshot = await coll.orderBy('createDate', 'desc').limit(limitCount).get()
    return snapshot.docs.map((d) => ({ ...(d.data() as BookingRecord), id: d.id }))
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('index') || message.includes('Index')) {
      const snapshot = await coll.get()
      const docs = snapshot.docs
        .map((d) => ({ ...(d.data() as BookingRecord), id: d.id }))
        .filter((r) => r.createDate)
      docs.sort((a, b) => (b.createDate > a.createDate ? 1 : -1))
      return docs.slice(0, limitCount)
    }
    throw err
  }
}

export async function listBookingsByStatus(status: BookingRecord['status']): Promise<BookingRecord[]> {
  const snapshot = await adminDb
    .collection(COLLECTION)
    .where('status', '==', status)
    .orderBy('createDate', 'desc')
    .limit(200)
    .get()
  return snapshot.docs.map((d) => ({ ...(d.data() as BookingRecord), id: d.id }))
}
