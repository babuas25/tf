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

    // Find Ashif Babu's user document
    const ashifEmail = 'asif.java.dev@gmail.com'
    const usersSnapshot = await adminDb.collection('users').where('email', '==', ashifEmail).get()

    if (usersSnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userDoc = usersSnapshot.docs.at(0)
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const raw = userDoc.data() as unknown
    const userData = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
    const userId = userDoc.id

    // Check if role is in profile object but not at root level
    const profile =
      userData.profile && typeof userData.profile === 'object'
        ? (userData.profile as Record<string, unknown>)
        : {}
    const profileRole = typeof profile.role === 'string' ? profile.role : undefined
    const rootRole = typeof userData.role === 'string' ? userData.role : undefined

    if (profileRole && !rootRole) {
      // Update the document to move role from profile to root level
      await adminDb.collection('users').doc(userId).update({
        role: profileRole,
        'profile.role': FieldValue.delete(),
      })

      return NextResponse.json({
        success: true,
        message: `Successfully moved role from profile to root level`,
        user: {
          uid: userId,
          email: typeof userData.email === 'string' ? userData.email : '',
          newRole: profileRole,
        },
      })
    } else if (rootRole) {
      return NextResponse.json({
        success: true,
        message: 'Role is already at root level',
        user: {
          uid: userId,
          email: typeof userData.email === 'string' ? userData.email : '',
          role: rootRole,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'No role found in either location',
        user: {
          uid: userId,
          email: typeof userData.email === 'string' ? userData.email : '',
        },
      })
    }
  } catch (error) {
    console.error('Error fixing Ashif role:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
