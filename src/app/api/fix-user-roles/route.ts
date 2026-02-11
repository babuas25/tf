import { FieldValue } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb } from '@/lib/firebase/admin'

export async function POST() {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Fix endpoints are only available in development' },
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
    const fixedUsers: Array<{ uid: string; email: string; oldRole: string; newRole: string }> = []
    const errors: Array<{ uid: string; email: string; error: string }> = []

    for (const doc of usersSnapshot.docs) {
      const raw = doc.data() as unknown
      const userData = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
      const userId = doc.id

      // Check if role is incorrectly stored in profile object
      const profile =
        userData.profile && typeof userData.profile === 'object'
          ? (userData.profile as Record<string, unknown>)
          : {}
      const profileRole = typeof profile.role === 'string' ? profile.role : undefined
      const rootRole = typeof userData.role === 'string' ? userData.role : undefined

      if (profileRole && !rootRole) {
        try {
          // Move role from profile to root level
          await adminDb.collection('users').doc(userId).update({
            role: profileRole,
            'profile.role': FieldValue.delete(),
          })

          fixedUsers.push({
            uid: userId,
            email: typeof userData.email === 'string' ? userData.email : '',
            oldRole: profileRole,
            newRole: profileRole,
          })
        } catch (error) {
          errors.push({
            uid: userId,
            email: typeof userData.email === 'string' ? userData.email : '',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedUsers.length} users`,
      fixedUsers,
      errors,
    })
  } catch (error) {
    console.error('Error fixing user roles:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
