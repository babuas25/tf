'use client'

import { useSession } from 'next-auth/react'
import { useCallback } from 'react'

import { logError, logApiError, logAuthError, ErrorContext } from '@/lib/error-monitoring'

interface UseErrorHandlerReturn {
  handleError: (error: Error | string, context?: ErrorContext) => void
  handleApiError: (
    endpoint: string,
    method: string,
    response: Response,
    error?: Error | string,
    requestData?: unknown,
  ) => void
  handleAuthError: (
    action: string,
    error: Error | string,
    metadata?: Record<string, unknown>,
  ) => void
  handleAsyncError: <T>(asyncFn: () => Promise<T>, context?: ErrorContext) => Promise<T | null>
}

/**
 * Custom hook for centralized error handling
 * Provides consistent error logging with user context
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const { data: session } = useSession()

  const handleError = useCallback(
    (error: Error | string, context?: ErrorContext) => {
      const id = (session?.user as { id?: string } | undefined)?.id
      const role = (session?.user as { role?: string } | undefined)?.role
      const enrichedContext: ErrorContext = {
        ...context,
        ...(id ? { userId: id } : {}),
        ...(role ? { userRole: role } : {}),
      }

      logError(error, enrichedContext)
    },
    [session],
  )

  const handleApiError = useCallback(
    (
      endpoint: string,
      method: string,
      response: Response,
      error?: Error | string,
      requestData?: unknown,
    ) => {
      const errorMessage = error || `API Error: ${response.status} ${response.statusText}`
      logApiError(endpoint, method, response.status, errorMessage, requestData)
    },
    [],
  )

  const handleAuthError = useCallback(
    (action: string, error: Error | string, metadata?: Record<string, unknown>) => {
      const id = (session?.user as { id?: string } | undefined)?.id
      const role = (session?.user as { role?: string } | undefined)?.role
      logAuthError(action, error, {
        ...metadata,
        ...(id ? { userId: id } : {}),
        ...(role ? { userRole: role } : {}),
      })
    },
    [session],
  )

  const handleAsyncError = useCallback(
    async <T>(asyncFn: () => Promise<T>, context?: ErrorContext): Promise<T | null> => {
      try {
        return await asyncFn()
      } catch (error) {
        handleError(error as Error, context)
        return null
      }
    },
    [handleError],
  )

  return {
    handleError,
    handleApiError,
    handleAuthError,
    handleAsyncError,
  }
}

/**
 * Higher-order function to wrap API calls with error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext,
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error as Error, context)
      return null
    }
  }
}

/**
 * Utility to create safe async functions that won't throw
 */
export function createSafeAsync<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  fallbackValue: R,
  context?: ErrorContext,
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      logError(error as Error, context)
      return fallbackValue
    }
  }
}
