'use client'

import { LogOut, Menu, ChevronDown, UserCircle, Sun, Moon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'
import { useTheme as useThemeContext } from '@/context/theme-context'
import { animations } from '@/lib/design-tokens'
import { useDynamicThemeColors } from '@/lib/dynamic-theme-colors'
import { cn } from '@/lib/utils'
// NAVIGATION_ITEMS removed - not used here

interface HeaderProps {
  className?: string
  showNavigation?: boolean
  showUserActions?: boolean
  onMobileMenuToggle?: () => void
}

export function Header({
  className,
  showNavigation: _showNavigation = true,
  showUserActions = true,
  onMobileMenuToggle,
}: HeaderProps) {
  const { data: session, status } = useSession()
  const { theme, setTheme } = useTheme()
  const { logoType, textLogo, logoImage } = useThemeContext()
  const themeColors = useDynamicThemeColors()

  // State for dropdown visibility
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)

  const userRole = (session?.user as { role?: string } | undefined)?.role

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-40 h-14 backdrop-blur-md border-b shadow-lg',
        // Stable glass background (independent from what's behind)
        'bg-white/30 dark:bg-white/15',
        'border-white/30 dark:border-white/20',
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 h-full w-full">
        {/* Left Side - Mobile Menu + Logo */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/20 dark:hover:bg-white/10 backdrop-blur-sm rounded-lg"
            onClick={onMobileMenuToggle}
            aria-label="Open mobile menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Logo Section */}
          <Link
            href="/"
            className={cn('text-lg font-semibold font-logo text-primary', animations.transition)}
          >
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
          </Link>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 hover:bg-white/20 dark:hover:bg-white/10 border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg"
              onClick={() => {
                // Toggle between light and dark only
                if (theme === 'light') {
                  setTheme('dark')
                } else {
                  setTheme('light')
                }
              }}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Sun className="h-4 w-4 text-primary" />
              ) : (
                <Moon className="h-4 w-4 text-primary" />
              )}
            </Button>
          </div>
          {/* User Actions */}
          {showUserActions && status === 'loading' ? (
            <div className="h-8 w-8 bg-white/20 dark:bg-white/10 rounded-full animate-pulse"></div>
          ) : showUserActions && session?.user ? (
            <div className="relative" ref={userDropdownRef}>
              {/* User Icon Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-white/20 dark:hover:bg-white/10 border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                aria-label={`${isUserDropdownOpen ? 'Close' : 'Open'} user menu`}
                aria-expanded={isUserDropdownOpen}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-white border border-white/20',
                    themeColors.primary,
                  )}
                >
                  <span className="text-xs font-medium">
                    {session.user.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase() || 'U'}
                  </span>
                </div>
              </Button>

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg z-50 bg-white/40 dark:bg-white/30 backdrop-blur-md border border-white/30 dark:border-white/20">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-white/20 dark:border-white/10">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {session.user.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{userRole}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false)
                        void signOut({ callbackUrl: '/' })
                      }}
                      className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Auth Buttons for non-authenticated users */
            <div className="flex items-center space-x-2">
              {/* Desktop: Show individual buttons */}
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 text-gray-900 dark:text-gray-100 hover:bg-white/30 dark:hover:bg-white/20 rounded-lg"
                  >
                    Registration
                  </Button>
                </Link>
              </div>

              {/* Mobile: Show dropdown */}
              <div className="md:hidden relative" ref={mobileDropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 hover:bg-white/20 dark:hover:bg-white/10 border border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg"
                  onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                  aria-label={`${isMobileDropdownOpen ? 'Close' : 'Open'} authentication menu`}
                  aria-expanded={isMobileDropdownOpen}
                >
                  <UserCircle className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                  <ChevronDown className="h-3 w-3 text-gray-900 dark:text-gray-100" />
                </Button>

                {/* Dropdown Menu */}
                {isMobileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-xl shadow-lg z-50 bg-white/40 dark:bg-white/30 backdrop-blur-md border border-white/30 dark:border-white/20">
                    <div className="py-1">
                      <Link
                        href="/auth"
                        className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200"
                        onClick={() => setIsMobileDropdownOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth"
                        className="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200"
                        onClick={() => setIsMobileDropdownOpen(false)}
                      >
                        Registration
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
