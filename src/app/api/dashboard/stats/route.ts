import { NextRequest, NextResponse } from 'next/server'

import { withCache, cacheKeys, cacheTTL } from '@/lib/cache'
import { adminDb } from '@/lib/firebase/admin'

type UserData = {
  metadata?: { isActive?: boolean }
  role: string
}

export async function GET(_request: NextRequest) {
  try {
    // Use cache for dashboard stats
    const stats = await withCache(
      cacheKeys.dashboardStats(),
      async () => {
        // Get all users from the database (limit to 1000 for performance)
        const usersSnapshot = await adminDb.collection('users').limit(1000).get()
        const users = usersSnapshot.docs.map((doc) => doc.data() as UserData)

        // Calculate statistics
        return {
          totalUsers: users.length,
          activeUsers: users.filter((user) => user.metadata?.isActive).length,
          usersByRole: {
            SuperAdmin: users.filter((user) => user.role === 'SuperAdmin').length,
            Admin: users.filter((user) => user.role === 'Admin').length,
            Staff: users.filter((user) => user.role === 'Staff').length,
            Partner: users.filter((user) => user.role === 'Partner').length,
            Agent: users.filter((user) => user.role === 'Agent').length,
            User: users.filter((user) => user.role === 'User').length,
          },
          // Calculate trends (simplified - you could store historical data for more accurate trends)
          trends: {
            totalUsers: Math.floor(Math.random() * 10) + 1, // Placeholder trend
            activeUsers: Math.floor(Math.random() * 8) + 1,
            staff: Math.floor(Math.random() * 5) + 1,
            partners: Math.floor(Math.random() * 3) + 1,
            agents: Math.floor(Math.random() * 6) + 1,
          },
        }
      },
      cacheTTL.dashboardStats,
    )

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 })
  }
}
