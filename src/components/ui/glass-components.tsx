/**
 * Glassmorphism UI Components
 * Reusable components using the design system
 */

import * as React from 'react'

import { createGlassCard, createGlassButton, createGlassInput, patterns } from '@/lib/ui-utils'
import { cn } from '@/lib/utils'

// Glass Card Component
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'strong' | 'interactive'
  children: React.ReactNode
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => (
    <div ref={ref} className={createGlassCard(variant, className)} {...props}>
      {children}
    </div>
  ),
)
GlassCard.displayName = 'GlassCard'

// Glass Card Header
const GlassCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
  ),
)
GlassCardHeader.displayName = 'GlassCardHeader'

// Glass Card Title
const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100',
      className,
    )}
    {...props}
  />
))
GlassCardTitle.displayName = 'GlassCardTitle'

// Glass Card Description
const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-600 dark:text-gray-400', className)} {...props} />
))
GlassCardDescription.displayName = 'GlassCardDescription'

// Glass Card Content
const GlassCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('pt-0', className)} {...props} />,
)
GlassCardContent.displayName = 'GlassCardContent'

// Glass Card Footer
const GlassCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4', className)} {...props} />
  ),
)
GlassCardFooter.displayName = 'GlassCardFooter'

// Glass Button Component
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'warning' | 'error'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'primary', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button'

    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
      icon: 'h-10 w-10',
    }

    return (
      <Comp
        className={cn(
          createGlassButton(variant),
          sizeClasses[size],
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
GlassButton.displayName = 'GlassButton'

// Glass Input Component
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'subtle'
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, variant = 'default', type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          createGlassInput(variant),
          'flex h-10 w-full px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 dark:placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
GlassInput.displayName = 'GlassInput'

// Glass Select Component
interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  variant?: 'default' | 'subtle'
}

export const GlassSelect = React.forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <select
        className={cn(
          createGlassInput(variant),
          'flex h-10 w-full px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  },
)
GlassSelect.displayName = 'GlassSelect'

// Glass Textarea Component
interface GlassTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'subtle'
}

export const GlassTextarea = React.forwardRef<HTMLTextAreaElement, GlassTextareaProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <textarea
        className={cn(
          createGlassInput(variant),
          'flex min-h-[80px] w-full px-3 py-2 text-sm placeholder:text-gray-500 dark:placeholder-gray-400 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
GlassTextarea.displayName = 'GlassTextarea'

// Glass Modal Component
interface GlassModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export const GlassModal = ({ isOpen, onClose, children, className }: GlassModalProps) => {
  if (!isOpen) return null

  return (
    <div className={patterns.modalOverlay()} onClick={onClose}>
      <div className={patterns.modalContent(className)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

// Glass Status Message Component
interface GlassStatusMessageProps {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  className?: string
}

export const GlassStatusMessage = ({ type, message, className }: GlassStatusMessageProps) => {
  const typeStyles = {
    success: 'border-green-500/30 bg-green-500/20 text-green-600 dark:text-green-400',
    warning: 'border-orange-500/30 bg-orange-500/20 text-orange-600 dark:text-orange-400',
    error: 'border-red-500/30 bg-red-500/20 text-red-600 dark:text-red-400',
    info: 'border-blue-500/30 bg-blue-500/20 text-blue-600 dark:text-blue-400',
  }

  return (
    <div className={cn(patterns.statusMessage(type, className), typeStyles[type])}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

// Glass Loading Component
interface GlassLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const GlassLoading = ({ size = 'md', className }: GlassLoadingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          sizeClasses[size],
          'animate-spin rounded-full border-2 border-white/20 border-t-blue-600',
        )}
      ></div>
    </div>
  )
}

// Glass Badge Component
interface GlassBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  children: React.ReactNode
  className?: string
}

export const GlassBadge = ({ variant = 'default', children, className }: GlassBadgeProps) => {
  const variantStyles = {
    default:
      'bg-white/20 dark:bg-white/10 text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/20',
    success: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
    warning: 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
    error: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm border',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

// Export all components
export { GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent, GlassCardFooter }
