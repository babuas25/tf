import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { rateLimiters } from '@/lib/middleware/rate-limit-middleware'
import { rateLimiter } from '@/lib/rate-limiting'

/**
 * GET /api/rate-limit/stats
 * Get rate limiting statistics (SuperAdmin only)
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting for admin endpoints
  return rateLimiters.admin(request, async (_req: NextRequest) => {
    try {
      const session = await getServerSession(authOptions as never)
      const userObj =
        session && typeof session === 'object' && 'user' in session
          ? (session as { user?: Record<string, unknown> }).user
          : undefined
      const role = userObj && typeof userObj.role === 'string' ? userObj.role : undefined
      // Only SuperAdmin can view rate limit stats
      if (!session || role !== 'SuperAdmin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const stats = rateLimiter.getStats()

      // Group entries by type for better visualization
      const groupedStats = {
        total: stats.totalEntries,
        byType: {} as Record<string, number>,
        byStatus: {
          active: 0,
          nearLimit: 0,
          exceeded: 0,
        },
        entries: stats.entries.map((entry) => ({
          ...entry,
          type: entry.key.split(':')[0],
          isActive: entry.remaining > 0,
          isNearLimit: entry.remaining < 300000, // Less than 5 minutes
          timeRemaining: Math.max(0, entry.remaining),
        })),
      }

      // Calculate statistics
      groupedStats.entries.forEach((entry) => {
        // Count by type
        const typeKey = entry.type ?? 'unknown'
        groupedStats.byType[typeKey] = (groupedStats.byType[typeKey] || 0) + 1

        // Count by status
        if (entry.isActive) {
          groupedStats.byStatus.active++
          if (entry.isNearLimit) {
            groupedStats.byStatus.nearLimit++
          }
        } else {
          groupedStats.byStatus.exceeded++
        }
      })

      return NextResponse.json({
        success: true,
        stats: groupedStats,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching rate limit stats:', error)
      return NextResponse.json({ error: 'Failed to fetch rate limit stats' }, { status: 500 })
    }
  })
}
