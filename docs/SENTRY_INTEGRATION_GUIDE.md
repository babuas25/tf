# Sentry Integration Guide

## 🎯 Overview

This guide shows how to integrate Sentry error monitoring with the existing error monitoring system.

## 📦 Installation

```bash
npm install @sentry/nextjs @sentry/tracing
```

## 🔧 Configuration

### 1. Create Sentry Configuration

Create `sentry.client.config.ts` in your project root:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Error Filtering
  beforeSend(event, hint) {
    // Filter out development errors
    if (process.env.NODE_ENV === 'development') {
      return null
    }
    return event
  },

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // User context
  initialScope: {
    tags: {
      component: 'client',
    },
  },
})
```

Create `sentry.server.config.ts` in your project root:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  initialScope: {
    tags: {
      component: 'server',
    },
  },
})
```

### 2. Update Environment Variables

Add to your `.env.local`:

```env
# Sentry Configuration
SENTRY_DSN=your-sentry-dsn-here
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn-here
NEXT_PUBLIC_APP_VERSION=1.0.0

# Sentry Build Configuration (optional)
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### 3. Update Error Monitoring

Update `src/lib/error-monitoring.ts` to integrate with Sentry:

```typescript
// Add this to the sendToExternalService method
private sendToExternalService(errorLog: ErrorLog) {
  // Sentry integration
  if (typeof window !== 'undefined' && (window as any).Sentry) {
    const Sentry = (window as any).Sentry

    Sentry.withScope((scope: any) => {
      // Set user context
      scope.setUser({
        id: errorLog.context?.userId,
        role: errorLog.context?.userRole
      })

      // Set tags
      scope.setTag('component', errorLog.context?.component)
      scope.setTag('action', errorLog.context?.action)
      scope.setTag('level', errorLog.level)

      // Set extra context
      scope.setExtra('sessionId', errorLog.sessionId)
      scope.setExtra('url', errorLog.url)
      scope.setExtra('userAgent', errorLog.userAgent)
      scope.setExtra('metadata', errorLog.context?.metadata)

      // Capture the error
      if (errorLog.level === 'error') {
        Sentry.captureException(new Error(errorLog.message))
      } else {
        Sentry.captureMessage(errorLog.message, errorLog.level)
      }
    })
  }

  // Server-side Sentry (for API routes)
  if (typeof window === 'undefined') {
    try {
      const Sentry = require('@sentry/nextjs')

      Sentry.withScope((scope: any) => {
        scope.setUser({
          id: errorLog.context?.userId,
          role: errorLog.context?.userRole
        })

        scope.setTag('component', errorLog.context?.component)
        scope.setTag('action', errorLog.context?.action)

        scope.setExtra('sessionId', errorLog.sessionId)
        scope.setExtra('metadata', errorLog.context?.metadata)

        if (errorLog.level === 'error') {
          Sentry.captureException(new Error(errorLog.message))
        } else {
          Sentry.captureMessage(errorLog.message, errorLog.level)
        }
      })
    } catch (e) {
      // Sentry not available
    }
  }
}
```

### 4. Update Next.js Configuration

Update `next.config.js`:

```javascript
const { withSentryConfig } = require('@sentry/nextjs')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your existing config
}

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  silent: true, // Suppresses source map uploading logs during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
}

const sentryOptions = {
  // Hide source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements
  disableLogger: true,
}

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions, sentryOptions)
```

## 🚀 Usage Examples

### In React Components

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler'

function MyComponent() {
  const { handleError, handleAsyncError } = useErrorHandler()

  const handleSubmit = async () => {
    const result = await handleAsyncError(
      () => fetch('/api/data'),
      { component: 'MyComponent', action: 'submit' }
    )

    if (!result) {
      // Error was handled automatically
      return
    }

    // Process successful result
  }

  return (
    <button onClick={handleSubmit}>
      Submit
    </button>
  )
}
```

### In API Routes

```typescript
import { logApiError } from '@/lib/error-monitoring'

export async function POST(request: NextRequest) {
  try {
    // Your API logic
  } catch (error) {
    logApiError('/api/example', 'POST', 500, error, requestData)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## 📊 Sentry Dashboard Features

Once integrated, you'll have access to:

1. **Error Tracking**: Real-time error monitoring with stack traces
2. **Performance Monitoring**: Track API response times and page loads
3. **User Context**: See which users are affected by errors
4. **Release Tracking**: Monitor error rates across deployments
5. **Alerts**: Get notified when error rates spike
6. **Source Maps**: See original source code in stack traces

## 🔧 Advanced Configuration

### Custom Error Boundaries with Sentry

```typescript
import * as Sentry from '@sentry/nextjs'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'

function MyErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        Sentry.withScope((scope) => {
          scope.setTag('errorBoundary', 'MyErrorBoundary')
          scope.setContext('errorInfo', errorInfo)
          Sentry.captureException(error)
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
```

### Performance Monitoring

```typescript
import * as Sentry from '@sentry/nextjs'

// Track custom transactions
const transaction = Sentry.startTransaction({
  name: 'User Registration',
  op: 'auth',
})

try {
  // Your code
  transaction.setStatus('ok')
} catch (error) {
  transaction.setStatus('internal_error')
  throw error
} finally {
  transaction.finish()
}
```

## 🛡️ Privacy & Security

1. **Data Scrubbing**: Sentry automatically scrubs sensitive data
2. **IP Anonymization**: Enable IP anonymization in Sentry settings
3. **Custom Filters**: Use `beforeSend` to filter sensitive information
4. **GDPR Compliance**: Configure data retention policies

## 📈 Monitoring Best Practices

1. **Set up Alerts**: Configure alerts for error rate spikes
2. **Release Tracking**: Tag errors with release versions
3. **User Feedback**: Enable user feedback collection
4. **Performance Budgets**: Set performance thresholds
5. **Regular Reviews**: Review error trends weekly

## 🔗 Useful Links

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Error Tracking](https://docs.sentry.io/product/issues/)
