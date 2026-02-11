'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

import { initErrorMonitoring } from '@/lib/error-monitoring'

interface ErrorMonitoringProviderProps {
  children: React.ReactNode
}

/**
 * Provider component to initialize error monitoring with user context
 * Should be placed inside AuthSessionProvider to access session data
 */
export function ErrorMonitoringProvider({ children }: ErrorMonitoringProviderProps) {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Initialize error monitoring when session is loaded
    if (status !== 'loading') {
      initErrorMonitoring(
        (session?.user as { id?: string } | undefined)?.id,
        (session?.user as { role?: string } | undefined)?.role,
      )
    }
  }, [session, status])

  return <>{children}</>
}
