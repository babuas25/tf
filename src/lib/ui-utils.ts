/**
 * UI Utilities for TripFeels
 * Easy-to-use utility functions for consistent UI components
 */

import {
  glassmorphism,
  colors,
  components,
  utilities,
  backgroundElements,
  animations,
  shadows,
  radius,
} from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

/**
 * Create glassmorphism card with customizable variant
 */
export function createGlassCard(
  variant: 'default' | 'subtle' | 'strong' | 'interactive' = 'default',
  className?: string,
) {
  return cn(components.card[variant], className)
}

/**
 * Create glassmorphism button with customizable variant
 */
export function createGlassButton(
  variant:
    | 'primary'
    | 'secondary'
    | 'ghost'
    | 'outline'
    | 'success'
    | 'warning'
    | 'error' = 'primary',
  className?: string,
) {
  return cn(components.button[variant], className)
}

/**
 * Create glassmorphism input with customizable variant
 */
export function createGlassInput(variant: 'default' | 'subtle' = 'default', className?: string) {
  return cn(components.input[variant], className)
}

/**
 * Create page container with background and animations
 */
export function createPageContainer(className?: string) {
  return cn(components.container.page, className)
}

/**
 * Create section container
 */
export function createSectionContainer(className?: string) {
  return cn(components.container.section, className)
}

/**
 * Create form container
 */
export function createFormContainer(className?: string) {
  return cn(components.container.form, className)
}

/**
 * Create animated background elements
 */
export function createAnimatedBackground(): string {
  return backgroundElements.blobs.container
}

/**
 * Create navigation item classes
 */
export function createNavItem(isActive: boolean = false, className?: string) {
  return cn(isActive ? components.nav.itemActive : components.nav.item, className)
}

/**
 * Create header classes
 */
export function createHeader(className?: string) {
  return cn(components.header.default, className)
}

/**
 * Create sidebar classes
 */
export function createSidebar(className?: string) {
  return cn(components.sidebar.default, className)
}

/**
 * Text utility functions
 */
export const textUtils = {
  heading1: (className?: string) => cn(utilities.text.heading1, className),
  heading2: (className?: string) => cn(utilities.text.heading2, className),
  heading3: (className?: string) => cn(utilities.text.heading3, className),
  body: (className?: string) => cn(utilities.text.body, className),
  caption: (className?: string) => cn(utilities.text.caption, className),
  muted: (className?: string) => cn(utilities.text.muted, className),
}

/**
 * Layout utility functions
 */
export const layoutUtils = {
  centerContent: (className?: string) => cn(utilities.layout.centerContent, className),
  centerText: (className?: string) => cn(utilities.layout.centerText, className),
  fullHeight: (className?: string) => cn(utilities.layout.fullHeight, className),
  flexColumn: (className?: string) => cn(utilities.layout.flexColumn, className),
  flexRow: (className?: string) => cn(utilities.layout.flexRow, className),
  grid: (cols: 1 | 2 | 3 | 4 = 1, className?: string) =>
    cn(utilities.layout.grid, utilities.layout.gridCols[cols], className),
}

/**
 * Interactive utility functions
 */
export const interactiveUtils = {
  clickable: (className?: string) => cn(utilities.interactive.clickable, className),
  disabled: (className?: string) => cn(utilities.interactive.disabled, className),
  loading: (className?: string) => cn(utilities.interactive.loading, className),
}

/**
 * Common component patterns
 */
export const patterns = {
  // Glassmorphism card with hover effect
  hoverCard: (className?: string) =>
    cn(
      glassmorphism.card.default,
      glassmorphism.interactive.hover,
      animations.smooth,
      'cursor-pointer',
      className,
    ),

  // Glassmorphism input with focus state
  focusInput: (className?: string) =>
    cn(
      glassmorphism.background.default,
      glassmorphism.border.default,
      glassmorphism.blur.sm,
      colors.text.primary,
      'placeholder-gray-500 dark:placeholder-gray-400',
      radius.lg,
      'px-3 py-2',
      glassmorphism.interactive.focus,
      animations.smooth,
      className,
    ),

  // Glassmorphism button with all states
  interactiveButton: (variant: 'primary' | 'secondary' | 'ghost' = 'primary', className?: string) =>
    cn(components.button[variant], glassmorphism.interactive.active, className),

  // Status message container
  statusMessage: (type: 'success' | 'warning' | 'error' | 'info' = 'info', className?: string) =>
    cn(
      glassmorphism.background.default,
      glassmorphism.blur.md,
      glassmorphism.border.default,
      radius.xl,
      'p-4',
      colors.text[type === 'info' ? 'primary' : type],
      className,
    ),

  // Modal overlay
  modalOverlay: (className?: string) =>
    cn('fixed inset-0 z-50', 'bg-black/50 backdrop-blur-sm', className),

  // Modal content
  modalContent: (className?: string) =>
    cn(glassmorphism.card.strong, 'relative z-50', 'max-w-lg mx-auto mt-20', className),
}

/**
 * Responsive utility functions
 */
export const responsiveUtils = {
  // Hide on mobile, show on desktop
  desktopOnly: (className?: string) => cn('hidden md:block', className),

  // Show on mobile, hide on desktop
  mobileOnly: (className?: string) => cn('block md:hidden', className),

  // Responsive grid columns
  responsiveGrid: (
    mobile: 1 | 2 = 1,
    tablet: 1 | 2 | 3 = 2,
    desktop: 1 | 2 | 3 | 4 = 3,
    className?: string,
  ) => cn(`grid-cols-${mobile} md:grid-cols-${tablet} lg:grid-cols-${desktop}`, className),

  // Responsive text sizes
  responsiveText: (size: 'sm' | 'md' | 'lg' | 'xl' = 'md', className?: string) => {
    const sizes = {
      sm: 'text-sm md:text-base',
      md: 'text-base md:text-lg',
      lg: 'text-lg md:text-xl',
      xl: 'text-xl md:text-2xl',
    }
    return cn(sizes[size], className)
  },
}

/**
 * Animation utility functions
 */
export const animationUtils = {
  // Fade in animation
  fadeIn: (className?: string) => cn('animate-in fade-in duration-300', className),

  // Slide up animation
  slideUp: (className?: string) => cn('animate-in slide-in-from-bottom-4 duration-300', className),

  // Scale animation
  scale: (className?: string) => cn('animate-in zoom-in-95 duration-300', className),

  // Smooth transitions
  smooth: (className?: string) => cn(animations.smooth, className),
}

/**
 * Export all utilities for easy importing
 */
const uiUtils = {
  // Component creators
  createGlassCard,
  createGlassButton,
  createGlassInput,
  createPageContainer,
  createSectionContainer,
  createFormContainer,
  createAnimatedBackground,
  createNavItem,
  createHeader,
  createSidebar,

  // Utility groups
  textUtils,
  layoutUtils,
  interactiveUtils,
  patterns,
  responsiveUtils,
  animationUtils,

  // Direct access to design tokens
  glassmorphism,
  colors,
  components,
  utilities,
  backgroundElements,
  animations,
  shadows,
  radius,
}

export default uiUtils
