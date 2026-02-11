import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb } from '@/lib/firebase/admin'
import { getSuperAdminEmails, isSuperAdminEmail } from '@/lib/firebase/firestore'

type FixAction =
  | 'check-config'
  | 'list-all-users'
  | 'fix-all-superadmins'
  | 'fix-specific-user'
  | 'create-superadmin'

interface UserListItem {
  uid: string
  email: string
  role: string
  category: string
  firstName: string
  lastName: string
  isActive: boolean
  isSuperAdminEmail: boolean
}

interface PostBody {
  action: FixAction | undefined
  email: string | undefined
  uid: string | undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readString = (record: Record<string, unknown>, key: string): string | undefined => {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

const readBoolean = (record: Record<string, unknown>, key: string): boolean | undefined => {
  const value = record[key]
  return typeof value === 'boolean' ? value : undefined
}

const normalizeEmail = (value: string | undefined): string => value?.trim().toLowerCase() ?? ''

const parsePostBody = (value: unknown): PostBody => {
  if (!isRecord(value)) {
    return {
      action: undefined,
      email: undefined,
      uid: undefined,
    }
  }

  const action = readString(value, 'action')
  const email = readString(value, 'email')
  const uid = readString(value, 'uid')

  const allowedActions: FixAction[] = [
    'check-config',
    'list-all-users',
    'fix-all-superadmins',
    'fix-specific-user',
    'create-superadmin',
  ]

  return {
    action: allowedActions.includes(action as FixAction) ? (action as FixAction) : undefined,
    email,
    uid,
  }
}

const toRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {})

const toUserListItem = (doc: FirebaseFirestore.DocumentSnapshot): UserListItem => {
  const rawData: unknown = doc.data()
  const data = toRecord(rawData)
  const profile = toRecord(data.profile)
  const metadata = toRecord(data.metadata)

  const email = readString(data, 'email') ?? ''
  const role = readString(data, 'role') ?? ''
  const category = readString(data, 'category') ?? ''
  const firstName = readString(profile, 'firstName') ?? ''
  const lastName = readString(profile, 'lastName') ?? ''
  const isActive = readBoolean(metadata, 'isActive') ?? true

  return {
    uid: doc.id,
    email,
    role,
    category,
    firstName,
    lastName,
    isActive,
    isSuperAdminEmail: isSuperAdminEmail(email),
  }
}

const ensureDevelopment = () => {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Fix endpoints are only available in development' },
      { status: 404 },
    )
  }

  return null
}

const ensureSuperAdminSession = async () => {
  const session = await getServerSession(authOptions as never)
  const userObj =
    session && typeof session === 'object' && 'user' in session
      ? (session as { user?: Record<string, unknown> }).user
      : undefined
  const role = userObj && typeof userObj.role === 'string' ? userObj.role : undefined

  if (!session || role !== 'SuperAdmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  return null
}

export async function POST(request: Request) {
  try {
    const envRejection = ensureDevelopment()
    if (envRejection) return envRejection

    const authRejection = await ensureSuperAdminSession()
    if (authRejection) return authRejection

    const parsedJson: unknown = await request.json().catch(() => ({}))
    const body = parsePostBody(parsedJson)

    const action = body.action
    const email = normalizeEmail(body.email)
    const uid = body.uid?.trim() ?? ''

    const superAdminEmails = getSuperAdminEmails()
    console.log('SuperAdmin emails configured:', superAdminEmails)

    if (action === 'check-config') {
      return NextResponse.json({
        success: true,
        superAdminEmails,
        environment: process.env.NODE_ENV,
        serverEnvSet: Boolean(process.env.SUPER_ADMIN_EMAILS),
        clientEnvSet: Boolean(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS),
      })
    }

    if (action === 'list-all-users') {
      const usersSnapshot = await adminDb.collection('users').get()
      const users = usersSnapshot.docs.map((doc) => toUserListItem(doc))

      return NextResponse.json({
        success: true,
        users,
        totalUsers: users.length,
        superAdmins: users.filter((user) => user.role === 'SuperAdmin'),
        shouldBeSuperAdmins: users.filter(
          (user) => user.isSuperAdminEmail && user.role !== 'SuperAdmin',
        ),
      })
    }

    if (action === 'fix-all-superadmins') {
      const usersSnapshot = await adminDb.collection('users').get()
      const fixedUsers: Array<{ uid: string; email: string; oldRole: string; newRole: string }> = []
      const errors: Array<{ uid: string; email: string; error: string }> = []

      for (const doc of usersSnapshot.docs) {
        const user = toUserListItem(doc)

        if (user.isSuperAdminEmail && user.role !== 'SuperAdmin') {
          try {
            await adminDb.collection('users').doc(user.uid).update({
              role: 'SuperAdmin',
              category: 'Admin',
              'metadata.updatedAt': new Date(),
              'metadata.roleUpdatedBy': 'system-fix',
            })

            fixedUsers.push({
              uid: user.uid,
              email: user.email,
              oldRole: user.role || 'undefined',
              newRole: 'SuperAdmin',
            })

            console.log(`Updated user ${user.email} to SuperAdmin`)
          } catch (error) {
            errors.push({
              uid: user.uid,
              email: user.email,
              error: error instanceof Error ? error.message : 'Unknown error',
            })
            console.error(`Failed to update user ${user.email}:`, error)
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
      let userDoc: FirebaseFirestore.DocumentSnapshot | undefined
      let userId = ''

      if (uid) {
        userDoc = await adminDb.collection('users').doc(uid).get()
        userId = uid
      } else if (email) {
        const userQuery = await adminDb
          .collection('users')
          .where('email', '==', email)
          .limit(1)
          .get()

        const firstDoc = userQuery.docs[0]
        if (firstDoc) {
          userDoc = firstDoc
          userId = firstDoc.id
        }
      }

      if (!userDoc || !userDoc.exists || !userId) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const user = toUserListItem(userDoc)

      if (!isSuperAdminEmail(user.email)) {
        return NextResponse.json(
          { error: `Email ${user.email} is not configured as a SuperAdmin email` },
          { status: 400 },
        )
      }

      if (user.role === 'SuperAdmin') {
        return NextResponse.json({
          success: true,
          message: 'User is already a SuperAdmin',
          user: {
            uid: userId,
            email: user.email,
            role: user.role,
            category: user.category,
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
          message: `Successfully updated ${user.email} to SuperAdmin`,
          user: {
            uid: userId,
            email: user.email,
            oldRole: user.role || 'undefined',
            newRole: 'SuperAdmin',
          },
        })
      } catch (error) {
        console.error(`Failed to update user ${user.email}:`, error)
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

      const existingUserQuery = await adminDb
        .collection('users')
        .where('email', '==', email)
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
          email,
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
            email,
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
    const envRejection = ensureDevelopment()
    if (envRejection) return envRejection

    const authRejection = await ensureSuperAdminSession()
    if (authRejection) return authRejection

    const superAdminEmails = getSuperAdminEmails()
    const usersSnapshot = await adminDb.collection('users').get()
    const users = usersSnapshot.docs.map((doc) => toUserListItem(doc))

    const superAdmins = users.filter((user) => user.role === 'SuperAdmin')
    const shouldBeSuperAdmins = users.filter(
      (user) => user.isSuperAdminEmail && user.role !== 'SuperAdmin',
    )

    return NextResponse.json({
      success: true,
      superAdminEmails,
      totalUsers: users.length,
      currentSuperAdmins: superAdmins.length,
      shouldBeSuperAdmins: shouldBeSuperAdmins.length,
      users,
      issues: {
        missingRoles: shouldBeSuperAdmins,
        inactiveUsers: users.filter((user) => !user.isActive),
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
