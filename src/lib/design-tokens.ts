/**
 * Design Tokens for TripFeels
 * Comprehensive, reusable design system for consistent UI
 */

// Glassmorphism Design System
export const glassmorphism = {
  // Base glassmorphism backgrounds
  background: {
    light: 'bg-white/20',
    dark: 'dark:bg-white/10',
    default: 'bg-white/20 dark:bg-white/10',
    subtle: 'bg-white/10 dark:bg-white/5',
    strong: 'bg-white/30 dark:bg-white/20',
  },

  // Glassmorphism borders
  border: {
    light: 'border-white/30',
    dark: 'dark:border-white/20',
    default: 'border-white/30 dark:border-white/20',
    subtle: 'border-white/20 dark:border-white/10',
    strong: 'border-white/40 dark:border-white/30',
  },

  // Glassmorphism blur effects
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
  },

  // Complete glassmorphism combinations
  card: {
    default:
      'bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/20 shadow-lg rounded-xl',
    subtle:
      'bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/20 dark:border-white/10 shadow-md rounded-lg',
    strong:
      'bg-white/30 dark:bg-white/20 backdrop-blur-lg border border-white/40 dark:border-white/30 shadow-xl rounded-xl',
  },

  // Interactive glassmorphism states
  interactive: {
    hover: 'hover:bg-white/25 dark:hover:bg-white/15',
    active: 'active:bg-white/35 dark:active:bg-white/25',
    focus: 'focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
  },
}

// Color System
export const colors = {
  // Text colors - Gray scale system
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-400',
    inverse: 'text-white',
    accent: 'text-blue-600 dark:text-blue-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-orange-600 dark:text-orange-400',
    error: 'text-red-600 dark:text-red-400',
  },

  // Background gradients
  gradient: {
    primary:
      'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900',
    subtle:
      'bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900',
    accent:
      'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900 dark:via-indigo-900 dark:to-purple-900',
  },

  // Brand colors
  brand: {
    primary: 'bg-blue-600/90 dark:bg-blue-500/90',
    primaryHover: 'hover:bg-blue-700/90 dark:hover:bg-blue-600/90',
    primaryBorder: 'border-blue-500/40 dark:border-blue-400/40',
    secondary: 'bg-gray-600/90 dark:bg-gray-500/90',
    secondaryHover: 'hover:bg-gray-700/90 dark:hover:bg-gray-600/90',
    secondaryBorder: 'border-gray-500/40 dark:border-gray-400/40',
  },

  // Status colors
  status: {
    success: 'bg-green-600/90 dark:bg-green-500/90',
    successHover: 'hover:bg-green-700/90 dark:hover:bg-green-600/90',
    warning: 'bg-orange-600/90 dark:bg-orange-500/90',
    warningHover: 'hover:bg-orange-700/90 dark:hover:bg-orange-600/90',
    error: 'bg-red-600/90 dark:bg-red-500/90',
    errorHover: 'hover:bg-red-700/90 dark:hover:bg-red-600/90',
  },
} as const

// Spacing tokens
export const spacing = {
  xs: 'space-y-1',
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6',
  xl: 'space-y-8',
} as const

// Shadow tokens
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
} as const

// Border radius tokens
export const radius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
} as const

// Animation tokens
export const animations = {
  transition: 'transition-all duration-200',
  transitionSlow: 'transition-all duration-300',
  hover: 'hover:opacity-100 hover:visible',
  fade: 'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
  smooth: 'transition-all duration-300 ease-in-out',
} as const

// Background animation elements
export const backgroundElements = {
  blobs: {
    container: 'fixed inset-0 overflow-hidden pointer-events-none',
    blob1:
      'absolute -top-40 -right-32 w-80 h-80 bg-blue-200/30 dark:bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob',
    blob2:
      'absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000',
    blob3:
      'absolute top-40 left-40 w-80 h-80 bg-slate-200/30 dark:bg-slate-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000',
  },
} as const

// Component System - Reusable UI Components
export const components = {
  // Button variants using the design system (static - use DynamicButton for theme-aware buttons)
  button: {
    primary: `bg-primary hover:bg-primary/90 ${glassmorphism.blur.sm} text-primary-foreground border border-primary/40 shadow-lg rounded-lg ${animations.smooth}`,
    secondary: `${colors.brand.secondary} ${colors.brand.secondaryHover} ${glassmorphism.blur.sm} text-white ${colors.brand.secondaryBorder} shadow-lg rounded-lg ${animations.smooth}`,
    ghost: `${glassmorphism.background.default} ${glassmorphism.border.default} ${glassmorphism.blur.sm} ${colors.text.primary} ${glassmorphism.interactive.hover} ${animations.smooth} rounded-lg`,
    outline: `${glassmorphism.background.subtle} ${glassmorphism.border.default} ${glassmorphism.blur.sm} ${colors.text.primary} ${glassmorphism.interactive.hover} ${animations.smooth} rounded-lg`,
    success: `${colors.status.success} ${colors.status.successHover} ${glassmorphism.blur.sm} text-white shadow-lg rounded-lg ${animations.smooth}`,
    warning: `${colors.status.warning} ${colors.status.warningHover} ${glassmorphism.blur.sm} text-white shadow-lg rounded-lg ${animations.smooth}`,
    error: `${colors.status.error} ${colors.status.errorHover} ${glassmorphism.blur.sm} text-white shadow-lg rounded-lg ${animations.smooth}`,
  },

  // Input variants
  input: {
    default: `${glassmorphism.background.default} ${glassmorphism.border.default} ${glassmorphism.blur.sm} ${colors.text.primary} placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2`,
    subtle: `${glassmorphism.background.subtle} ${glassmorphism.border.subtle} ${glassmorphism.blur.sm} ${colors.text.primary} placeholder-gray-500 dark:placeholder-gray-400 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2`,
  },

  // Card variants
  card: {
    default: `${glassmorphism.card.default} p-6`,
    subtle: `${glassmorphism.card.subtle} p-4`,
    strong: `${glassmorphism.card.strong} p-6`,
    interactive: `${glassmorphism.card.default} p-6 ${glassmorphism.interactive.hover} ${animations.smooth} cursor-pointer`,
  },

  // Container variants
  container: {
    page: `${colors.gradient.primary} min-h-screen`,
    section: `${glassmorphism.card.default} p-6`,
    form: `${glassmorphism.card.default} p-8`,
  },

  // Navigation variants
  nav: {
    item: `${glassmorphism.background.subtle} ${glassmorphism.border.default} ${glassmorphism.blur.sm} ${colors.text.secondary} ${glassmorphism.interactive.hover} ${colors.text.primary} ${animations.smooth} rounded-lg px-3 py-2`,
    itemActive: `${glassmorphism.background.strong} ${glassmorphism.border.strong} ${glassmorphism.blur.sm} ${colors.text.primary} ${animations.smooth} rounded-lg px-3 py-2`,
  },

  // Header variants
  header: {
    default: `fixed top-0 left-0 right-0 z-40 h-14 ${glassmorphism.background.default} ${glassmorphism.border.default} ${glassmorphism.blur.md} ${shadows.lg}`,
  },

  // Sidebar variants
  sidebar: {
    default: `flex flex-col ${glassmorphism.background.default} ${glassmorphism.border.default} ${glassmorphism.blur.md} ${shadows.lg} transition-all duration-300 h-full`,
  },
} as const

// Utility classes for common patterns
export const utilities = {
  // Layout utilities
  layout: {
    centerContent: 'flex items-center justify-center',
    centerText: 'text-center',
    fullHeight: 'min-h-screen',
    flexColumn: 'flex flex-col',
    flexRow: 'flex flex-row',
    grid: 'grid',
    gridCols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    },
  },

  // Text utilities
  text: {
    heading1: `${colors.text.primary} text-3xl font-bold`,
    heading2: `${colors.text.primary} text-2xl font-semibold`,
    heading3: `${colors.text.primary} text-xl font-semibold`,
    body: `${colors.text.primary} text-base`,
    caption: `${colors.text.secondary} text-sm`,
    muted: `${colors.text.muted} text-xs`,
  },

  // Interactive utilities
  interactive: {
    clickable: 'cursor-pointer',
    disabled: 'opacity-50 pointer-events-none',
    loading: 'animate-pulse',
  },
} as const

// Responsive breakpoints
export const breakpoints = {
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
  xl: 'xl:',
  '2xl': '2xl:',
} as const
