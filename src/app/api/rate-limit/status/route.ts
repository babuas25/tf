import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { rateLimiter, RATE_LIMIT_CONFIGS, getClientIP, KEY_GENERATORS } from '@/lib/rate-limiting'

/**
 * GET /api/rate-limit/status
 * Check rate limit status for current user/IP
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as never)
    const userObj =
      session && typeof session === 'object' && 'user' in session
        ? (session as { user?: Record<string, unknown> }).user
        : undefined
    const ip = getClientIP(request)

    // Only allow authenticated users or in development
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (() => {
      const id = userObj?.id
      if (typeof id === 'string') return id
      if (typeof id === 'number' || typeof id === 'bigint') return id.toString()
      return undefined
    })()
    const userRole = (typeof userObj?.role === 'string' ? userObj.role : undefined) || 'anonymous'

    // Check status for different rate limit types
    const statuses = {
      ip: rateLimiter.getStatus(KEY_GENERATORS.IP(ip), RATE_LIMIT_CONFIGS.API),
      user: userId
        ? rateLimiter.getStatus(KEY_GENERATORS.USER(userId), RATE_LIMIT_CONFIGS.API)
        : null,
      auth: rateLimiter.getStatus(KEY_GENERATORS.IP(ip), RATE_LIMIT_CONFIGS.AUTH),
      admin:
        (userRole === 'SuperAdmin' || userRole === 'Admin') && userId
          ? rateLimiter.getStatus(KEY_GENERATORS.USER(userId), RATE_LIMIT_CONFIGS.ADMIN)
          : null,
    }

    return NextResponse.json({
      success: true,
      ip,
      userId,
      userRole,
      statuses,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error checking rate limit status:', error)
    return NextResponse.json({ error: 'Failed to check rate limit status' }, { status: 500 })
  }
}

/**
 * POST /api/rate-limit/status
 * Reset rate limits (SuperAdmin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as never)
    const userObj =
      session && typeof session === 'object' && 'user' in session
        ? (session as { user?: Record<string, unknown> }).user
        : undefined

    // Only SuperAdmin can reset rate limits
    const role = typeof userObj?.role === 'string' ? userObj.role : undefined
    if (!session || role !== 'SuperAdmin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: unknown = await request.json()
    const { targetUserId, targetIp, limitType } =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>)
        : { targetUserId: undefined, targetIp: undefined, limitType: undefined }
    const targetUserIdStr =
      typeof targetUserId === 'string' && targetUserId.length > 0 ? targetUserId : undefined
    const targetIpStr = typeof targetIp === 'string' && targetIp.length > 0 ? targetIp : undefined

    if (!targetUserIdStr && !targetIpStr) {
      return NextResponse.json({ error: 'Must provide targetUserId or targetIp' }, { status: 400 })
    }

    const config =
      RATE_LIMIT_CONFIGS[limitType as keyof typeof RATE_LIMIT_CONFIGS] || RATE_LIMIT_CONFIGS.API

    // Reset rate limits
    if (targetUserIdStr) {
      rateLimiter.reset(KEY_GENERATORS.USER(targetUserIdStr), config)
    }

    if (targetIpStr) {
      rateLimiter.reset(KEY_GENERATORS.IP(targetIpStr), config)
    }

    return NextResponse.json({
      success: true,
      message: 'Rate limits reset successfully',
      resetFor: { targetUserId: targetUserIdStr, targetIp: targetIpStr, limitType },
    })
  } catch (error) {
    console.error('Error resetting rate limits:', error)
    return NextResponse.json({ error: 'Failed to reset rate limits' }, { status: 500 })
  }
}
