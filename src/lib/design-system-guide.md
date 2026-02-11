# TripFeels Design System Guide

## Overview

This design system provides a comprehensive, reusable set of components and utilities for creating consistent, beautiful glassmorphism UI across the TripFeels application.

## Quick Start

### Import the utilities

```typescript
import { createGlassCard, createGlassButton, createGlassInput } from '@/lib/ui-utils'
import { GlassCard, GlassButton, GlassInput } from '@/components/ui/glass-components'
```

### Basic Usage

```tsx
// Create a glassmorphism card
<div className={createGlassCard('default')}>
  <h2>Card Title</h2>
  <p>Card content goes here</p>
</div>

// Or use the component
<GlassCard variant="default">
  <GlassCardHeader>
    <GlassCardTitle>Card Title</GlassCardTitle>
    <GlassCardDescription>Card description</GlassCardDescription>
  </GlassCardHeader>
  <GlassCardContent>Card content</GlassCardContent>
</GlassCard>
```

## Design Tokens

### Glassmorphism System

```typescript
import { glassmorphism } from '@/lib/design-tokens'

// Background variants
glassmorphism.background.default // bg-white/20 dark:bg-white/10
glassmorphism.background.subtle // bg-white/10 dark:bg-white/5
glassmorphism.background.strong // bg-white/30 dark:bg-white/20

// Border variants
glassmorphism.border.default // border-white/30 dark:border-white/20
glassmorphism.border.subtle // border-white/20 dark:border-white/10
glassmorphism.border.strong // border-white/40 dark:border-white/30

// Blur effects
glassmorphism.blur.sm // backdrop-blur-sm
glassmorphism.blur.md // backdrop-blur-md
glassmorphism.blur.lg // backdrop-blur-lg

// Complete card combinations
glassmorphism.card.default // Full glassmorphism card styling
glassmorphism.card.subtle // Subtle glassmorphism card
glassmorphism.card.strong // Strong glassmorphism card
```

### Color System

```typescript
import { colors } from '@/lib/design-tokens'

// Text colors
colors.text.primary // text-gray-900 dark:text-gray-100
colors.text.secondary // text-gray-600 dark:text-gray-400
colors.text.muted // text-gray-500 dark:text-gray-400
colors.text.accent // text-blue-600 dark:text-blue-400

// Background gradients
colors.gradient.primary // Main app gradient
colors.gradient.subtle // Subtle gradient
colors.gradient.accent // Accent gradient

// Brand colors
colors.brand.primary // bg-blue-600/90 dark:bg-blue-500/90
colors.brand.primaryHover // hover:bg-blue-700/90 dark:hover:bg-blue-600/90
colors.brand.primaryBorder // border-blue-500/40 dark:border-blue-400/40
```

### Component System

```typescript
import { components } from '@/lib/design-tokens'

// Button variants
components.button.primary // Primary button styling
components.button.secondary // Secondary button styling
components.button.ghost // Ghost button styling
components.button.outline // Outline button styling
components.button.success // Success button styling
components.button.warning // Warning button styling
components.button.error // Error button styling

// Input variants
components.input.default // Default input styling
components.input.subtle // Subtle input styling

// Card variants
components.card.default // Default card styling
components.card.subtle // Subtle card styling
components.card.strong // Strong card styling
components.card.interactive // Interactive card styling
```

## Utility Functions

### Component Creators

```typescript
import {
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
} from '@/lib/ui-utils'

// Create components with variants
const cardClass = createGlassCard('default', 'custom-class')
const buttonClass = createGlassButton('primary', 'w-full')
const inputClass = createGlassInput('default', 'mb-4')

// Create page containers
const pageClass = createPageContainer('relative z-10')
const sectionClass = createSectionContainer('mb-6')
const formClass = createFormContainer('max-w-md')

// Create animated background
const AnimatedBackground = () => createAnimatedBackground()

// Create navigation
const navClass = createNavItem(isActive, 'mb-2')
const headerClass = createHeader('px-4')
const sidebarClass = createSidebar('w-64')
```

### Text Utilities

```typescript
import { textUtils } from '@/lib/ui-utils'

<h1 className={textUtils.heading1('mb-4')}>Main Heading</h1>
<h2 className={textUtils.heading2('mb-2')}>Section Heading</h2>
<h3 className={textUtils.heading3('mb-1')}>Subsection</h3>
<p className={textUtils.body('mb-2')}>Body text</p>
<span className={textUtils.caption('text-xs')}>Caption</span>
<small className={textUtils.muted('text-xs')}>Muted text</small>
```

### Layout Utilities

```typescript
import { layoutUtils } from '@/lib/ui-utils'

// Layout helpers
<div className={layoutUtils.centerContent('min-h-screen')}>
<div className={layoutUtils.centerText('mb-4')}>
<div className={layoutUtils.fullHeight('relative')}>
<div className={layoutUtils.flexColumn('space-y-4')}>
<div className={layoutUtils.flexRow('space-x-4')}>
<div className={layoutUtils.grid(3, 'gap-4')}>
```

### Interactive Utilities

```typescript
import { interactiveUtils } from '@/lib/ui-utils'

<button className={interactiveUtils.clickable('hover:scale-105')}>
<div className={interactiveUtils.disabled('opacity-50')}>
<div className={interactiveUtils.loading('animate-pulse')}>
```

### Patterns

```typescript
import { patterns } from '@/lib/ui-utils'

// Common patterns
<div className={patterns.hoverCard('mb-4')}>
<input className={patterns.focusInput('mb-2')} />
<button className={patterns.interactiveButton('primary', 'w-full')}>
<div className={patterns.statusMessage('success', 'mb-4')}>
<div className={patterns.modalOverlay('z-50')}>
<div className={patterns.modalContent('max-w-lg')}>
```

### Responsive Utilities

```typescript
import { responsiveUtils } from '@/lib/ui-utils'

// Responsive helpers
<div className={responsiveUtils.desktopOnly('hidden')}>
<div className={responsiveUtils.mobileOnly('block')}>
<div className={responsiveUtils.responsiveGrid(1, 2, 3, 'gap-4')}>
<h1 className={responsiveUtils.responsiveText('lg', 'mb-4')}>
```

### Animation Utilities

```typescript
import { animationUtils } from '@/lib/ui-utils'

// Animation helpers
<div className={animationUtils.fadeIn('duration-500')}>
<div className={animationUtils.slideUp('delay-200')}>
<div className={animationUtils.scale('hover:scale-105')}>
<div className={animationUtils.smooth('hover:opacity-80')}>
```

## Components

### GlassCard

```tsx
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassCardFooter,
} from '@/components/ui/glass-components'
;<GlassCard variant="default">
  <GlassCardHeader>
    <GlassCardTitle>Card Title</GlassCardTitle>
    <GlassCardDescription>Card description</GlassCardDescription>
  </GlassCardHeader>
  <GlassCardContent>
    <p>Card content goes here</p>
  </GlassCardContent>
  <GlassCardFooter>
    <GlassButton variant="primary">Action</GlassButton>
  </GlassCardFooter>
</GlassCard>
```

### GlassButton

```tsx
import { GlassButton } from '@/components/ui/glass-components'

<GlassButton variant="primary" size="default">Primary Button</GlassButton>
<GlassButton variant="secondary" size="sm">Secondary</GlassButton>
<GlassButton variant="ghost" size="lg">Ghost</GlassButton>
<GlassButton variant="success">Success</GlassButton>
<GlassButton variant="warning">Warning</GlassButton>
<GlassButton variant="error">Error</GlassButton>
```

### GlassInput

```tsx
import { GlassInput } from '@/components/ui/glass-components'

<GlassInput variant="default" placeholder="Enter text..." />
<GlassInput variant="subtle" type="email" placeholder="Email address" />
```

### GlassSelect

```tsx
import { GlassSelect } from '@/components/ui/glass-components'
;<GlassSelect variant="default">
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</GlassSelect>
```

### GlassTextarea

```tsx
import { GlassTextarea } from '@/components/ui/glass-components'
;<GlassTextarea variant="default" placeholder="Enter your message..." />
```

### GlassModal

```tsx
import { GlassModal } from '@/components/ui/glass-components'
;<GlassModal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  <h2>Modal Title</h2>
  <p>Modal content</p>
  <GlassButton variant="primary" onClick={() => setIsOpen(false)}>
    Close
  </GlassButton>
</GlassModal>
```

### GlassStatusMessage

```tsx
import { GlassStatusMessage } from '@/components/ui/glass-components'

<GlassStatusMessage type="success" message="Operation completed successfully!" />
<GlassStatusMessage type="warning" message="Please check your input" />
<GlassStatusMessage type="error" message="Something went wrong" />
<GlassStatusMessage type="info" message="Information message" />
```

### GlassLoading

```tsx
import { GlassLoading } from '@/components/ui/glass-components'

<GlassLoading size="md" />
<GlassLoading size="sm" className="mr-2" />
```

### GlassBadge

```tsx
import { GlassBadge } from '@/components/ui/glass-components'

<GlassBadge variant="default">Default</GlassBadge>
<GlassBadge variant="success">Success</GlassBadge>
<GlassBadge variant="warning">Warning</GlassBadge>
<GlassBadge variant="error">Error</GlassBadge>
<GlassBadge variant="info">Info</GlassBadge>
```

## Page Layout Examples

### Complete Page Setup

```tsx
import { createPageContainer, createAnimatedBackground } from '@/lib/ui-utils'

export default function MyPage() {
  return (
    <div className={createPageContainer()}>
      {createAnimatedBackground()}
      <div className="relative z-10">{/* Page content */}</div>
    </div>
  )
}
```

### Form Layout

```tsx
import { createFormContainer, createGlassInput, createGlassButton } from '@/lib/ui-utils'

export default function MyForm() {
  return (
    <div className={createFormContainer('max-w-md mx-auto')}>
      <form className="space-y-4">
        <input className={createGlassInput('default', 'w-full')} placeholder="Name" />
        <input className={createGlassInput('default', 'w-full')} placeholder="Email" />
        <button className={createGlassButton('primary', 'w-full')}>Submit</button>
      </form>
    </div>
  )
}
```

### Card Grid Layout

```tsx
import { createGlassCard, layoutUtils } from '@/lib/ui-utils'

export default function MyGrid() {
  return (
    <div className={layoutUtils.grid(3, 'gap-6')}>
      <div className={createGlassCard('default')}>
        <h3>Card 1</h3>
        <p>Content</p>
      </div>
      <div className={createGlassCard('default')}>
        <h3>Card 2</h3>
        <p>Content</p>
      </div>
      <div className={createGlassCard('default')}>
        <h3>Card 3</h3>
        <p>Content</p>
      </div>
    </div>
  )
}
```

## Best Practices

1. **Consistency**: Always use the design system utilities instead of writing custom CSS
2. **Variants**: Choose appropriate variants (default, subtle, strong) based on hierarchy
3. **Responsive**: Use responsive utilities for mobile-first design
4. **Accessibility**: Ensure proper contrast and focus states
5. **Performance**: Use the utility functions to avoid CSS duplication
6. **Maintainability**: Import from the centralized design tokens

## Migration Guide

### From Old Styling

```tsx
// Old way
<div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg p-6">

// New way
<div className={createGlassCard('default')}>
```

### Component Migration

```tsx
// Old Button
<Button className="bg-blue-600/90 backdrop-blur-sm text-white hover:bg-blue-700/90">

// New Button
<GlassButton variant="primary">
```

This design system ensures consistency, maintainability, and ease of use across the entire TripFeels application.
