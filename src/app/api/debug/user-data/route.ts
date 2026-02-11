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

    // Get all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get()
    const users = []

    for (const doc of usersSnapshot.docs) {
      const raw = doc.data() as unknown
      const userData = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
      const profile =
        userData.profile && typeof userData.profile === 'object'
          ? (userData.profile as Record<string, unknown>)
          : {}
      users.push({
        uid: doc.id,
        email: typeof userData.email === 'string' ? userData.email : '',
        role: typeof userData.role === 'string' ? userData.role : null,
        profileRole: typeof profile.role === 'string' ? profile.role : null,
        hasRoleInProfile: typeof profile.role === 'string',
        hasRoleAtRoot: typeof userData.role === 'string',
      })
    }

    return NextResponse.json({
      success: true,
      users,
      summary: {
        total: users.length,
        withRoleAtRoot: users.filter((u) => u.hasRoleAtRoot).length,
        withRoleInProfile: users.filter((u) => u.hasRoleInProfile).length,
        missingRole: users.filter((u) => !u.hasRoleAtRoot && !u.hasRoleInProfile).length,
      },
    })
  } catch (error) {
    console.error('Error getting user data:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
