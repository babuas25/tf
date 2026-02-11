# Color Scheme System Guide

## Overview

The Color Scheme system allows you to dynamically change the color theme of your entire application. When a theme color is applied, all buttons and interactive elements automatically change to use the selected theme color. By default, buttons will be black in light mode or white in dark mode, automatically adapting to the system theme.

## How It Works

### 1. Theme Selection

Users can select from 10 different theme colors:

- **Slate** (default) - Professional slate grays for business use
- **Rose** - Elegant rose tones for sophistication
- **Emerald** - Fresh emerald greens for natural feel
- **Blue** - Trustworthy blue for reliability
- **Orange** - Vibrant orange for energy and creativity
- **Gold** - Luxurious gold for premium branding
- **Purple** - Creative purple for innovation
- **Indigo** - Deep indigo for wisdom and connection
- **Cyan** - Modern cyan for technology
- **Pink** - Playful pink for creativity and friendliness

### 2. Dynamic Color Application

When a theme is selected:

- **Primary buttons** change to the theme color
- **Input focus rings** use the theme color
- **Badges** (default variant) use the theme color
- **Status messages** (info variant) use the theme color
- **Interactive elements** adapt to the theme

### 3. System Mode (Default)

When no theme is selected:

- **Light mode**: Buttons are black (`bg-gray-900`)
- **Dark mode**: Buttons are white (`bg-gray-100`)
- Automatically adapts to system dark/light mode preference

## Implementation

### Using Dynamic Components

#### DynamicButton

```tsx
import { DynamicButton } from '@/components/ui/dynamic-theme-components'

// Automatically uses the selected theme color
<DynamicButton variant="primary">Click me</DynamicButton>
<DynamicButton variant="secondary">Secondary</DynamicButton>
<DynamicButton variant="ghost">Ghost</DynamicButton>
<DynamicButton variant="outline">Outline</DynamicButton>
```

#### DynamicInput

```tsx
import { DynamicInput } from '@/components/ui/dynamic-theme-components'

// Focus ring automatically matches theme color
<DynamicInput variant="default" placeholder="Enter text..." />
<DynamicInput variant="subtle" type="email" placeholder="Email" />
```

#### DynamicSelect

```tsx
import { DynamicSelect } from '@/components/ui/dynamic-theme-components'
;<DynamicSelect variant="default">
  <option value="">Choose option</option>
  <option value="1">Option 1</option>
</DynamicSelect>
```

#### DynamicBadge

```tsx
import { DynamicBadge } from '@/components/ui/dynamic-theme-components'

// Default badge uses theme color
<DynamicBadge variant="default">Theme Badge</DynamicBadge>
<DynamicBadge variant="success">Success</DynamicBadge>
<DynamicBadge variant="warning">Warning</DynamicBadge>
```

#### DynamicStatusMessage

```tsx
import { DynamicStatusMessage } from '@/components/ui/dynamic-theme-components'

// Info messages use theme color
<DynamicStatusMessage type="info" message="Theme-colored message" />
<DynamicStatusMessage type="success" message="Success message" />
```

### Theme Context Usage

#### Accessing Theme State

```tsx
import { useTheme } from '@/contexts/theme-context'

function MyComponent() {
  const { colorTheme, setColorTheme } = useTheme()

  return (
    <div>
      <p>Current theme: {colorTheme}</p>
      <button onClick={() => setColorTheme('rose')}>Switch to Rose Theme</button>
    </div>
  )
}
```

#### Using Dynamic Colors

```tsx
import { useDynamicThemeColors } from '@/lib/dynamic-theme-colors'

function CustomComponent() {
  const themeColors = useDynamicThemeColors()

  return (
    <button className={`${themeColors.primary} ${themeColors.primaryHover}`}>
      Custom Theme Button
    </button>
  )
}
```

## Theme Management

### Available Themes

```tsx
import {
  availableThemes,
  getThemeDisplayName,
  getThemeDescription,
} from '@/lib/dynamic-theme-colors'

// Get all available theme names
const themes = availableThemes // ['blue', 'rose', 'emerald', ...]

// Get display name
const displayName = getThemeDisplayName('rose') // 'Rose'

// Get description
const description = getThemeDescription('rose') // 'Elegant rose tones for...'
```

### Theme Persistence

The selected theme is automatically saved to localStorage and restored when the user returns to the application.

```tsx
// Theme is automatically saved when changed
setColorTheme('emerald')

// Theme is automatically loaded on app startup
// No additional code needed
```

## Complete Example

### Theme Selector Component

```tsx
import { useTheme } from '@/contexts/theme-context'
import { availableThemes, getThemeDisplayName } from '@/lib/dynamic-theme-colors'
import { DynamicButton } from '@/components/ui/dynamic-theme-components'

function ThemeSelector() {
  const { colorTheme, setColorTheme } = useTheme()

  return (
    <div className="space-y-4">
      <h3>Choose Theme Color</h3>
      <div className="grid grid-cols-2 gap-2">
        {availableThemes.map((theme) => (
          <button
            key={theme}
            onClick={() => setColorTheme(theme)}
            className={`p-3 rounded-lg border-2 ${
              colorTheme === theme
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            {getThemeDisplayName(theme)}
          </button>
        ))}
      </div>

      {/* Demo buttons that change with theme */}
      <div className="flex gap-2">
        <DynamicButton variant="primary">Primary</DynamicButton>
        <DynamicButton variant="secondary">Secondary</DynamicButton>
        <DynamicButton variant="ghost">Ghost</DynamicButton>
      </div>
    </div>
  )
}
```

### Dashboard with Dynamic Theme

```tsx
import { DynamicButton, DynamicBadge } from '@/components/ui/dynamic-theme-components'
import { useTheme } from '@/contexts/theme-context'
import { getThemeDisplayName } from '@/lib/dynamic-theme-colors'

function Dashboard() {
  const { colorTheme } = useTheme()

  return (
    <div>
      <h1>Dashboard - {getThemeDisplayName(colorTheme)} Theme</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="glass-card">
          <h3>User Management</h3>
          <p>Manage users and permissions</p>
          <DynamicButton variant="primary" className="w-full">
            Manage Users
          </DynamicButton>
        </div>

        <div className="glass-card">
          <h3>Theme Settings</h3>
          <p>Customize appearance</p>
          <DynamicButton variant="secondary" className="w-full">
            Settings
          </DynamicButton>
        </div>

        <div className="glass-card">
          <h3>Support</h3>
          <p>Get help and support</p>
          <DynamicButton variant="outline" className="w-full">
            Contact
          </DynamicButton>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <DynamicBadge variant="default">+12%</DynamicBadge>
        <DynamicBadge variant="success">Active</DynamicBadge>
        <DynamicBadge variant="warning">Pending</DynamicBadge>
      </div>
    </div>
  )
}
```

## Best Practices

### 1. Use Dynamic Components

Always use `DynamicButton`, `DynamicInput`, etc. instead of static components when you want theme-aware styling.

```tsx
// ✅ Good - Uses theme color
<DynamicButton variant="primary">Click me</DynamicButton>

// ❌ Avoid - Static color
<Button className="bg-blue-600">Click me</Button>
```

### 2. Provide Theme Selection

Give users the ability to choose their preferred theme color through a theme selector interface.

### 3. Maintain Consistency

Use the same theme color across all interactive elements for a cohesive experience.

### 4. Test Both Modes

Always test your components in both light and dark modes to ensure proper contrast and readability.

### 5. Fallback Handling

The system automatically falls back to blue theme if an invalid theme is selected.

## Customization

### Adding New Theme Colors

To add a new theme color, update the `themeColorMap` in `src/lib/dynamic-theme-colors.ts`:

```tsx
export const themeColorMap = {
  // ... existing themes
  teal: {
    primary: 'bg-teal-600/90 dark:bg-teal-500/90',
    primaryHover: 'hover:bg-teal-700/90 dark:hover:bg-teal-600/90',
    primaryBorder: 'border-teal-500/40 dark:border-teal-400/40',
    primaryText: 'text-teal-600 dark:text-teal-400',
    primaryRing: 'focus:ring-teal-500/50',
  },
}
```

### Custom Theme Components

You can create your own theme-aware components using the `useDynamicThemeColors` hook:

```tsx
import { useDynamicThemeColors } from '@/lib/dynamic-theme-colors'

function CustomThemedComponent() {
  const themeColors = useDynamicThemeColors()

  return (
    <div className={`${themeColors.primary} ${themeColors.primaryHover}`}>
      Custom themed content
    </div>
  )
}
```

This color scheme system provides a powerful way to customize your application's appearance while maintaining consistency and accessibility across all components.
