/**
 * Dynamic Theme Colors System
 * Automatically changes button and component colors based on selected theme
 */

import { useState, useEffect } from 'react'

// Theme color mappings - WCAG AA compliant (4.5:1 contrast ratio for text)
// Using darker shades for text colors to ensure accessibility
export const themeColorMap = {
  default: {
    primary: 'bg-slate-900 dark:bg-slate-100',
    primaryHover: 'hover:bg-slate-800 dark:hover:bg-slate-200',
    primaryBorder: 'border-slate-900/40 dark:border-slate-100/40',
    primaryText: 'text-slate-900 dark:text-slate-100', // High contrast
    primaryRing: 'focus:ring-slate-500/50',
  },
  blue: {
    primary: 'bg-blue-600 dark:bg-blue-500',
    primaryHover: 'hover:bg-blue-700 dark:hover:bg-blue-400',
    primaryBorder: 'border-blue-600/40 dark:border-blue-400/40',
    primaryText: 'text-blue-700 dark:text-blue-300', // WCAG AA compliant
    primaryRing: 'focus:ring-blue-500/50',
  },
  rose: {
    primary: 'bg-rose-600 dark:bg-rose-500',
    primaryHover: 'hover:bg-rose-700 dark:hover:bg-rose-400',
    primaryBorder: 'border-rose-600/40 dark:border-rose-400/40',
    primaryText: 'text-rose-700 dark:text-rose-300', // WCAG AA compliant
    primaryRing: 'focus:ring-rose-500/50',
  },
  red: {
    primary: 'bg-red-600 dark:bg-red-500',
    primaryHover: 'hover:bg-red-700 dark:hover:bg-red-400',
    primaryBorder: 'border-red-600/40 dark:border-red-400/40',
    primaryText: 'text-red-700 dark:text-red-300', // WCAG AA compliant
    primaryRing: 'focus:ring-red-500/50',
  },
  green: {
    primary: 'bg-green-600 dark:bg-green-500',
    primaryHover: 'hover:bg-green-700 dark:hover:bg-green-400',
    primaryBorder: 'border-green-600/40 dark:border-green-400/40',
    primaryText: 'text-green-700 dark:text-green-300', // WCAG AA compliant
    primaryRing: 'focus:ring-green-500/50',
  },
  slate: {
    primary: 'bg-slate-700 dark:bg-slate-400',
    primaryHover: 'hover:bg-slate-800 dark:hover:bg-slate-300',
    primaryBorder: 'border-slate-700/40 dark:border-slate-400/40',
    primaryText: 'text-slate-700 dark:text-slate-300', // WCAG AA compliant
    primaryRing: 'focus:ring-slate-500/50',
  },
  orange: {
    primary: 'bg-orange-600 dark:bg-orange-500',
    primaryHover: 'hover:bg-orange-700 dark:hover:bg-orange-400',
    primaryBorder: 'border-orange-600/40 dark:border-orange-400/40',
    primaryText: 'text-orange-700 dark:text-orange-300', // WCAG AA compliant
    primaryRing: 'focus:ring-orange-500/50',
  },
  yellow: {
    primary: 'bg-yellow-500 dark:bg-yellow-400',
    primaryHover: 'hover:bg-yellow-600 dark:hover:bg-yellow-300',
    primaryBorder: 'border-yellow-600/40 dark:border-yellow-400/40',
    primaryText: 'text-yellow-700 dark:text-yellow-300', // WCAG AA compliant
    primaryRing: 'focus:ring-yellow-500/50',
  },
  teal: {
    primary: 'bg-teal-600 dark:bg-teal-500',
    primaryHover: 'hover:bg-teal-700 dark:hover:bg-teal-400',
    primaryBorder: 'border-teal-600/40 dark:border-teal-400/40',
    primaryText: 'text-teal-700 dark:text-teal-300', // WCAG AA compliant
    primaryRing: 'focus:ring-teal-500/50',
  },
  violet: {
    primary: 'bg-violet-600 dark:bg-violet-500',
    primaryHover: 'hover:bg-violet-700 dark:hover:bg-violet-400',
    primaryBorder: 'border-violet-600/40 dark:border-violet-400/40',
    primaryText: 'text-violet-700 dark:text-violet-300', // WCAG AA compliant
    primaryRing: 'focus:ring-violet-500/50',
  },
} as const

// Default theme (when no theme is selected or system mode)
export const defaultThemeColors = {
  light: {
    primary: 'bg-gray-900 dark:bg-gray-100',
    primaryHover: 'hover:bg-gray-800 dark:hover:bg-gray-200',
    primaryBorder: 'border-gray-900 dark:border-gray-100',
    primaryText: 'text-gray-900 dark:text-gray-100',
    primaryRing: 'focus:ring-gray-500/50',
  },
  dark: {
    primary: 'bg-gray-100 dark:bg-gray-900',
    primaryHover: 'hover:bg-gray-200 dark:hover:bg-gray-800',
    primaryBorder: 'border-gray-100 dark:border-gray-900',
    primaryText: 'text-gray-100 dark:text-gray-900',
    primaryRing: 'focus:ring-gray-500/50',
  },
}

// Get current theme colors based on selected theme and system mode
export function getThemeColors(themeName: string, isDarkMode: boolean = false) {
  // If no theme is selected or it's 'default', use system-based colors
  if (!themeName || themeName === 'default') {
    return isDarkMode ? defaultThemeColors.dark : defaultThemeColors.light
  }

  // Return the theme colors or fallback to slate if theme not found
  return themeColorMap[themeName as keyof typeof themeColorMap] || themeColorMap.slate
}

// Hook to get dynamic theme colors
export function useDynamicThemeColors() {
  // Track selected color theme from the DOM attribute set by ThemeSystemProvider
  const [colorTheme, setColorTheme] = useState<string>('slate')

  useEffect(() => {
    const root = document.documentElement
    const readTheme = () => {
      const attr = root.getAttribute('data-theme-color') || 'slate'
      setColorTheme(attr)
    }
    readTheme()
    const attrObserver = new MutationObserver(readTheme)
    attrObserver.observe(root, { attributes: true, attributeFilter: ['data-theme-color'] })
    return () => attrObserver.disconnect()
  }, [])

  // Get system theme (light/dark)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => observer.disconnect()
  }, [])

  return getThemeColors(colorTheme, isDarkMode)
}

// Dynamic button component that changes color based on theme
export function createDynamicButton(
  _variant: 'primary' | 'secondary' | 'ghost' | 'outline' = 'primary',
  className?: string,
) {
  // This function will be used with the useDynamicThemeColors hook
  return `${className || ''}`
}

// Dynamic input component that changes focus ring based on theme
export function createDynamicInput(_variant: 'default' | 'subtle' = 'default', className?: string) {
  // This function will be used with the useDynamicThemeColors hook
  return `${className || ''}`
}

// Export theme color names for easy access
export const availableThemes = Object.keys(themeColorMap) as Array<keyof typeof themeColorMap>

// Helper function to get theme display name
export function getThemeDisplayName(themeName: string): string {
  const displayNames: Record<string, string> = {
    default: 'Default',
    blue: 'Blue',
    green: 'Green',
    rose: 'Rose',
    red: 'Red',
    slate: 'Slate',
    orange: 'Orange',
    yellow: 'Yellow',
    teal: 'Teal',
    violet: 'Violet',
  }

  return displayNames[themeName] || themeName.charAt(0).toUpperCase() + themeName.slice(1)
}

// Helper function to get theme description
export function getThemeDescription(themeName: string): string {
  const descriptions: Record<string, string> = {
    default: 'Clean neutral tones for maximum readability',
    blue: 'Trustworthy blue for reliability and professionalism',
    green: 'Fresh green for nature-inspired, calming experiences',
    rose: 'Elegant rose tones for a sophisticated and warm look',
    red: 'Bold red for energy and attention-grabbing designs',
    slate: 'Professional slate grays for business and corporate use',
    orange: 'Vibrant orange for energy, creativity, and enthusiasm',
    yellow: 'Bright yellow for optimism and cheerful vibes',
    teal: 'Modern teal for technology and digital experiences',
    violet: 'Creative violet for innovation and artistic expression',
  }

  return descriptions[themeName] || 'A beautiful color theme for your application'
}
