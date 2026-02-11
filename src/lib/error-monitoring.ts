/**
 * Error Monitoring and Logging Utilities
 * Centralized error handling for the application
 */

export interface ErrorContext {
  userId?: string
  userRole?: string
  component?: string
  action?: string
  metadata?: Record<string, unknown>
}

export interface ErrorLog {
  id: string
  timestamp: string
  level: 'error' | 'warn' | 'info'
  message: string
  stack?: string
  context?: ErrorContext
  userAgent?: string
  url?: string
  sessionId?: string
}

class ErrorMonitor {
  private sessionId: string
  private userId?: string
  private userRole?: string

  constructor() {
    this.sessionId = this.generateSessionId()
  }

  /**
   * Initialize error monitoring with user context
   */
  init(userId?: string, userRole?: string) {
    if (userId !== undefined) this.userId = userId
    if (userRole !== undefined) this.userRole = userRole

    // Set up global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', this.handleGlobalError)
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
    }
  }

  /**
   * Log an error with context
   */
  logError(error: Error | string, context?: ErrorContext) {
    const errorLog = this.createErrorLog('error', error, context)
    this.sendErrorLog(errorLog)
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: ErrorContext) {
    const errorLog = this.createErrorLog('warn', message, context)
    this.sendErrorLog(errorLog)
  }

  /**
   * Log info for debugging
   */
  logInfo(message: string, context?: ErrorContext) {
    const errorLog = this.createErrorLog('info', message, context)
    this.sendErrorLog(errorLog)
  }

  /**
   * Log API errors with request details
   */
  logApiError(
    endpoint: string,
    method: string,
    status: number,
    error: Error | string,
    requestData?: unknown,
  ) {
    const context: ErrorContext = {
      component: 'API',
      action: `${method} ${endpoint}`,
      metadata: {
        status,
        requestData:
          requestData === undefined
            ? undefined
            : (() => {
                try {
                  if (
                    typeof requestData === 'string' ||
                    typeof requestData === 'number' ||
                    typeof requestData === 'boolean'
                  ) {
                    return String(requestData)
                  }
                  return JSON.stringify(requestData).slice(0, 500)
                } catch {
                  return '[unserializable]'
                }
              })(),
      },
    }

    this.logError(error, context)
  }

  /**
   * Log authentication errors
   */
  logAuthError(action: string, error: Error | string, metadata?: Record<string, unknown>) {
    const context: ErrorContext = {
      component: 'Authentication',
      action,
      ...(metadata !== undefined ? { metadata } : {}),
    }

    this.logError(error, context)
  }

  /**
   * Log form validation errors
   */
  logFormError(formName: string, fieldErrors: Record<string, string>) {
    const context: ErrorContext = {
      component: 'Form',
      action: `Validation Error - ${formName}`,
      metadata: { fieldErrors },
    }

    this.logWarning('Form validation failed', context)
  }

  /**
   * Create error log object
   */
  private createErrorLog(
    level: 'error' | 'warn' | 'info',
    error: Error | string,
    context?: ErrorContext,
  ): ErrorLog {
    const message = typeof error === 'string' ? error : error.message
    const stack = typeof error === 'object' ? error.stack : undefined

    const mergedContext: ErrorContext = {
      ...context,
      ...((context?.userId ?? this.userId) !== undefined
        ? { userId: (context?.userId ?? this.userId)! }
        : {}),
      ...((context?.userRole ?? this.userRole) !== undefined
        ? { userRole: (context?.userRole ?? this.userRole)! }
        : {}),
    }

    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(stack !== undefined ? { stack } : {}),
      context: mergedContext,
      ...(typeof window !== 'undefined' ? { userAgent: window.navigator.userAgent } : {}),
      ...(typeof window !== 'undefined' ? { url: window.location.href } : {}),
      sessionId: this.sessionId,
    }
  }

  /**
   * Send error log to monitoring service
   */
  private sendErrorLog(errorLog: ErrorLog) {
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 ${errorLog.level.toUpperCase()}: ${errorLog.message}`)
      console.log('Context:', errorLog.context)
      console.log('Timestamp:', errorLog.timestamp)
      if (errorLog.stack) {
        console.log('Stack:', errorLog.stack)
      }
      console.groupEnd()
    }

    // Store in localStorage for debugging
    this.storeLocalError(errorLog)

    // Send to external service (implement based on your monitoring solution)
    this.sendToExternalService(errorLog)
  }

  /**
   * Store error in localStorage for debugging
   */
  private storeLocalError(errorLog: ErrorLog) {
    if (typeof window === 'undefined') return

    try {
      const raw = localStorage.getItem('app-error-logs')
      const parsed: unknown = raw ? JSON.parse(raw) : []
      const existingErrors: ErrorLog[] = Array.isArray(parsed)
        ? parsed.filter((e): e is ErrorLog => typeof e === 'object' && e !== null)
        : []
      const updated = [...existingErrors, errorLog]

      // Keep only last 50 errors to prevent localStorage bloat
      const recentErrors = updated.slice(-50)
      localStorage.setItem('app-error-logs', JSON.stringify(recentErrors))
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e)
    }
  }

  /**
   * Send to external monitoring service
   */
  private sendToExternalService(_errorLog: ErrorLog) {
    // TODO: Implement based on your monitoring solution
    // Example for Sentry:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(new Error(errorLog.message), {
    //     tags: {
    //       component: errorLog.context?.component,
    //       action: errorLog.context?.action,
    //       level: errorLog.level
    //     },
    //     user: {
    //       id: errorLog.context?.userId,
    //       role: errorLog.context?.userRole
    //     },
    //     extra: errorLog.context?.metadata
    //   })
    // }
    // Example for custom API endpoint:
    // if (process.env.NODE_ENV === 'production') {
    //   fetch('/api/errors', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(errorLog)
    //   }).catch(e => console.warn('Failed to send error to API:', e))
    // }
  }

  /**
   * Handle global JavaScript errors
   */
  private handleGlobalError = (event: ErrorEvent) => {
    this.logError(new Error(event.message), {
      component: 'Global',
      action: 'JavaScript Error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    })
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.logError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
      component: 'Global',
      action: 'Promise Rejection',
    })
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate unique error ID
   */
  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get stored error logs (for debugging)
   */
  getStoredErrors(): ErrorLog[] {
    if (typeof window === 'undefined') return []

    try {
      const raw = localStorage.getItem('app-error-logs')
      const parsed: unknown = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed)
        ? parsed.filter((e): e is ErrorLog => typeof e === 'object' && e !== null)
        : []
    } catch {
      return []
    }
  }

  /**
   * Clear stored error logs
   */
  clearStoredErrors() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app-error-logs')
    }
  }
}

// Create singleton instance
export const errorMonitor = new ErrorMonitor()

// Convenience functions
export const logError = (error: Error | string, context?: ErrorContext) =>
  errorMonitor.logError(error, context)

export const logWarning = (message: string, context?: ErrorContext) =>
  errorMonitor.logWarning(message, context)

export const logInfo = (message: string, context?: ErrorContext) =>
  errorMonitor.logInfo(message, context)

export const logApiError = (
  endpoint: string,
  method: string,
  status: number,
  error: Error | string,
  requestData?: unknown,
) => errorMonitor.logApiError(endpoint, method, status, error, requestData)

export const logAuthError = (
  action: string,
  error: Error | string,
  metadata?: Record<string, unknown>,
) => errorMonitor.logAuthError(action, error, metadata)

export const logFormError = (formName: string, fieldErrors: Record<string, string>) =>
  errorMonitor.logFormError(formName, fieldErrors)

// Initialize error monitoring (call this in your app initialization)
export const initErrorMonitoring = (userId?: string, userRole?: string) =>
  errorMonitor.init(userId, userRole)
