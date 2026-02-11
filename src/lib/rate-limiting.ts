/**
 * Rate Limiting System
 * Implements token bucket algorithm with multiple strategies
 */

import { logWarning } from './error-monitoring'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (identifier: string) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
  headers?: boolean
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup()
      },
      5 * 60 * 1000,
    )
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
    const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier
    const now = Date.now()

    // Get or create entry
    let entry = this.store.get(key)

    if (!entry || entry.resetTime <= now) {
      // Create new window
      entry = {
        count: 1,
        resetTime: now + config.windowMs,
        firstRequest: now,
      }
      this.store.set(key, entry)

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: entry.resetTime,
      }
    }

    // Check if within limit
    if (entry.count < config.maxRequests) {
      entry.count++
      this.store.set(key, entry)

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime,
      }
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)

    // Log rate limit violation
    logWarning('Rate limit exceeded', {
      component: 'RateLimit',
      action: 'limit_exceeded',
      metadata: {
        identifier: key,
        count: entry.count,
        limit: config.maxRequests,
        retryAfter,
      },
    })

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    }
  }

  /**
   * Reset rate limit for specific identifier
   */
  reset(identifier: string, config: RateLimitConfig): void {
    const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier
    this.store.delete(key)
  }

  /**
   * Get current status without incrementing
   */
  getStatus(identifier: string, config: RateLimitConfig): RateLimitResult {
    const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier
    const now = Date.now()
    const entry = this.store.get(key)

    if (!entry || entry.resetTime <= now) {
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests,
        resetTime: now + config.windowMs,
      }
    }

    const remaining = Math.max(0, config.maxRequests - entry.count)

    return {
      success: remaining > 0,
      limit: config.maxRequests,
      remaining,
      resetTime: entry.resetTime,
      ...(remaining === 0 ? { retryAfter: Math.ceil((entry.resetTime - now) / 1000) } : {}),
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0

    Array.from(this.store.entries()).forEach(([key, entry]) => {
      if (entry.resetTime <= now) {
        this.store.delete(key)
        cleaned++
      }
    })

    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`Rate limiter cleanup: removed ${cleaned} expired entries`)
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalEntries: this.store.size,
      entries: Array.from(this.store.entries()).map(([key, entry]) => ({
        key,
        count: entry.count,
        resetTime: new Date(entry.resetTime).toISOString(),
        remaining: Math.max(0, entry.resetTime - Date.now()),
      })),
    }
  }

  /**
   * Cleanup on destroy
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Create singleton instance
export const rateLimiter = new RateLimiter()

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - stricter limits
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    message: 'Too many authentication attempts. Please try again later.',
    headers: true,
  } as RateLimitConfig,

  // API endpoints - moderate limits
  API: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    message: 'Too many API requests. Please slow down.',
    headers: true,
  } as RateLimitConfig,

  // Admin endpoints - more restrictive
  ADMIN: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30, // 30 requests per minute
    message: 'Too many admin requests. Please slow down.',
    headers: true,
  } as RateLimitConfig,

  // User management - very restrictive
  USER_MANAGEMENT: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 10, // 10 requests per 5 minutes
    message: 'Too many user management requests. Please wait before trying again.',
    headers: true,
  } as RateLimitConfig,

  // File uploads - restrictive
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 uploads per minute
    message: 'Too many upload requests. Please wait before uploading again.',
    headers: true,
  } as RateLimitConfig,

  // General endpoints - lenient
  GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    message: 'Too many requests. Please slow down.',
    headers: true,
  } as RateLimitConfig,
}

// Key generators for different strategies
export const KEY_GENERATORS = {
  // IP-based rate limiting
  IP: (ip: string) => `ip:${ip}`,

  // User-based rate limiting
  USER: (userId: string) => `user:${userId}`,

  // Combined IP + User
  IP_USER: (ip: string, userId?: string) => (userId ? `ip_user:${ip}:${userId}` : `ip:${ip}`),

  // Endpoint-specific
  ENDPOINT: (endpoint: string, identifier: string) => `endpoint:${endpoint}:${identifier}`,

  // Role-based
  ROLE: (role: string, identifier: string) => `role:${role}:${identifier}`,
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string {
  // Check various headers for IP address
  const headers = request.headers

  // Vercel/Netlify
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]
    return first ? first.trim() : 'unknown'
  }

  // Cloudflare
  const cfConnectingIP = headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Other proxies
  const realIP = headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback
  return 'unknown'
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
  }

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString()
  }

  return headers
}
