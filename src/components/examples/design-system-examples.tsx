/**
 * Design System Examples
 * Examples showing how to use the TripFeels design system
 */

import {
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassTextarea,
  GlassStatusMessage,
  GlassLoading,
  GlassBadge,
} from '@/components/ui/glass-components'
import {
  createGlassCard,
  createPageContainer,
  createAnimatedBackground,
  textUtils,
  layoutUtils,
  responsiveUtils,
} from '@/lib/ui-utils'

// Example 1: Basic Page Layout
export function BasicPageExample() {
  return (
    <div className={createPageContainer()}>
      {createAnimatedBackground()}
      <div className="relative z-10 p-6">
        <h1 className={textUtils.heading1('mb-6')}>Welcome to TripFeels</h1>

        <div className={layoutUtils.grid(3, 'gap-6 mb-8')}>
          <div className={createGlassCard('default')}>
            <h3 className={textUtils.heading3('mb-2')}>Feature 1</h3>
            <p className={textUtils.body('mb-4')}>Description of feature 1</p>
            <GlassButton variant="primary">Learn More</GlassButton>
          </div>

          <div className={createGlassCard('interactive')}>
            <h3 className={textUtils.heading3('mb-2')}>Feature 2</h3>
            <p className={textUtils.body('mb-4')}>Description of feature 2</p>
            <GlassButton variant="secondary">Learn More</GlassButton>
          </div>

          <div className={createGlassCard('subtle')}>
            <h3 className={textUtils.heading3('mb-2')}>Feature 3</h3>
            <p className={textUtils.body('mb-4')}>Description of feature 3</p>
            <GlassButton variant="ghost">Learn More</GlassButton>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example 2: Form Layout
export function FormExample() {
  return (
    <div className={createPageContainer()}>
      {createAnimatedBackground()}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className={createGlassCard('default', 'w-full max-w-md')}>
          <GlassCardHeader>
            <GlassCardTitle>Contact Form</GlassCardTitle>
            <GlassCardDescription>
              Fill out the form below to get in touch with us.
            </GlassCardDescription>
          </GlassCardHeader>

          <GlassCardContent>
            <form className="space-y-4">
              <div>
                <label className={textUtils.caption('block mb-2')}>Name</label>
                <GlassInput variant="default" placeholder="Enter your name" />
              </div>

              <div>
                <label className={textUtils.caption('block mb-2')}>Email</label>
                <GlassInput variant="default" type="email" placeholder="Enter your email" />
              </div>

              <div>
                <label className={textUtils.caption('block mb-2')}>Subject</label>
                <GlassSelect variant="default">
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Support</option>
                  <option value="feedback">Feedback</option>
                </GlassSelect>
              </div>

              <div>
                <label className={textUtils.caption('block mb-2')}>Message</label>
                <GlassTextarea variant="default" placeholder="Enter your message" rows={4} />
              </div>

              <div className="flex gap-3">
                <GlassButton variant="primary" className="flex-1">
                  Send Message
                </GlassButton>
                <GlassButton variant="outline">Cancel</GlassButton>
              </div>
            </form>
          </GlassCardContent>
        </div>
      </div>
    </div>
  )
}

// Example 3: Dashboard Layout
export function DashboardExample() {
  return (
    <div className={createPageContainer()}>
      {createAnimatedBackground()}
      <div className="relative z-10 p-6">
        <div className="mb-8">
          <h1 className={textUtils.heading1('mb-2')}>Dashboard</h1>
          <p className={textUtils.body('text-gray-600 dark:text-gray-400')}>
            Welcome to your personalized dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className={layoutUtils.grid(4, 'gap-6 mb-8')}>
          <div className={createGlassCard('default')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={textUtils.muted('mb-1')}>Total Users</p>
                <h3 className={textUtils.heading3()}>1,234</h3>
              </div>
              <GlassBadge variant="success">+12%</GlassBadge>
            </div>
          </div>

          <div className={createGlassCard('default')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={textUtils.muted('mb-1')}>Revenue</p>
                <h3 className={textUtils.heading3()}>$45,678</h3>
              </div>
              <GlassBadge variant="info">+8%</GlassBadge>
            </div>
          </div>

          <div className={createGlassCard('default')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={textUtils.muted('mb-1')}>Orders</p>
                <h3 className={textUtils.heading3()}>567</h3>
              </div>
              <GlassBadge variant="warning">-3%</GlassBadge>
            </div>
          </div>

          <div className={createGlassCard('default')}>
            <div className="flex items-center justify-between">
              <div>
                <p className={textUtils.muted('mb-1')}>Active</p>
                <h3 className={textUtils.heading3()}>89</h3>
              </div>
              <GlassBadge variant="default">Live</GlassBadge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={layoutUtils.grid(2, 'gap-6')}>
          <div className={createGlassCard('default')}>
            <GlassCardHeader>
              <GlassCardTitle>Recent Activity</GlassCardTitle>
              <GlassCardDescription>Latest updates from your account</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <GlassLoading size="sm" />
                  <div>
                    <p className={textUtils.body('font-medium')}>User registration</p>
                    <p className={textUtils.caption()}>2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GlassLoading size="sm" />
                  <div>
                    <p className={textUtils.body('font-medium')}>Payment processed</p>
                    <p className={textUtils.caption()}>5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <GlassLoading size="sm" />
                  <div>
                    <p className={textUtils.body('font-medium')}>Profile updated</p>
                    <p className={textUtils.caption()}>10 minutes ago</p>
                  </div>
                </div>
              </div>
            </GlassCardContent>
          </div>

          <div className={createGlassCard('default')}>
            <GlassCardHeader>
              <GlassCardTitle>Quick Actions</GlassCardTitle>
              <GlassCardDescription>Common tasks and shortcuts</GlassCardDescription>
            </GlassCardHeader>
            <GlassCardContent>
              <div className="grid grid-cols-2 gap-3">
                <GlassButton variant="primary" className="h-20 flex-col">
                  <span className="text-lg">+</span>
                  <span>Add User</span>
                </GlassButton>
                <GlassButton variant="secondary" className="h-20 flex-col">
                  <span className="text-lg">📊</span>
                  <span>View Reports</span>
                </GlassButton>
                <GlassButton variant="success" className="h-20 flex-col">
                  <span className="text-lg">⚙️</span>
                  <span>Settings</span>
                </GlassButton>
                <GlassButton variant="warning" className="h-20 flex-col">
                  <span className="text-lg">📧</span>
                  <span>Messages</span>
                </GlassButton>
              </div>
            </GlassCardContent>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example 4: Status Messages
export function StatusMessagesExample() {
  return (
    <div className={createPageContainer()}>
      {createAnimatedBackground()}
      <div className="relative z-10 p-6 max-w-2xl mx-auto">
        <h1 className={textUtils.heading1('mb-8')}>Status Messages</h1>

        <div className="space-y-4">
          <GlassStatusMessage type="success" message="Operation completed successfully!" />
          <GlassStatusMessage type="warning" message="Please check your input and try again." />
          <GlassStatusMessage
            type="error"
            message="Something went wrong. Please contact support."
          />
          <GlassStatusMessage type="info" message="Here's some useful information for you." />
        </div>

        <div className="mt-8">
          <h2 className={textUtils.heading2('mb-4')}>Loading States</h2>
          <div className="flex gap-4">
            <GlassLoading size="sm" />
            <GlassLoading size="md" />
            <GlassLoading size="lg" />
          </div>
        </div>

        <div className="mt-8">
          <h2 className={textUtils.heading2('mb-4')}>Badges</h2>
          <div className="flex gap-2 flex-wrap">
            <GlassBadge variant="default">Default</GlassBadge>
            <GlassBadge variant="success">Success</GlassBadge>
            <GlassBadge variant="warning">Warning</GlassBadge>
            <GlassBadge variant="error">Error</GlassBadge>
            <GlassBadge variant="info">Info</GlassBadge>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example 5: Responsive Layout
export function ResponsiveExample() {
  return (
    <div className={createPageContainer()}>
      {createAnimatedBackground()}
      <div className="relative z-10 p-6">
        <h1 className={responsiveUtils.responsiveText('lg', 'mb-8')}>Responsive Design</h1>

        <div className={responsiveUtils.responsiveGrid(1, 2, 3, 'gap-6')}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className={createGlassCard('default')}>
              <h3 className={textUtils.heading3('mb-2')}>Card {item}</h3>
              <p className={textUtils.body('mb-4')}>
                This card demonstrates responsive behavior. It will show 1 column on mobile, 2
                columns on tablet, and 3 columns on desktop.
              </p>
              <GlassButton variant="primary" className="w-full">
                Action {item}
              </GlassButton>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={responsiveUtils.desktopOnly('hidden')}>
            <GlassStatusMessage type="info" message="This message is only visible on desktop" />
          </div>

          <div className={responsiveUtils.mobileOnly('block')}>
            <GlassStatusMessage type="warning" message="This message is only visible on mobile" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Export all examples
const DesignSystemExamples = {
  BasicPageExample,
  FormExample,
  DashboardExample,
  StatusMessagesExample,
  ResponsiveExample,
}

export default DesignSystemExamples
