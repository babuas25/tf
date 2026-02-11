'use client'

import {
  DynamicButton,
  DynamicInput,
  DynamicSelect,
  DynamicBadge,
  DynamicStatusMessage,
} from '@/components/ui/dynamic-theme-components'
import { useTheme } from '@/context/theme-context'
import {
  availableThemes,
  getThemeDisplayName,
  getThemeDescription,
} from '@/lib/dynamic-theme-colors'
import { createPageContainer } from '@/lib/ui-utils'
import { textUtils, layoutUtils } from '@/lib/ui-utils'

export default function ThemeDemoPage() {
  const { colorTheme, setColorTheme } = useTheme()

  return (
    <div className={createPageContainer()}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-200/30 dark:bg-blue-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-indigo-200/30 dark:bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-slate-200/30 dark:bg-slate-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>
      <div className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className={textUtils.heading1('mb-2')}>🎨 Dynamic Color Scheme Demo</h1>
          <p className={textUtils.body('text-gray-600 dark:text-gray-400 mb-8')}>
            Select a theme color below and watch all buttons and components automatically change!
          </p>

          {/* Current Theme Display */}
          <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg p-6 mb-8">
            <h2 className={textUtils.heading2('mb-2')}>Current Theme</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Selected: <strong>{getThemeDisplayName(colorTheme)}</strong>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getThemeDescription(colorTheme)}
            </p>
          </div>

          {/* Theme Selector */}
          <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg p-6 mb-8">
            <h2 className={textUtils.heading2('mb-4')}>Choose Your Theme Color</h2>
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
            <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg p-6">
              <h3 className={textUtils.heading3('mb-4')}>Dynamic Buttons</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                All buttons automatically use the selected theme color
              </p>

              <div className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <DynamicButton variant="primary">Primary</DynamicButton>
                  <DynamicButton variant="secondary">Secondary</DynamicButton>
                  <DynamicButton variant="ghost">Ghost</DynamicButton>
                  <DynamicButton variant="outline">Outline</DynamicButton>
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
              </div>
            </div>

            {/* Form Elements Section */}
            <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg p-6">
              <h3 className={textUtils.heading3('mb-4')}>Dynamic Form Elements</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
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

                <DynamicButton variant="primary" className="w-full">
                  Submit Form
                </DynamicButton>
              </div>
            </div>
          </div>

          {/* Badges and Status Messages */}
          <div className={layoutUtils.grid(2, 'gap-8 mt-8')}>
            {/* Badges Section */}
            <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg p-6">
              <h3 className={textUtils.heading3('mb-4')}>Dynamic Badges</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Default badges use the theme color
              </p>

              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <DynamicBadge variant="default">Theme Badge</DynamicBadge>
                  <DynamicBadge variant="success">Success</DynamicBadge>
                  <DynamicBadge variant="warning">Warning</DynamicBadge>
                  <DynamicBadge variant="error">Error</DynamicBadge>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <DynamicBadge variant="default">+12%</DynamicBadge>
                  <DynamicBadge variant="success">Active</DynamicBadge>
                  <DynamicBadge variant="warning">Pending</DynamicBadge>
                </div>
              </div>
            </div>

            {/* Status Messages Section */}
            <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg p-6">
              <h3 className={textUtils.heading3('mb-4')}>Dynamic Status Messages</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
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

          {/* Instructions */}
          <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md rounded-xl border border-white/30 dark:border-white/20 shadow-lg p-6 mt-8">
            <h3 className={textUtils.heading3('mb-4')}>How It Works</h3>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>
                <strong>1. Select a Theme:</strong> Click on any theme color above to see the change
                instantly.
              </p>
              <p>
                <strong>2. Dynamic Updates:</strong> All buttons, inputs, badges, and status
                messages automatically update to use the new theme color.
              </p>
              <p>
                <strong>3. Persistent:</strong> Your theme choice is saved and will be restored when
                you return to the app.
              </p>
              <p>
                <strong>4. System Mode:</strong> When no theme is selected (default), buttons will
                be black in light mode and white in dark mode.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
