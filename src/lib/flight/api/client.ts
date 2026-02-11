// Base HTTP client with authentication
import { AUTH_CONFIG } from './endpoints'

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface FetchOptions extends RequestInit {
  skipAuth?: boolean
}

export async function apiClient<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  }

  // Add Basic Auth
  if (!skipAuth) {
    const basicAuth = Buffer.from(
      `${AUTH_CONFIG.username}:${AUTH_CONFIG.password}`
    ).toString('base64')
    headers['Authorization'] = `Basic ${basicAuth}`
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      // Add mode: 'cors' for cross-origin requests
      mode: 'cors',
      // Add credentials if needed
      credentials: 'omit',
    })

    // Check if response is ok
    if (!response.ok) {
      throw new ApiError(
        response.status,
        'HTTP_ERROR',
        `HTTP ${response.status}: ${response.statusText}`
      )
    }

    const data: unknown = await response.json()

    // Type guard for API response
    interface ApiResponse {
      success: boolean
      error?: {
        errorCode?: string
        errorMessage?: string
      }
    }

    // Check for API-level errors
    if (typeof data === 'object' && data !== null && 'success' in data) {
      const apiData = data as ApiResponse
      if (!apiData.success) {
        throw new ApiError(
          response.status,
          apiData.error?.errorCode || 'UNKNOWN_ERROR',
          apiData.error?.errorMessage || 'An unknown error occurred'
        )
      }
    }

    return data as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    // Network or parsing errors
    throw new ApiError(
      500,
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed'
    )
  }
}
