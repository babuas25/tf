/**
 * Dynamic Theme Examples
 * Examples showing how the color scheme system works with dynamic theming
 */

import {
  DynamicButton,
  DynamicInput,
  DynamicSelect,
  DynamicTextarea,
  DynamicBadge,
  DynamicStatusMessage,
} from '@/components/ui/dynamic-theme-components'
import { useTheme } from '@/context/theme-context'
import {
  availableThemes,
  getThemeDisplayName,
  getThemeDescription,
} from '@/lib/dynamic-theme-colors'
import {
  createGlassCard,
  createPageContainer,
  createAnimatedBackground,
  textUtils,
  layoutUtils,
} from '@/lib/ui-utils'

// Example 1: Theme Color Demonstration
export function DynamicThemeDemo() {
  const { colorTheme, setColorTheme } = useTheme()

  return (
    <div className={createPageContainer()}>
      {createAnimatedBackground()}
      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className={textUtils.heading1('mb-2')}>Dynamic Color Scheme System</h1>
          <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-8')}>
            Watch how all buttons and components automatically change colors when you select a
            different theme!
          </p>

          {/* Theme Selector */}
          <div className={createGlassCard('default', 'mb-8')}>
            <h2 className={textUtils.heading2('mb-4')}>Choose Your Theme Color</h2>
            <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-6')}>
              Current theme: <strong>{getThemeDisplayName(colorTheme)}</strong>
            </p>

            <div className={layoutUtils.grid(2, 'gap-4')}>
              {availableThemes.map((theme) => (
                <button
                  key={theme}
                  onClick={() => setColorTheme(theme)}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    colorTheme === theme
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {getThemeDisplayName(theme)}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getThemeDescription(theme)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Components Demo */}
          <div className={layoutUtils.grid(2, 'gap-8')}>
            {/* Buttons Section */}
            <div className={createGlassCard('default')}>
              <h3 className={textUtils.heading3('mb-4')}>Dynamic Buttons</h3>
              <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-6')}>
                All buttons automatically use the selected theme color
              </p>

              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <DynamicButton variant="primary">Primary Button</DynamicButton>
                  <DynamicButton variant="secondary">Secondary</DynamicButton>
                  <DynamicButton variant="ghost">Ghost Button</DynamicButton>
                  <DynamicButton variant="outline">Outline Button</DynamicButton>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <DynamicButton variant="primary" size="sm">
                    Small
                  </DynamicButton>
                  <DynamicButton variant="primary" size="default">
                    Default
                  </DynamicButton>
                  <DynamicButton variant="primary" size="lg">
                    Large
                  </DynamicButton>
                </div>

                <div className="flex gap-3 flex-wrap">
                  <DynamicButton variant="primary" disabled>
                    Disabled
                  </DynamicButton>
                  <DynamicButton variant="primary">
                    <span className="mr-2">🔍</span>
                    With Icon
                  </DynamicButton>
                </div>
              </div>
            </div>

            {/* Form Elements Section */}
            <div className={createGlassCard('default')}>
              <h3 className={textUtils.heading3('mb-4')}>Dynamic Form Elements</h3>
              <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-6')}>
                Input focus colors match the selected theme
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Email Address
                  </label>
                  <DynamicInput
                    variant="default"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Select Option
                  </label>
                  <DynamicSelect variant="default" className="w-full">
                    <option value="">Choose an option</option>
                    <option value="option1">Option 1</option>
                    <option value="option2">Option 2</option>
                    <option value="option3">Option 3</option>
                  </DynamicSelect>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Message
                  </label>
                  <DynamicTextarea
                    variant="default"
                    placeholder="Enter your message"
                    rows={3}
                    className="w-full"
                  />
                </div>

                <DynamicButton variant="primary" className="w-full">
                  Submit Form
                </DynamicButton>
              </div>
            </div>
          </div>

          {/* Badges and Status Messages */}
          <div className={layoutUtils.grid(2, 'gap-8 mt-8')}>
            {/* Badges Section */}
            <div className={createGlassCard('default')}>
              <h3 className={textUtils.heading3('mb-4')}>Dynamic Badges</h3>
              <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-6')}>
                Badges adapt to the theme color
              </p>

              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <DynamicBadge variant="default">Default Badge</DynamicBadge>
                  <DynamicBadge variant="success">Success</DynamicBadge>
                  <DynamicBadge variant="warning">Warning</DynamicBadge>
                  <DynamicBadge variant="error">Error</DynamicBadge>
                  <DynamicBadge variant="info">Info</DynamicBadge>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <DynamicBadge variant="default">+12%</DynamicBadge>
                  <DynamicBadge variant="success">Active</DynamicBadge>
                  <DynamicBadge variant="warning">Pending</DynamicBadge>
                  <DynamicBadge variant="error">Failed</DynamicBadge>
                </div>
              </div>
            </div>

            {/* Status Messages Section */}
            <div className={createGlassCard('default')}>
              <h3 className={textUtils.heading3('mb-4')}>Dynamic Status Messages</h3>
              <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-6')}>
                Info messages use the theme color
              </p>

              <div className="space-y-3">
                <DynamicStatusMessage
                  type="info"
                  message="This info message uses the selected theme color!"
                />
                <DynamicStatusMessage type="success" message="Operation completed successfully!" />
                <DynamicStatusMessage type="warning" message="Please check your input." />
                <DynamicStatusMessage type="error" message="Something went wrong." />
              </div>
            </div>
          </div>

          {/* Theme Information */}
          <div className={createGlassCard('default', 'mt-8')}>
            <h3 className={textUtils.heading3('mb-4')}>How It Works</h3>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                <strong>Dynamic Theming:</strong> When you select a theme color, all components
                automatically update to use that color. The system supports 10 different theme
                colors.
              </p>
              <p>
                <strong>System Mode:</strong> When no theme is selected (default), buttons will be
                black in light mode and white in dark mode, automatically adapting to the system
                theme.
              </p>
              <p>
                <strong>Components:</strong> Use{' '}
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  DynamicButton
                </code>
                ,
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">DynamicInput</code>
                , and other dynamic components for theme-aware styling.
              </p>
              <p>
                <strong>Customization:</strong> You can easily add new theme colors by updating the
                <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  themeColorMap
                </code>{' '}
                in the design system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example 2: Dashboard with Dynamic Theme
export function DynamicDashboardExample() {
  const { colorTheme } = useTheme()

  return (
    <div className={createPageContainer()}>
      {createAnimatedBackground()}
      <div className="relative z-10 p-6">
        <div className="mb-8">
          <h1 className={textUtils.heading1('mb-2')}>
            Dashboard - {getThemeDisplayName(colorTheme)} Theme
          </h1>
          <p className={textUtils.body('text-gray-600 dark:text-gray-400')}>
            All buttons and interactive elements use the{' '}
            {getThemeDisplayName(colorTheme).toLowerCase()} theme
          </p>
        </div>

        {/* Stats Cards */}
        <div className={layoutUtils.grid(4, 'gap-6 mb-8')}>
          <div className={createGlassCard('default')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Users</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">1,234</h3>
                <DynamicBadge variant="default">+12%</DynamicBadge>
              </div>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400">👥</span>
              </div>
            </div>
          </div>

          <div className={createGlassCard('default')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Revenue</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">$45,678</h3>
                <DynamicBadge variant="success">+8%</DynamicBadge>
              </div>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400">💰</span>
              </div>
            </div>
          </div>

          <div className={createGlassCard('default')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Orders</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">567</h3>
                <DynamicBadge variant="warning">-3%</DynamicBadge>
              </div>
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400">📦</span>
              </div>
            </div>
          </div>

          <div className={createGlassCard('default')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">89</h3>
                <DynamicBadge variant="info">Live</DynamicBadge>
              </div>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400">⚡</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className={layoutUtils.grid(3, 'gap-6')}>
          <div className={createGlassCard('default')}>
            <h3 className={textUtils.heading3('mb-2')}>User Management</h3>
            <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-4')}>
              Manage users, roles, and permissions across the platform.
            </p>
            <DynamicButton variant="primary" className="w-full">
              Manage Users
            </DynamicButton>
          </div>

          <div className={createGlassCard('default')}>
            <h3 className={textUtils.heading3('mb-2')}>Theme Management</h3>
            <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-4')}>
              Customize platform themes and visual settings.
            </p>
            <DynamicButton variant="secondary" className="w-full">
              Manage Themes
            </DynamicButton>
          </div>

          <div className={createGlassCard('default')}>
            <h3 className={textUtils.heading3('mb-2')}>Profile Settings</h3>
            <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-4')}>
              Update your profile information and preferences.
            </p>
            <DynamicButton variant="outline" className="w-full">
              Edit Profile
            </DynamicButton>
          </div>
        </div>
      </div>
    </div>
  )
}

const DynamicThemeExamples = {
  DynamicThemeDemo,
  DynamicDashboardExample,
}

export default DynamicThemeExamples
