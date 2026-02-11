/**
 * Pagination utilities for database queries
 */

export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total?: number
    hasNext: boolean
    hasPrev: boolean
    nextCursor?: string
    prevCursor?: string
  }
}

export interface CursorPaginationParams {
  limit?: number
  cursor?: string
  orderBy?: string
  orderDirection?: 'asc' | 'desc'
}

export interface CursorPaginatedResponse<T> {
  data: T[]
  pagination: {
    limit: number
    hasNext: boolean
    nextCursor?: string
    prevCursor?: string
  }
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  }
}

/**
 * Generate cursor from item data
 */
export function generateCursor(item: unknown, orderBy: string = 'id'): string {
  const value =
    typeof item === 'object' && item !== null && orderBy in (item as Record<string, unknown>)
      ? (item as Record<string, unknown>)[orderBy]
      : undefined
  if (typeof value === 'string' || typeof value === 'number') {
    return Buffer.from(value.toString()).toString('base64')
  }
  if (value && typeof value === 'object' && 'seconds' in (value as Record<string, unknown>)) {
    const seconds = (value as Record<string, unknown>).seconds
    if (typeof seconds === 'number') {
      // Handle Firestore timestamps
      return Buffer.from(seconds.toString()).toString('base64')
    }
  }
  // Handle Firestore timestamps
  return Buffer.from(String(value)).toString('base64')
}

/**
 * Parse cursor to get the value
 */
export function parseCursor(cursor: string): unknown {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString()
    // Try to parse as number first
    const num = Number(decoded)
    if (!isNaN(num)) {
      return num
    }
    // Try to parse as JSON
    return JSON.parse(decoded)
  } catch {
    // Return as string if parsing fails
    return Buffer.from(cursor, 'base64').toString()
  }
}

/**
 * Default pagination limits
 */
export const PAGINATION_LIMITS = {
  USERS: 20,
  TRAVELLERS: 25,
  DASHBOARD: 10,
  MAX: 100,
} as const

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(
    PAGINATION_LIMITS.MAX,
    Math.max(1, params.limit || PAGINATION_LIMITS.USERS),
  )

  return { page, limit }
}

/**
 * Validate cursor pagination parameters
 */
export function validateCursorPaginationParams(params: CursorPaginationParams) {
  const limit = Math.min(
    PAGINATION_LIMITS.MAX,
    Math.max(1, params.limit || PAGINATION_LIMITS.USERS),
  )

  return {
    limit,
    cursor: params.cursor,
    orderBy: params.orderBy || 'createdAt',
    orderDirection: params.orderDirection || 'desc',
  }
}
