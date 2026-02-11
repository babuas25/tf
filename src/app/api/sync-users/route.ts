import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { serverEnv } from '@/lib/env.server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { isSuperAdminEmail } from '@/lib/firebase/firestore'

export async function POST() {
  try {
    // Only allow in development environment
    if (serverEnv.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Sync endpoints are only available in development' },
        { status: 404 },
      )
    }

    const session = await getServerSession(authOptions as never)
    const role = (
      session && typeof session === 'object' && 'user' in session
        ? (session as { user?: { role?: unknown } }).user?.role
        : undefined
    ) as string | undefined
    if (!session || role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users from Firebase Auth
    const authUsers = await adminAuth.listUsers()

    const results = {
      total: authUsers.users.length,
      created: 0,
      updated: 0,
      errors: 0,
      errors_list: [] as string[],
    }

    for (const authUser of authUsers.users) {
      try {
        // Check if user exists in Firestore
        const userDoc = await adminDb.collection('users').doc(authUser.uid).get()

        if (userDoc.exists) {
          // Update existing user
          const raw = userDoc.data() as unknown
          const userData = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
          const profile =
            userData.profile && typeof userData.profile === 'object'
              ? (userData.profile as Record<string, unknown>)
              : {}
          const currentAvatar = typeof profile.avatar === 'string' ? profile.avatar : ''
          const now = new Date()

          await adminDb
            .collection('users')
            .doc(authUser.uid)
            .update({
              'metadata.lastLoginAt': now,
              email: authUser.email || '',
              'profile.avatar': authUser.photoURL || currentAvatar || '',
            })

          results.updated++
        } else {
          // Create new user
          const role = isSuperAdminEmail(authUser.email || '') ? 'SuperAdmin' : 'User'
          const now = new Date()

          const userData = {
            uid: authUser.uid,
            email: authUser.email || '',
            role,
            category: role === 'SuperAdmin' ? 'Admin' : '',
            profile: {
              firstName: authUser.displayName?.split(' ')[0] || '',
              lastName: authUser.displayName?.split(' ').slice(1).join(' ') || '',
              gender: 'Other',
              dateOfBirth: '',
              mobile: '',
              avatar: authUser.photoURL || '',
            },
            metadata: {
              createdAt: now,
              lastLoginAt: now,
              isActive: true,
              emailVerified: authUser.emailVerified,
            },
            permissions: [],
            assignedBy: '',
          }

          await adminDb.collection('users').doc(authUser.uid).set(userData)
          results.created++
        }
      } catch (error) {
        results.errors++
        const errorMsg = `Error processing user ${authUser.email}: ${error instanceof Error ? error.message : String(error)}`
        results.errors_list.push(errorMsg)
        console.error(errorMsg)
      }
    }

    return NextResponse.json({
      message: 'User sync completed',
      results,
    })
  } catch (error) {
    console.error('User sync error:', error)
    return NextResponse.json(
      {
        error: 'User sync failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
