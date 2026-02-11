import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In | TripFeels',
  description:
    'Sign in to your TripFeels account to access your personalized dashboard and travel management platform. Secure authentication with role-based access.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-slate-200/30 dark:bg-slate-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-slate-300/30 dark:bg-slate-500/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-slate-400/30 dark:bg-slate-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>
      {children}
    </div>
  )
}
