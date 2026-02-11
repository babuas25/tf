import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb } from '@/lib/firebase/admin'
import { rateLimiters } from '@/lib/middleware/rate-limit-middleware'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  return rateLimiters.admin(request, async () => {
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
    const src = typeof body.src === 'string' ? body.src : ''
    const alt = typeof body.alt === 'string' ? body.alt : ''
    if (!src || typeof src !== 'string') {
      return NextResponse.json({ error: 'src required' }, { status: 400 })
    }
    const doc = await adminDb
      .collection('auth_slides')
      .add({ src, alt: alt ?? '', createdAt: new Date() })
    return NextResponse.json({ id: doc.id })
  })
}
