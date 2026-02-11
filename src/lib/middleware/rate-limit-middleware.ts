/**
 * Rate Limiting Middleware for Next.js API Routes
 * Provides easy-to-use rate limiting with multiple strategies
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import { authOptions } from '@/lib/auth/nextauth'
import { logWarning, logError } from '@/lib/error-monitoring'
import {
  rateLimiter,
  RateLimitConfig,
  RateLimitResult,
  getClientIP,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
  KEY_GENERATORS,
} from '@/lib/rate-limiting'

export type RateLimitStrategy = 'ip' | 'user' | 'ip_user' | 'endpoint' | 'role'

export interface RateLimitOptions {
  config?: RateLimitConfig
  strategy?: RateLimitStrategy
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  onLimitReached?: (identifier: string, result: RateLimitResult) => void
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimit(options: RateLimitOptions = {}) {
  const config = options.config || RATE_LIMIT_CONFIGS.API
  const strategy = options.strategy || 'ip'

  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>,
  ): Promise<NextResponse> {
    try {
      // Get identifier based on strategy
      const identifier = await getIdentifier(request, strategy)

      // Check rate limit
      const result = rateLimiter.checkLimit(identifier, config)

      // If rate limit exceeded
      if (!result.success) {
        // Call custom handler if provided
        if (options.onLimitReached) {
          options.onLimitReached(identifier, result)
        }

        // Log rate limit violation
        logWarning('Rate limit exceeded', {
          component: 'RateLimit',
          action: 'blocked_request',
          metadata: {
            identifier,
            strategy,
            limit: result.limit,
            retryAfter: result.retryAfter,
            endpoint: request.url,
          },
        })

        // Return rate limit error
        const headers = config.headers ? createRateLimitHeaders(result) : {}

        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: config.message || 'Too many requests. Please try again later.',
            retryAfter: result.retryAfter,
          },
          {
            status: 429,
            headers,
          },
        )
      }

      // Execute the handler
      const response = await handler(request)

      // Add rate limit headers to successful responses
      if (config.headers) {
        const headers = createRateLimitHeaders(result)
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }

      return response
    } catch (error) {
      logError(error as Error, {
        component: 'RateLimit',
        action: 'middleware_error',
        metadata: { strategy, endpoint: request.url },
      })

      // Continue without rate limiting if there's an error
      return handler(request)
    }
  }
}

/**
 * Get identifier based on strategy
 */
async function getIdentifier(request: NextRequest, strategy: RateLimitStrategy): Promise<string> {
  const ip = getClientIP(request)

  // Helper to fetch session user safely without relying on any-typed access
  const getSessionUser = async (): Promise<{ id?: string; role?: string } | null> => {
    // Use a narrower cast to satisfy TS without introducing any-typed arguments
    const session = await getServerSession(authOptions as never)
    if (session && typeof session === 'object' && 'user' in session) {
      const maybeUser = (session as { user?: unknown }).user
      if (maybeUser && typeof maybeUser === 'object') {
        const id = 'id' in maybeUser ? (maybeUser as { id?: unknown }).id : undefined
        const role = 'role' in maybeUser ? (maybeUser as { role?: unknown }).role : undefined
        return {
          ...(typeof id === 'string' ? { id } : {}),
          ...(typeof role === 'string' ? { role } : {}),
        }
      }
    }
    return null
  }

  switch (strategy) {
    case 'ip':
      return KEY_GENERATORS.IP(ip)

    case 'user': {
      const user = await getSessionUser()
      const userId = user?.id
      if (!userId) {
        // Fall back to IP if no user session
        return KEY_GENERATORS.IP(ip)
      }
      return KEY_GENERATORS.USER(userId)
    }

    case 'ip_user': {
      const user = await getSessionUser()
      const userId = user?.id
      return KEY_GENERATORS.IP_USER(ip, userId)
    }

    case 'endpoint': {
      const endpoint = new URL(request.url).pathname
      return KEY_GENERATORS.ENDPOINT(endpoint, ip)
    }

    case 'role': {
      const user = await getSessionUser()
      const role = user?.role || 'anonymous'
      return KEY_GENERATORS.ROLE(role, ip)
    }

    default:
      return KEY_GENERATORS.IP(ip)
  }
}

/**
 * Predefined rate limiters for common use cases
 */
export const rateLimiters = {
  // Authentication endpoints
  auth: createRateLimit({
    config: RATE_LIMIT_CONFIGS.AUTH,
    strategy: 'ip',
  }),

  // General API endpoints
  api: createRateLimit({
    config: RATE_LIMIT_CONFIGS.API,
    strategy: 'ip_user',
  }),

  // Admin endpoints
  admin: createRateLimit({
    config: RATE_LIMIT_CONFIGS.ADMIN,
    strategy: 'user',
  }),

  // User management endpoints
  userManagement: createRateLimit({
    config: RATE_LIMIT_CONFIGS.USER_MANAGEMENT,
    strategy: 'user',
  }),

  // Upload endpoints
  upload: createRateLimit({
    config: RATE_LIMIT_CONFIGS.UPLOAD,
    strategy: 'user',
  }),

  // General endpoints
  general: createRateLimit({
    config: RATE_LIMIT_CONFIGS.GENERAL,
    strategy: 'ip',
  }),
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  options: RateLimitOptions = {},
) {
  const rateLimit = createRateLimit(options)

  return async function rateLimitedHandler(
    request: NextRequest,
    ...args: unknown[]
  ): Promise<NextResponse> {
    return rateLimit(request, () => handler(request, ...args))
  }
}

/**
 * Utility to check rate limit status without incrementing
 */
export async function checkRateLimitStatus(
  request: NextRequest,
  config: RateLimitConfig,
  strategy: RateLimitStrategy = 'ip',
): Promise<RateLimitResult> {
  const identifier = await getIdentifier(request, strategy)
  return rateLimiter.getStatus(identifier, config)
}

/**
 * Utility to reset rate limit for specific identifier
 */
export async function resetRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  strategy: RateLimitStrategy = 'ip',
): Promise<void> {
  const identifier = await getIdentifier(request, strategy)
  rateLimiter.reset(identifier, config)
}
