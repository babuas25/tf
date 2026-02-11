import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb } from '@/lib/firebase/admin'

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

    // Get all users from Firestore with raw timestamp data
    const usersSnapshot = await adminDb.collection('users').get()
    const users = []

    type TimestampLike = {
      seconds: number
      nanoseconds: number
      toDate?: () => Date
    }

    const asTimestamp = (value: unknown): TimestampLike | null => {
      if (!value || typeof value !== 'object') return null
      const ts = value as Partial<TimestampLike>
      if (typeof ts.seconds === 'number' && typeof ts.nanoseconds === 'number') {
        const timestamp: TimestampLike = {
          seconds: ts.seconds,
          nanoseconds: ts.nanoseconds,
        }
        if (typeof ts.toDate === 'function') {
          timestamp.toDate = ts.toDate
        }
        return timestamp
      }
      return null
    }

    for (const doc of usersSnapshot.docs) {
      const raw = doc.data() as unknown
      const userData = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
      const metadata =
        userData.metadata && typeof userData.metadata === 'object'
          ? (userData.metadata as Record<string, unknown>)
          : {}
      const createdAtTs = asTimestamp(metadata.createdAt)
      const lastLoginAtTs = asTimestamp(metadata.lastLoginAt)
      users.push({
        uid: doc.id,
        email: userData.email,
        role: userData.role,
        metadata: {
          createdAt: createdAtTs,
          lastLoginAt: lastLoginAtTs,
          isActive: metadata?.isActive,
          emailVerified: metadata?.emailVerified,
        },
        // Raw timestamp data for debugging
        rawTimestamps: {
          createdAt: createdAtTs
            ? {
                seconds: createdAtTs.seconds,
                nanoseconds: createdAtTs.nanoseconds,
                ...(createdAtTs.toDate
                  ? { toDate: createdAtTs.toDate().toISOString() }
                  : { toDate: 'No toDate method' }),
              }
            : null,
          lastLoginAt: lastLoginAtTs
            ? {
                seconds: lastLoginAtTs.seconds,
                nanoseconds: lastLoginAtTs.nanoseconds,
                ...(lastLoginAtTs.toDate
                  ? { toDate: lastLoginAtTs.toDate().toISOString() }
                  : { toDate: 'No toDate method' }),
              }
            : null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      users,
      summary: {
        total: users.length,
        withLastLoginAt: users.filter((u) => u.metadata.lastLoginAt).length,
        withoutLastLoginAt: users.filter((u) => !u.metadata.lastLoginAt).length,
      },
    })
  } catch (error) {
    console.error('Error getting timestamp debug data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
