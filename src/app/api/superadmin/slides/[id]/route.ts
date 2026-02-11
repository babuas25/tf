import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions as never)
  const userObj =
    session && typeof session === 'object' && 'user' in session
      ? (session as { user?: Record<string, unknown> }).user
      : undefined
  const role = userObj && typeof userObj.role === 'string' ? userObj.role : undefined
  if (!session || role !== 'SuperAdmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const raw: unknown = await request.json()
  const body = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const { id } = await params
  await adminDb.collection('auth_slides').doc(id).update(body)
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions as never)
  const userObj =
    session && typeof session === 'object' && 'user' in session
      ? (session as { user?: Record<string, unknown> }).user
      : undefined
  const role = userObj && typeof userObj.role === 'string' ? userObj.role : undefined
  if (!session || role !== 'SuperAdmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { id } = await params
  await adminDb.collection('auth_slides').doc(id).delete()
  return NextResponse.json({ ok: true })
}
