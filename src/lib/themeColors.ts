export type ThemeName =
  | 'default'
  | 'red'
  | 'rose'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'violet'
  | 'teal'
  | 'slate'

export const THEME_NAMES: ThemeName[] = [
  'default',
  'red',
  'rose',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'teal',
  'slate',
]

// Each theme maps to CSS variable tokens (no hex/hsl here)
// The actual values are defined in CSS as --<theme>-<token> variables
// Provider sets --theme-* to point to one of these sets.
export type ThemeTokenMap = {
  '--theme-background': string
  '--theme-foreground': string
  '--theme-primary': string
  '--theme-primary-foreground': string
  '--theme-secondary': string
  '--theme-secondary-foreground': string
  '--theme-accent': string
  '--theme-accent-foreground': string
  '--theme-muted': string
  '--theme-muted-foreground': string
  '--theme-card': string
  '--theme-card-foreground': string
  '--theme-popover': string
  '--theme-popover-foreground': string
  '--theme-border': string
  '--theme-input': string
  '--theme-ring': string
  '--theme-bg-from': string
  '--theme-bg-via': string
  '--theme-bg-to': string
}

export function getThemeTokens(theme: ThemeName): ThemeTokenMap {
  const prefix = `--${theme}`
  return {
    '--theme-background': `var(${prefix}-background)`,
    '--theme-foreground': `var(${prefix}-foreground)`,
    '--theme-primary': `var(${prefix}-primary)`,
    '--theme-primary-foreground': `var(${prefix}-primary-foreground)`,
    '--theme-secondary': `var(${prefix}-secondary)`,
    '--theme-secondary-foreground': `var(${prefix}-secondary-foreground)`,
    '--theme-accent': `var(${prefix}-accent)`,
    '--theme-accent-foreground': `var(${prefix}-accent-foreground)`,
    '--theme-muted': `var(${prefix}-muted)`,
    '--theme-muted-foreground': `var(${prefix}-muted-foreground)`,
    '--theme-card': `var(${prefix}-card)`,
    '--theme-card-foreground': `var(${prefix}-card-foreground)`,
    '--theme-popover': `var(${prefix}-popover)`,
    '--theme-popover-foreground': `var(${prefix}-popover-foreground)`,
    '--theme-border': `var(${prefix}-border)`,
    '--theme-input': `var(${prefix}-input)`,
    '--theme-ring': `var(${prefix}-ring)`,
    '--theme-bg-from': `var(${prefix}-bg-from)`,
    '--theme-bg-via': `var(${prefix}-bg-via)`,
    '--theme-bg-to': `var(${prefix}-bg-to)`,
  }
}

export type ThemeSystemState = {
  color: ThemeName
  mode: 'light' | 'dark'
}
