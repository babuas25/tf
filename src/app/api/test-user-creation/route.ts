import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb } from '@/lib/firebase/admin'

export async function GET() {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Test endpoints are only available in development' },
        { status: 404 },
      )
    }

    const session = await getServerSession(authOptions as never)

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Test creating a user document
    const testUserId = 'test-user-' + Date.now()
    const now = new Date()

    const testUserData = {
      uid: testUserId,
      email: 'test@example.com',
      role: 'User',
      category: '',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        gender: 'Other',
        dateOfBirth: '',
        mobile: '',
        avatar: '',
      },
      metadata: {
        createdAt: now,
        lastLoginAt: now,
        isActive: true,
        emailVerified: false,
      },
      permissions: [],
      assignedBy: '',
    }

    await adminDb.collection('users').doc(testUserId).set(testUserData)

    // Verify the user was created
    const createdUser = await adminDb.collection('users').doc(testUserId).get()

    if (createdUser.exists) {
      // Clean up the test user
      await adminDb.collection('users').doc(testUserId).delete()

      return NextResponse.json({
        success: true,
        message: 'User creation test passed',
        testUserData: createdUser.data(),
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Test user was not created',
      })
    }
  } catch (error) {
    console.error('Test user creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
