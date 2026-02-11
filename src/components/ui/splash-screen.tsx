'use client'

interface SplashScreenProps {
  message?: string
  showLogo?: boolean
}

export function SplashScreen({ message = 'Loading...', showLogo = true }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.3)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        {/* Logo Section */}
        {showLogo && (
          <div className="flex flex-col items-center space-y-4">
            {/* Animated Logo */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-2xl flex items-center justify-center animate-pulse">
                <span className="text-xs font-bold text-black dark:text-white">tripfeels</span>
              </div>

              {/* Rotating Ring */}
              <div className="absolute inset-0 rounded-2xl border-4 border-transparent border-t-blue-400 border-r-purple-400 animate-spin"></div>

              {/* Pulse Ring */}
              <div className="absolute inset-0 rounded-2xl border-2 border-blue-300 animate-ping opacity-20"></div>
            </div>
          </div>
        )}

        {/* Loading Message */}
        <div className="text-center space-y-4">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{message}</p>

          {/* Progress Bar with Dots */}
          <div className="relative w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>

            {/* Animated Dots inside progress bar */}
            <div className="absolute inset-0 flex items-center justify-center space-x-1">
              <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s] opacity-80"></div>
              <div className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s] opacity-80"></div>
              <div className="w-1 h-1 bg-white rounded-full animate-bounce opacity-80"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          <p>Please wait while we verify your access...</p>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-20"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-30 [animation-delay:1s]"></div>
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-blue-300 rounded-full animate-ping opacity-25 [animation-delay:2s]"></div>
      </div>
    </div>
  )
}

// Specific splash screen for permission checking
export function PermissionCheckingSplash() {
  return <SplashScreen message="Checking permissions..." showLogo={true} />
}

// Specific splash screen for data loading
export function DataLoadingSplash() {
  return <SplashScreen message="Loading data..." showLogo={false} />
}

// Specific splash screen for authentication
export function AuthSplash() {
  return <SplashScreen message="Authenticating..." showLogo={true} />
}
