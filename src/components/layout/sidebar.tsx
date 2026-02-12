'use client'

import {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  BarChart3,
  UserCheck,
  FileText,
  CheckSquare,
  Briefcase,
  TrendingUp,
  DollarSign,
  Map,
  Percent,
  User,
  Home,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Palette,
  Plane,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useTheme } from '@/context/theme-context'
import { cn } from '@/lib/utils'
import { NAVIGATION_ITEMS } from '@/lib/utils/constants'

const iconMap = {
  LayoutDashboard,
  Users,
  Shield,
  Settings,
  BarChart3,
  UserCheck,
  FileText,
  CheckSquare,
  Briefcase,
  TrendingUp,
  DollarSign,
  Map,
  Percent,
  User,
  Home,
  Palette,
  Plane,
}

interface SidebarProps {
  className?: string
  isMobile?: boolean
  onClose?: () => void
  onCollapseChange?: (isCollapsed: boolean) => void
}

export function Sidebar({ className, isMobile = false, onClose, onCollapseChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const { data: session } = useSession()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { logoType, textLogo, logoImage } = useTheme()

  // On mobile, always show expanded sidebar with text
  const shouldShowText = isMobile || !isCollapsed

  // Always show sidebar with fallback navigation
  const userRole = (session?.user as { role?: string } | undefined)?.role
  const navigationItems = userRole
    ? NAVIGATION_ITEMS[userRole as keyof typeof NAVIGATION_ITEMS] || []
    : [
        { label: 'Home', href: '/', icon: 'Home' },
        { label: 'Privacy Policy', href: '/privacy', icon: 'Shield' },
        { label: 'Terms & Conditions', href: '/terms', icon: 'FileText' },
      ]

  return (
    <div
      className={cn(
        'flex flex-col backdrop-blur-md bg-white/20 dark:bg-white/10 border-r border-white/30 dark:border-white/20 shadow-lg transition-all duration-300 h-full',
        isMobile ? 'w-64' : isCollapsed ? 'w-20' : 'w-64',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {shouldShowText && (
          <h2 className="text-xl font-bold font-logo text-primary">
            {logoType === 'image' && logoImage ? (
              <Image
                src={logoImage}
                alt="Logo"
                width={64}
                height={28}
                className="object-contain h-7 w-16"
                priority
              />
            ) : (
              textLogo
            )}
          </h2>
        )}
        <div className={cn('flex', shouldShowText ? 'justify-end' : 'justify-center w-full')}>
          {isMobile ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 font-bold hover:bg-white/20 dark:hover:bg-white/10 border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg"
              aria-label="Close sidebar"
            >
              <ChevronLeft className="h-4 w-4 font-bold text-primary" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newCollapsed = !isCollapsed
                setIsCollapsed(newCollapsed)
                onCollapseChange?.(newCollapsed)
              }}
              className="h-8 w-8 font-bold hover:bg-white/20 dark:hover:bg-white/10 border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg"
              aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar`}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 font-bold text-primary" />
              ) : (
                <ChevronLeft className="h-4 w-4 font-bold text-primary" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-white/20 dark:border-white/10"></div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2" role="navigation" aria-label="Main navigation">
        {navigationItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap]
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobile && onClose) onClose()
              }}
              aria-label={item.label}
              title={item.label}
              className={cn(
                'group flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-sm',
                isActive
                  ? 'bg-white/30 dark:bg-white/20 text-gray-900 dark:text-gray-100 border border-white/40 dark:border-white/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-white/20 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-gray-100',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-primary' : 'text-primary/70 group-hover:text-primary',
                )}
                aria-hidden="true"
              />
              {shouldShowText && <span>{item.label}</span>}
              {!shouldShowText && <span className="sr-only">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="border-b border-white/20 dark:border-white/10"></div>

      {/* User Profile & Sign Out */}
      <div className="p-4">
        {shouldShowText && session?.user && (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {session.user.name}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{userRole}</p>
          </div>
        )}
        {session?.user ? (
          <Button
            variant="ghost"
            size={shouldShowText ? 'sm' : 'icon'}
            onClick={() => {
              if (isMobile && onClose) onClose()
              const qs = searchParams.toString()
              const currentPath = `${pathname}${qs ? `?${qs}` : ''}`
              const callbackUrl = `/auth?callbackUrl=${encodeURIComponent(currentPath)}`
              void signOut({ callbackUrl })
            }}
            className="w-full justify-start px-3 py-2 hover:bg-white/20 dark:hover:bg-white/10 border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 group"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5 flex-shrink-0 text-primary/70 group-hover:text-primary" />
            {shouldShowText && <span className="ml-3">Sign Out</span>}
          </Button>
        ) : (
          <Link
            href="/auth"
            onClick={() => {
              if (isMobile && onClose) onClose()
            }}
          >
            <Button
              variant="ghost"
              size={shouldShowText ? 'sm' : 'icon'}
              className="w-full justify-start px-3 py-2 hover:bg-white/20 dark:hover:bg-white/10 border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 group"
              aria-label="Sign in"
            >
              <User className="h-5 w-5 flex-shrink-0 text-primary/70 group-hover:text-primary" />
              {shouldShowText && <span className="ml-3">Sign In</span>}
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
