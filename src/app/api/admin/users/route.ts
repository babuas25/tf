import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'

import { authOptions } from '@/lib/auth/nextauth'
import { withCache, cacheKeys, cacheTTL } from '@/lib/cache'
import { serverEnv } from '@/lib/env.server'
import { logApiError } from '@/lib/error-monitoring'
import { adminDb } from '@/lib/firebase/admin'
import { rateLimiters } from '@/lib/middleware/rate-limit-middleware'
import { validatePaginationParams, PAGINATION_LIMITS } from '@/lib/pagination'

export async function GET(request: NextRequest) {
  // Apply rate limiting for admin endpoints
  return rateLimiters.admin(request, async (_req: NextRequest) => {
    // Parse pagination parameters from query string (outside try block for error logging)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || PAGINATION_LIMITS.USERS.toString())
    const roleFilter = searchParams.get('role') || 'all'
    const search = searchParams.get('search') || ''
    const { page: validPage, limit: validLimit } = validatePaginationParams({ page, limit })

    try {
      // Env is validated at startup; access to ensure bundling keeps it
      void serverEnv.FIREBASE_PROJECT_ID

      // Validate inputs with Zod
      const QuerySchema = z.object({
        page: z
          .string()
          .regex(/^\d+$/)
          .transform((v) => parseInt(v, 10))
          .optional(),
        limit: z
          .string()
          .regex(/^\d+$/)
          .transform((v) => parseInt(v, 10))
          .optional(),
        role: z.string().optional(),
        search: z.string().optional(),
      })
      const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams.entries()))
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: parsed.error.flatten() },
          { status: 400 },
        )
      }

      const session = await getServerSession(authOptions as never)
      const role = (
        session && typeof session === 'object' && 'user' in session
          ? (session as { user?: { role?: unknown } }).user?.role
          : undefined
      ) as string | undefined

      if (!session || !role || (role !== 'SuperAdmin' && role !== 'Admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      // Create cache key based on parameters
      const cacheKey = cacheKeys.users(validLimit, `${roleFilter}:${search}`)

      // Use cache with fallback to database
      const result = await withCache(
        cacheKey,
        async () => {
          type AdminUserRow = {
            email: string
            role: string
            profile?: { firstName?: string; lastName?: string }
            metadata?: {
              createdAt?: { seconds: number; nanoseconds: number }
              lastLoginAt?: { seconds: number; nanoseconds: number }
            }
            [key: string]: unknown
          }
          let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
            adminDb.collection('users')

          // Apply role filter if specified
          if (roleFilter !== 'all') {
            query = query.where('role', '==', roleFilter)
          }

          // Apply search filter if specified
          if (search) {
            // Note: Firestore doesn't support full-text search, so we'll filter client-side
            // For better performance, consider using Algolia or similar search service
          }

          // Get total count for pagination (limited to avoid performance issues)
          const countSnapshot = await query.limit(1000).get()
          const total = countSnapshot.size

          // Apply pagination
          const offset = (validPage - 1) * validLimit
          const snapshot = await query
            .orderBy('metadata.createdAt', 'desc')
            .offset(offset)
            .limit(validLimit)
            .get()

          const users: Array<AdminUserRow & { uid: string }> = snapshot.docs.map(
            (d: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) => {
              const data = d.data() as AdminUserRow
              // Ensure timestamps are properly serialized
              if (data.metadata?.createdAt) {
                data.metadata.createdAt = {
                  seconds: data.metadata.createdAt.seconds,
                  nanoseconds: data.metadata.createdAt.nanoseconds,
                }
              }
              if (data.metadata?.lastLoginAt) {
                data.metadata.lastLoginAt = {
                  seconds: data.metadata.lastLoginAt.seconds,
                  nanoseconds: data.metadata.lastLoginAt.nanoseconds,
                }
              }
              return { uid: d.id, ...data }
            },
          )

          // Apply client-side search filter if needed
          const filteredUsers = search
            ? users.filter((user: AdminUserRow & { uid: string }) => {
                const searchLower = search.toLowerCase()
                const name =
                  `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.toLowerCase()
                return (
                  user.email.toLowerCase().includes(searchLower) ||
                  name.includes(searchLower) ||
                  user.role.toLowerCase().includes(searchLower)
                )
              })
            : users

          return {
            users: filteredUsers,
            total: Math.min(total, 1000), // Cap total at 1000 for performance
            page: validPage,
            limit: validLimit,
          }
        },
        cacheTTL.users,
      )

      return NextResponse.json({
        users: result.users,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          hasNext: result.users.length === validLimit && result.page * validLimit < result.total,
          hasPrev: result.page > 1,
        },
      })
    } catch (err) {
      console.error('Error fetching users:', err)

      // Log error with context
      logApiError('/api/admin/users', 'GET', 500, err as Error, {
        page: validPage,
        limit: validLimit,
        roleFilter,
        search,
      })

      return NextResponse.json(
        {
          error: 'Failed to fetch users',
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
  })
}
