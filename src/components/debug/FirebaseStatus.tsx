'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

import { connectionMonitor } from '@/lib/firebase/connection'
import { firebaseDebugger, type FirebaseDebugInfo } from '@/lib/firebase/debug'

interface FirebaseStatusProps {
  showInProduction?: boolean
}

export default function FirebaseStatus({ showInProduction = false }: FirebaseStatusProps) {
  const [debugInfo, setDebugInfo] = useState<FirebaseDebugInfo | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const { data: session } = useSession()

  // Don't show in production unless explicitly enabled
  const shouldShow = process.env.NODE_ENV !== 'production' || showInProduction

  if (!shouldShow) {
    return null
  }

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    const updateDebugInfo = () => {
      try {
        const info = firebaseDebugger.getDebugInfo()
        setDebugInfo(info)
      } catch (_err) {
        console.error('Failed to get debug info:', _err)
      }
    }

    // Initial load
    updateDebugInfo()

    // Update every 5 seconds in development
    if (process.env.NODE_ENV === 'development') {
      intervalId = setInterval(updateDebugInfo, 5000)
    }

    // Monitor connection status
    const unsubscribe = connectionMonitor.onConnectionChange((online) => {
      setIsOnline(online)
      updateDebugInfo() // Update debug info when connection changes
    })

    return () => {
      if (intervalId) clearInterval(intervalId)
      unsubscribe()
    }
  }, [])

  if (!debugInfo) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-yellow-500 text-white px-3 py-2 rounded-lg shadow-lg text-xs">
        Loading Firebase status...
      </div>
    )
  }

  const hasErrors = debugInfo.errors.length > 0
  const isHealthy =
    debugInfo.firebase.auth.isConnected && debugInfo.firebase.firestore.isConnected && isOnline

  const statusColor = isHealthy ? 'bg-green-500' : hasErrors ? 'bg-red-500' : 'bg-yellow-500'

  const statusIcon = isHealthy ? '✅' : hasErrors ? '❌' : '⚠️'

  const statusText = isHealthy ? 'Connected' : hasErrors ? 'Error' : 'Warning'

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main status button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`${statusColor} text-white px-3 py-2 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 transition-all duration-200 hover:scale-105`}
      >
        <span>{statusIcon}</span>
        <span>Firebase: {statusText}</span>
        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Expanded debug panel */}
      {isExpanded && (
        <div className="absolute bottom-12 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl p-4 w-96 max-h-96 overflow-auto text-xs">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Firebase Debug Panel
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            {/* Connection Status */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Connection</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`p-2 rounded ${debugInfo.network.isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                >
                  Network: {debugInfo.network.isOnline ? 'Online' : 'Offline'}
                </div>
                <div
                  className={`p-2 rounded ${debugInfo.firebase.auth.isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                >
                  Auth: {debugInfo.firebase.auth.isConnected ? 'Connected' : 'Disconnected'}
                </div>
                <div
                  className={`p-2 rounded ${debugInfo.firebase.firestore.isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}
                >
                  Firestore:{' '}
                  {debugInfo.firebase.firestore.isConnected ? 'Connected' : 'Disconnected'}
                </div>
                <div className="p-2 rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  Type: {debugInfo.network.connectionType}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Authentication</h4>
              <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                <div>User: {session?.user?.email || 'Not signed in'}</div>
                <div>Role: {(session?.user as { role?: string })?.role || 'N/A'}</div>
                <div>Firebase UID: {debugInfo.firebase.auth.currentUser || 'None'}</div>
              </div>
            </div>

            {/* Configuration */}
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">Configuration</h4>
              <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs space-y-1">
                <div>Project: {debugInfo.firebase.config.projectId}</div>
                <div>Environment: {debugInfo.environment.nodeEnv}</div>
                <div>Context: {debugInfo.environment.isClient ? 'Client' : 'Server'}</div>
                {(debugInfo.firebase.auth.emulatorConnected ||
                  debugInfo.firebase.firestore.emulatorConnected) && (
                  <div className="text-yellow-600 dark:text-yellow-400">🔧 Using emulator</div>
                )}
              </div>
            </div>

            {/* Errors */}
            {debugInfo.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 dark:text-red-300 mb-1">
                  Recent Errors ({debugInfo.errors.length})
                </h4>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {debugInfo.errors.slice(-5).map((error, index) => (
                    <div
                      key={index}
                      className="p-2 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded text-xs"
                    >
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-t pt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    void firebaseDebugger.diagnose()
                  }}
                  className="flex-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                >
                  Run Diagnostics
                </button>
                <button
                  onClick={() => firebaseDebugger.clearAllErrors()}
                  className="flex-1 bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                >
                  Clear Errors
                </button>
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1 border-t">
              Last updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
