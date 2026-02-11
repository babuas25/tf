import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb } from '@/lib/firebase/admin'
import { isSuperAdminEmail, getSuperAdminEmails } from '@/lib/firebase/firestore'

export async function POST(request: Request) {
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

    // Allow access for existing SuperAdmins or if no users exist yet
    if (!session && role !== 'SuperAdmin') {
      // Check if there are any SuperAdmins in the system
      const superAdminQuery = await adminDb
        .collection('users')
        .where('role', '==', 'SuperAdmin')
        .limit(1)
        .get()
      if (!superAdminQuery.empty) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { action, email, uid } = body

    const superAdminEmails = getSuperAdminEmails()
    console.log('SuperAdmin emails configured:', superAdminEmails)

    if (action === 'check-config') {
      return NextResponse.json({
        success: true,
        superAdminEmails,
        environment: process.env.NODE_ENV,
        serverEnvSet: !!process.env.SUPER_ADMIN_EMAILS,
        clientEnvSet: !!process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS,
      })
    }

    if (action === 'list-all-users') {
      const usersSnapshot = await adminDb.collection('users').get()
      const users = usersSnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          uid: doc.id,
          email: data.email,
          role: data.role,
          category: data.category,
          firstName: data.profile?.firstName || '',
          lastName: data.profile?.lastName || '',
          isSuperAdminEmail: isSuperAdminEmail(data.email || ''),
        }
      })

      return NextResponse.json({
        success: true,
        users,
        totalUsers: users.length,
        superAdmins: users.filter((u) => u.role === 'SuperAdmin'),
        shouldBeSuperAdmins: users.filter((u) => u.isSuperAdminEmail && u.role !== 'SuperAdmin'),
      })
    }

    if (action === 'fix-all-superadmins') {
      // Get all users from Firestore
      const usersSnapshot = await adminDb.collection('users').get()
      const fixedUsers: Array<{ uid: string; email: string; oldRole: string; newRole: string }> = []
      const errors: Array<{ uid: string; email: string; error: string }> = []

      for (const doc of usersSnapshot.docs) {
        const userData = doc.data()
        const userId = doc.id
        const userEmail = userData.email || ''

        if (isSuperAdminEmail(userEmail) && userData.role !== 'SuperAdmin') {
          try {
            await adminDb.collection('users').doc(userId).update({
              role: 'SuperAdmin',
              category: 'Admin',
              'metadata.updatedAt': new Date(),
              'metadata.roleUpdatedBy': 'system-fix',
            })

            fixedUsers.push({
              uid: userId,
              email: userEmail,
              oldRole: userData.role || 'undefined',
              newRole: 'SuperAdmin',
            })

            console.log(`✅ Updated user ${userEmail} to SuperAdmin`)
          } catch (error) {
            errors.push({
              uid: userId,
              email: userEmail,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
            console.error(`❌ Failed to update user ${userEmail}:`, error)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Fixed ${fixedUsers.length} users`,
        fixedUsers,
        errors,
        superAdminEmails,
      })
    }

    if (action === 'fix-specific-user' && (email || uid)) {
      let userDoc
      let userId

      if (uid) {
        userDoc = await adminDb.collection('users').doc(uid).get()
        userId = uid
      } else if (email) {
        const userQuery = await adminDb
          .collection('users')
          .where('email', '==', email.toLowerCase())
          .limit(1)
          .get()
        if (!userQuery.empty) {
          userDoc = userQuery.docs[0]
          if (userDoc) {
            userId = userDoc.id
          }
        }
      }

      if (!userDoc || !userDoc.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const userData = userDoc.data()
      const userEmail = userData?.email || ''

      if (!isSuperAdminEmail(userEmail)) {
        return NextResponse.json(
          { error: `Email ${userEmail} is not configured as a SuperAdmin email` },
          { status: 400 },
        )
      }

      if (userData?.role === 'SuperAdmin') {
        return NextResponse.json({
          success: true,
          message: 'User is already a SuperAdmin',
          user: {
            uid: userId,
            email: userEmail,
            role: userData.role,
            category: userData.category,
          },
        })
      }

      try {
        await adminDb.collection('users').doc(userId).update({
          role: 'SuperAdmin',
          category: 'Admin',
          'metadata.updatedAt': new Date(),
          'metadata.roleUpdatedBy': 'system-fix',
        })

        return NextResponse.json({
          success: true,
          message: `Successfully updated ${userEmail} to SuperAdmin`,
          user: {
            uid: userId,
            email: userEmail,
            oldRole: userData?.role || 'undefined',
            newRole: 'SuperAdmin',
          },
        })
      } catch (error) {
        console.error(`Failed to update user ${userEmail}:`, error)
        return NextResponse.json(
          {
            error: 'Failed to update user role',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 },
        )
      }
    }

    if (action === 'create-superadmin' && email) {
      if (!isSuperAdminEmail(email)) {
        return NextResponse.json(
          { error: `Email ${email} is not configured as a SuperAdmin email` },
          { status: 400 },
        )
      }

      // Check if user already exists
      const existingUserQuery = await adminDb
        .collection('users')
        .where('email', '==', email.toLowerCase())
        .limit(1)
        .get()
      if (!existingUserQuery.empty) {
        return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 })
      }

      try {
        const now = new Date()
        const newUserId = adminDb.collection('users').doc().id

        const userData = {
          uid: newUserId,
          email: email.toLowerCase(),
          role: 'SuperAdmin',
          category: 'Admin',
          profile: {
            firstName: 'Super',
            lastName: 'Admin',
            gender: 'Other',
            dateOfBirth: '',
            mobile: '',
            avatar: '',
          },
          metadata: {
            createdAt: now,
            updatedAt: now,
            isActive: true,
            emailVerified: false,
            roleUpdatedBy: 'system-create',
          },
          permissions: [],
          assignedBy: 'system',
        }

        await adminDb.collection('users').doc(newUserId).set(userData)

        return NextResponse.json({
          success: true,
          message: `Successfully created SuperAdmin user for ${email}`,
          user: {
            uid: newUserId,
            email: email.toLowerCase(),
            role: 'SuperAdmin',
            category: 'Admin',
          },
        })
      } catch (error) {
        console.error(`Failed to create SuperAdmin user for ${email}:`, error)
        return NextResponse.json(
          {
            error: 'Failed to create SuperAdmin user',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 })
  } catch (error) {
    console.error('Error in fix-superadmin endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Fix endpoints are only available in development' },
        { status: 404 },
      )
    }

    const superAdminEmails = getSuperAdminEmails()

    // Get all users from Firestore
    const usersSnapshot = await adminDb.collection('users').get()
    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        uid: doc.id,
        email: data.email,
        role: data.role,
        category: data.category,
        firstName: data.profile?.firstName || '',
        lastName: data.profile?.lastName || '',
        isActive: data.metadata?.isActive ?? true,
        isSuperAdminEmail: isSuperAdminEmail(data.email || ''),
      }
    })

    const superAdmins = users.filter((u) => u.role === 'SuperAdmin')
    const shouldBeSuperAdmins = users.filter((u) => u.isSuperAdminEmail && u.role !== 'SuperAdmin')

    return NextResponse.json({
      success: true,
      superAdminEmails,
      totalUsers: users.length,
      currentSuperAdmins: superAdmins.length,
      shouldBeSuperAdmins: shouldBeSuperAdmins.length,
      users,
      issues: {
        missingRoles: shouldBeSuperAdmins,
        inactiveUsers: users.filter((u) => !u.isActive),
      },
      actions: [
        'check-config: Check SuperAdmin email configuration',
        'list-all-users: List all users with their roles',
        'fix-all-superadmins: Fix all users who should be SuperAdmins',
        'fix-specific-user: Fix a specific user (requires email or uid)',
        'create-superadmin: Create a new SuperAdmin user (requires email)',
      ],
    })
  } catch (error) {
    console.error('Error in fix-superadmin GET:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
