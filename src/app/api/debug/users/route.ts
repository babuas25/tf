import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb, adminAuth } from '@/lib/firebase/admin'

export async function GET() {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Debug endpoints are only available in development' },
        { status: 404 },
      )
    }

    const session = await getServerSession(authOptions as never)
    const userObj =
      session && typeof session === 'object' && 'user' in session
        ? (session as { user?: Record<string, unknown> }).user
        : undefined
    const role = userObj && typeof userObj.role === 'string' ? userObj.role : undefined
    if (!session || role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all users from Firestore
    const snapshot = await adminDb.collection('users').get()
    const users = snapshot.docs.map((doc) => {
      const raw = doc.data() as unknown
      const data = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
      return {
        uid: doc.id,
        ...data,
      }
    })

    // Also check Firebase Auth users
    const authUsers = await adminAuth.listUsers()

    return NextResponse.json({
      firestoreUsers: users.length,
      authUsers: authUsers.users.length,
      users: users.slice(0, 5), // Return first 5 users for debugging
      authUserEmails: authUsers.users.map((u) => u.email).slice(0, 5),
    })
  } catch (err) {
    console.error('Debug error:', err)
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
