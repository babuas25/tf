import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextauth'
import { serverEnv } from '@/lib/env.server'
import { adminDb } from '@/lib/firebase/admin'

export const revalidate = 0

export async function PATCH(req: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    // Touch env so bundlers retain it; validation happens at startup
    void serverEnv.FIREBASE_PROJECT_ID

    const session = await getServerSession(authOptions as never)
    const role = (
      session && typeof session === 'object' && 'user' in session
        ? (session as { user?: { role?: unknown } }).user?.role
        : undefined
    ) as string | undefined

    if (!session || !role || (role !== 'SuperAdmin' && role !== 'Admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate params
    const ParamsSchema = z.object({ uid: z.string().min(1) })
    const { uid } = ParamsSchema.parse(await params)

    // Validate body
    const BodySchema = z.object({
      role: z.string().optional(),
      category: z.string().optional(),
      isActive: z.boolean().optional(),
      profile: z
        .object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          gender: z.enum(['Male', 'Female', 'Other']).optional(),
          dateOfBirth: z.string().optional(),
          mobile: z.string().optional(),
          avatar: z.string().optional(),
        })
        .partial()
        .optional(),
    })
    const { role: newRole, category, isActive, profile } = BodySchema.parse(await req.json())

    // Get target user data
    const targetDoc = await adminDb.collection('users').doc(uid).get()
    const targetUser = targetDoc.exists ? targetDoc.data() : null

    // Admin restriction: cannot modify SuperAdmin or assign SuperAdmin
    if (role === 'Admin') {
      if (newRole === 'SuperAdmin') {
        return NextResponse.json({ error: 'Admins cannot assign SuperAdmin' }, { status: 400 })
      }
      if (targetUser?.role === 'SuperAdmin') {
        // Admin cannot modify SuperAdmin role, category, or profile
        if (newRole || category !== undefined || profile) {
          return NextResponse.json({ error: 'Admins cannot modify SuperAdmin' }, { status: 400 })
        }
        // Admin cannot deactivate SuperAdmin
        if (isActive === false) {
          return NextResponse.json(
            { error: 'Admins cannot deactivate SuperAdmin' },
            { status: 400 },
          )
        }
      }
    }

    const updates: FirebaseFirestore.UpdateData<FirebaseFirestore.DocumentData> = {}
    if (newRole) updates.role = newRole
    if (category !== undefined) updates.category = category
    if (isActive !== undefined) updates['metadata.isActive'] = isActive
    if (profile) {
      // Update profile fields individually
      Object.keys(profile).forEach((key) => {
        const value = (profile as Record<string, unknown>)[key]
        if (value !== undefined) {
          updates[`profile.${key}`] = value as unknown
        }
      })
    }

    await adminDb.collection('users').doc(uid).update(updates)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error updating user:', err)
    return NextResponse.json(
      {
        error: 'Failed to update user',
        details:
          process.env.NODE_ENV === 'development'
            ? err instanceof Error
              ? err.message
              : String(err)
            : undefined,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ uid: string }> }) {
  try {
    const session = await getServerSession(authOptions as never)
    const role = (
      session && typeof session === 'object' && 'user' in session
        ? (session as { user?: { role?: unknown } }).user?.role
        : undefined
    ) as string | undefined

    if (!session || !role || (role !== 'SuperAdmin' && role !== 'Admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { uid } = await params

    // Get target user data
    const targetDoc = await adminDb.collection('users').doc(uid).get()
    const targetUser = targetDoc.exists ? targetDoc.data() : null

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Admin restriction: can only delete Staff, Partner, Agent
    if (role === 'Admin') {
      if (targetUser.role === 'SuperAdmin' || targetUser.role === 'Admin') {
        return NextResponse.json(
          { error: 'Admins can only delete Staff, Partner, and Agent users' },
          { status: 400 },
        )
      }
      if (
        !(
          typeof targetUser.role === 'string' &&
          ['Staff', 'Partner', 'Agent'].includes(targetUser.role)
        )
      ) {
        return NextResponse.json(
          { error: 'Admins can only delete Staff, Partner, and Agent users' },
          { status: 400 },
        )
      }
    }

    // Delete the user
    await adminDb.collection('users').doc(uid).delete()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Error deleting user:', err)
    return NextResponse.json(
      {
        error: 'Failed to delete user',
        details:
          process.env.NODE_ENV === 'development'
            ? err instanceof Error
              ? err.message
              : String(err)
            : undefined,
      },
      { status: 500 },
    )
  }
}

export function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 })
}
