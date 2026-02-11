'use client'

import { Users, TrendingUp, Activity, Star } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { StatsCard } from '@/components/dashboard/stats-card'
import { DynamicButton } from '@/components/ui/dynamic-theme-components'

interface DashboardHomeProps {
  userRole?: string
}

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  usersByRole: {
    SuperAdmin: number
    Admin: number
    Staff: number
    Partner: number
    Agent: number
    User: number
  }
  trends: {
    totalUsers: number
    activeUsers: number
    staff: number
    partners: number
    agents: number
  }
}

export function DashboardHome({ userRole }: DashboardHomeProps) {
  const { data: session } = useSession()
  const extractedRole = (() => {
    const u = session?.user
    if (u && typeof u === 'object' && 'role' in u) {
      const r = (u as Record<string, unknown>).role
      return typeof r === 'string' ? r : undefined
    }
    return undefined
  })()
  const role = userRole || extractedRole
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetch('/api/dashboard/stats')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard statistics')
        }
        const raw: unknown = await response.json()
        // Narrow to DashboardStats shape minimally
        const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object'
        if (
          isObj(raw) &&
          typeof raw.totalUsers === 'number' &&
          typeof raw.activeUsers === 'number' &&
          isObj(raw.usersByRole) &&
          isObj(raw.trends)
        ) {
          const users: Record<string, unknown> = raw.usersByRole
          const trends: Record<string, unknown> = raw.trends
          const data: DashboardStats = {
            totalUsers: raw.totalUsers,
            activeUsers: raw.activeUsers,
            usersByRole: {
              SuperAdmin: Number(users['SuperAdmin']) || 0,
              Admin: Number(users['Admin']) || 0,
              Staff: Number(users['Staff']) || 0,
              Partner: Number(users['Partner']) || 0,
              Agent: Number(users['Agent']) || 0,
              User: Number(users['User']) || 0,
            },
            trends: {
              totalUsers: Number(trends['totalUsers']) || 0,
              activeUsers: Number(trends['activeUsers']) || 0,
              staff: Number(trends['staff']) || 0,
              partners: Number(trends['partners']) || 0,
              agents: Number(trends['agents']) || 0,
            },
          }
          setStats(data)
        } else {
          throw new Error('Invalid stats payload')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics')
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchStats()
  }, [])

  const getWelcomeMessage = () => {
    const nameVal =
      session?.user && typeof session.user === 'object'
        ? (session.user as Record<string, unknown>).name
        : undefined
    const firstName = typeof nameVal === 'string' ? nameVal.split(' ')[0] || 'User' : 'User'
    return `Welcome back, ${firstName}!`
  }

  const getRoleSpecificContent = () => {
    const totalUsers = stats?.totalUsers || 0
    const activeUsers = stats?.activeUsers || 0
    const staffCount = stats?.usersByRole.Staff || 0
    const partnerCount = stats?.usersByRole.Partner || 0
    const agentCount = stats?.usersByRole.Agent || 0
    const adminCount = stats?.usersByRole.Admin || 0
    // const superAdminCount = stats?.usersByRole.SuperAdmin || 0

    switch (role) {
      case 'SuperAdmin':
        return {
          title: 'Super Admin Dashboard',
          description: 'Manage the entire platform, themes, and user administration.',
          stats: [
            {
              title: 'Total Users',
              value: totalUsers.toLocaleString(),
              icon: Users,
              trend: { value: stats?.trends.totalUsers || 0, isPositive: true },
            },
            {
              title: 'Active Users',
              value: activeUsers.toLocaleString(),
              icon: Activity,
              trend: { value: stats?.trends.activeUsers || 0, isPositive: true },
            },
            {
              title: 'Admins',
              value: adminCount.toString(),
              icon: Star,
              trend: { value: Math.floor(Math.random() * 3) + 1, isPositive: true },
            },
            {
              title: 'Staff Members',
              value: staffCount.toString(),
              icon: Users,
              trend: { value: stats?.trends.staff || 0, isPositive: true },
            },
          ],
        }
      case 'Admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage users, monitor system performance, and oversee operations.',
          stats: [
            {
              title: 'Total Users',
              value: totalUsers.toLocaleString(),
              icon: Users,
              trend: { value: stats?.trends.totalUsers || 0, isPositive: true },
            },
            {
              title: 'Active Staff',
              value: staffCount.toString(),
              icon: Users,
              trend: { value: stats?.trends.staff || 0, isPositive: true },
            },
            {
              title: 'Partners',
              value: partnerCount.toString(),
              icon: Star,
              trend: { value: stats?.trends.partners || 0, isPositive: true },
            },
            {
              title: 'Agents',
              value: agentCount.toString(),
              icon: TrendingUp,
              trend: { value: stats?.trends.agents || 0, isPositive: true },
            },
          ],
        }
      case 'Staff':
        return {
          title: 'Staff Dashboard',
          description: 'Manage daily operations, customer support, and content.',
          stats: [
            {
              title: 'Open Tickets',
              value: '12',
              icon: Activity,
              trend: { value: -3, isPositive: true },
            },
            {
              title: 'Resolved Today',
              value: '28',
              icon: TrendingUp,
              trend: { value: 5, isPositive: true },
            },
            {
              title: 'Active Projects',
              value: '7',
              icon: Star,
              trend: { value: 1, isPositive: true },
            },
            {
              title: 'Team Members',
              value: '24',
              icon: Users,
              trend: { value: 0, isPositive: true },
            },
          ],
        }
      case 'Partner':
        return {
          title: 'Partner Dashboard',
          description: 'Manage your business partnerships and service offerings.',
          stats: [
            {
              title: 'Active Services',
              value: '15',
              icon: Star,
              trend: { value: 2, isPositive: true },
            },
            {
              title: 'Monthly Revenue',
              value: '$12,450',
              icon: TrendingUp,
              trend: { value: 15, isPositive: true },
            },
            {
              title: 'Partner Rating',
              value: '4.8/5',
              icon: Star,
              trend: { value: 0.2, isPositive: true },
            },
            {
              title: 'Active Bookings',
              value: '89',
              icon: Activity,
              trend: { value: 12, isPositive: true },
            },
          ],
        }
      case 'Agent':
        return {
          title: 'Agent Dashboard',
          description: 'Manage bookings, customer relationships, and sales.',
          stats: [
            {
              title: 'Total Bookings',
              value: '156',
              icon: TrendingUp,
              trend: { value: 23, isPositive: true },
            },
            {
              title: 'Monthly Sales',
              value: '$8,920',
              icon: TrendingUp,
              trend: { value: 18, isPositive: true },
            },
            {
              title: 'Customer Rating',
              value: '4.7/5',
              icon: Star,
              trend: { value: 0.1, isPositive: true },
            },
            {
              title: 'Active Leads',
              value: '34',
              icon: Users,
              trend: { value: 7, isPositive: true },
            },
          ],
        }
      case 'User':
      default:
        return {
          title: 'Travel Dashboard',
          description: 'Manage your travel plans, bookings, and preferences.',
          stats: [
            {
              title: 'Upcoming Trips',
              value: '3',
              icon: Star,
              trend: { value: 1, isPositive: true },
            },
            {
              title: 'Total Bookings',
              value: '12',
              icon: TrendingUp,
              trend: { value: 2, isPositive: true },
            },
            {
              title: 'Loyalty Points',
              value: '2,450',
              icon: Star,
              trend: { value: 150, isPositive: true },
            },
            {
              title: 'Saved Places',
              value: '24',
              icon: Activity,
              trend: { value: 3, isPositive: true },
            },
          ],
        }
    }
  }

  const content = getRoleSpecificContent()

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {getWelcomeMessage()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading dashboard statistics...</p>
        </div>

        {/* Loading Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg animate-pulse"
            >
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {getWelcomeMessage()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{content.description}</p>
        </div>

        <div className="p-6 bg-red-500/20 backdrop-blur-md rounded-xl border border-red-500/30 shadow-lg">
          <p className="text-red-600 dark:text-red-200">
            <strong>Error loading dashboard:</strong> {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section with Glassmorphism */}
      <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {getWelcomeMessage()}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">{content.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {content.stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {role === 'SuperAdmin' && (
          <>
            <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg hover:bg-white/25 dark:hover:bg-white/15 transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                User Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Manage users, roles, and permissions across the platform.
              </p>
              <DynamicButton variant="primary" asChild>
                <a href="/superadmin/admin/user-management">Manage Users</a>
              </DynamicButton>
            </div>

            <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg hover:bg-white/25 dark:hover:bg-white/15 transition-all duration-300">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Theme Management
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Customize platform themes and visual settings.
              </p>
              <DynamicButton variant="secondary" asChild>
                <a href="/superadmin/theme">Manage Themes</a>
              </DynamicButton>
            </div>
          </>
        )}

        {role === 'Admin' && (
          <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg hover:bg-white/25 dark:hover:bg-white/15 transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              User Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              View and manage users, their roles and categories.
            </p>
            <DynamicButton variant="primary" asChild>
              <a href="/users/admin/user-management">Manage Users</a>
            </DynamicButton>
          </div>
        )}

        <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg hover:bg-white/25 dark:hover:bg-white/15 transition-all duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Profile Settings
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Update your profile information and preferences.
          </p>
          <DynamicButton variant="outline" asChild>
            <a href="/profile">Edit Profile</a>
          </DynamicButton>
        </div>

        <div className="p-6 bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg hover:bg-white/25 dark:hover:bg-white/15 transition-all duration-300">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Support</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get help and support for your account and platform usage.
          </p>
          <DynamicButton variant="ghost" asChild>
            <a href="/support">Contact Support</a>
          </DynamicButton>
        </div>
      </div>
    </div>
  )
}
