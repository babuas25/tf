import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { adminDb } from '@/lib/firebase/admin'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as never)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userObj =
      typeof session === 'object' && 'user' in session
        ? (session as { user?: Record<string, unknown> }).user
        : undefined
    const role = (userObj && typeof userObj.role === 'string' ? userObj.role : undefined) || 'User'
    if (role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const raw: unknown = await req.json()
    const { colorTheme, mode } =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}

    const allowed = [
      'default',
      'red',
      'rose',
      'orange',
      'yellow',
      'green',
      'blue',
      'violet',
      'teal',
      'slate',
    ]
    const themeName =
      typeof colorTheme === 'string' && allowed.includes(colorTheme) ? colorTheme : 'slate'
    const themeMode = mode === 'dark' ? 'dark' : 'light'

    const payload = {
      colorTheme: themeName,
      mode: themeMode,
      updatedAt: new Date(),
      updatedBy: userObj && typeof userObj.id === 'string' ? userObj.id : undefined,
    }

    await adminDb.collection('themes').doc('global').set(payload, { merge: true })

    return NextResponse.json({ ok: true, theme: payload })
  } catch (error) {
    console.error('POST /api/theme error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
