'use client'

import { Plane, Building, Sun, FileText, Car, Calendar, Shield, Ticket, RotateCcw, PackagePlus } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

interface TabBarItem {
  label: string
  href: string
  icon: React.ElementType
}

interface TabBarProps {
  className?: string
  activeTab: number
  onTabChange: (index: number) => void
  tabType?: 'default' | 'booking'
}

const TAB_ITEMS: TabBarItem[] = [
  { label: 'Flight', href: '#', icon: Plane },
  { label: 'Hotel', href: '#', icon: Building },
  { label: 'Holidays', href: '#', icon: Sun },
  { label: 'Visa', href: '#', icon: FileText },
  { label: 'Cars', href: '#', icon: Car },
  { label: 'Events', href: '#', icon: Calendar },
  { label: 'Insurance', href: '#', icon: Shield },
]

const BOOKING_TAB_ITEMS: TabBarItem[] = [
  { label: 'Ticket', href: '#', icon: Ticket },
  { label: 'Refund', href: '#', icon: RotateCcw },
  { label: 'Add-ons', href: '#', icon: PackagePlus },
]

export function TabBar({ className, activeTab, onTabChange, tabType = 'default' }: TabBarProps) {
  const items = tabType === 'booking' ? BOOKING_TAB_ITEMS : TAB_ITEMS
  
  return (
    <div
      className={cn(
        'w-full border-b border-white/30 dark:border-white/20 bg-white/20 dark:bg-white/10 backdrop-blur-md',
        className,
      )}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex w-full">
        {items.map((item, index) => {
          const Icon = item.icon
          return (
            <Link
              key={index}
              href={item.href}
              onClick={(e) => {
                e.preventDefault()
                onTabChange(index)
              }}
              aria-label={`Navigate to ${item.label}`}
              role="tab"
              aria-selected={activeTab === index}
              className={cn(
                'flex items-center justify-center py-2 px-1 text-xs font-medium transition-all duration-200 flex-1',
                tabType === 'booking' 
                  ? 'flex-row' 
                  : 'flex-col md:flex-row',
                tabType === 'booking' 
                  ? 'md:py-3 md:px-4 md:text-sm' 
                  : 'md:py-3 md:px-4 md:text-sm',
                activeTab === index
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
              )}
            >
              <Icon className={cn('h-5 w-5', tabType === 'booking' && 'md:h-5 md:w-5')} aria-hidden="true" />
              {tabType === 'booking' ? (
                <span className="ml-1.5 text-xs md:ml-2 md:text-sm">{item.label}</span>
              ) : (
                <>
                  <span className="hidden md:inline md:ml-2">{item.label}</span>
                  <span className="sr-only md:hidden">{item.label}</span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
