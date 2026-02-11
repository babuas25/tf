'use client'

import { useEffect, useMemo, useState } from 'react'

import { FlightSearchInterface } from '@/components/flight/FlightSearchInterface'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { AuthSessionProvider } from '@/components/providers/session-provider'
import { TabBar } from '@/components/tab/TabBar'

export function HomePageClient() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  const wrapper = useMemo(() => {
    if (!mounted)
      return { className: 'min-h-screen bg-white dark:bg-black', style: {} as React.CSSProperties }
    return {
      className: 'min-h-screen bg-white dark:bg-black',
      style: {},
    }
  }, [mounted])

  // Blob colors from theme vars

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  return (
    <AuthSessionProvider>
      <div className={wrapper.className} style={wrapper.style}>
        {/* Animated background elements */}
        {/* flat background for readability */}

        <Header
          showNavigation={false}
          showUserActions={true}
          onMobileMenuToggle={toggleMobileSidebar}
          className={`${isMobileSidebarOpen ? 'hidden md:block' : ''}`}
        />

        {/* Main content with sidebar for logged-in users */}
        <div className="flex pt-14 relative z-10 min-h-screen">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <div className="fixed top-14 bottom-0 left-0 z-30">
              <Sidebar onCollapseChange={setIsSidebarCollapsed} className="h-full" />
            </div>
          </div>

          {/* Sidebar spacer for desktop */}
          <div className={`hidden md:block ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}></div>

          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden" onClick={closeMobileSidebar}>
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

              {/* Sidebar */}
              <div className="relative h-full w-64">
                <Sidebar isMobile={true} onClose={closeMobileSidebar} className="h-full" />
              </div>
            </div>
          )}

          {/* TabBar positioned below header, starting after sidebar on desktop */}
          <div
            className={`fixed top-14 z-30 transition-all duration-300 ${isMobileSidebarOpen ? 'hidden md:block' : ''} ${isSidebarCollapsed ? 'md:left-20' : 'md:left-64'} left-0 right-0`}
          >
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <main className="flex-1 flex flex-col min-h-[calc(100vh-3.5rem)]">
            <div className="flex-1 overflow-auto">
              {/* Add padding-top to account for TabBar height */}
              <div className="pt-[3.5rem] pb-20 relative overflow-visible">{activeTab === 0 ? <FlightSearchInterface /> : null}</div>
            </div>
            
            {/* Footer at bottom of viewport */}
            <Footer />
          </main>
        </div>
      </div>
    </AuthSessionProvider>
  )
}
